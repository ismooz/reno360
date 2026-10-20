<?php
/**
 * Historique d'une demande (notes, appels, e-mails, messages, statuts…).
 *
 * @package Reno360
 */

namespace Reno360;

defined( 'ABSPATH' ) || exit;

class Events {

	public static function types() {
		return array(
			'note'    => array( 'label' => 'Note interne', 'icon' => 'file' ),
			'call'    => array( 'label' => 'Appel', 'icon' => 'phone' ),
			'email'   => array( 'label' => 'E-mail', 'icon' => 'mail' ),
			'sms'     => array( 'label' => 'SMS', 'icon' => 'message' ),
			'message' => array( 'label' => 'Message', 'icon' => 'message' ),
			'status'  => array( 'label' => 'Statut', 'icon' => 'arrow' ),
			'quote'   => array( 'label' => 'Devis', 'icon' => 'file' ),
			'task'    => array( 'label' => 'Tâche', 'icon' => 'check' ),
			'system'  => array( 'label' => 'Système', 'icon' => 'info' ),
		);
	}

	/**
	 * Ajoute un événement.
	 *
	 * @param int    $request_id Demande.
	 * @param string $type       Type.
	 * @param string $content    Texte.
	 * @param array  $opts       visibility (internal|client), author_type (admin|client|artisan|system), author_id, author_name, meta.
	 * @return int
	 */
	public static function add( $request_id, $type, $content, array $opts = array() ) {
		global $wpdb;
		$opts = wp_parse_args(
			$opts,
			array(
				'visibility'  => 'internal',
				'author_type' => 'admin',
				'author_id'   => 0,
				'author_name' => '',
				'meta'        => array(),
			)
		);
		if ( 'admin' === $opts['author_type'] && ! $opts['author_id'] ) {
			$opts['author_id']   = get_current_user_id();
			$opts['author_name'] = $opts['author_name'] ? $opts['author_name'] : Util::current_user_name();
		}
		if ( 'system' === $opts['author_type'] && ! $opts['author_name'] ) {
			$opts['author_name'] = 'Automatique';
		}
		$wpdb->insert(
			Installer::table( 'events' ),
			array(
				'request_id'  => (int) $request_id,
				'type'        => isset( self::types()[ $type ] ) ? $type : 'note',
				'visibility'  => 'client' === $opts['visibility'] ? 'client' : 'internal',
				'author_type' => sanitize_key( $opts['author_type'] ),
				'author_id'   => (int) $opts['author_id'],
				'author_name' => mb_substr( sanitize_text_field( $opts['author_name'] ), 0, 150 ),
				'content'     => sanitize_textarea_field( $content ),
				'meta'        => $opts['meta'] ? Util::json( $opts['meta'] ) : null,
				'created_at'  => Util::now(),
			)
		);
		return (int) $wpdb->insert_id;
	}

	/**
	 * Événements d'une demande, du plus récent au plus ancien.
	 *
	 * @param int         $request_id Demande.
	 * @param string|null $visibility Filtre (client = seulement ceux visibles par le client).
	 * @param string      $order      ASC|DESC.
	 * @return array
	 */
	public static function for_request( $request_id, $visibility = null, $order = 'DESC' ) {
		global $wpdb;
		$t     = Installer::table( 'events' );
		$order = 'ASC' === $order ? 'ASC' : 'DESC';
		if ( 'client' === $visibility ) {
			$rows = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM $t WHERE request_id = %d AND visibility = 'client' ORDER BY created_at $order, id $order", $request_id ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
		} else {
			$rows = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM $t WHERE request_id = %d ORDER BY created_at $order, id $order", $request_id ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
		}
		foreach ( $rows as &$row ) {
			$row['meta'] = Util::decode( $row['meta'] );
		}
		return (array) $rows;
	}

	public static function delete( $id ) {
		global $wpdb;
		return (bool) $wpdb->delete( Installer::table( 'events' ), array( 'id' => (int) $id ), array( '%d' ) );
	}
}
