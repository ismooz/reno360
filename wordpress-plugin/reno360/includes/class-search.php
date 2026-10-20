<?php
/**
 * Moteur de recherche par mots-clés.
 *
 * Insensible aux accents, à la casse et au pluriel, tolérant aux fautes de frappe
 * (distance de Damerau-Levenshtein), avec recherche par préfixe (saisie en cours),
 * racines communes (plombier / plomberie), pondération par champ et bonus d'expression.
 * L'algorithme est dupliqué à l'identique dans assets/js/search.js (recherche instantanée
 * côté navigateur) ; cette version PHP sert l'API REST, l'outil de test et le journal.
 *
 * @package Reno360
 */

namespace Reno360;

defined( 'ABSPATH' ) || exit;

class Search {

	const OPTION  = 'reno360_search_index';
	const VERSION = 6;

	/** Poids des champs : nom, mots-clés, catégorie, description. */
	const WEIGHTS = array(
		'n' => 10,
		'k' => 8,
		'c' => 3,
		'd' => 2,
	);

	/** Score minimal pour qu'un résultat soit affiché. */
	const THRESHOLD = 3;

	public static function init() {
		add_action( 'reno360_cron', array( __CLASS__, 'purge_log' ) );
	}

	/**
	 * Mots vides (forme normalisée, avant racinisation).
	 *
	 * @return array<string,int>
	 */
	public static function stopwords() {
		static $set = null;
		if ( null === $set ) {
			$set = array_flip( self::stopword_list() );
		}
		return $set;
	}

	public static function stopword_list() {
		return array( 'a', 'au', 'aux', 'avec', 'ce', 'ces', 'cet', 'cette', 'chez', 'c', 'ca', 'd', 'dans', 'de', 'des', 'du', 'en', 'et', 'est', 'il', 'elle', 'je', 'j', 'l', 'la', 'le', 'les', 'leur', 'm', 'ma', 'me', 'mes', 'mon', 'moi', 'n', 'ne', 'nos', 'notre', 'nous', 'on', 'ou', 'par', 'pas', 'pour', 'qu', 'que', 'qui', 's', 'sa', 'se', 'ses', 'son', 'sur', 't', 'ta', 'te', 'tes', 'ton', 'un', 'une', 'vos', 'votre', 'vous', 'y', 'faire', 'refaire', 'besoin', 'veux', 'voudrais', 'souhaite', 'souhaiterais', 'cherche', 'recherche', 'trouver', 'svp', 'merci', 'bonjour', 'devis', 'prix', 'cout', 'tarif', 'entreprise', 'artisan', 'artisans', 'travaux', 'travail', 'quelqu', 'quelque', 'chose', 'avoir', 'etre', 'peu', 'tres', 'plus', 'bien', 'tout', 'tous', 'toute', 'toutes', 'cela', 'ici', 'mettre', 'il', 'y' );
	}

	/**
	 * Mots génériques dont le poids est réduit (forme racinisée).
	 *
	 * @return array<string,int>
	 */
	public static function weak() {
		static $set = null;
		if ( null === $set ) {
			$set = array_flip( self::weak_list() );
		}
		return $set;
	}

	public static function weak_list() {
		return array( 'renovation', 'renover', 'installation', 'installer', 'pose', 'poser', 'remplacement', 'remplacer', 'changer', 'changement', 'reparation', 'reparer', 'entretien', 'creation', 'creer', 'amenagement', 'amenager', 'complet', 'complete', 'general', 'generale', 'neuf', 'neuve', 'nouveau', 'nouvelle', 'mise', 'service' );
	}

	/**
	 * Minuscules, sans accents ni ponctuation, espaces simples.
	 *
	 * @param string $s Texte.
	 * @return string
	 */
	public static function normalize( $s ) {
		$s = wp_strip_all_tags( (string) $s );
		$s = str_replace(
			array( 'œ', 'Œ', 'æ', 'Æ', 'ß', '’', '‘', "'", '`', '-', '_', '/', '²', '³' ),
			array( 'oe', 'oe', 'ae', 'ae', 'ss', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '2', '3' ),
			$s
		);
		$s = remove_accents( $s );
		$s = strtolower( $s );
		$s = preg_replace( '/[^a-z0-9]+/', ' ', $s );
		return trim( preg_replace( '/\s+/', ' ', $s ) );
	}

	/**
	 * Racinisation légère : pluriels réguliers.
	 *
	 * @param string $t Jeton normalisé.
	 * @return string
	 */
	public static function stem( $t ) {
		$l = strlen( $t );
		if ( $l > 5 && 'eaux' === substr( $t, -4 ) ) {
			return substr( $t, 0, -1 );
		}
		if ( $l > 4 && 'aux' === substr( $t, -3 ) ) {
			return substr( $t, 0, -3 ) . 'al';
		}
		if ( $l > 3 && ( 's' === substr( $t, -1 ) || 'x' === substr( $t, -1 ) ) && 'ss' !== substr( $t, -2 ) ) {
			return substr( $t, 0, -1 );
		}
		return $t;
	}

	/**
	 * Jetons significatifs (sans mots vides), racinisés et uniques.
	 *
	 * @param string $s Texte.
	 * @return string[]
	 */
	public static function tokens( $s ) {
		$stop = self::stopwords();
		$out  = array();
		foreach ( explode( ' ', self::normalize( $s ) ) as $t ) {
			if ( '' === $t || isset( $stop[ $t ] ) ) {
				continue;
			}
			if ( strlen( $t ) < 2 && ! ctype_digit( $t ) ) {
				continue;
			}
			$t = self::stem( $t );
			if ( ! in_array( $t, $out, true ) ) {
				$out[] = $t;
			}
		}
		return $out;
	}

	/** Expression normalisée (jetons joints). */
	public static function phrase( $s ) {
		return implode( ' ', self::tokens( $s ) );
	}

	/* ------------------------------------------------------------------ */
	/* Index                                                              */
	/* ------------------------------------------------------------------ */

	public static function flush() {
		delete_option( self::OPTION );
	}

	/**
	 * Index (mis en cache dans une option, reconstruit à chaque modification).
	 *
	 * @return array
	 */
	public static function index() {
		$idx = get_option( self::OPTION );
		if ( ! is_array( $idx ) || ! isset( $idx['v'] ) || self::VERSION !== (int) $idx['v'] ) {
			$idx = self::build();
			update_option( self::OPTION, $idx, false );
		}
		return $idx;
	}

	public static function build() {
		$items = array();
		foreach ( Activities::all() as $a ) {
			$k_tokens = array();
			$phrases  = array();
			foreach ( $a['keywords'] as $kw ) {
				$toks = self::tokens( $kw );
				if ( ! $toks ) {
					continue;
				}
				// 3e valeur : 1 si aucun mot du mot-clé n'a été ignoré (mot vide).
				$phrases[] = array( implode( ' ', $toks ), $kw, count( $toks ) === count( explode( ' ', self::normalize( $kw ) ) ) ? 1 : 0 );
				foreach ( $toks as $t ) {
					$k_tokens[ $t ] = 1;
				}
			}
			$items[] = array(
				'id'   => $a['id'],
				's'    => $a['slug'],
				'name' => $a['name'],
				'cat'  => $a['category'],
				'cs'   => $a['cat_slug'],
				'icon' => $a['icon'],
				'url'  => $a['url'],
				'ex'   => $a['excerpt'],
				'pop'  => $a['popular'] ? 1 : 0,
				'b'    => $a['boost'],
				'f'    => array(
					'n' => self::tokens( $a['name'] ),
					'k' => array_map( 'strval', array_keys( $k_tokens ) ),
					'c' => self::tokens( $a['category'] ),
					'd' => self::tokens( $a['excerpt'] ),
				),
				'nn'   => self::phrase( $a['name'] ),
				'kp'   => $phrases,
			);
		}
		return array(
			'v'     => self::VERSION,
			't'     => time(),
			'items' => $items,
		);
	}

	/**
	 * Index allégé envoyé au navigateur.
	 *
	 * @return array
	 */
	public static function client_index() {
		$idx = self::index();
		return array(
			'v'     => $idx['t'],
			'items' => $idx['items'],
			'stop'  => self::stopword_list(),
			'weak'  => self::weak_list(),
		);
	}

	/* ------------------------------------------------------------------ */
	/* Correspondance et score                                            */
	/* ------------------------------------------------------------------ */

	/**
	 * Distance de Damerau-Levenshtein (alignement optimal), arrêt anticipé au-delà de $max.
	 *
	 * @param string $a   Chaîne A.
	 * @param string $b   Chaîne B.
	 * @param int    $max Distance maximale utile.
	 * @return int
	 */
	public static function distance( $a, $b, $max = 2 ) {
		$la = strlen( $a );
		$lb = strlen( $b );
		if ( abs( $la - $lb ) > $max ) {
			return $max + 1;
		}
		$prev2 = array();
		$prev  = range( 0, $lb );
		for ( $i = 1; $i <= $la; $i++ ) {
			$cur     = array( $i );
			$row_min = $i;
			for ( $j = 1; $j <= $lb; $j++ ) {
				$cost = ( $a[ $i - 1 ] === $b[ $j - 1 ] ) ? 0 : 1;
				$v    = min( $prev[ $j ] + 1, $cur[ $j - 1 ] + 1, $prev[ $j - 1 ] + $cost );
				if ( $i > 1 && $j > 1 && $a[ $i - 1 ] === $b[ $j - 2 ] && $a[ $i - 2 ] === $b[ $j - 1 ] ) {
					$v = min( $v, $prev2[ $j - 2 ] + 1 );
				}
				$cur[ $j ] = $v;
				if ( $v < $row_min ) {
					$row_min = $v;
				}
			}
			if ( $row_min > $max ) {
				return $max + 1;
			}
			$prev2 = $prev;
			$prev  = $cur;
		}
		return $prev[ $lb ];
	}

	/**
	 * Qualité de correspondance entre un jeton de requête et un jeton indexé (0 à 1).
	 *
	 * @param string $q Jeton de la requête.
	 * @param string $f Jeton indexé.
	 * @return float
	 */
	public static function match( $q, $f ) {
		if ( $q === $f ) {
			return 1.0;
		}
		$lq = strlen( $q );
		$lf = strlen( $f );
		if ( $lq >= 2 && $lf > $lq && 0 === strpos( $f, $q ) ) {
			return $lq >= 3 ? 0.9 : 0.6;
		}
		if ( $lf >= 4 && $lq > $lf && 0 === strpos( $q, $f ) ) {
			return 0.75;
		}
		if ( $lq >= 4 ) {
			$max = $lq >= 8 ? 2 : 1;
			if ( abs( $lq - $lf ) <= $max ) {
				$d = self::distance( $q, $f, $max );
				if ( $d <= $max ) {
					return 1 === $d ? 0.72 : 0.5;
				}
			}
			if ( $lf > $lq && self::distance( $q, substr( $f, 0, $lq ), 1 ) <= 1 ) {
				return 0.6;
			}
		}
		// Racine commune : plombier / plomberie, peintre / peinture.
		$p   = 0;
		$min = min( $lq, $lf );
		while ( $p < $min && $q[ $p ] === $f[ $p ] ) {
			++$p;
		}
		if ( $p >= 5 && $p >= 0.6 * $min ) {
			return 0.65;
		}
		return 0.0;
	}

	/**
	 * Score d'un élément de l'index pour une requête.
	 *
	 * @param string[] $q_tokens Jetons de la requête.
	 * @param string   $q_phrase Expression normalisée.
	 * @param array    $item     Élément d'index.
	 * @return array{score:float,hint:string}
	 */
	public static function score( array $q_tokens, $q_phrase, array $item ) {
		$weak       = self::weak();
		$total      = 0.0;
		$matched    = 0;
		$hint       = '';
		$hint_score = 0.0;

		foreach ( $q_tokens as $qt ) {
			$best       = 0.0;
			$best_field = '';
			$best_tok   = '';
			foreach ( self::WEIGHTS as $field => $w ) {
				foreach ( $item['f'][ $field ] as $ft ) {
					$m = self::match( $qt, $ft );
					if ( $m <= 0 ) {
						continue;
					}
					$s = $w * $m;
					if ( $s > $best ) {
						$best       = $s;
						$best_field = $field;
						$best_tok   = $ft;
					}
				}
			}
			if ( $best <= 0 ) {
				continue;
			}
			++$matched;
			$contrib = $best * ( isset( $weak[ $qt ] ) ? 0.35 : 1 );
			$total  += $contrib;
			if ( 'k' === $best_field && $contrib > $hint_score ) {
				foreach ( $item['kp'] as $kp ) {
					if ( false !== strpos( ' ' . $kp[0] . ' ', ' ' . $best_tok . ' ' ) ) {
						$hint       = $kp[1];
						$hint_score = $contrib;
						break;
					}
				}
			}
		}
		if ( 0 === $matched ) {
			return array(
				'score' => 0.0,
				'hint'  => '',
			);
		}
		$total *= pow( $matched / count( $q_tokens ), 1.5 );

		if ( strlen( $q_phrase ) >= 3 ) {
			if ( $item['nn'] === $q_phrase ) {
				$total += 20;
			} elseif ( 0 === strpos( $item['nn'], $q_phrase ) ) {
				$total += 10;
			} elseif ( false !== strpos( ' ' . $item['nn'], ' ' . $q_phrase ) ) {
				$total += 6;
			}
			foreach ( $item['kp'] as $kp ) {
				if ( $kp[0] === $q_phrase ) {
					$total += ! empty( $kp[2] ) ? 14 : 7;
					$hint   = $kp[1];
					break;
				}
				if ( count( $q_tokens ) > 1 && false !== strpos( ' ' . $kp[0] . ' ', ' ' . $q_phrase . ' ' ) ) {
					$total += 7;
					$hint   = $kp[1];
					break;
				}
			}
		}
		$total += 0.5 * (int) $item['b'] + ( $item['pop'] ? 0.5 : 0 );

		return array(
			'score' => $total,
			'hint'  => $hint,
		);
	}

	/**
	 * Recherche.
	 *
	 * @param string $q     Requête.
	 * @param int    $limit Nombre maximum de résultats.
	 * @return array{tokens:string[],results:array}
	 */
	public static function query( $q, $limit = 8 ) {
		$tokens = self::tokens( $q );
		$phrase = implode( ' ', $tokens );
		$out    = array();
		if ( $tokens ) {
			foreach ( self::index()['items'] as $item ) {
				$r = self::score( $tokens, $phrase, $item );
				if ( $r['score'] >= self::THRESHOLD ) {
					$out[] = array(
						'id'    => $item['id'],
						'slug'  => $item['s'],
						'name'  => $item['name'],
						'cat'   => $item['cat'],
						'icon'  => $item['icon'],
						'url'   => $item['url'],
						'hint'  => $r['hint'],
						'score' => round( $r['score'], 2 ),
					);
				}
			}
			usort(
				$out,
				static function ( $a, $b ) {
					if ( $a['score'] === $b['score'] ) {
						return strcmp( $a['name'], $b['name'] );
					}
					return $a['score'] < $b['score'] ? 1 : -1;
				}
			);
		}
		return array(
			'tokens'  => $tokens,
			'results' => array_slice( $out, 0, max( 1, (int) $limit ) ),
		);
	}

	/* ------------------------------------------------------------------ */
	/* Journal des recherches                                             */
	/* ------------------------------------------------------------------ */

	public static function log( $q, $results, $top_id = 0, $selected_id = 0, $source = '' ) {
		global $wpdb;
		$q    = mb_substr( trim( sanitize_text_field( (string) $q ) ), 0, 190 );
		$norm = mb_substr( self::phrase( $q ), 0, 190 );
		if ( strlen( $norm ) < 2 ) {
			return;
		}
		$wpdb->insert(
			Installer::table( 'search_log' ),
			array(
				'q'           => $q,
				'norm'        => $norm,
				'results'     => (int) $results,
				'top_id'      => (int) $top_id,
				'selected_id' => (int) $selected_id,
				'source'      => sanitize_key( $source ),
				'created_at'  => Util::now(),
			),
			array( '%s', '%s', '%d', '%d', '%d', '%s', '%s' )
		);
	}

	public static function purge_log() {
		global $wpdb;
		$days = (int) Settings::get( 'search_log_days', 180 );
		if ( $days > 0 ) {
			$wpdb->query( $wpdb->prepare( 'DELETE FROM ' . Installer::table( 'search_log' ) . ' WHERE created_at < %s', gmdate( 'Y-m-d H:i:s', time() - $days * DAY_IN_SECONDS ) ) ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		}
	}

	public static function clear_log() {
		global $wpdb;
		$wpdb->query( 'DELETE FROM ' . Installer::table( 'search_log' ) ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
	}

	/**
	 * Statistiques du journal.
	 *
	 * @param int $days Période.
	 * @return array
	 */
	public static function stats( $days = 30 ) {
		global $wpdb;
		$t     = Installer::table( 'search_log' );
		$since = gmdate( 'Y-m-d H:i:s', time() - $days * DAY_IN_SECONDS );
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$total   = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $t WHERE created_at >= %s", $since ) );
		$empty   = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $t WHERE created_at >= %s AND results = 0", $since ) );
		$picked  = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $t WHERE created_at >= %s AND selected_id > 0", $since ) );
		$uniques = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(DISTINCT norm) FROM $t WHERE created_at >= %s", $since ) );
		// phpcs:enable
		return array(
			'total'   => $total,
			'empty'   => $empty,
			'picked'  => $picked,
			'uniques' => $uniques,
		);
	}

	/**
	 * Requêtes les plus fréquentes.
	 *
	 * @param int  $days      Période.
	 * @param int  $limit     Nombre.
	 * @param bool $no_result Seulement celles sans résultat.
	 * @return array
	 */
	public static function top_queries( $days = 30, $limit = 30, $no_result = false ) {
		global $wpdb;
		$t     = Installer::table( 'search_log' );
		$since = gmdate( 'Y-m-d H:i:s', time() - $days * DAY_IN_SECONDS );
		$where = $no_result ? ' AND results = 0' : '';
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		return (array) $wpdb->get_results(
			$wpdb->prepare(
				"SELECT norm, MAX(q) AS q, COUNT(*) AS hits, MAX(results) AS results, MAX(selected_id) AS selected_id, MAX(top_id) AS top_id, MAX(created_at) AS last_at
				FROM $t WHERE created_at >= %s $where GROUP BY norm ORDER BY hits DESC, last_at DESC LIMIT %d",
				$since,
				$limit
			),
			ARRAY_A
		);
		// phpcs:enable
	}

	public static function delete_query_logs( $norm ) {
		global $wpdb;
		$wpdb->delete( Installer::table( 'search_log' ), array( 'norm' => $norm ), array( '%s' ) );
	}
}
