<?php
/**
 * API REST : recherche, envoi des formulaires publics, espace client, espace artisan.
 *
 * @package Reno360
 */

namespace Reno360;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

defined( 'ABSPATH' ) || exit;

class Rest {

	const NS = 'reno360/v1';

	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'routes' ) );
	}

	public static function routes() {
		$public = '__return_true';
		$admin  = static function () {
			return current_user_can( Util::CAP );
		};

		register_rest_route( self::NS, '/search', array( 'methods' => 'GET', 'callback' => array( __CLASS__, 'search' ), 'permission_callback' => $public ) );
		register_rest_route( self::NS, '/index', array( 'methods' => 'GET', 'callback' => array( __CLASS__, 'index' ), 'permission_callback' => $public ) );
		register_rest_route( self::NS, '/search/log', array( 'methods' => 'POST', 'callback' => array( __CLASS__, 'search_log' ), 'permission_callback' => $public ) );
		register_rest_route( self::NS, '/requests', array( 'methods' => 'POST', 'callback' => array( __CLASS__, 'create_request' ), 'permission_callback' => $public ) );
		register_rest_route( self::NS, '/partners', array( 'methods' => 'POST', 'callback' => array( __CLASS__, 'create_partner' ), 'permission_callback' => $public ) );
		register_rest_route( self::NS, '/portal/login', array( 'methods' => 'POST', 'callback' => array( __CLASS__, 'portal_login' ), 'permission_callback' => $public ) );
		register_rest_route( self::NS, '/portal/message', array( 'methods' => 'POST', 'callback' => array( __CLASS__, 'portal_message' ), 'permission_callback' => $public ) );
		register_rest_route( self::NS, '/portal/accept', array( 'methods' => 'POST', 'callback' => array( __CLASS__, 'portal_accept' ), 'permission_callback' => $public ) );
		register_rest_route( self::NS, '/artisan/quote', array( 'methods' => 'POST', 'callback' => array( __CLASS__, 'artisan_quote' ), 'permission_callback' => $public ) );
		register_rest_route( self::NS, '/artisan/decline', array( 'methods' => 'POST', 'callback' => array( __CLASS__, 'artisan_decline' ), 'permission_callback' => $public ) );
		register_rest_route( self::NS, '/file/(?P<id>\d+)', array( 'methods' => 'GET', 'callback' => array( __CLASS__, 'file' ), 'permission_callback' => $public ) );
		register_rest_route( self::NS, '/admin/status', array( 'methods' => 'POST', 'callback' => array( __CLASS__, 'admin_status' ), 'permission_callback' => $admin ) );
		register_rest_route( self::NS, '/admin/search-test', array( 'methods' => 'GET', 'callback' => array( __CLASS__, 'admin_search_test' ), 'permission_callback' => $admin ) );
	}

	private static function error( $message, $status = 400, array $fields = array() ) {
		return new WP_Error( 'rn_error', $message, array( 'status' => $status, 'fields' => $fields ) );
	}

	/* ------------------------------------------------------------------ */
	/* Recherche                                                          */
	/* ------------------------------------------------------------------ */

	public static function search( WP_REST_Request $req ) {
		$q     = (string) $req->get_param( 'q' );
		$limit = min( 30, max( 1, (int) ( $req->get_param( 'limit' ) ? $req->get_param( 'limit' ) : 8 ) ) );
		$res   = Search::query( $q, $limit );
		if ( $req->get_param( 'log' ) && Util::rate_limit( 'search', 120, 600 ) ) {
			Search::log( $q, count( $res['results'] ), $res['results'] ? $res['results'][0]['id'] : 0, 0, sanitize_key( (string) $req->get_param( 'source' ) ) );
		}
		$out = array();
		foreach ( $res['results'] as $r ) {
			unset( $r['score'] );
			$r['form_url'] = Settings::page_url( 'form', array( 'travail' => $r['slug'] ) );
			$out[]         = $r;
		}
		return new WP_REST_Response( array( 'results' => $out ) );
	}

	public static function search_log( WP_REST_Request $req ) {
		if ( ! Util::rate_limit( 'search_log', 60, 600 ) ) {
			return new WP_REST_Response( array( 'ok' => false ), 429 );
		}
		$p = $req->get_json_params();
		if ( ! is_array( $p ) ) {
			$p = $req->get_params();
		}
		Search::log(
			isset( $p['q'] ) ? (string) $p['q'] : '',
			isset( $p['results'] ) ? (int) $p['results'] : 0,
			isset( $p['top'] ) ? (int) $p['top'] : 0,
			isset( $p['selected'] ) ? (int) $p['selected'] : 0,
			isset( $p['source'] ) ? (string) $p['source'] : ''
		);
		return new WP_REST_Response( array( 'ok' => true ) );
	}

	/* ------------------------------------------------------------------ */
	/* Demande de devis                                                   */
	/* ------------------------------------------------------------------ */

	/**
	 * Le jeton d'horodatage du formulaire prouve qu'il a été affiché il y a plus de 3 secondes.
	 *
	 * @param string $value Valeur « horodatage.signature ».
	 * @return bool
	 */
	public static function check_form_time( $value ) {
		$parts = explode( '.', (string) $value );
		if ( 2 !== count( $parts ) ) {
			return false;
		}
		$ts = (int) $parts[0];
		return hash_equals( Frontend::form_stamp_sig( $ts ), $parts[1] ) && ( time() - $ts ) >= 3 && ( time() - $ts ) < 2 * DAY_IN_SECONDS;
	}

	public static function create_request( WP_REST_Request $req ) {
		$p = $req->get_params();

		// Pièges à robots : réponse positive sans rien enregistrer.
		if ( ! empty( $p['website'] ) || ! self::check_form_time( isset( $p['rn_ts'] ) ? $p['rn_ts'] : '' ) ) {
			return new WP_REST_Response( array( 'ok' => true, 'ref' => '', 'message' => Settings::fill( Settings::get( 'success_text' ) ) ) );
		}
		if ( ! Util::rate_limit( 'request', 6, HOUR_IN_SECONDS ) ) {
			return self::error( 'Trop de demandes envoyées depuis votre connexion. Merci de réessayer plus tard.', 429 );
		}

		$errors = array();
		$get    = static function ( $k ) use ( $p ) {
			return isset( $p[ $k ] ) && ! is_array( $p[ $k ] ) ? trim( wp_unslash( (string) $p[ $k ] ) ) : '';
		};
		// Demande rapide (fenêtre en 3 étapes) : les questions détaillées, la description et la localité
		// sont facultatives, le conseiller les complète lors de la qualification.
		$quick = 'quick' === $get( 'mode' );

		// Travaux.
		$activity = null;
		if ( $get( 'activity_id' ) ) {
			$activity = Activities::get( (int) $get( 'activity_id' ) );
		} elseif ( $get( 'travail' ) ) {
			$activity = Activities::find_by_slug( $get( 'travail' ) );
		}
		if ( $activity && ! $activity['active'] ) {
			$activity = null;
		}
		$free = mb_substr( sanitize_text_field( $get( 'q' ) ), 0, 150 );
		if ( ! $activity && '' === $free ) {
			$errors['activity'] = 'Choisissez le type de travaux.';
		}

		// Réponses aux questions spécifiques.
		$answers   = array();
		$questions = $activity ? ( $activity['questions'] ? $activity['questions'] : Activities::default_questions() ) : Activities::default_questions();
		$posted    = json_decode( $get( 'answers' ), true );
		$posted    = is_array( $posted ) ? $posted : array();
		$by_label  = array();
		foreach ( $posted as $a ) {
			if ( is_array( $a ) && isset( $a['label'] ) ) {
				$by_label[ (string) $a['label'] ] = isset( $a['value'] ) ? $a['value'] : '';
			}
		}
		foreach ( $questions as $qn ) {
			$v = isset( $by_label[ $qn['label'] ] ) ? $by_label[ $qn['label'] ] : '';
			if ( 'multiple' === $qn['type'] ) {
				$v = array_values( array_intersect( array_map( 'strval', (array) $v ), $qn['options'] ) );
			} elseif ( 'single' === $qn['type'] ) {
				$v = in_array( (string) $v, $qn['options'], true ) ? (string) $v : '';
			} else {
				$v = mb_substr( sanitize_text_field( is_array( $v ) ? '' : (string) $v ), 0, 200 );
			}
			if ( ! $quick && ! empty( $qn['required'] ) && ( '' === $v || array() === $v ) ) {
				$errors[ 'q_' . md5( $qn['label'] ) ] = 'Merci de répondre : ' . $qn['label'];
			}
			if ( '' !== $v && array() !== $v ) {
				$answers[] = array(
					'label' => $qn['label'],
					'value' => $v,
				);
			}
		}

		$description = sanitize_textarea_field( $get( 'description' ) );
		$min_desc    = (int) Settings::get( 'min_description', 15 );
		if ( ( ! $quick || '' !== $description ) && mb_strlen( $description ) < ( $quick ? min( $min_desc, 5 ) : $min_desc ) ) {
			$errors['description'] = sprintf( 'Décrivez votre projet en quelques mots (au moins %d caractères).', $min_desc );
		}
		$npa = preg_replace( '/\D/', '', $get( 'npa' ) );
		if ( ! preg_match( '/^[1-9]\d{3}$/', $npa ) ) {
			$errors['npa'] = 'Indiquez un NPA suisse à 4 chiffres.';
		}
		$city = sanitize_text_field( $get( 'city' ) );
		if ( '' === $city && ! $quick ) {
			$errors['city'] = 'Indiquez la localité.';
		}
		$first = sanitize_text_field( $get( 'first_name' ) );
		$last  = sanitize_text_field( $get( 'last_name' ) );
		if ( '' === $first ) {
			$errors['first_name'] = 'Indiquez votre prénom.';
		}
		if ( '' === $last ) {
			$errors['last_name'] = 'Indiquez votre nom.';
		}
		$email = sanitize_email( $get( 'email' ) );
		if ( ! is_email( $email ) ) {
			$errors['email'] = 'Indiquez une adresse e-mail valide.';
		}
		$phone  = sanitize_text_field( $get( 'phone' ) );
		$digits = preg_replace( '/\D/', '', $phone );
		if ( ( Settings::get( 'require_phone' ) || '' !== $phone ) && strlen( $digits ) < 9 ) {
			$errors['phone'] = 'Indiquez un numéro de téléphone valide.';
		}
		if ( empty( $p['consent'] ) ) {
			$errors['consent'] = 'Merci d’accepter les conditions pour envoyer votre demande.';
		}

		$files = Files::normalize( isset( $_FILES['photos'] ) ? $_FILES['photos'] : null ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$max   = (int) Settings::get( 'max_files', 10 );
		if ( count( $files ) > $max ) {
			$errors['photos'] = sprintf( 'Vous pouvez joindre au maximum %d fichiers.', $max );
		}

		if ( $errors ) {
			return self::error( 'Certaines informations sont manquantes ou incorrectes.', 422, $errors );
		}

		$utm = array();
		foreach ( array( 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid' ) as $k ) {
			if ( $get( $k ) ) {
				$utm[ $k ] = mb_substr( sanitize_text_field( $get( $k ) ), 0, 100 );
			}
		}
		$preferred = $get( 'preferred_date' );

		$id = Requests::create(
			array(
				'activity_id'    => $activity ? $activity['id'] : 0,
				'activity_name'  => $activity ? $activity['name'] : 'Autre : ' . $free,
				'answers'        => $answers,
				'description'    => $description,
				'first_name'     => $first,
				'last_name'      => $last,
				'email'          => $email,
				'phone'          => $phone,
				'contact_pref'   => Util::pick( $get( 'contact_pref' ), Settings::lines( 'contact_prefs' ) ),
				'contact_time'   => Util::pick( $get( 'contact_time' ), Settings::lines( 'contact_times' ) ),
				'address'        => sanitize_text_field( $get( 'address' ) ),
				'npa'            => $npa,
				'city'           => $city,
				'property_type'  => Util::pick( $get( 'property_type' ), Settings::lines( 'property_types' ) ),
				'client_type'    => Util::pick( $get( 'client_type' ), Settings::lines( 'client_types' ) ),
				'start_wish'     => Util::pick( $get( 'start_wish' ), Settings::lines( 'start_options' ) ),
				'budget'         => Util::pick( $get( 'budget' ), Settings::lines( 'budgets' ) ),
				'preferred_date' => preg_match( '/^\d{4}-\d{2}-\d{2}$/', $preferred ) ? $preferred : null,
				'source'         => mb_substr( sanitize_text_field( $get( 'source' ) ), 0, 100 ),
				'landing'        => mb_substr( esc_url_raw( $get( 'landing' ) ), 0, 255 ),
				'utm'            => $utm,
				'device'         => Util::device(),
				'consent_at'     => Util::now(),
			),
			$quick ? 'Demande rapide créée depuis le site (à compléter lors de la qualification).' : 'Demande créée via le formulaire web.'
		);
		if ( is_wp_error( $id ) ) {
			return self::error( $id->get_error_message(), 500 );
		}

		$stored = Files::store_many( $files, 'photo', array( 'request_id' => $id ), $max );
		if ( $stored['ids'] ) {
			Events::add( $id, 'system', count( $stored['ids'] ) . ' fichier(s) joint(s) par le client.', array( 'author_type' => 'client' ) );
		}

		$r = Requests::get( $id );
		Notifications::client_confirmation( $r );
		Notifications::admin_new_request( $r );

		return new WP_REST_Response(
			array(
				'ok'         => true,
				'ref'        => $r['ref'],
				'message'    => Settings::fill( Settings::get( 'success_text' ) ),
				'portal_url' => Portal::link( $r['email'], $r['ref'] ),
				'warnings'   => $stored['errors'],
			)
		);
	}

	/* ------------------------------------------------------------------ */
	/* Candidature artisan                                                */
	/* ------------------------------------------------------------------ */

	public static function create_partner( WP_REST_Request $req ) {
		$p = $req->get_params();
		if ( ! empty( $p['website_hp'] ) || ! self::check_form_time( isset( $p['rn_ts'] ) ? $p['rn_ts'] : '' ) ) {
			return new WP_REST_Response( array( 'ok' => true ) );
		}
		if ( ! Util::rate_limit( 'partner', 4, HOUR_IN_SECONDS ) ) {
			return self::error( 'Trop de candidatures envoyées. Merci de réessayer plus tard.', 429 );
		}
		$get    = static function ( $k ) use ( $p ) {
			return isset( $p[ $k ] ) && ! is_array( $p[ $k ] ) ? trim( wp_unslash( (string) $p[ $k ] ) ) : '';
		};
		$errors = array();
		foreach ( array(
			'company'      => 'Indiquez le nom de l’entreprise.',
			'contact_name' => 'Indiquez une personne de contact.',
			'city'         => 'Indiquez la localité.',
		) as $k => $msg ) {
			if ( '' === sanitize_text_field( $get( $k ) ) ) {
				$errors[ $k ] = $msg;
			}
		}
		if ( ! is_email( $get( 'email' ) ) ) {
			$errors['email'] = 'Indiquez une adresse e-mail valide.';
		}
		if ( strlen( preg_replace( '/\D/', '', $get( 'phone' ) ) ) < 9 ) {
			$errors['phone'] = 'Indiquez un numéro de téléphone valide.';
		}
		if ( ! preg_match( '/^[1-9]\d{3}$/', preg_replace( '/\D/', '', $get( 'npa' ) ) ) ) {
			$errors['npa'] = 'Indiquez un NPA suisse à 4 chiffres.';
		}
		$trades = array_filter( array_map( 'intval', isset( $p['trades'] ) ? (array) $p['trades'] : array() ) );
		if ( ! $trades ) {
			$errors['trades'] = 'Choisissez au moins un métier.';
		}
		$cantons = isset( $p['cantons'] ) ? (array) $p['cantons'] : array();
		if ( ! $cantons ) {
			$errors['cantons'] = 'Choisissez au moins un canton.';
		}
		if ( empty( $p['consent'] ) ) {
			$errors['consent'] = 'Merci d’accepter les conditions.';
		}
		if ( $errors ) {
			return self::error( 'Certaines informations sont manquantes ou incorrectes.', 422, $errors );
		}
		$id = Artisans::save(
			array(
				'company'      => $get( 'company' ),
				'contact_name' => $get( 'contact_name' ),
				'email'        => $get( 'email' ),
				'phone'        => $get( 'phone' ),
				'address'      => $get( 'address' ),
				'npa'          => $get( 'npa' ),
				'city'         => $get( 'city' ),
				'ide'          => $get( 'ide' ),
				'website'      => $get( 'site' ),
				'cantons'      => $cantons,
				'npa_ranges'   => $get( 'npa_ranges' ),
				'notes'        => 'Message de candidature : ' . sanitize_textarea_field( $get( 'message' ) ),
				'status'       => 'candidat',
				'trades'       => $trades,
			)
		);
		if ( is_wp_error( $id ) ) {
			return self::error( $id->get_error_message(), 500 );
		}
		$stored = Files::store_many( Files::normalize( isset( $_FILES['docs'] ) ? $_FILES['docs'] : null ), 'artisan_doc', array( 'artisan_id' => $id ), 5 ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$a      = Artisans::get( $id );
		Notifications::partner_ack( $a );
		Notifications::admin_partner( $a );
		return new WP_REST_Response(
			array(
				'ok'       => true,
				'message'  => 'Merci ! Votre candidature a bien été reçue. Nous vérifions votre dossier et revenons vers vous rapidement.',
				'warnings' => $stored['errors'],
			)
		);
	}

	/* ------------------------------------------------------------------ */
	/* Espace client                                                      */
	/* ------------------------------------------------------------------ */

	public static function portal_login( WP_REST_Request $req ) {
		$email = sanitize_email( (string) $req->get_param( 'email' ) );
		if ( ! is_email( $email ) ) {
			return self::error( 'Indiquez une adresse e-mail valide.', 422, array( 'email' => 'Adresse e-mail invalide.' ) );
		}
		if ( Util::rate_limit( 'portal_login', 5, 15 * MINUTE_IN_SECONDS ) ) {
			Portal::send_login_link( $email );
		}
		return new WP_REST_Response(
			array(
				'ok'      => true,
				'message' => 'Si une demande est associée à cette adresse, vous allez recevoir un lien d’accès par e-mail dans quelques instants.',
			)
		);
	}

	private static function portal_request( WP_REST_Request $req ) {
		if ( ! Portal::check_csrf( $req->get_header( 'X-RN-Portal' ) ? $req->get_header( 'X-RN-Portal' ) : $req->get_param( 'csrf' ) ) ) {
			return self::error( 'Votre session a expiré. Rechargez la page.', 403 );
		}
		$r = Portal::request_for_current( (string) $req->get_param( 'ref' ) );
		if ( ! $r ) {
			return self::error( 'Demande introuvable.', 404 );
		}
		return $r;
	}

	public static function portal_message( WP_REST_Request $req ) {
		$r = self::portal_request( $req );
		if ( is_wp_error( $r ) ) {
			return $r;
		}
		$message = sanitize_textarea_field( wp_unslash( (string) $req->get_param( 'message' ) ) );
		$files   = Files::normalize( isset( $_FILES['files'] ) ? $_FILES['files'] : null ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		if ( mb_strlen( $message ) < 2 && ! $files ) {
			return self::error( 'Écrivez votre message.', 422, array( 'message' => 'Message vide.' ) );
		}
		if ( ! Util::rate_limit( 'portal_msg', 20, HOUR_IN_SECONDS ) ) {
			return self::error( 'Trop de messages envoyés. Réessayez plus tard.', 429 );
		}
		$stored = Files::store_many( $files, 'message', array( 'request_id' => $r['id'] ), 5 );
		$text   = mb_substr( $message, 0, 3000 );
		if ( $stored['ids'] ) {
			$text .= ( $text ? "\n" : '' ) . '[' . count( $stored['ids'] ) . ' fichier(s) joint(s)]';
		}
		$event = Events::add(
			$r['id'],
			'message',
			$text,
			array(
				'visibility'  => 'client',
				'author_type' => 'client',
				'author_name' => $r['name'],
				'meta'        => array( 'files' => $stored['ids'] ),
			)
		);
		Requests::touch( $r['id'] );
		Notifications::admin_message( $r, $text );
		Tasks::add(
			'Répondre au message de ' . $r['name'],
			array(
				'request_id' => $r['id'],
				'owner_id'   => $r['owner_id'],
				'source'     => 'auto',
				'auto_key'   => 'message_' . $event,
			)
		);
		return new WP_REST_Response(
			array(
				'ok'       => true,
				'warnings' => $stored['errors'],
			)
		);
	}

	public static function portal_accept( WP_REST_Request $req ) {
		$r = self::portal_request( $req );
		if ( is_wp_error( $r ) ) {
			return $r;
		}
		$q = Quotes::get( (int) $req->get_param( 'quote' ) );
		if ( ! $q || $q['request_id'] !== $r['id'] || 'recu' !== $q['status'] ) {
			return self::error( 'Ce devis ne peut pas être accepté.', 409 );
		}
		Quotes::accept( $q['id'], 'client' );
		return new WP_REST_Response(
			array(
				'ok'      => true,
				'message' => 'Merci ! Votre choix est enregistré. ' . $q['company'] . ' va vous contacter pour organiser les travaux.',
			)
		);
	}

	/* ------------------------------------------------------------------ */
	/* Espace artisan (lien sécurisé)                                     */
	/* ------------------------------------------------------------------ */

	public static function artisan_quote( WP_REST_Request $req ) {
		$q = Quotes::get_by_token( (string) $req->get_param( 'token' ) );
		if ( ! $q ) {
			return self::error( 'Lien invalide.', 404 );
		}
		if ( ! in_array( $q['status'], array( 'attendu', 'recu', 'decline' ), true ) ) {
			return self::error( 'Cette demande est clôturée : le devis ne peut plus être modifié.', 409 );
		}
		$amount = Util::parse_amount( (string) $req->get_param( 'amount' ) );
		$errors = array();
		if ( null === $amount || $amount <= 0 ) {
			$errors['amount'] = 'Indiquez le montant TTC du devis.';
		}
		$files = Files::normalize( isset( $_FILES['quote_file'] ) ? $_FILES['quote_file'] : null ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		if ( ! $files && ! Files::query( array( 'quote_id' => $q['id'] ) ) ) {
			$errors['quote_file'] = 'Joignez votre devis (PDF).';
		}
		if ( $errors ) {
			return self::error( 'Certaines informations sont manquantes.', 422, $errors );
		}
		if ( $files ) {
			$stored = Files::store_many( $files, 'quote', array( 'request_id' => $q['request_id'], 'quote_id' => $q['id'] ), 1, true );
			if ( $stored['errors'] ) {
				return self::error( $stored['errors'][0], 422, array( 'quote_file' => $stored['errors'][0] ) );
			}
		}
		Quotes::receive(
			$q['id'],
			array(
				'amount'      => $amount,
				'start_date'  => (string) $req->get_param( 'start_date' ),
				'duration'    => (string) $req->get_param( 'duration' ),
				'valid_until' => (string) $req->get_param( 'valid_until' ),
				'includes'    => (string) $req->get_param( 'includes' ),
				'excludes'    => (string) $req->get_param( 'excludes' ),
				'notes'       => (string) $req->get_param( 'notes' ),
			),
			'artisan'
		);
		return new WP_REST_Response(
			array(
				'ok'      => true,
				'message' => 'Merci ! Votre devis a bien été transmis. Le client peut maintenant le consulter.',
			)
		);
	}

	public static function artisan_decline( WP_REST_Request $req ) {
		$q = Quotes::get_by_token( (string) $req->get_param( 'token' ) );
		if ( ! $q ) {
			return self::error( 'Lien invalide.', 404 );
		}
		if ( 'attendu' !== $q['status'] ) {
			return self::error( 'Cette demande ne peut plus être déclinée.', 409 );
		}
		Quotes::decline( $q['id'], mb_substr( sanitize_textarea_field( (string) $req->get_param( 'reason' ) ), 0, 500 ), 'artisan' );
		return new WP_REST_Response(
			array(
				'ok'      => true,
				'message' => 'C’est noté, merci de nous avoir prévenus. Nous proposerons cette demande à un autre artisan.',
			)
		);
	}

	/* ------------------------------------------------------------------ */
	/* Fichiers et administration                                         */
	/* ------------------------------------------------------------------ */

	public static function file( WP_REST_Request $req ) {
		$id = (int) $req['id'];
		if ( ! Files::verify( $id, (int) $req->get_param( 'e' ), (string) $req->get_param( 's' ) ) ) {
			return self::error( 'Lien expiré.', 403 );
		}
		$f = Files::get( $id );
		if ( ! $f ) {
			return self::error( 'Fichier introuvable.', 404 );
		}
		Files::output( $f, (bool) $req->get_param( 'dl' ) );
		return null;
	}

	public static function admin_status( WP_REST_Request $req ) {
		$id     = (int) $req->get_param( 'id' );
		$status = sanitize_key( (string) $req->get_param( 'status' ) );
		if ( ! Requests::get( $id ) || ! isset( Util::statuses()[ $status ] ) ) {
			return self::error( 'Demande ou statut invalide.', 400 );
		}
		Requests::set_status( $id, $status );
		return new WP_REST_Response(
			array(
				'ok'    => true,
				'label' => Util::status_label( $status ),
			)
		);
	}

	/** Index de recherche du navigateur, chargé à la demande sur les pages sans contenu Reno360. */
	public static function index() {
		$res = new WP_REST_Response( Search::client_index() );
		$res->header( 'Cache-Control', 'public, max-age=600' );
		return $res;
	}

	public static function admin_search_test( WP_REST_Request $req ) {
		$res = Search::query( (string) $req->get_param( 'q' ), 15 );
		return new WP_REST_Response( $res );
	}
}
