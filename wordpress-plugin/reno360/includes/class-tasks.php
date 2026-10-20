<?php
/**
 * Tâches de suivi (manuelles ou créées par les automatisations).
 *
 * @package Reno360
 */

namespace Reno360;

defined( 'ABSPATH' ) || exit;

class Tasks {

	/**
	 * Crée une tâche. Avec auto_key, une tâche identique n'est jamais recréée.
	 *
	 * @param string $title Intitulé.
	 * @param array  $args  request_id, artisan_id, due_at (UTC), owner_id, source, auto_key.
	 * @return int 0 si ignorée.
	 */
	public static function add( $title, array $args = array() ) {
		global $wpdb;
		$t    = Installer::table( 'tasks' );
		$args = wp_parse_args(
			$args,
			array(
				'request_id' => 0,
				'artisan_id' => 0,
				'due_at'     => Util::now(),
				'owner_id'   => 0,
				'source'     => 'manual',
				'auto_key'   => '',
			)
		);
		if ( $args['auto_key'] ) {
			$exists = $wpdb->get_var( $wpdb->prepare( "SELECT id FROM $t WHERE auto_key = %s LIMIT 1", $args['auto_key'] ) ); // phpcs:ignore WordPress.DB.PreparedSQL
			if ( $exists ) {
				return 0;
			}
		}
		$title = trim( sanitize_text_field( $title ) );
		if ( '' === $title ) {
			return 0;
		}
		$wpdb->insert(
			$t,
			array(
				'request_id' => (int) $args['request_id'],
				'artisan_id' => (int) $args['artisan_id'],
				'title'      => mb_substr( $title, 0, 255 ),
				'due_at'     => $args['due_at'] ? $args['due_at'] : null,
				'owner_id'   => (int) $args['owner_id'],
				'source'     => 'auto' === $args['source'] ? 'auto' : 'manual',
				'auto_key'   => substr( sanitize_key( $args['auto_key'] ), 0, 80 ),
				'created_at' => Util::now(),
			)
		);
		return (int) $wpdb->insert_id;
	}

	public static function get( $id ) {
		global $wpdb;
		return $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . Installer::table( 'tasks' ) . ' WHERE id = %d', $id ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
	}

	public static function set_done( $id, $done = true ) {
		global $wpdb;
		return false !== $wpdb->update( Installer::table( 'tasks' ), array( 'done_at' => $done ? Util::now() : null ), array( 'id' => (int) $id ) );
	}

	public static function delete( $id ) {
		global $wpdb;
		return (bool) $wpdb->delete( Installer::table( 'tasks' ), array( 'id' => (int) $id ), array( '%d' ) );
	}

	/**
	 * @param array $args request_id, open (bool), due_before (UTC), owner_id, limit.
	 * @return array
	 */
	public static function query( array $args = array() ) {
		global $wpdb;
		$args   = wp_parse_args(
			$args,
			array(
				'request_id' => 0,
				'open'       => true,
				'due_before' => '',
				'owner_id'   => 0,
				'limit'      => 50,
			)
		);
		$t      = Installer::table( 'tasks' );
		$r      = Installer::table( 'requests' );
		$where  = array( '1=1' );
		$params = array();
		if ( $args['request_id'] ) {
			$where[]  = 't.request_id = %d';
			$params[] = (int) $args['request_id'];
		}
		if ( $args['open'] ) {
			$where[] = 't.done_at IS NULL';
		}
		if ( $args['due_before'] ) {
			$where[]  = '(t.due_at IS NULL OR t.due_at <= %s)';
			$params[] = $args['due_before'];
		}
		if ( $args['owner_id'] ) {
			$where[]  = '(t.owner_id = %d OR t.owner_id = 0)';
			$params[] = (int) $args['owner_id'];
		}
		$params[] = (int) $args['limit'];
		$sql      = "SELECT t.*, r.ref, r.first_name, r.last_name, r.activity_name FROM $t t LEFT JOIN $r r ON r.id = t.request_id WHERE " . implode( ' AND ', $where ) . ' ORDER BY (t.done_at IS NOT NULL), t.due_at ASC, t.id ASC LIMIT %d';
		return (array) $wpdb->get_results( $wpdb->prepare( $sql, $params ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
	}
}
