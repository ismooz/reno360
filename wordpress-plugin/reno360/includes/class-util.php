<?php
/**
 * Fonctions utilitaires partagées.
 *
 * @package Reno360
 */

namespace Reno360;

defined( 'ABSPATH' ) || exit;

class Util {

	const CAP = 'manage_reno360';

	/**
	 * Statuts d'une demande, dans l'ordre du pipeline.
	 *
	 * @return array
	 */
	public static function statuses() {
		return array(
			'nouvelle'  => array( 'label' => 'Nouvelle', 'client' => 'Demande envoyée', 'fg' => '#1D4ED8', 'bg' => '#E7EEFE' ),
			'qualifiee' => array( 'label' => 'Qualifiée', 'client' => 'Vérifiée par un conseiller', 'fg' => '#6D28D9', 'bg' => '#F1EBFE' ),
			'envoyee'   => array( 'label' => 'Envoyée aux artisans', 'client' => 'Artisans sélectionnés', 'fg' => '#0F766E', 'bg' => '#E1F4F1' ),
			'devis'     => array( 'label' => 'Devis reçus', 'client' => 'Devis reçus', 'fg' => '#7A4F00', 'bg' => '#FDF1D8' ),
			'acceptee'  => array( 'label' => 'Acceptée', 'client' => 'Devis accepté', 'fg' => '#145F32', 'bg' => '#E3F2E8' ),
			'travaux'   => array( 'label' => 'En travaux', 'client' => 'Travaux en cours', 'fg' => '#334155', 'bg' => '#E7EBF0' ),
			'terminee'  => array( 'label' => 'Terminée', 'client' => 'Travaux terminés', 'fg' => '#0F1D15', 'bg' => '#DCE3DD' ),
			'perdue'    => array( 'label' => 'Perdue', 'client' => 'Demande clôturée', 'fg' => '#A61B1B', 'bg' => '#FDE8E8' ),
		);
	}

	public static function status_label( $status, $client = false ) {
		$all = self::statuses();
		if ( ! isset( $all[ $status ] ) ) {
			return $status;
		}
		return $client ? $all[ $status ]['client'] : $all[ $status ]['label'];
	}

	public static function status_badge( $status ) {
		$all = self::statuses();
		$s   = isset( $all[ $status ] ) ? $all[ $status ] : array( 'label' => $status, 'fg' => '#3C434A', 'bg' => '#F0F0F1' );
		return sprintf(
			'<span class="rn-badge" style="color:%1$s;background:%2$s">%3$s</span>',
			esc_attr( $s['fg'] ),
			esc_attr( $s['bg'] ),
			esc_html( $s['label'] )
		);
	}

	public static function quote_statuses() {
		return array(
			'attendu' => array( 'label' => 'Devis attendu', 'fg' => '#0F766E', 'bg' => '#E1F4F1' ),
			'recu'    => array( 'label' => 'Devis reçu', 'fg' => '#7A4F00', 'bg' => '#FDF1D8' ),
			'accepte' => array( 'label' => 'Accepté', 'fg' => '#145F32', 'bg' => '#E3F2E8' ),
			'refuse'  => array( 'label' => 'Non retenu', 'fg' => '#3C434A', 'bg' => '#F0F0F1' ),
			'decline' => array( 'label' => 'Indisponible', 'fg' => '#A61B1B', 'bg' => '#FDE8E8' ),
		);
	}

	public static function quote_badge( $status ) {
		$all = self::quote_statuses();
		$s   = isset( $all[ $status ] ) ? $all[ $status ] : array( 'label' => $status, 'fg' => '#3C434A', 'bg' => '#F0F0F1' );
		return sprintf(
			'<span class="rn-badge" style="color:%1$s;background:%2$s">%3$s</span>',
			esc_attr( $s['fg'] ),
			esc_attr( $s['bg'] ),
			esc_html( $s['label'] )
		);
	}

	public static function artisan_statuses() {
		return array(
			'candidat' => array( 'label' => 'En validation', 'fg' => '#7A4F00', 'bg' => '#FDF1D8' ),
			'actif'    => array( 'label' => 'Actif', 'fg' => '#145F32', 'bg' => '#E3F2E8' ),
			'suspendu' => array( 'label' => 'Suspendu', 'fg' => '#A61B1B', 'bg' => '#FDE8E8' ),
		);
	}

	public static function artisan_badge( $status ) {
		$all = self::artisan_statuses();
		$s   = isset( $all[ $status ] ) ? $all[ $status ] : array( 'label' => $status, 'fg' => '#3C434A', 'bg' => '#F0F0F1' );
		return sprintf(
			'<span class="rn-badge" style="color:%1$s;background:%2$s">%3$s</span>',
			esc_attr( $s['fg'] ),
			esc_attr( $s['bg'] ),
			esc_html( $s['label'] )
		);
	}

	public static function cantons() {
		return array(
			'VD' => 'Vaud',
			'GE' => 'Genève',
			'FR' => 'Fribourg',
			'VS' => 'Valais',
			'NE' => 'Neuchâtel',
			'JU' => 'Jura',
			'BE' => 'Berne',
			'SO' => 'Soleure',
			'BS' => 'Bâle-Ville',
			'BL' => 'Bâle-Campagne',
			'AG' => 'Argovie',
			'LU' => 'Lucerne',
			'ZG' => 'Zoug',
			'ZH' => 'Zurich',
			'SZ' => 'Schwytz',
			'UR' => 'Uri',
			'OW' => 'Obwald',
			'NW' => 'Nidwald',
			'GL' => 'Glaris',
			'SH' => 'Schaffhouse',
			'TG' => 'Thurgovie',
			'SG' => 'Saint-Gall',
			'AR' => 'Appenzell Rh.-Ext.',
			'AI' => 'Appenzell Rh.-Int.',
			'GR' => 'Grisons',
			'TI' => 'Tessin',
		);
	}

	/**
	 * Canton probable d'après le NPA (approximation, modifiable dans la fiche).
	 *
	 * @param string $npa NPA suisse.
	 * @return string Code canton ou chaîne vide.
	 */
	public static function canton_from_npa( $npa ) {
		$n = (int) preg_replace( '/\D/', '', (string) $npa );
		if ( $n < 1000 || $n > 9999 ) {
			return '';
		}
		$ranges = array(
			array( 1000, 1199, 'VD' ),
			array( 1200, 1299, 'GE' ),
			array( 1300, 1467, 'VD' ),
			array( 1468, 1489, 'FR' ),
			array( 1490, 1529, 'VD' ),
			array( 1530, 1539, 'VD' ),
			array( 1540, 1579, 'FR' ),
			array( 1580, 1589, 'VD' ),
			array( 1590, 1599, 'VD' ),
			array( 1600, 1799, 'FR' ),
			array( 1800, 1869, 'VD' ),
			array( 1870, 1879, 'VS' ),
			array( 1880, 1885, 'VD' ),
			array( 1886, 1999, 'VS' ),
			array( 2000, 2499, 'NE' ),
			array( 2500, 2739, 'BE' ),
			array( 2740, 2999, 'JU' ),
			array( 3000, 3899, 'BE' ),
			array( 3900, 3999, 'VS' ),
			array( 4000, 4099, 'BS' ),
			array( 4100, 4499, 'BL' ),
			array( 4500, 4699, 'SO' ),
			array( 4700, 5999, 'AG' ),
			array( 6000, 6299, 'LU' ),
			array( 6300, 6399, 'ZG' ),
			array( 6400, 6499, 'SZ' ),
			array( 6500, 6999, 'TI' ),
			array( 7000, 7799, 'GR' ),
			array( 8000, 8499, 'ZH' ),
			array( 8500, 8599, 'TG' ),
			array( 8600, 8999, 'ZH' ),
			array( 9000, 9999, 'SG' ),
		);
		foreach ( $ranges as $r ) {
			if ( $n >= $r[0] && $n <= $r[1] ) {
				return $r[2];
			}
		}
		return '';
	}

	/** Date/heure UTC au format MySQL. */
	public static function now() {
		return current_time( 'mysql', true );
	}

	/**
	 * Affiche une date stockée en UTC dans le fuseau du site.
	 *
	 * @param string|null $utc    Date MySQL UTC.
	 * @param string      $format Format PHP.
	 * @return string
	 */
	public static function date( $utc, $format = 'd.m.Y' ) {
		if ( empty( $utc ) || '0000-00-00 00:00:00' === $utc ) {
			return '';
		}
		$ts = strtotime( $utc . ( strlen( $utc ) > 10 ? ' UTC' : '' ) );
		return $ts ? wp_date( $format, $ts ) : '';
	}

	public static function datetime( $utc ) {
		return self::date( $utc, 'd.m.Y H:i' );
	}

	/**
	 * « il y a 3 h », « hier », « 12.10 »…
	 *
	 * @param string $utc Date MySQL UTC.
	 * @return string
	 */
	public static function ago( $utc ) {
		if ( empty( $utc ) ) {
			return '';
		}
		$ts   = strtotime( $utc . ' UTC' );
		$diff = time() - $ts;
		if ( $diff < 60 ) {
			return 'à l’instant';
		}
		if ( $diff < 3600 ) {
			return sprintf( 'il y a %d min', floor( $diff / 60 ) );
		}
		if ( $diff < 86400 ) {
			return sprintf( 'il y a %d h', floor( $diff / 3600 ) );
		}
		if ( $diff < 172800 ) {
			return 'hier';
		}
		if ( $diff < 7 * 86400 ) {
			return sprintf( 'il y a %d j', floor( $diff / 86400 ) );
		}
		return wp_date( 'd.m.Y', $ts );
	}

	/**
	 * 18450 -> « CHF 18'450 ».
	 *
	 * @param float|string|null $amount Montant.
	 * @param bool              $prefix Préfixer « CHF ».
	 * @return string
	 */
	public static function chf( $amount, $prefix = true ) {
		if ( null === $amount || '' === $amount ) {
			return '—';
		}
		$amount = (float) $amount;
		$dec    = ( floor( $amount ) != $amount ) ? 2 : 0; // phpcs:ignore Universal.Operators.StrictComparisons
		$s      = number_format( $amount, $dec, '.', "'" );
		return $prefix ? 'CHF ' . $s : $s;
	}

	public static function parse_amount( $raw ) {
		$raw = str_replace( array( "'", '’', ' ', 'CHF', 'chf', "\xc2\xa0" ), '', (string) $raw );
		$raw = str_replace( ',', '.', $raw );
		return is_numeric( $raw ) ? round( (float) $raw, 2 ) : null;
	}

	public static function initials( $name ) {
		$words = preg_split( '/[\s\-&]+/u', trim( (string) $name ) );
		$out   = '';
		foreach ( $words as $w ) {
			if ( '' === $w ) {
				continue;
			}
			$out .= mb_strtoupper( mb_substr( $w, 0, 1 ) );
			if ( mb_strlen( $out ) >= 2 ) {
				break;
			}
		}
		return $out ? $out : '?';
	}

	/** Jeton aléatoire hexadécimal. */
	public static function token( $length = 32 ) {
		return bin2hex( random_bytes( (int) ceil( $length / 2 ) ) );
	}

	/**
	 * Limitation de débit simple sur les points d'entrée publics.
	 * L'adresse IP n'est jamais stockée en clair (hachage salé, durée courte).
	 *
	 * @param string $action Clé d'action.
	 * @param int    $max    Nombre d'appels autorisés.
	 * @param int    $window Fenêtre en secondes.
	 * @return bool True si autorisé.
	 */
	public static function rate_limit( $action, $max, $window ) {
		$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown';
		$key = 'rn_rl_' . substr( hash_hmac( 'sha256', $action . '|' . $ip, wp_salt( 'nonce' ) ), 0, 32 );
		$hit = (int) get_transient( $key );
		if ( $hit >= $max ) {
			return false;
		}
		set_transient( $key, $hit + 1, $window );
		return true;
	}

	public static function device() {
		$ua = isset( $_SERVER['HTTP_USER_AGENT'] ) ? strtolower( sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ) ) : '';
		if ( preg_match( '/ipad|tablet/', $ua ) ) {
			return 'Tablette';
		}
		if ( preg_match( '/mobi|android|iphone/', $ua ) ) {
			return 'Mobile';
		}
		return $ua ? 'Ordinateur' : '';
	}

	/**
	 * Texte d'une liste d'options : renvoie la valeur si elle fait partie des choix.
	 *
	 * @param string   $value   Valeur postée.
	 * @param string[] $choices Choix permis.
	 * @return string
	 */
	public static function pick( $value, array $choices ) {
		$value = trim( (string) $value );
		return in_array( $value, $choices, true ) ? $value : '';
	}

	public static function admin_url( $page, array $args = array() ) {
		return add_query_arg( array_merge( array( 'page' => $page ), $args ), admin_url( 'admin.php' ) );
	}

	public static function json( $data ) {
		return wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
	}

	/** JSON sûr à l'intérieur d'une balise <script>. */
	public static function json_script( $data ) {
		return wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP );
	}

	/**
	 * Décode un champ JSON stocké en base.
	 *
	 * @param string|null $raw JSON.
	 * @return array
	 */
	public static function decode( $raw ) {
		if ( empty( $raw ) ) {
			return array();
		}
		$data = json_decode( (string) $raw, true );
		return is_array( $data ) ? $data : array();
	}

	public static function current_user_name() {
		$u = wp_get_current_user();
		return $u && $u->exists() ? $u->display_name : '';
	}

	/**
	 * Liste des utilisateurs pouvant gérer Reno360 (responsables).
	 *
	 * @return \WP_User[]
	 */
	public static function staff() {
		$users = get_users(
			array(
				'capability' => self::CAP,
				'orderby'    => 'display_name',
				'fields'     => array( 'ID', 'display_name' ),
			)
		);
		return $users;
	}

	public static function user_name( $user_id ) {
		if ( ! $user_id ) {
			return '';
		}
		$u = get_userdata( (int) $user_id );
		return $u ? $u->display_name : '';
	}
}
