<?php
/**
 * Traitement des formulaires du back-office (admin-post.php).
 * Chaque action vérifie le jeton (nonce) et la capacité manage_reno360.
 *
 * @package Reno360
 */

namespace Reno360\Admin;

use Reno360\Activities;
use Reno360\Artisans;
use Reno360\Events;
use Reno360\Files;
use Reno360\Installer;
use Reno360\Notifications;
use Reno360\Portal;
use Reno360\Quotes;
use Reno360\Requests;
use Reno360\Search;
use Reno360\Settings;
use Reno360\Tasks;
use Reno360\Util;

defined( 'ABSPATH' ) || exit;

class Actions {

	public static function init() {
		$actions = array(
			'rn_request_save', 'rn_request_delete', 'rn_request_status', 'rn_request_event', 'rn_request_assign', 'rn_request_owner',
			'rn_quote_save', 'rn_quote_accept', 'rn_quote_status', 'rn_quote_delete', 'rn_quote_resend',
			'rn_task_add', 'rn_task_toggle', 'rn_task_delete', 'rn_file_upload', 'rn_file_delete',
			'rn_requests_bulk', 'rn_requests_export',
			'rn_activity_save', 'rn_activity_delete', 'rn_activity_toggle', 'rn_activities_bulk', 'rn_activity_quick',
			'rn_category_save', 'rn_category_delete', 'rn_activities_import', 'rn_activities_export', 'rn_activities_reseed',
			'rn_keyword_add', 'rn_search_clear', 'rn_search_ignore',
			'rn_artisan_save', 'rn_artisan_delete', 'rn_artisan_status', 'rn_artisans_export',
			'rn_client_link', 'rn_client_erase',
			'rn_settings_save', 'rn_pages_create', 'rn_front_page', 'rn_test_email', 'rn_run_cron',
		);
		foreach ( $actions as $action ) {
			add_action( 'admin_post_' . $action, array( __CLASS__, 'dispatch' ) );
		}
	}

	public static function dispatch() {
		$action = isset( $_REQUEST['action'] ) ? sanitize_key( $_REQUEST['action'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		if ( ! current_user_can( Util::CAP ) ) {
			wp_die( 'Accès refusé.', 403 );
		}
		check_admin_referer( $action );
		$method = substr( $action, 3 );
		if ( method_exists( __CLASS__, $method ) ) {
			call_user_func( array( __CLASS__, $method ) );
		}
		self::back();
	}

	/* ------------------------------------------------------------------ */
	/* Outils                                                             */
	/* ------------------------------------------------------------------ */

	private static function p( $key, $default = '' ) {
		// phpcs:ignore WordPress.Security.NonceVerification, WordPress.Security.ValidatedSanitizedInput
		return isset( $_POST[ $key ] ) ? wp_unslash( $_POST[ $key ] ) : ( isset( $_GET[ $key ] ) ? wp_unslash( $_GET[ $key ] ) : $default );
	}

	private static function id( $key = 'id' ) {
		return (int) self::p( $key, 0 );
	}

	private static function back( $url = '' ) {
		if ( ! $url ) {
			$url = self::p( '_redirect' ) ? esc_url_raw( self::p( '_redirect' ) ) : wp_get_referer();
		}
		wp_safe_redirect( $url ? $url : Util::admin_url( 'reno360' ) );
		exit;
	}

	private static function request_url( $id, $hash = '' ) {
		return Util::admin_url( 'reno360-requests', array( 'view' => (int) $id ) ) . ( $hash ? '#' . $hash : '' );
	}

	private static function csv( $filename, array $header, array $rows ) {
		nocache_headers();
		header( 'Content-Type: text/csv; charset=UTF-8' );
		header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
		$out = fopen( 'php://output', 'w' ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		fwrite( $out, "\xEF\xBB\xBF" ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		fputcsv( $out, $header, ';' );
		foreach ( $rows as $row ) {
			fputcsv(
				$out,
				array_map(
					static function ( $v ) {
						$v = (string) $v;
						return preg_match( '/^[=+\-@]/', $v ) ? "'" . $v : $v; // Protection contre l'injection de formules.
					},
					$row
				),
				';'
			);
		}
		fclose( $out ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		exit;
	}

	/* ------------------------------------------------------------------ */
	/* Demandes                                                           */
	/* ------------------------------------------------------------------ */

	public static function request_save() {
		$id   = self::id();
		$data = array();
		foreach ( array( 'first_name', 'last_name', 'email', 'phone', 'contact_pref', 'contact_time', 'address', 'npa', 'city', 'canton', 'property_type', 'client_type', 'start_wish', 'budget', 'preferred_date', 'description', 'source', 'owner_id', 'priority' ) as $k ) {
			$v = self::p( $k, null );
			if ( null !== $v ) {
				$data[ $k ] = $v;
			}
		}
		$activity_id = self::id( 'activity_id' );
		if ( $activity_id ) {
			$data['activity_id'] = $activity_id;
		} elseif ( '' !== trim( (string) self::p( 'activity_name' ) ) ) {
			$data['activity_id']   = 0;
			$data['activity_name'] = sanitize_text_field( self::p( 'activity_name' ) );
		}
		$answers = self::p( 'answers', array() );
		if ( is_array( $answers ) ) {
			$clean = array();
			foreach ( $answers as $a ) {
				if ( ! empty( $a['label'] ) && isset( $a['value'] ) && '' !== trim( (string) $a['value'] ) ) {
					$clean[] = array(
						'label' => sanitize_text_field( $a['label'] ),
						'value' => sanitize_text_field( $a['value'] ),
					);
				}
			}
			$data['answers'] = $clean;
		}
		if ( $id ) {
			if ( isset( $data['canton'] ) && '' === $data['canton'] ) {
				unset( $data['canton'] );
			}
			Requests::update( $id, $data );
			Events::add( $id, 'system', 'Fiche de la demande modifiée.' );
			Admin::flash( 'Demande mise à jour.' );
			self::back( self::request_url( $id ) );
		}
		if ( empty( $data['email'] ) && empty( $data['phone'] ) ) {
			Admin::flash( 'Indiquez au moins un e-mail ou un téléphone.', 'error' );
			self::back();
		}
		$data['source'] = isset( $data['source'] ) && $data['source'] ? $data['source'] : 'Saisie manuelle';
		$new            = Requests::create( $data, 'Demande saisie manuellement par ' . Util::current_user_name() . '.' );
		if ( is_wp_error( $new ) ) {
			Admin::flash( $new->get_error_message(), 'error' );
			self::back();
		}
		if ( self::p( 'send_confirmation' ) ) {
			Notifications::client_confirmation( Requests::get( $new ) );
		}
		Admin::flash( 'Demande créée.' );
		self::back( self::request_url( $new ) );
	}

	public static function request_delete() {
		$id = self::id();
		$r  = Requests::get( $id );
		if ( $r && Requests::delete( $id ) ) {
			Admin::flash( 'Demande ' . esc_html( $r['ref'] ) . ' supprimée, avec ses devis, fichiers et historique.' );
		}
		self::back( Util::admin_url( 'reno360-requests' ) );
	}

	public static function request_status() {
		$id     = self::id();
		$status = sanitize_key( self::p( 'status' ) );
		$ok     = Requests::set_status(
			$id,
			$status,
			array(
				'notify'      => (bool) self::p( 'notify', '' ),
				'lost_reason' => self::p( 'lost_reason' ),
				'note'        => sanitize_textarea_field( self::p( 'note' ) ),
			)
		);
		Admin::flash( $ok ? 'Statut mis à jour : ' . esc_html( Util::status_label( $status ) ) . '.' : 'Statut inchangé.', $ok ? 'success' : 'warning' );
		self::back( self::request_url( $id ) );
	}

	public static function request_owner() {
		$id    = self::id();
		$owner = self::id( 'owner_id' );
		Requests::update( $id, array( 'owner_id' => $owner ) );
		Events::add( $id, 'system', 'Responsable : ' . ( $owner ? Util::user_name( $owner ) : 'aucun' ) );
		Admin::flash( 'Responsable mis à jour.' );
		self::back( self::request_url( $id ) );
	}

	public static function request_event() {
		$id      = self::id();
		$r       = Requests::get( $id );
		$type    = sanitize_key( self::p( 'type', 'note' ) );
		$content = sanitize_textarea_field( self::p( 'content' ) );
		if ( ! $r || '' === trim( $content ) ) {
			Admin::flash( 'Le message est vide.', 'error' );
			self::back( self::request_url( $id, 'activite' ) );
		}
		switch ( $type ) {
			case 'message':
				Events::add( $id, 'message', $content, array( 'visibility' => 'client' ) );
				if ( $r['email'] ) {
					Notifications::client_message( $r, $content );
				}
				Requests::mark_first_response( $id );
				Admin::flash( 'Message envoyé au client (visible dans son espace).' );
				break;
			case 'email':
				$subject = sanitize_text_field( self::p( 'subject' ) );
				$subject = $subject ? $subject : 'Votre demande ' . $r['ref'];
				$sent    = $r['email'] ? Notifications::custom( $r, $subject, $content ) : false;
				Requests::mark_first_response( $id );
				Admin::flash( $sent ? 'E-mail envoyé.' : 'L’e-mail n’a pas pu être envoyé (vérifiez la configuration SMTP).', $sent ? 'success' : 'error' );
				break;
			case 'call':
				$duration = (int) self::p( 'duration', 0 );
				Events::add( $id, 'call', ( $duration ? 'Durée : ' . $duration . ' min. ' : '' ) . $content );
				Requests::mark_first_response( $id );
				Admin::flash( 'Appel enregistré.' );
				break;
			default:
				Events::add( $id, 'note', $content );
				Admin::flash( 'Note ajoutée.' );
		}
		Requests::touch( $id );
		self::back( self::request_url( $id, 'activite' ) );
	}

	public static function request_assign() {
		$id      = self::id();
		$artisan = self::id( 'artisan_id' );
		$r       = Quotes::assign( $id, $artisan, (bool) self::p( 'notify', '' ) );
		if ( is_wp_error( $r ) ) {
			Admin::flash( $r->get_error_message(), 'error' );
		} else {
			Admin::flash( 'Artisan ajouté à la demande.' );
		}
		self::back( self::request_url( $id, 'artisans' ) );
	}

	public static function quote_save() {
		$qid = self::id( 'quote_id' );
		$q   = Quotes::get( $qid );
		if ( ! $q ) {
			self::back();
		}
		$data = array();
		foreach ( array( 'amount', 'start_date', 'duration', 'valid_until', 'includes', 'excludes', 'notes' ) as $k ) {
			$data[ $k ] = self::p( $k, '' );
		}
		$files = Files::normalize( isset( $_FILES['quote_file'] ) ? $_FILES['quote_file'] : null ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		if ( $files && UPLOAD_ERR_NO_FILE !== (int) $files[0]['error'] ) {
			$stored = Files::store_many( $files, 'quote', array( 'request_id' => $q['request_id'], 'quote_id' => $q['id'] ), 1 );
			foreach ( $stored['errors'] as $e ) {
				Admin::flash( $e, 'error' );
			}
		}
		if ( self::p( 'mark_received' ) && in_array( $q['status'], array( 'attendu', 'decline' ), true ) ) {
			Quotes::receive( $qid, $data, 'admin' );
			Admin::flash( 'Devis enregistré comme reçu.' );
		} else {
			Quotes::update( $qid, $data );
			Admin::flash( 'Devis mis à jour.' );
		}
		self::back( self::request_url( $q['request_id'], 'artisans' ) );
	}

	public static function quote_accept() {
		$q = Quotes::get( self::id( 'quote_id' ) );
		if ( $q && Quotes::accept( $q['id'], 'admin' ) ) {
			Admin::flash( 'Devis de ' . esc_html( $q['company'] ) . ' accepté. Les artisans ont été informés.' );
		}
		self::back( $q ? self::request_url( $q['request_id'], 'artisans' ) : '' );
	}

	public static function quote_status() {
		$q      = Quotes::get( self::id( 'quote_id' ) );
		$status = sanitize_key( self::p( 'status' ) );
		if ( $q ) {
			if ( 'decline' === $status ) {
				Quotes::decline( $q['id'], sanitize_text_field( self::p( 'reason' ) ), 'admin' );
			} else {
				Quotes::set_status( $q['id'], $status );
				Events::add( $q['request_id'], 'quote', 'Devis de ' . $q['company'] . ' : ' . Util::quote_statuses()[ $status ]['label'] );
			}
			Admin::flash( 'Statut du devis mis à jour.' );
		}
		self::back( $q ? self::request_url( $q['request_id'], 'artisans' ) : '' );
	}

	public static function quote_delete() {
		$q = Quotes::get( self::id( 'quote_id' ) );
		if ( $q ) {
			Quotes::delete( $q['id'] );
			Admin::flash( esc_html( $q['company'] ) . ' retiré de la demande.' );
		}
		self::back( $q ? self::request_url( $q['request_id'], 'artisans' ) : '' );
	}

	public static function quote_resend() {
		$q = Quotes::get( self::id( 'quote_id' ) );
		if ( $q ) {
			$ok = Notifications::artisan_lead( $q );
			Admin::flash( $ok ? 'Demande renvoyée à ' . esc_html( $q['company'] ) . '.' : 'Envoi impossible (e-mail de l’artisan manquant ?).', $ok ? 'success' : 'error' );
		}
		self::back( $q ? self::request_url( $q['request_id'], 'artisans' ) : '' );
	}

	public static function task_add() {
		$request = self::id( 'request_id' );
		$due     = sanitize_text_field( self::p( 'due' ) );
		$due_utc = $due && preg_match( '/^\d{4}-\d{2}-\d{2}$/', $due ) ? get_gmt_from_date( $due . ' 09:00:00' ) : Util::now();
		$tid     = Tasks::add(
			self::p( 'title' ),
			array(
				'request_id' => $request,
				'artisan_id' => self::id( 'artisan_id' ),
				'owner_id'   => self::id( 'owner_id' ) ? self::id( 'owner_id' ) : get_current_user_id(),
				'due_at'     => $due_utc,
			)
		);
		Admin::flash( $tid ? 'Tâche ajoutée.' : 'Intitulé de la tâche manquant.', $tid ? 'success' : 'error' );
		self::back( $request ? self::request_url( $request, 'taches' ) : '' );
	}

	public static function task_toggle() {
		$t = Tasks::get( self::id() );
		if ( $t ) {
			Tasks::set_done( $t['id'], empty( $t['done_at'] ) );
			if ( empty( $t['done_at'] ) && $t['request_id'] ) {
				Events::add( $t['request_id'], 'task', 'Tâche terminée : ' . $t['title'] );
			}
		}
		self::back();
	}

	public static function task_delete() {
		Tasks::delete( self::id() );
		Admin::flash( 'Tâche supprimée.' );
		self::back();
	}

	public static function file_upload() {
		$request = self::id( 'request_id' );
		$artisan = self::id( 'artisan_id' );
		$files   = Files::normalize( isset( $_FILES['files'] ) ? $_FILES['files'] : null ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$stored  = Files::store_many( $files, $artisan ? 'artisan_doc' : 'photo', array( 'request_id' => $request, 'artisan_id' => $artisan ), 20 );
		foreach ( $stored['errors'] as $e ) {
			Admin::flash( $e, 'error' );
		}
		if ( $stored['ids'] ) {
			if ( $request ) {
				Events::add( $request, 'system', count( $stored['ids'] ) . ' fichier(s) ajouté(s).' );
			}
			Admin::flash( count( $stored['ids'] ) . ' fichier(s) ajouté(s).' );
		}
		self::back();
	}

	public static function file_delete() {
		$f = Files::get( self::id() );
		if ( $f ) {
			Files::delete( $f['id'] );
			Admin::flash( 'Fichier supprimé.' );
		}
		self::back();
	}

	public static function requests_bulk() {
		$ids = array_map( 'intval', (array) self::p( 'ids', array() ) );
		$op  = sanitize_key( self::p( 'bulk_action' ) );
		if ( ! $ids || ! $op ) {
			Admin::flash( 'Sélectionnez des demandes et une action.', 'warning' );
			self::back();
		}
		if ( 'delete' === $op ) {
			foreach ( $ids as $id ) {
				Requests::delete( $id );
			}
			Admin::flash( count( $ids ) . ' demande(s) supprimée(s).' );
		} elseif ( 'export' === $op ) {
			self::export_requests( $ids );
		} elseif ( 0 === strpos( $op, 'status_' ) ) {
			$status = substr( $op, 7 );
			foreach ( $ids as $id ) {
				Requests::set_status( $id, $status, array( 'notify' => false ) );
			}
			Admin::flash( count( $ids ) . ' demande(s) passée(s) en « ' . esc_html( Util::status_label( $status ) ) . ' ».' );
		} elseif ( 0 === strpos( $op, 'owner_' ) ) {
			$owner = (int) substr( $op, 6 );
			foreach ( $ids as $id ) {
				Requests::update( $id, array( 'owner_id' => $owner ) );
			}
			Admin::flash( count( $ids ) . ' demande(s) attribuée(s).' );
		}
		self::back();
	}

	public static function requests_export() {
		self::export_requests( array() );
	}

	private static function export_requests( array $ids ) {
		$args = array( 'per_page' => 100000 );
		foreach ( array( 'status', 'activity_id', 'canton', 'owner_id', 'search' ) as $k ) {
			if ( self::p( $k ) ) {
				$args[ $k ] = self::p( $k );
			}
		}
		$items = Requests::query( $args )['items'];
		$rows  = array();
		foreach ( $items as $r ) {
			if ( $ids && ! in_array( $r['id'], $ids, true ) ) {
				continue;
			}
			$rows[] = array( $r['ref'], Util::datetime( $r['created_at'] ), Util::status_label( $r['status'] ), $r['activity_name'], $r['first_name'], $r['last_name'], $r['email'], $r['phone'], $r['address'], $r['npa'], $r['city'], $r['canton'], $r['property_type'], $r['client_type'], $r['start_wish'], $r['budget'], Util::user_name( $r['owner_id'] ), $r['source'], $r['description'] );
		}
		self::csv( 'reno360-demandes-' . gmdate( 'Y-m-d' ) . '.csv', array( 'N°', 'Reçue le', 'Statut', 'Travaux', 'Prénom', 'Nom', 'E-mail', 'Téléphone', 'Adresse', 'NPA', 'Localité', 'Canton', 'Bien', 'Client', 'Début', 'Budget', 'Responsable', 'Source', 'Description' ), $rows );
	}

	/* ------------------------------------------------------------------ */
	/* Travaux, catégories et mots-clés                                   */
	/* ------------------------------------------------------------------ */

	public static function activity_save() {
		$id   = self::id();
		$data = array(
			'name'         => self::p( 'name' ),
			'slug'         => self::p( 'slug' ),
			'excerpt'      => self::p( 'excerpt' ),
			'content'      => self::p( 'content' ),
			'category_id'  => self::id( 'category_id' ),
			'icon'         => sanitize_key( self::p( 'icon' ) ),
			'keywords'     => self::p( 'keywords', '' ),
			'questions'    => self::p( 'questions', array() ),
			'prices'       => self::p( 'prices', array() ),
			'faq'          => self::p( 'faq', array() ),
			'popular'      => (bool) self::p( 'popular', '' ),
			'featured'     => (bool) self::p( 'featured', '' ),
			'active'       => (bool) self::p( 'active', '' ),
			'auto_layout'  => (bool) self::p( 'auto_layout', '' ),
			'order'        => (int) self::p( 'order', 0 ),
			'boost'        => (int) self::p( 'boost', 0 ),
			'thumbnail_id' => self::id( 'thumbnail_id' ),
		);
		$r    = Activities::save( $data, $id );
		if ( is_wp_error( $r ) ) {
			Admin::flash( $r->get_error_message(), 'error' );
			self::back();
		}
		Admin::flash( $id ? 'Type de travaux mis à jour.' : 'Type de travaux créé.' );
		self::back( Util::admin_url( 'reno360-activities', array( 'edit' => $r ) ) );
	}

	public static function activity_quick() {
		$r = Activities::save(
			array(
				'name'        => self::p( 'name' ),
				'category_id' => self::id( 'category_id' ),
				'keywords'    => self::p( 'keywords', '' ),
				'excerpt'     => self::p( 'excerpt', '' ),
				'icon'        => 'hammer',
				'active'      => true,
			)
		);
		if ( is_wp_error( $r ) ) {
			Admin::flash( $r->get_error_message(), 'error' );
		} else {
			Admin::flash( 'Type de travaux « ' . esc_html( sanitize_text_field( self::p( 'name' ) ) ) . ' » ajouté. <a href="' . esc_url( Util::admin_url( 'reno360-activities', array( 'edit' => $r ) ) ) . '">Compléter la fiche</a>' );
		}
		self::back();
	}

	public static function activity_delete() {
		$a = Activities::get( self::id() );
		if ( $a && Activities::delete( $a['id'] ) ) {
			Admin::flash( 'Type de travaux « ' . esc_html( $a['name'] ) . ' » supprimé. Les demandes existantes conservent leur intitulé.' );
		}
		self::back( Util::admin_url( 'reno360-activities' ) );
	}

	public static function activity_toggle() {
		$a = Activities::get( self::id() );
		if ( $a ) {
			Activities::save( array( 'active' => ! $a['active'] ), $a['id'] );
			Admin::flash( $a['active'] ? '« ' . esc_html( $a['name'] ) . ' » désactivé (masqué du site et de la recherche).' : '« ' . esc_html( $a['name'] ) . ' » activé.' );
		}
		self::back();
	}

	public static function activities_bulk() {
		$ids = array_map( 'intval', (array) self::p( 'ids', array() ) );
		$op  = sanitize_key( self::p( 'bulk_action' ) );
		if ( ! $ids || ! $op ) {
			Admin::flash( 'Sélectionnez des travaux et une action.', 'warning' );
			self::back();
		}
		foreach ( $ids as $id ) {
			if ( 'delete' === $op ) {
				Activities::delete( $id );
			} elseif ( 'activate' === $op || 'deactivate' === $op ) {
				Activities::save( array( 'active' => 'activate' === $op ), $id );
			} elseif ( 0 === strpos( $op, 'cat_' ) ) {
				Activities::save( array( 'category_id' => (int) substr( $op, 4 ) ), $id );
			}
		}
		Admin::flash( count( $ids ) . ' type(s) de travaux modifié(s).' );
		self::back();
	}

	public static function category_save() {
		$id = self::id();
		$r  = Activities::save_category(
			array(
				'name'        => self::p( 'name' ),
				'slug'        => self::p( 'slug' ),
				'description' => self::p( 'description' ),
				'order'       => self::p( 'order', 0 ),
				'icon'        => sanitize_key( self::p( 'icon' ) ),
			),
			$id
		);
		if ( is_wp_error( $r ) ) {
			Admin::flash( $r->get_error_message(), 'error' );
		} else {
			Admin::flash( $id ? 'Catégorie mise à jour.' : 'Catégorie créée.' );
		}
		self::back( Util::admin_url( 'reno360-activities', array( 'tab' => 'categories' ) ) );
	}

	public static function category_delete() {
		Activities::delete_category( self::id() );
		Admin::flash( 'Catégorie supprimée. Ses travaux sont désormais sans catégorie.' );
		self::back( Util::admin_url( 'reno360-activities', array( 'tab' => 'categories' ) ) );
	}

	public static function activities_export() {
		$rows = array();
		foreach ( Activities::all( array( 'status' => 'any' ) ) as $a ) {
			$rows[] = array( $a['slug'], $a['name'], $a['cat_slug'], implode( ' | ', $a['keywords'] ), $a['excerpt'], $a['icon'], $a['popular'] ? 1 : 0, $a['featured'] ? 1 : 0, $a['active'] ? 1 : 0, $a['order'] );
		}
		self::csv( 'reno360-travaux-' . gmdate( 'Y-m-d' ) . '.csv', array( 'slug', 'nom', 'categorie', 'mots_cles', 'description', 'icone', 'populaire', 'vedette', 'actif', 'ordre' ), $rows );
	}

	public static function activities_import() {
		if ( empty( $_FILES['csv']['tmp_name'] ) || ! is_uploaded_file( $_FILES['csv']['tmp_name'] ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
			Admin::flash( 'Choisissez un fichier CSV.', 'error' );
			self::back();
		}
		$mode = 'replace' === self::p( 'mode' ) ? 'replace' : 'merge';
		$fh   = fopen( $_FILES['csv']['tmp_name'], 'r' ); // phpcs:ignore WordPress.WP.AlternativeFunctions, WordPress.Security.ValidatedSanitizedInput
		$head = fgetcsv( $fh, 0, ';' );
		if ( ! $head ) {
			Admin::flash( 'Fichier vide ou illisible.', 'error' );
			self::back();
		}
		$head    = array_map(
			static function ( $h ) {
				return strtolower( trim( str_replace( "\xEF\xBB\xBF", '', $h ) ) );
			},
			$head
		);
		$created = 0;
		$updated = 0;
		$cats    = array();
		foreach ( Activities::categories() as $c ) {
			$cats[ $c['slug'] ] = $c['id'];
		}
		while ( ( $line = fgetcsv( $fh, 0, ';' ) ) !== false ) { // phpcs:ignore WordPress.CodeAnalysis.AssignmentInCondition
			if ( count( $line ) < 2 ) {
				continue;
			}
			$row  = array_combine( array_slice( $head, 0, count( $line ) ), array_slice( $line, 0, count( $head ) ) );
			$name = isset( $row['nom'] ) ? trim( $row['nom'] ) : '';
			if ( '' === $name ) {
				continue;
			}
			$slug     = ! empty( $row['slug'] ) ? sanitize_title( $row['slug'] ) : sanitize_title( $name );
			$existing = Activities::find_by_slug( $slug );
			$keywords = isset( $row['mots_cles'] ) ? Activities::clean_keywords( $row['mots_cles'] ) : array();
			if ( $existing && 'merge' === $mode ) {
				$keywords = Activities::clean_keywords( array_merge( $existing['keywords'], $keywords ) );
			}
			$cat_slug = isset( $row['categorie'] ) ? sanitize_title( $row['categorie'] ) : '';
			if ( $cat_slug && ! isset( $cats[ $cat_slug ] ) ) {
				$new_cat = Activities::save_category( array( 'name' => $row['categorie'], 'slug' => $cat_slug ) );
				if ( ! is_wp_error( $new_cat ) ) {
					$cats[ $cat_slug ] = $new_cat;
				}
			}
			$data = array(
				'name'     => $name,
				'slug'     => $slug,
				'keywords' => $keywords,
			);
			if ( $cat_slug && isset( $cats[ $cat_slug ] ) ) {
				$data['category_id'] = $cats[ $cat_slug ];
			}
			foreach ( array( 'description' => 'excerpt', 'icone' => 'icon', 'ordre' => 'order' ) as $col => $key ) {
				if ( isset( $row[ $col ] ) && '' !== $row[ $col ] ) {
					$data[ $key ] = $row[ $col ];
				}
			}
			foreach ( array( 'populaire' => 'popular', 'vedette' => 'featured', 'actif' => 'active' ) as $col => $key ) {
				if ( isset( $row[ $col ] ) && '' !== $row[ $col ] ) {
					$data[ $key ] = in_array( strtolower( trim( $row[ $col ] ) ), array( '1', 'oui', 'yes', 'true', 'x' ), true );
				}
			}
			$r = Activities::save( $data, $existing ? $existing['id'] : 0 );
			if ( ! is_wp_error( $r ) ) {
				$existing ? ++$updated : ++$created;
			}
		}
		fclose( $fh ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		Admin::flash( sprintf( 'Import terminé : %d créé(s), %d mis à jour.', $created, $updated ) );
		self::back( Util::admin_url( 'reno360-activities' ) );
	}

	public static function activities_reseed() {
		delete_option( 'reno360_seeded' );
		$n = Activities::seed( false );
		Admin::flash( sprintf( '%d type(s) de travaux manquant(s) restauré(s) depuis la liste de départ.', $n ) );
		self::back();
	}

	public static function keyword_add() {
		$id      = self::id( 'activity_id' );
		$keyword = sanitize_text_field( self::p( 'keyword' ) );
		if ( ! $id || '' === $keyword ) {
			Admin::flash( 'Choisissez un type de travaux.', 'error' );
			self::back();
		}
		Activities::add_keywords( $id, array( $keyword ) );
		$a = Activities::get( $id );
		Admin::flash( 'Mot-clé « ' . esc_html( $keyword ) . ' » ajouté à « ' . esc_html( $a ? $a['name'] : '' ) . ' ». La recherche est à jour.' );
		self::back();
	}

	public static function search_clear() {
		Search::clear_log();
		Admin::flash( 'Journal des recherches vidé.' );
		self::back();
	}

	public static function search_ignore() {
		Search::delete_query_logs( sanitize_text_field( self::p( 'norm' ) ) );
		Admin::flash( 'Recherche retirée du journal.' );
		self::back();
	}

	/* ------------------------------------------------------------------ */
	/* Artisans                                                           */
	/* ------------------------------------------------------------------ */

	public static function artisan_save() {
		$id   = self::id();
		$data = array();
		foreach ( array( 'company', 'contact_name', 'email', 'phone', 'address', 'npa', 'city', 'canton', 'ide', 'website', 'npa_ranges', 'status', 'rating', 'rc_expiry', 'notes' ) as $k ) {
			$data[ $k ] = self::p( $k, '' );
		}
		$data['cantons'] = (array) self::p( 'cantons', array() );
		$data['trades']  = array_map( 'intval', (array) self::p( 'trades', array() ) );
		$before          = $id ? Artisans::get( $id ) : null;
		$r               = Artisans::save( $data, $id );
		if ( is_wp_error( $r ) ) {
			Admin::flash( $r->get_error_message(), 'error' );
			self::back();
		}
		$files  = Files::normalize( isset( $_FILES['docs'] ) ? $_FILES['docs'] : null ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
		$stored = Files::store_many( $files, 'artisan_doc', array( 'artisan_id' => $r ), 10 );
		foreach ( $stored['errors'] as $e ) {
			Admin::flash( $e, 'error' );
		}
		if ( $before && 'candidat' === $before['status'] && 'actif' === $data['status'] && self::p( 'welcome' ) ) {
			Notifications::partner_welcome( Artisans::get( $r ) );
		}
		Admin::flash( $id ? 'Artisan mis à jour.' : 'Artisan ajouté.' );
		self::back( Util::admin_url( 'reno360-artisans', array( 'edit' => $r ) ) );
	}

	public static function artisan_status() {
		$a      = Artisans::get( self::id() );
		$status = sanitize_key( self::p( 'status' ) );
		if ( $a && isset( Util::artisan_statuses()[ $status ] ) ) {
			Artisans::save( array( 'status' => $status ), $a['id'] );
			if ( 'actif' === $status && 'candidat' === $a['status'] ) {
				Notifications::partner_welcome( Artisans::get( $a['id'] ) );
			}
			Admin::flash( esc_html( $a['company'] ) . ' : ' . esc_html( Util::artisan_statuses()[ $status ]['label'] ) . '.' );
		}
		self::back();
	}

	public static function artisan_delete() {
		$a = Artisans::get( self::id() );
		if ( $a && Artisans::delete( $a['id'] ) ) {
			Admin::flash( esc_html( $a['company'] ) . ' supprimé. Les devis existants sont conservés.' );
		}
		self::back( Util::admin_url( 'reno360-artisans' ) );
	}

	public static function artisans_export() {
		$rows = array();
		foreach ( Artisans::query( array( 'per_page' => 100000 ) )['items'] as $a ) {
			$rows[] = array( $a['company'], $a['contact_name'], $a['email'], $a['phone'], $a['address'], $a['npa'], $a['city'], $a['ide'], implode( ', ', $a['trade_names'] ), implode( ', ', $a['cantons'] ), $a['npa_ranges'], Util::artisan_statuses()[ $a['status'] ]['label'], $a['rating'], $a['rc_expiry'] );
		}
		self::csv( 'reno360-artisans-' . gmdate( 'Y-m-d' ) . '.csv', array( 'Entreprise', 'Contact', 'E-mail', 'Téléphone', 'Adresse', 'NPA', 'Localité', 'IDE', 'Métiers', 'Cantons', 'NPA couverts', 'Statut', 'Note', 'Échéance RC Pro' ), $rows );
	}

	/* ------------------------------------------------------------------ */
	/* Clients                                                            */
	/* ------------------------------------------------------------------ */

	public static function client_link() {
		$email = sanitize_email( self::p( 'email' ) );
		$ok    = Notifications::client_login( $email, Portal::link( $email, '', 7 * DAY_IN_SECONDS ) );
		Admin::flash( $ok ? 'Lien d’accès envoyé à ' . esc_html( $email ) . '.' : 'Envoi impossible.', $ok ? 'success' : 'error' );
		self::back();
	}

	public static function client_erase() {
		$email = sanitize_email( self::p( 'email' ) );
		$n     = 0;
		foreach ( Requests::for_email( $email ) as $r ) {
			Requests::delete( $r['id'] );
			++$n;
		}
		Admin::flash( sprintf( 'Données de %s effacées (%d demande(s)), conformément au droit à l’effacement (nLPD).', esc_html( $email ), $n ) );
		self::back( Util::admin_url( 'reno360-clients' ) );
	}

	/* ------------------------------------------------------------------ */
	/* Réglages                                                           */
	/* ------------------------------------------------------------------ */

	public static function settings_save() {
		$tab    = sanitize_key( self::p( 'tab', 'general' ) );
		$values = array();
		$text   = array( 'company', 'public_email', 'phone', 'address', 'notify_emails', 'from_name', 'from_email', 'primary_color', 'activities_slug', 'terms_url', 'privacy_url', 'review_url' );
		$area   = array( 'budgets', 'start_options', 'property_types', 'client_types', 'contact_prefs', 'contact_times', 'consent_text', 'success_text', 'faq' );
		$ints   = array( 'logo_id', 'max_artisans', 'sla_hours', 'max_files', 'max_file_mb', 'min_description', 'auto_unhandled_hours', 'auto_artisan_days', 'auto_client_days', 'auto_review_days', 'auto_docs_days', 'retention_months', 'search_log_days' );
		$bools  = array(
			'general'       => array( 'use_fonts' ),
			'form'          => array( 'require_phone' ),
			'notifications' => array( 'share_client_contact', 'notify_client_quote', 'notify_admin_quote', 'notify_losers' ),
			'automations'   => array( 'auto_unhandled', 'auto_artisan', 'auto_client_choose', 'auto_review', 'auto_docs' ),
			'data'          => array( 'delete_on_uninstall' ),
		);
		foreach ( $text as $k ) {
			if ( null !== self::p( $k, null ) ) {
				$v = sanitize_text_field( self::p( $k ) );
				if ( in_array( $k, array( 'terms_url', 'privacy_url', 'review_url' ), true ) ) {
					$v = esc_url_raw( $v );
				}
				if ( 'primary_color' === $k ) {
					$v = sanitize_hex_color( $v ) ? sanitize_hex_color( $v ) : '#187A3E';
				}
				$values[ $k ] = $v;
			}
		}
		foreach ( $area as $k ) {
			if ( null !== self::p( $k, null ) ) {
				$values[ $k ] = sanitize_textarea_field( self::p( $k ) );
			}
		}
		foreach ( $ints as $k ) {
			if ( null !== self::p( $k, null ) ) {
				$values[ $k ] = max( 0, (int) self::p( $k ) );
			}
		}
		if ( isset( $values['max_artisans'] ) ) {
			$values['max_artisans'] = max( 1, min( 10, $values['max_artisans'] ) );
		}
		if ( isset( $bools[ $tab ] ) ) {
			foreach ( $bools[ $tab ] as $k ) {
				$values[ $k ] = self::p( $k ) ? 1 : 0;
			}
		}
		if ( 'general' === $tab ) {
			$values['cantons'] = array_values( array_intersect( array_map( 'strtoupper', (array) self::p( 'cantons', array() ) ), array_keys( Util::cantons() ) ) );
		}
		if ( 'notifications' === $tab ) {
			$values['notify_client_status'] = array_values( array_intersect( (array) self::p( 'notify_client_status', array() ), array_keys( Util::statuses() ) ) );
			$emails                         = array();
			foreach ( (array) self::p( 'emails', array() ) as $key => $tpl ) {
				if ( ! Notifications::template( $key ) ) {
					continue;
				}
				$default        = Notifications::defaults()[ $key ];
				$subject        = sanitize_text_field( isset( $tpl['subject'] ) ? $tpl['subject'] : '' );
				$body           = sanitize_textarea_field( isset( $tpl['body'] ) ? $tpl['body'] : '' );
				$emails[ $key ] = array(
					'subject' => $subject === $default['subject'] ? '' : $subject,
					'body'    => str_replace( "\r\n", "\n", $body ) === $default['body'] ? '' : $body,
					'enabled' => empty( $tpl['enabled'] ) ? 0 : 1,
				);
			}
			$values['emails'] = $emails;
		}
		$old_slug = Settings::get( 'activities_slug' );
		Settings::update( $values );
		if ( isset( $values['activities_slug'] ) && $values['activities_slug'] !== $old_slug ) {
			Activities::register();
			flush_rewrite_rules();
		}
		Search::flush();
		Admin::flash( 'Réglages enregistrés.' );
		self::back( Util::admin_url( 'reno360-settings', array( 'tab' => $tab ) ) );
	}

	public static function pages_create() {
		$n = Installer::create_pages( true );
		Admin::flash( $n ? sprintf( '%d page(s) créée(s).', $n ) : 'Toutes les pages existent déjà.' );
		self::back();
	}

	public static function front_page() {
		$id = \Reno360\Settings::page_id( 'home' );
		if ( $id ) {
			update_option( 'show_on_front', 'page' );
			update_option( 'page_on_front', $id );
			Admin::flash( 'La page « Accueil Reno360 » est maintenant la page d’accueil du site.' );
		}
		self::back();
	}

	public static function test_email() {
		$to = wp_get_current_user()->user_email;
		$ok = wp_mail( $to, 'Test d’envoi Reno360', Notifications::layout( 'Test d’envoi Reno360', "Si vous lisez ce message, l’envoi d’e-mails fonctionne.\n\nBonne journée !", array() ), array( 'Content-Type: text/html; charset=UTF-8' ) );
		Admin::flash( $ok ? 'E-mail de test envoyé à ' . esc_html( $to ) . '.' : 'Échec de l’envoi. Installez une extension SMTP (par ex. WP Mail SMTP) et configurez votre serveur d’envoi.', $ok ? 'success' : 'error' );
		self::back();
	}

	public static function run_cron() {
		\Reno360\Automations::run();
		Admin::flash( 'Automatisations exécutées.' );
		self::back();
	}
}
