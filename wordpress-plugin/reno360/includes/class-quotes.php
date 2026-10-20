<?php
/**
 * Devis : attribution d'une demande à un artisan, réception, acceptation.
 *
 * Une ligne de devis est créée dès qu'un artisan est consulté (statut « attendu ») ;
 * l'artisan dispose alors d'un lien sécurisé pour déposer son offre.
 *
 * @package Reno360
 */

namespace Reno360;

defined( 'ABSPATH' ) || exit;

class Quotes {

	public static function table() {
		return Installer::table( 'quotes' );
	}

	public static function get( $id ) {
		global $wpdb;
		$row = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::table() . ' WHERE id = %d', $id ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
		return $row ? self::hydrate( $row ) : null;
	}

	public static function get_by_token( $token ) {
		global $wpdb;
		$token = preg_replace( '/[^a-f0-9]/', '', strtolower( (string) $token ) );
		if ( strlen( $token ) < 32 ) {
			return null;
		}
		$row = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::table() . ' WHERE token = %s', $token ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
		return $row ? self::hydrate( $row ) : null;
	}

	public static function hydrate( array $row ) {
		$row['id']         = (int) $row['id'];
		$row['request_id'] = (int) $row['request_id'];
		$row['artisan_id'] = (int) $row['artisan_id'];
		$row['amount']     = null === $row['amount'] ? null : (float) $row['amount'];
		$a                 = $row['artisan_id'] ? Artisans::get( $row['artisan_id'] ) : null;
		$row['artisan']    = $a;
		$row['company']    = $a ? $a['company'] : 'Artisan supprimé';
		return $row;
	}

	/**
	 * Devis d'une demande.
	 *
	 * @param int  $request_id Demande.
	 * @param bool $visible    Seulement ceux visibles par le client (reçus/acceptés/non retenus).
	 * @return array
	 */
	public static function for_request( $request_id, $visible = false ) {
		global $wpdb;
		$sql = 'SELECT * FROM ' . self::table() . ' WHERE request_id = %d' . ( $visible ? " AND status IN ('recu','accepte','refuse')" : '' ) . ' ORDER BY id ASC';
		return array_map( array( __CLASS__, 'hydrate' ), (array) $wpdb->get_results( $wpdb->prepare( $sql, $request_id ), ARRAY_A ) ); // phpcs:ignore WordPress.DB.PreparedSQL
	}

	public static function artisan_link( array $q ) {
		return Settings::page_url( 'artisan', array( 'q' => $q['token'] ) );
	}

	/**
	 * Consulte un artisan pour une demande.
	 *
	 * @param int  $request_id Demande.
	 * @param int  $artisan_id Artisan.
	 * @param bool $notify     Envoyer l'e-mail à l'artisan.
	 * @return int|\WP_Error
	 */
	public static function assign( $request_id, $artisan_id, $notify = true ) {
		global $wpdb;
		$r = Requests::get( $request_id );
		$a = Artisans::get( $artisan_id );
		if ( ! $r || ! $a ) {
			return new \WP_Error( 'rn_missing', 'Demande ou artisan introuvable.' );
		}
		$exists = $wpdb->get_var( $wpdb->prepare( 'SELECT id FROM ' . self::table() . ' WHERE request_id = %d AND artisan_id = %d', $request_id, $artisan_id ) ); // phpcs:ignore WordPress.DB.PreparedSQL
		if ( $exists ) {
			return new \WP_Error( 'rn_exists', 'Cet artisan est déjà consulté pour cette demande.' );
		}
		$now = Util::now();
		$wpdb->insert(
			self::table(),
			array(
				'request_id' => (int) $request_id,
				'artisan_id' => (int) $artisan_id,
				'status'     => 'attendu',
				'token'      => Util::token( 40 ),
				'sent_at'    => $now,
				'created_at' => $now,
				'updated_at' => $now,
			)
		);
		$id = (int) $wpdb->insert_id;
		Events::add( $request_id, 'quote', 'Artisan consulté : ' . $a['company'] . ( $notify ? ' (e-mail envoyé)' : '' ) );
		if ( $notify ) {
			Notifications::artisan_lead( self::get( $id ) );
		}
		if ( in_array( $r['status'], array( 'nouvelle', 'qualifiee' ), true ) ) {
			Requests::set_status( $request_id, 'envoyee' );
		}
		Requests::mark_first_response( $request_id );
		return $id;
	}

	/**
	 * Met à jour les champs d'un devis (sans changer son statut).
	 *
	 * @param int   $id   Devis.
	 * @param array $data amount, start_date, duration, valid_until, includes, excludes, notes.
	 * @return bool
	 */
	public static function update( $id, array $data ) {
		global $wpdb;
		$row = array();
		if ( array_key_exists( 'amount', $data ) ) {
			$row['amount'] = Util::parse_amount( $data['amount'] );
		}
		foreach ( array( 'start_date', 'valid_until' ) as $k ) {
			if ( array_key_exists( $k, $data ) ) {
				$row[ $k ] = preg_match( '/^\d{4}-\d{2}-\d{2}$/', (string) $data[ $k ] ) ? $data[ $k ] : null;
			}
		}
		if ( isset( $data['duration'] ) ) {
			$row['duration'] = mb_substr( sanitize_text_field( $data['duration'] ), 0, 100 );
		}
		foreach ( array( 'includes', 'excludes', 'notes' ) as $k ) {
			if ( isset( $data[ $k ] ) ) {
				$row[ $k ] = sanitize_textarea_field( $data[ $k ] );
			}
		}
		if ( ! $row ) {
			return false;
		}
		$row['updated_at'] = Util::now();
		return false !== $wpdb->update( self::table(), $row, array( 'id' => (int) $id ) );
	}

	/**
	 * Enregistre la réception d'un devis.
	 *
	 * @param int    $id   Devis.
	 * @param array  $data Champs du devis.
	 * @param string $by   admin|artisan.
	 * @return bool
	 */
	public static function receive( $id, array $data, $by = 'admin' ) {
		global $wpdb;
		$q = self::get( $id );
		if ( ! $q ) {
			return false;
		}
		self::update( $id, $data );
		$first = 'recu' !== $q['status'];
		$wpdb->update(
			self::table(),
			array(
				'status'      => 'recu',
				'received_at' => $q['received_at'] ? $q['received_at'] : Util::now(),
				'updated_at'  => Util::now(),
			),
			array( 'id' => (int) $id )
		);
		$q = self::get( $id );
		Events::add(
			$q['request_id'],
			'quote',
			sprintf( 'Devis %s : %s — %s', $first ? 'reçu' : 'mis à jour', $q['company'], Util::chf( $q['amount'] ) ),
			array(
				'author_type' => 'artisan' === $by ? 'artisan' : 'admin',
				'author_name' => 'artisan' === $by ? $q['company'] : '',
				'visibility'  => 'internal',
			)
		);
		$r = Requests::get( $q['request_id'] );
		if ( $r && in_array( $r['status'], array( 'nouvelle', 'qualifiee', 'envoyee' ), true ) ) {
			// Pas d'e-mail de statut ici : l'e-mail « nouveau devis » informe déjà le client.
			Requests::set_status( $r['id'], 'devis', array( 'notify' => false ) );
		}
		if ( $first ) {
			if ( 'artisan' === $by && Settings::get( 'notify_admin_quote' ) ) {
				Notifications::admin_quote( $q );
			}
			if ( Settings::get( 'notify_client_quote' ) ) {
				Notifications::client_new_quote( $q );
			}
		}
		return true;
	}

	/**
	 * Accepte un devis : les autres deviennent « non retenus ».
	 *
	 * @param int    $id Devis.
	 * @param string $by client|admin.
	 * @return bool
	 */
	public static function accept( $id, $by = 'admin' ) {
		global $wpdb;
		$q = self::get( $id );
		if ( ! $q || ! in_array( $q['status'], array( 'recu', 'attendu', 'refuse' ), true ) ) {
			return false;
		}
		$now = Util::now();
		$wpdb->update(
			self::table(),
			array(
				'status'     => 'accepte',
				'decided_at' => $now,
				'updated_at' => $now,
			),
			array( 'id' => (int) $id )
		);
		$losers = array();
		foreach ( self::for_request( $q['request_id'] ) as $other ) {
			if ( $other['id'] !== $q['id'] && in_array( $other['status'], array( 'attendu', 'recu' ), true ) ) {
				$wpdb->update(
					self::table(),
					array(
						'status'     => 'refuse',
						'decided_at' => $now,
						'updated_at' => $now,
					),
					array( 'id' => $other['id'] )
				);
				$losers[] = $other;
			}
		}
		Requests::update( $q['request_id'], array( 'accepted_quote_id' => $q['id'] ) );
		Events::add(
			$q['request_id'],
			'quote',
			sprintf( 'Devis accepté%s : %s — %s', 'client' === $by ? ' par le client' : '', $q['company'], Util::chf( $q['amount'] ) ),
			array(
				'author_type' => 'client' === $by ? 'client' : 'admin',
				'visibility'  => 'client',
			)
		);
		Requests::set_status( $q['request_id'], 'acceptee', array( 'author_type' => 'client' === $by ? 'client' : 'admin' ) );
		Notifications::artisan_won( self::get( $id ) );
		if ( Settings::get( 'notify_losers' ) ) {
			foreach ( $losers as $l ) {
				Notifications::artisan_lost( $l );
			}
		}
		if ( 'client' === $by ) {
			Notifications::admin_accepted( self::get( $id ) );
		}
		return true;
	}

	/**
	 * L'artisan (ou l'admin) indique qu'il ne peut pas faire d'offre.
	 *
	 * @param int    $id     Devis.
	 * @param string $reason Motif.
	 * @param string $by     artisan|admin.
	 * @return bool
	 */
	public static function decline( $id, $reason = '', $by = 'artisan' ) {
		global $wpdb;
		$q = self::get( $id );
		if ( ! $q ) {
			return false;
		}
		$wpdb->update(
			self::table(),
			array(
				'status'     => 'decline',
				'notes'      => trim( $q['notes'] . "\n" . sanitize_textarea_field( $reason ) ),
				'decided_at' => Util::now(),
				'updated_at' => Util::now(),
			),
			array( 'id' => (int) $id )
		);
		Events::add(
			$q['request_id'],
			'quote',
			'Artisan indisponible : ' . $q['company'] . ( $reason ? ' — ' . $reason : '' ),
			array(
				'author_type' => 'artisan' === $by ? 'artisan' : 'admin',
				'author_name' => 'artisan' === $by ? $q['company'] : '',
			)
		);
		if ( 'artisan' === $by ) {
			Tasks::add(
				'Remplacer ' . $q['company'] . ' (indisponible)',
				array(
					'request_id' => $q['request_id'],
					'source'     => 'auto',
					'auto_key'   => 'decline_' . $q['id'],
				)
			);
			Notifications::admin_decline( $q, $reason );
		}
		return true;
	}

	public static function set_status( $id, $status ) {
		global $wpdb;
		if ( ! isset( Util::quote_statuses()[ $status ] ) ) {
			return false;
		}
		return false !== $wpdb->update(
			self::table(),
			array(
				'status'     => $status,
				'updated_at' => Util::now(),
			),
			array( 'id' => (int) $id )
		);
	}

	public static function delete( $id ) {
		global $wpdb;
		$q = self::get( $id );
		if ( ! $q ) {
			return false;
		}
		foreach ( Files::query( array( 'quote_id' => (int) $id ) ) as $f ) {
			Files::delete( $f['id'] );
		}
		Events::add( $q['request_id'], 'quote', 'Artisan retiré : ' . $q['company'] );
		return (bool) $wpdb->delete( self::table(), array( 'id' => (int) $id ), array( '%d' ) );
	}

	/**
	 * Liste paginée (écran « Devis »).
	 *
	 * @param array $args status, artisan_id, per_page, page.
	 * @return array{items:array,total:int}
	 */
	public static function query( array $args = array() ) {
		global $wpdb;
		$args   = wp_parse_args(
			$args,
			array(
				'status'     => '',
				'artisan_id' => 0,
				'per_page'   => 20,
				'page'       => 1,
			)
		);
		$where  = array( '1=1' );
		$params = array();
		if ( $args['status'] ) {
			$where[]  = 'status = %s';
			$params[] = $args['status'];
		}
		if ( $args['artisan_id'] ) {
			$where[]  = 'artisan_id = %d';
			$params[] = (int) $args['artisan_id'];
		}
		$w      = implode( ' AND ', $where );
		$t      = self::table();
		$limit  = max( 1, (int) $args['per_page'] );
		$offset = max( 0, ( (int) $args['page'] - 1 ) * $limit );
		// phpcs:disable WordPress.DB.PreparedSQL
		$count_sql = "SELECT COUNT(*) FROM $t WHERE $w";
		$total     = (int) ( $params ? $wpdb->get_var( $wpdb->prepare( $count_sql, $params ) ) : $wpdb->get_var( $count_sql ) );
		$rows      = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM $t WHERE $w ORDER BY updated_at DESC, id DESC LIMIT %d OFFSET %d", array_merge( $params, array( $limit, $offset ) ) ), ARRAY_A );
		// phpcs:enable
		return array(
			'items' => array_map( array( __CLASS__, 'hydrate' ), (array) $rows ),
			'total' => $total,
		);
	}

	/**
	 * Étiquettes « prix le plus bas » / « démarrage le plus tôt » pour le comparatif.
	 *
	 * @param array $quotes Devis reçus.
	 * @return array id => libellés
	 */
	public static function tags( array $quotes ) {
		$tags   = array();
		$priced = array_filter(
			$quotes,
			static function ( $q ) {
				return null !== $q['amount'] && in_array( $q['status'], array( 'recu', 'accepte' ), true );
			}
		);
		if ( count( $priced ) > 1 ) {
			usort(
				$priced,
				static function ( $a, $b ) {
					return $a['amount'] <=> $b['amount'];
				}
			);
			$tags[ $priced[0]['id'] ][] = 'Prix le plus bas';
			$dated                      = array_filter(
				$priced,
				static function ( $q ) {
					return ! empty( $q['start_date'] );
				}
			);
			if ( count( $dated ) > 1 ) {
				usort(
					$dated,
					static function ( $a, $b ) {
						return strcmp( $a['start_date'], $b['start_date'] );
					}
				);
				$tags[ $dated[0]['id'] ][] = 'Démarrage le plus tôt';
			}
		}
		return $tags;
	}
}
