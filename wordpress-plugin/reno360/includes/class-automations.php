<?php
/**
 * Relances automatiques (WP-Cron, toutes les heures).
 *
 * @package Reno360
 */

namespace Reno360;

defined( 'ABSPATH' ) || exit;

class Automations {

	public static function init() {
		add_action( 'reno360_cron', array( __CLASS__, 'run' ) );
	}

	/**
	 * Liste lisible des automatisations (écran Vue d'ensemble / Réglages).
	 *
	 * @return array
	 */
	public static function describe() {
		$s = Settings::all();
		return array(
			array(
				'key'     => 'auto_unhandled',
				'name'    => 'Alerte si une demande n’est pas traitée',
				'when'    => sprintf( 'après %d h en statut « Nouvelle »', (int) $s['auto_unhandled_hours'] ),
				'enabled' => (bool) $s['auto_unhandled'],
			),
			array(
				'key'     => 'auto_artisan',
				'name'    => 'Relance de l’artisan sans devis',
				'when'    => sprintf( '%d jours après l’envoi de la demande', (int) $s['auto_artisan_days'] ),
				'enabled' => (bool) $s['auto_artisan'],
			),
			array(
				'key'     => 'auto_client_choose',
				'name'    => 'Rappel au client pour choisir un devis',
				'when'    => sprintf( '%d jours après le dernier devis reçu', (int) $s['auto_client_days'] ),
				'enabled' => (bool) $s['auto_client_choose'],
			),
			array(
				'key'     => 'auto_review',
				'name'    => 'Demande d’avis au client',
				'when'    => sprintf( '%d jours après la fin des travaux', (int) $s['auto_review_days'] ),
				'enabled' => (bool) $s['auto_review'],
			),
			array(
				'key'     => 'auto_docs',
				'name'    => 'Documents d’artisan à renouveler',
				'when'    => sprintf( '%d jours avant l’échéance de la RC Pro', (int) $s['auto_docs_days'] ),
				'enabled' => (bool) $s['auto_docs'],
			),
			array(
				'key'     => 'retention_months',
				'name'    => 'Suppression des anciennes demandes (nLPD)',
				'when'    => $s['retention_months'] ? sprintf( 'demandes clôturées depuis plus de %d mois', (int) $s['retention_months'] ) : 'désactivée',
				'enabled' => (bool) $s['retention_months'],
			),
		);
	}

	public static function run() {
		$s = Settings::all();
		if ( $s['auto_unhandled'] ) {
			self::unhandled( (int) $s['auto_unhandled_hours'] );
		}
		if ( $s['auto_artisan'] ) {
			self::artisan_reminders( (int) $s['auto_artisan_days'] );
		}
		if ( $s['auto_client_choose'] ) {
			self::client_choose( (int) $s['auto_client_days'] );
		}
		if ( $s['auto_review'] ) {
			self::reviews( (int) $s['auto_review_days'] );
		}
		if ( $s['auto_docs'] ) {
			self::documents( (int) $s['auto_docs_days'] );
		}
		if ( (int) $s['retention_months'] > 0 ) {
			self::retention( (int) $s['retention_months'] );
		}
	}

	private static function ago( $seconds ) {
		return gmdate( 'Y-m-d H:i:s', time() - $seconds );
	}

	public static function unhandled( $hours ) {
		global $wpdb;
		$t    = Requests::table();
		$rows = $wpdb->get_results( $wpdb->prepare( "SELECT id FROM $t WHERE status = 'nouvelle' AND created_at <= %s AND (flags IS NULL OR flags NOT LIKE %s) LIMIT 50", self::ago( max( 1, $hours ) * HOUR_IN_SECONDS ), '%alert_unhandled%' ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
		foreach ( (array) $rows as $row ) {
			$r = Requests::get( $row['id'] );
			if ( ! $r ) {
				continue;
			}
			Requests::add_flag( $r['id'], 'alert_unhandled' );
			$vars           = Notifications::request_vars( $r );
			$vars['heures'] = $hours;
			Notifications::send( Settings::notify_emails(), 'admin_unhandled', $vars );
			Tasks::add(
				'Prendre en charge la demande ' . $r['ref'],
				array(
					'request_id' => $r['id'],
					'owner_id'   => $r['owner_id'],
					'source'     => 'auto',
					'auto_key'   => 'unhandled_' . $r['id'],
				)
			);
			Events::add( $r['id'], 'system', sprintf( 'Alerte : demande non traitée depuis %d h.', $hours ), array( 'author_type' => 'system' ) );
		}
	}

	public static function artisan_reminders( $days ) {
		global $wpdb;
		$t    = Quotes::table();
		$rows = $wpdb->get_results( $wpdb->prepare( "SELECT id FROM $t WHERE status = 'attendu' AND reminded_at IS NULL AND sent_at <= %s LIMIT 50", self::ago( max( 1, $days ) * DAY_IN_SECONDS ) ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
		foreach ( (array) $rows as $row ) {
			$q = Quotes::get( $row['id'] );
			if ( ! $q ) {
				continue;
			}
			$wpdb->update( $t, array( 'reminded_at' => Util::now() ), array( 'id' => $q['id'] ) );
			Notifications::artisan_reminder( $q );
			$r = Requests::get( $q['request_id'] );
			Tasks::add(
				'Relancer ' . $q['company'] . ' (devis attendu depuis ' . $days . ' j)',
				array(
					'request_id' => $q['request_id'],
					'artisan_id' => $q['artisan_id'],
					'owner_id'   => $r ? $r['owner_id'] : 0,
					'due_at'     => gmdate( 'Y-m-d H:i:s', time() + 2 * DAY_IN_SECONDS ),
					'source'     => 'auto',
					'auto_key'   => 'artisan_reminder_' . $q['id'],
				)
			);
		}
	}

	public static function client_choose( $days ) {
		global $wpdb;
		$t    = Requests::table();
		$q    = Quotes::table();
		$rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.PreparedSQL
			$wpdb->prepare(
				"SELECT r.id FROM $t r WHERE r.status = 'devis' AND (r.flags IS NULL OR r.flags NOT LIKE %s)
				AND (SELECT MAX(received_at) FROM $q WHERE request_id = r.id) <= %s LIMIT 50", // phpcs:ignore WordPress.DB.PreparedSQL
				'%client_choose%',
				self::ago( max( 1, $days ) * DAY_IN_SECONDS )
			),
			ARRAY_A
		);
		foreach ( (array) $rows as $row ) {
			$r = Requests::get( $row['id'] );
			if ( ! $r ) {
				continue;
			}
			Requests::add_flag( $r['id'], 'client_choose' );
			Notifications::send( $r['email'], 'client_choose', Notifications::request_vars( $r ), array( 'request_id' => $r['id'] ) );
			Tasks::add(
				'Appeler ' . $r['name'] . ' pour l’aider à choisir un devis',
				array(
					'request_id' => $r['id'],
					'owner_id'   => $r['owner_id'],
					'source'     => 'auto',
					'auto_key'   => 'client_choose_' . $r['id'],
				)
			);
		}
	}

	public static function reviews( $days ) {
		global $wpdb;
		$t    = Requests::table();
		$rows = $wpdb->get_results( $wpdb->prepare( "SELECT id FROM $t WHERE status = 'terminee' AND status_changed_at <= %s AND (flags IS NULL OR flags NOT LIKE %s) LIMIT 50", self::ago( max( 1, $days ) * DAY_IN_SECONDS ), '%review_sent%' ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
		foreach ( (array) $rows as $row ) {
			$r = Requests::get( $row['id'] );
			if ( ! $r ) {
				continue;
			}
			Requests::add_flag( $r['id'], 'review_sent' );
			if ( Settings::get( 'review_url' ) ) {
				Notifications::send( $r['email'], 'client_review', Notifications::request_vars( $r ), array( 'request_id' => $r['id'] ) );
			}
		}
	}

	public static function documents( $days ) {
		global $wpdb;
		$t    = Artisans::table();
		$rows = $wpdb->get_results( $wpdb->prepare( "SELECT id, rc_expiry FROM $t WHERE status = 'actif' AND rc_expiry IS NOT NULL AND rc_expiry <= %s", gmdate( 'Y-m-d', time() + max( 1, $days ) * DAY_IN_SECONDS ) ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
		foreach ( (array) $rows as $row ) {
			$flag = 'docs_' . str_replace( '-', '', $row['rc_expiry'] );
			$a    = Artisans::get( $row['id'] );
			if ( ! $a || Artisans::has_flag( $a, $flag ) ) {
				continue;
			}
			Artisans::add_flag( $a['id'], $flag );
			Notifications::admin_docs( $a );
			Tasks::add(
				'Demander la nouvelle attestation RC Pro de ' . $a['company'],
				array(
					'artisan_id' => $a['id'],
					'source'     => 'auto',
					'auto_key'   => 'docs_' . $a['id'] . '_' . str_replace( '-', '', $row['rc_expiry'] ),
				)
			);
		}
	}

	public static function retention( $months ) {
		global $wpdb;
		$t    = Requests::table();
		$ids  = $wpdb->get_col( $wpdb->prepare( "SELECT id FROM $t WHERE status IN ('terminee','perdue') AND updated_at <= %s LIMIT 100", self::ago( $months * 30 * DAY_IN_SECONDS ) ) ); // phpcs:ignore WordPress.DB.PreparedSQL
		foreach ( (array) $ids as $id ) {
			Requests::delete( (int) $id );
		}
	}
}
