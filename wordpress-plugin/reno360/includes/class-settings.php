<?php
/**
 * Réglages de l'extension (une seule option sérialisée).
 *
 * @package Reno360
 */

namespace Reno360;

defined( 'ABSPATH' ) || exit;

class Settings {

	const OPTION = 'reno360_settings';

	/** @var array|null */
	private static $cache = null;

	public static function defaults() {
		return array(
			// Général.
			'company'               => 'Reno360',
			'public_email'          => 'info@reno360.ch',
			'phone'                 => '+41 21 888 10 10',
			'address'               => '1565 Missy, Vaud',
			'notify_emails'         => get_option( 'admin_email' ),
			'from_name'             => 'Reno360',
			'from_email'            => '',
			'logo_id'               => 0,
			'primary_color'         => '#187A3E',
			'use_fonts'             => 1,
			'max_artisans'          => 3,
			'sla_hours'             => 24,
			'cantons'               => array( 'VD', 'GE', 'FR', 'VS', 'NE', 'JU' ),
			'activities_slug'       => 'travaux',
			'pages'                 => array(),

			// Formulaire.
			'budgets'               => "Moins de 5'000 CHF\n5'000 – 10'000 CHF\n10'000 – 20'000 CHF\n20'000 – 50'000 CHF\nPlus de 50'000 CHF\nÀ déterminer",
			'start_options'         => "Urgent (moins d’une semaine)\nDans le mois\nDans 1 à 3 mois\nDans 3 à 6 mois\nFlexible",
			'property_types'        => "Appartement\nMaison individuelle\nImmeuble\nLocal commercial ou bureau\nAutre",
			'client_types'          => "Propriétaire\nLocataire\nRégie / gérance\nPPE / copropriété\nEntreprise",
			'contact_prefs'         => "Téléphone\nE-mail\nWhatsApp",
			'contact_times'         => "Matin\nMidi\nAprès-midi\nAprès 17 h",
			'max_files'             => 10,
			'max_file_mb'           => 10,
			'require_phone'         => 1,
			'min_description'       => 15,
			'terms_url'             => '',
			'privacy_url'           => '',
			'consent_text'          => 'J’accepte les conditions générales et la politique de confidentialité, et que ma demande soit transmise à {max_artisans} artisans au maximum.',
			'success_text'          => 'Merci ! Votre demande a bien été reçue. Un conseiller la vérifie et vous contacte sous {sla_hours} h ouvrées.',

			// Suivi et notifications.
			'share_client_contact'  => 1,
			'notify_client_status'  => array( 'envoyee', 'devis', 'acceptee', 'terminee' ),
			'notify_client_quote'   => 1,
			'notify_admin_quote'    => 1,
			'notify_losers'         => 1,
			'review_url'            => '',

			// Automatisations.
			'auto_unhandled'        => 1,
			'auto_unhandled_hours'  => 4,
			'auto_artisan'          => 1,
			'auto_artisan_days'     => 3,
			'auto_client_choose'    => 1,
			'auto_client_days'      => 5,
			'auto_review'           => 1,
			'auto_review_days'      => 7,
			'auto_docs'             => 1,
			'auto_docs_days'        => 30,

			// Données (nLPD).
			'retention_months'      => 0,
			'search_log_days'       => 180,
			'delete_on_uninstall'   => 0,

			// Contenus.
			'faq'                   => implode(
				"\n",
				array(
					'Le service est-il vraiment gratuit ? :: Oui. La demande de devis est gratuite et sans engagement pour les particuliers, les régies et les copropriétés.',
					'Combien d’entreprises vont me contacter ? :: Au maximum {max_artisans}. Un conseiller choisit les artisans les plus adaptés à votre projet et à votre région : vous n’êtes pas sollicité par dix entreprises.',
					'Comment les artisans sont-ils sélectionnés ? :: Chaque partenaire est contrôlé avant d’être accepté : inscription au registre du commerce, attestation d’assurance RC Pro et références clients. Les avis des clients sont suivis en continu.',
					'Dans quelles régions intervenez-vous ? :: Dans toute la Suisse romande : Vaud, Genève, Fribourg, Valais, Neuchâtel et Jura.',
					'Puis-je suivre ma demande en ligne ? :: Oui. Vous recevez un lien personnel vers votre espace client pour suivre l’avancement, comparer les devis côte à côte et échanger avec votre conseiller.',
				)
			),
			'emails'                => array(),
		);
	}

	public static function all() {
		if ( null === self::$cache ) {
			$saved       = get_option( self::OPTION, array() );
			self::$cache = wp_parse_args( is_array( $saved ) ? $saved : array(), self::defaults() );
		}
		return self::$cache;
	}

	/**
	 * @param string $key     Clé du réglage.
	 * @param mixed  $default Valeur si absente.
	 * @return mixed
	 */
	public static function get( $key, $default = null ) {
		$all = self::all();
		return array_key_exists( $key, $all ) ? $all[ $key ] : $default;
	}

	public static function update( array $values ) {
		$current = get_option( self::OPTION, array() );
		$current = is_array( $current ) ? $current : array();
		update_option( self::OPTION, array_merge( $current, $values ), false );
		self::$cache = null;
	}

	/**
	 * Liste (une valeur par ligne) depuis un réglage texte.
	 *
	 * @param string $key Clé.
	 * @return string[]
	 */
	public static function lines( $key ) {
		$raw = (string) self::get( $key, '' );
		return array_values( array_filter( array_map( 'trim', preg_split( '/\r\n|\r|\n/', $raw ) ) ) );
	}

	/**
	 * Remplace {max_artisans}, {sla_hours}, {company}… dans un texte de réglage.
	 *
	 * @param string $text Texte.
	 * @return string
	 */
	public static function fill( $text ) {
		return strtr(
			(string) $text,
			array(
				'{max_artisans}' => (string) (int) self::get( 'max_artisans', 3 ),
				'{sla_hours}'    => (string) (int) self::get( 'sla_hours', 24 ),
				'{company}'      => (string) self::get( 'company', 'Reno360' ),
				'{phone}'        => (string) self::get( 'phone', '' ),
			)
		);
	}

	/**
	 * FAQ : tableau de [q, a].
	 *
	 * @return array
	 */
	public static function faq() {
		$items = array();
		foreach ( self::lines( 'faq' ) as $line ) {
			$parts = explode( '::', $line, 2 );
			if ( 2 === count( $parts ) && '' !== trim( $parts[0] ) ) {
				$items[] = array(
					'q' => self::fill( trim( $parts[0] ) ),
					'a' => self::fill( trim( $parts[1] ) ),
				);
			}
		}
		return $items;
	}

	public static function page_id( $key ) {
		$pages = (array) get_option( 'reno360_pages', array() );
		return isset( $pages[ $key ] ) ? (int) $pages[ $key ] : 0;
	}

	public static function page_url( $key, array $args = array() ) {
		$id  = self::page_id( $key );
		$url = $id ? get_permalink( $id ) : home_url( '/' );
		return $args ? add_query_arg( $args, $url ) : $url;
	}

	public static function logo_url() {
		$id = (int) self::get( 'logo_id', 0 );
		if ( $id ) {
			$url = wp_get_attachment_image_url( $id, 'medium' );
			if ( $url ) {
				return $url;
			}
		}
		return RENO360_URL . 'assets/img/logo.png';
	}

	public static function notify_emails() {
		$list = preg_split( '/[\s,;]+/', (string) self::get( 'notify_emails', '' ) );
		$list = array_filter( array_map( 'sanitize_email', (array) $list ), 'is_email' );
		if ( ! $list ) {
			$list = array( get_option( 'admin_email' ) );
		}
		return array_values( $list );
	}
}
