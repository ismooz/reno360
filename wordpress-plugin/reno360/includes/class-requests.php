<?php
/**
 * Demandes de devis : CRUD, statuts et requêtes.
 *
 * @package Reno360
 */

namespace Reno360;

defined( 'ABSPATH' ) || exit;

class Requests {

	public static function table() {
		return Installer::table( 'requests' );
	}

	/**
	 * Colonnes modifiables et leur type.
	 *
	 * @return array<string,string>
	 */
	public static function columns() {
		return array(
			'status'            => 'status',
			'activity_id'       => 'int',
			'activity_name'     => 'text',
			'answers'           => 'json',
			'description'       => 'textarea',
			'first_name'        => 'text',
			'last_name'         => 'text',
			'email'             => 'email',
			'phone'             => 'text',
			'contact_pref'      => 'text',
			'contact_time'      => 'text',
			'address'           => 'text',
			'npa'               => 'npa',
			'city'              => 'text',
			'canton'            => 'canton',
			'property_type'     => 'text',
			'client_type'       => 'text',
			'start_wish'        => 'text',
			'budget'            => 'text',
			'preferred_date'    => 'date',
			'owner_id'          => 'int',
			'priority'          => 'int',
			'source'            => 'text',
			'landing'           => 'text',
			'utm'               => 'json',
			'device'            => 'text',
			'lost_reason'       => 'text',
			'accepted_quote_id' => 'int',
			'consent_at'        => 'datetime',
			'first_response_at' => 'datetime',
		);
	}

	/**
	 * Nettoie les données selon leur type.
	 *
	 * @param array $data Données brutes.
	 * @return array
	 */
	public static function sanitize( array $data ) {
		$out = array();
		foreach ( self::columns() as $col => $type ) {
			if ( ! array_key_exists( $col, $data ) ) {
				continue;
			}
			$v = $data[ $col ];
			switch ( $type ) {
				case 'int':
					$out[ $col ] = max( 0, (int) $v );
					break;
				case 'email':
					$out[ $col ] = sanitize_email( $v );
					break;
				case 'textarea':
					$out[ $col ] = sanitize_textarea_field( $v );
					break;
				case 'json':
					$out[ $col ] = is_array( $v ) ? Util::json( $v ) : ( is_string( $v ) ? $v : '' );
					break;
				case 'npa':
					$out[ $col ] = substr( preg_replace( '/\D/', '', (string) $v ), 0, 4 );
					break;
				case 'canton':
					$v           = strtoupper( sanitize_key( $v ) );
					$out[ $col ] = isset( Util::cantons()[ $v ] ) ? $v : '';
					break;
				case 'date':
					$out[ $col ] = preg_match( '/^\d{4}-\d{2}-\d{2}$/', (string) $v ) ? $v : null;
					break;
				case 'datetime':
					$out[ $col ] = $v ? (string) $v : null;
					break;
				case 'status':
					$out[ $col ] = isset( Util::statuses()[ $v ] ) ? $v : 'nouvelle';
					break;
				default:
					$out[ $col ] = mb_substr( sanitize_text_field( $v ), 0, 190 );
			}
		}
		return $out;
	}

	/**
	 * Crée une demande.
	 *
	 * @param array  $data   Données.
	 * @param string $origin Texte de l'événement de création.
	 * @return int|\WP_Error
	 */
	public static function create( array $data, $origin = '' ) {
		global $wpdb;
		$row = self::sanitize( $data );
		if ( empty( $row['email'] ) && empty( $row['phone'] ) ) {
			return new \WP_Error( 'rn_contact', 'Un e-mail ou un téléphone est nécessaire.' );
		}
		if ( ! empty( $row['activity_id'] ) && empty( $row['activity_name'] ) ) {
			$a                    = Activities::get( $row['activity_id'] );
			$row['activity_name'] = $a ? $a['name'] : '';
		}
		if ( empty( $row['canton'] ) && ! empty( $row['npa'] ) ) {
			$row['canton'] = Util::canton_from_npa( $row['npa'] );
		}
		$now                      = Util::now();
		$row['status']            = isset( $row['status'] ) ? $row['status'] : 'nouvelle';
		$row['created_at']        = $now;
		$row['updated_at']        = $now;
		$row['status_changed_at'] = $now;

		$ok = $wpdb->insert( self::table(), $row );
		if ( ! $ok ) {
			return new \WP_Error( 'rn_db', 'Impossible d’enregistrer la demande.' );
		}
		$id = (int) $wpdb->insert_id;
		$wpdb->update( self::table(), array( 'ref' => self::make_ref( $id ) ), array( 'id' => $id ) );
		Events::add( $id, 'system', $origin ? $origin : 'Demande créée.', array( 'author_type' => 'system' ) );
		do_action( 'reno360_request_created', $id );
		return $id;
	}

	public static function make_ref( $id ) {
		return 'R-' . ( 1000 + (int) $id );
	}

	/**
	 * @param int $id Identifiant.
	 * @return array|null
	 */
	public static function get( $id ) {
		global $wpdb;
		$row = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::table() . ' WHERE id = %d', $id ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		return $row ? self::hydrate( $row ) : null;
	}

	public static function get_by_ref( $ref ) {
		global $wpdb;
		$row = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::table() . ' WHERE ref = %s', strtoupper( trim( (string) $ref ) ) ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		return $row ? self::hydrate( $row ) : null;
	}

	public static function hydrate( array $row ) {
		$row['id']          = (int) $row['id'];
		$row['activity_id'] = (int) $row['activity_id'];
		$row['owner_id']    = (int) $row['owner_id'];
		$row['answers']     = Util::decode( $row['answers'] );
		$row['utm']         = Util::decode( $row['utm'] );
		$row['flags']       = array_filter( explode( ',', (string) $row['flags'] ) );
		$row['name']        = trim( $row['first_name'] . ' ' . $row['last_name'] );
		$row['place']       = trim( $row['npa'] . ' ' . $row['city'] );
		return $row;
	}

	/**
	 * Met à jour une demande (le statut passe par set_status()).
	 *
	 * @param int   $id   Demande.
	 * @param array $data Champs.
	 * @return bool
	 */
	public static function update( $id, array $data ) {
		global $wpdb;
		unset( $data['status'] );
		$row = self::sanitize( $data );
		if ( isset( $row['npa'] ) && ! array_key_exists( 'canton', $data ) ) {
			$row['canton'] = Util::canton_from_npa( $row['npa'] );
		}
		if ( isset( $row['activity_id'] ) && ! isset( $data['activity_name'] ) ) {
			$a                    = Activities::get( $row['activity_id'] );
			$row['activity_name'] = $a ? $a['name'] : '';
		}
		if ( ! $row ) {
			return false;
		}
		$row['updated_at'] = Util::now();
		return false !== $wpdb->update( self::table(), $row, array( 'id' => (int) $id ) );
	}

	/**
	 * Change le statut, journalise et notifie le client si configuré.
	 *
	 * @param int    $id     Demande.
	 * @param string $status Nouveau statut.
	 * @param array  $opts   note, notify (bool), lost_reason, author_type.
	 * @return bool
	 */
	public static function set_status( $id, $status, array $opts = array() ) {
		global $wpdb;
		$r = self::get( $id );
		if ( ! $r || ! isset( Util::statuses()[ $status ] ) || $r['status'] === $status ) {
			return false;
		}
		$opts = wp_parse_args(
			$opts,
			array(
				'note'        => '',
				'notify'      => true,
				'lost_reason' => '',
				'author_type' => is_user_logged_in() ? 'admin' : 'system',
			)
		);
		$now    = Util::now();
		$update = array(
			'status'            => $status,
			'status_changed_at' => $now,
			'updated_at'        => $now,
		);
		if ( 'perdue' === $status && $opts['lost_reason'] ) {
			$update['lost_reason'] = mb_substr( sanitize_text_field( $opts['lost_reason'] ), 0, 190 );
		}
		if ( 'nouvelle' === $r['status'] && empty( $r['first_response_at'] ) ) {
			$update['first_response_at'] = $now;
		}
		$wpdb->update( self::table(), $update, array( 'id' => (int) $id ) );

		$text = sprintf( 'Statut : %s → %s', Util::status_label( $r['status'] ), Util::status_label( $status ) );
		if ( $opts['note'] ) {
			$text .= "\n" . $opts['note'];
		}
		if ( ! empty( $update['lost_reason'] ) ) {
			$text .= "\nMotif : " . $update['lost_reason'];
		}
		Events::add(
			$id,
			'status',
			$text,
			array(
				'author_type' => $opts['author_type'],
				'meta'        => array(
					'from' => $r['status'],
					'to'   => $status,
				),
			)
		);

		if ( $opts['notify'] && in_array( $status, (array) Settings::get( 'notify_client_status', array() ), true ) ) {
			Notifications::client_status( self::get( $id ) );
		}
		do_action( 'reno360_request_status', $id, $status, $r['status'] );
		return true;
	}

	public static function mark_first_response( $id ) {
		global $wpdb;
		$wpdb->query( $wpdb->prepare( 'UPDATE ' . self::table() . ' SET first_response_at = %s WHERE id = %d AND first_response_at IS NULL', Util::now(), $id ) ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
	}

	public static function touch( $id ) {
		global $wpdb;
		$wpdb->update( self::table(), array( 'updated_at' => Util::now() ), array( 'id' => (int) $id ) );
	}

	public static function has_flag( array $r, $flag ) {
		return in_array( $flag, $r['flags'], true );
	}

	public static function add_flag( $id, $flag ) {
		global $wpdb;
		$r = self::get( $id );
		if ( ! $r || self::has_flag( $r, $flag ) ) {
			return;
		}
		$flags   = $r['flags'];
		$flags[] = sanitize_key( $flag );
		$wpdb->update( self::table(), array( 'flags' => implode( ',', $flags ) ), array( 'id' => (int) $id ) );
	}

	/**
	 * Supprime une demande et tout ce qui s'y rattache.
	 *
	 * @param int $id Demande.
	 * @return bool
	 */
	public static function delete( $id ) {
		global $wpdb;
		$id = (int) $id;
		foreach ( Files::query( array( 'request_id' => $id ) ) as $f ) {
			Files::delete( $f['id'] );
		}
		$wpdb->delete( Installer::table( 'quotes' ), array( 'request_id' => $id ), array( '%d' ) );
		$wpdb->delete( Installer::table( 'events' ), array( 'request_id' => $id ), array( '%d' ) );
		$wpdb->delete( Installer::table( 'tasks' ), array( 'request_id' => $id ), array( '%d' ) );
		return (bool) $wpdb->delete( self::table(), array( 'id' => $id ), array( '%d' ) );
	}

	/**
	 * Recherche paginée.
	 *
	 * @param array $args status, activity_id, canton, owner_id, search, email, since, per_page, page, orderby, order.
	 * @return array{items:array,total:int}
	 */
	public static function query( array $args = array() ) {
		global $wpdb;
		$args = wp_parse_args(
			$args,
			array(
				'status'      => '',
				'activity_id' => 0,
				'canton'      => '',
				'owner_id'    => 0,
				'search'      => '',
				'email'       => '',
				'since'       => '',
				'per_page'    => 20,
				'page'        => 1,
				'orderby'     => 'created_at',
				'order'       => 'DESC',
			)
		);
		list( $where, $params ) = self::where( $args );
		$orderby = in_array( $args['orderby'], array( 'created_at', 'updated_at', 'status', 'ref', 'last_name', 'npa', 'activity_name', 'id' ), true ) ? $args['orderby'] : 'created_at';
		$order   = 'ASC' === strtoupper( $args['order'] ) ? 'ASC' : 'DESC';
		$limit   = max( 1, (int) $args['per_page'] );
		$offset  = max( 0, ( (int) $args['page'] - 1 ) * $limit );
		$t       = self::table();

		// phpcs:disable WordPress.DB.PreparedSQL
		$sql_total = "SELECT COUNT(*) FROM $t WHERE $where";
		$total     = (int) ( $params ? $wpdb->get_var( $wpdb->prepare( $sql_total, $params ) ) : $wpdb->get_var( $sql_total ) );
		$sql       = "SELECT * FROM $t WHERE $where ORDER BY $orderby $order, id DESC LIMIT %d OFFSET %d";
		$rows      = $wpdb->get_results( $wpdb->prepare( $sql, array_merge( $params, array( $limit, $offset ) ) ), ARRAY_A );
		// phpcs:enable

		return array(
			'items' => array_map( array( __CLASS__, 'hydrate' ), (array) $rows ),
			'total' => $total,
		);
	}

	/**
	 * Clause WHERE et paramètres.
	 *
	 * @param array $args Filtres.
	 * @return array
	 */
	public static function where( array $args ) {
		global $wpdb;
		$where  = array( '1=1' );
		$params = array();
		if ( ! empty( $args['status'] ) ) {
			$statuses = array_values( array_intersect( (array) $args['status'], array_keys( Util::statuses() ) ) );
			if ( $statuses ) {
				$where[] = 'status IN (' . implode( ',', array_fill( 0, count( $statuses ), '%s' ) ) . ')';
				$params  = array_merge( $params, $statuses );
			}
		}
		if ( ! empty( $args['activity_id'] ) ) {
			$where[]  = 'activity_id = %d';
			$params[] = (int) $args['activity_id'];
		}
		if ( ! empty( $args['canton'] ) ) {
			$where[]  = 'canton = %s';
			$params[] = strtoupper( $args['canton'] );
		}
		if ( ! empty( $args['owner_id'] ) ) {
			$where[]  = 'owner_id = %d';
			$params[] = (int) $args['owner_id'];
		}
		if ( ! empty( $args['email'] ) ) {
			$where[]  = 'email = %s';
			$params[] = sanitize_email( $args['email'] );
		}
		if ( ! empty( $args['since'] ) ) {
			$where[]  = 'created_at >= %s';
			$params[] = $args['since'];
		}
		if ( isset( $args['search'] ) && '' !== trim( (string) $args['search'] ) ) {
			$like     = '%' . $wpdb->esc_like( trim( $args['search'] ) ) . '%';
			$where[]  = '(ref LIKE %s OR first_name LIKE %s OR last_name LIKE %s OR email LIKE %s OR phone LIKE %s OR npa LIKE %s OR city LIKE %s OR activity_name LIKE %s OR description LIKE %s)';
			$params   = array_merge( $params, array_fill( 0, 9, $like ) );
		}
		return array( implode( ' AND ', $where ), $params );
	}

	/**
	 * Nombre de demandes par statut.
	 *
	 * @param array $args Filtres (hors statut).
	 * @return array<string,int>
	 */
	public static function counts( array $args = array() ) {
		global $wpdb;
		unset( $args['status'] );
		list( $where, $params ) = self::where( $args );
		$sql  = 'SELECT status, COUNT(*) AS n FROM ' . self::table() . " WHERE $where GROUP BY status";
		$rows = $params ? $wpdb->get_results( $wpdb->prepare( $sql, $params ), ARRAY_A ) : $wpdb->get_results( $sql, ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
		$out  = array_fill_keys( array_keys( Util::statuses() ), 0 );
		foreach ( (array) $rows as $row ) {
			$out[ $row['status'] ] = (int) $row['n'];
		}
		return $out;
	}

	/**
	 * Demandes d'une adresse e-mail (espace client).
	 *
	 * @param string $email E-mail.
	 * @return array
	 */
	public static function for_email( $email ) {
		return self::query(
			array(
				'email'    => $email,
				'per_page' => 100,
			)
		)['items'];
	}

	/**
	 * Avancement affiché au client (étapes du suivi).
	 *
	 * @param array $r Demande.
	 * @return array
	 */
	public static function client_steps( array $r ) {
		$keys  = array( 'nouvelle', 'qualifiee', 'envoyee', 'devis', 'acceptee', 'travaux', 'terminee' );
		$pos   = array_search( $r['status'], $keys, true );
		$steps = array();
		foreach ( $keys as $i => $k ) {
			$steps[] = array(
				'key'     => $k,
				'label'   => Util::status_label( $k, true ),
				'done'    => false !== $pos && $i < $pos,
				'current' => false !== $pos && $i === $pos,
			);
		}
		return $steps;
	}
}
