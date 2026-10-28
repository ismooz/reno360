<?php
/**
 * En-tête et pied de page du site (bandeau, logo, menu « Travaux », pied de page) et fenêtre
 * de demande rapide. Avec un thème à blocs, ils remplacent les parties « header » et « footer »
 * du thème sur tout le site ; avec un thème classique (Divi), ils s'insèrent par shortcode.
 *
 * @package Reno360
 */

namespace Reno360;

defined( 'ABSPATH' ) || exit;

class Chrome {

	public static function init() {
		add_shortcode( 'reno360_header', array( __CLASS__, 'sc_header' ) );
		add_shortcode( 'reno360_footer', array( __CLASS__, 'sc_footer' ) );
		add_filter( 'render_block_core/template-part', array( __CLASS__, 'replace_part' ), 10, 2 );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'maybe_enqueue' ), 25 );
		add_action( 'wp_footer', array( __CLASS__, 'quote_modal' ), 5 );
	}

	/** L'en-tête et le pied de page Reno360 remplacent-ils ceux du thème ? */
	public static function replaces_theme() {
		return Settings::get( 'site_chrome' ) && function_exists( 'wp_is_block_theme' ) && wp_is_block_theme();
	}

	/** Sur les pages sans contenu Reno360, l'index de recherche est chargé à la demande. */
	public static function maybe_enqueue() {
		if ( self::replaces_theme() && ! Frontend::assets_loaded() ) {
			Frontend::enqueue( false );
		}
	}

	public static function sc_header() {
		Frontend::enqueue();
		return self::header();
	}

	public static function sc_footer() {
		Frontend::enqueue();
		return self::footer();
	}

	/**
	 * Remplace les parties d'en-tête et de pied de page du thème à blocs.
	 *
	 * @param string $content Rendu du bloc.
	 * @param array  $block   Bloc analysé.
	 * @return string
	 */
	public static function replace_part( $content, $block ) {
		if ( is_admin() || wp_is_json_request() || ! self::replaces_theme() ) {
			return $content;
		}
		$area = self::part_area( isset( $block['attrs'] ) ? $block['attrs'] : array() );
		if ( 'header' === $area ) {
			return self::header();
		}
		if ( 'footer' === $area ) {
			return self::footer();
		}
		return $content;
	}

	private static function part_area( array $attrs ) {
		if ( ! empty( $attrs['area'] ) ) {
			return $attrs['area'];
		}
		if ( ! empty( $attrs['tagName'] ) && in_array( $attrs['tagName'], array( 'header', 'footer' ), true ) ) {
			return $attrs['tagName'];
		}
		if ( empty( $attrs['slug'] ) ) {
			return '';
		}
		$theme = ! empty( $attrs['theme'] ) ? $attrs['theme'] : get_stylesheet();
		$part  = get_block_template( $theme . '//' . $attrs['slug'], 'wp_template_part' );
		if ( $part && ! empty( $part->area ) && 'uncategorized' !== $part->area ) {
			return $part->area;
		}
		return preg_match( '/header|footer/', $attrs['slug'], $m ) ? $m[0] : '';
	}

	/* ------------------------------------------------------------------ */
	/* Données                                                            */
	/* ------------------------------------------------------------------ */

	/** URL du logo : réglage Reno360, sinon logo du site WordPress, sinon aucun (texte). */
	public static function logo_url() {
		$id = (int) Settings::get( 'logo_id', 0 );
		if ( ! $id ) {
			$id = (int) get_option( 'site_logo' );
		}
		if ( ! $id ) {
			$id = (int) get_theme_mod( 'custom_logo' );
		}
		$url = $id ? wp_get_attachment_image_url( $id, 'medium_large' ) : '';
		return $url ? $url : '';
	}

	/** Nom de l'entreprise mis en forme quand il n'y a pas de logo (« reno<b>360</b> »). */
	public static function logo_text() {
		$name = (string) Settings::get( 'company', 'Reno360' );
		if ( preg_match( '/^(.*?)(\d+)$/u', $name, $m ) ) {
			return esc_html( mb_strtolower( $m[1] ) ) . '<b>' . esc_html( $m[2] ) . '</b>';
		}
		return esc_html( $name );
	}

	public static function region_text() {
		$custom = trim( (string) Settings::get( 'utility_text', '' ) );
		if ( '' !== $custom ) {
			return $custom;
		}
		$codes  = (array) Settings::get( 'cantons', array() );
		$names  = array();
		$all    = Util::cantons();
		foreach ( $codes as $c ) {
			if ( isset( $all[ $c ] ) ) {
				$names[] = $all[ $c ];
			}
		}
		$romand = ! array_diff( $codes, array( 'VD', 'GE', 'FR', 'VS', 'NE', 'JU' ) );
		$prefix = $romand ? ( count( $codes ) >= 6 ? 'Toute la Suisse romande' : 'Suisse romande' ) : 'Suisse';
		return $names ? $prefix . ' · ' . implode( ', ', $names ) : $prefix;
	}

	/** Lien vers une ancre de la page d'accueil Reno360. */
	public static function home_anchor( $anchor ) {
		return Settings::page_url( 'home' ) . '#' . $anchor;
	}

	/** Nom court (sans précision entre parenthèses) : « Pompe à chaleur (PAC) » → « Pompe à chaleur ». */
	public static function short_name( $name ) {
		return trim( preg_replace( '/\s*\([^)]*\)\s*$/u', '', $name ) );
	}

	/** Catégories et leurs travaux actifs, dans l'ordre d'affichage. */
	public static function groups() {
		$by_cat = array();
		foreach ( Activities::all() as $a ) {
			if ( $a['active'] ) {
				$by_cat[ $a['cat_slug'] ][] = $a;
			}
		}
		$groups = array();
		foreach ( Activities::categories() as $c ) {
			if ( ! empty( $by_cat[ $c['slug'] ] ) ) {
				$groups[] = array(
					'name'  => $c['name'],
					'slug'  => $c['slug'],
					'items' => $by_cat[ $c['slug'] ],
				);
				unset( $by_cat[ $c['slug'] ] );
			}
		}
		if ( ! empty( $by_cat ) ) {
			$rest = array();
			foreach ( $by_cat as $items ) {
				$rest = array_merge( $rest, $items );
			}
			$groups[] = array(
				'name'  => 'Autres travaux',
				'slug'  => 'autres',
				'items' => $rest,
			);
		}
		return $groups;
	}

	/**
	 * Travaux mis en avant dans le pied de page et la demande rapide.
	 *
	 * @param int      $limit Nombre de travaux.
	 * @param string[] $first Adresses (slugs) à placer en tête si elles existent.
	 */
	public static function highlights( $limit, array $first = array() ) {
		$all    = array_values(
			array_filter(
				Activities::all(),
				static function ( $a ) {
					return $a['active'];
				}
			)
		);
		$picked = array();
		foreach ( $first as $slug ) {
			foreach ( $all as $a ) {
				if ( $a['slug'] === $slug ) {
					$picked[ $a['id'] ] = $a;
				}
			}
		}
		foreach ( array( 'featured', 'popular' ) as $flag ) {
			foreach ( $all as $a ) {
				if ( $a[ $flag ] ) {
					$picked[ $a['id'] ] = $a;
				}
			}
		}
		foreach ( $all as $a ) {
			$picked[ $a['id'] ] = $a;
		}
		return array_slice( array_values( $picked ), 0, $limit );
	}

	/** Liens légaux renseignés dans les réglages. */
	public static function legal_links() {
		$links = array();
		if ( Settings::get( 'legal_url' ) ) {
			$links['Mentions légales'] = Settings::get( 'legal_url' );
		}
		$privacy = Settings::get( 'privacy_url' ) ? Settings::get( 'privacy_url' ) : get_privacy_policy_url();
		if ( $privacy ) {
			$links['Protection des données'] = $privacy;
		}
		if ( Settings::get( 'terms_url' ) ) {
			$links['Conditions générales'] = Settings::get( 'terms_url' );
		}
		return $links;
	}

	/* ------------------------------------------------------------------ */
	/* Rendu                                                              */
	/* ------------------------------------------------------------------ */

	public static function header() {
		return Frontend::render( 'chrome/header' );
	}

	public static function footer() {
		return Frontend::render( 'chrome/footer' );
	}

	/** Fenêtre de demande rapide, imprimée une fois en bas de page dès que Reno360 est chargé. */
	public static function quote_modal() {
		if ( ! Frontend::assets_loaded() ) {
			return;
		}
		echo Frontend::render( 'parts/quote-modal' ); // phpcs:ignore WordPress.Security.EscapeOutput
	}
}
