<?php
/**
 * Artisans partenaires : CRUD, métiers, zones et correspondance avec les demandes.
 *
 * @package Reno360
 */

namespace Reno360;

defined( 'ABSPATH' ) || exit;

class Artisans {

	public static function table() {
		return Installer::table( 'artisans' );
	}

	/**
	 * Crée ou met à jour un artisan.
	 *
	 * @param array $data company, contact_name, email, phone, address, npa, city, canton, ide, website, cantons[], npa_ranges, status, rating, rc_expiry, notes, trades[].
	 * @param int   $id   0 pour créer.
	 * @return int|\WP_Error
	 */
	public static function save( array $data, $id = 0 ) {
		global $wpdb;
		$row = array();
		$map = array( 'company', 'contact_name', 'phone', 'address', 'city', 'ide', 'website' );
		foreach ( $map as $k ) {
			if ( isset( $data[ $k ] ) ) {
				$row[ $k ] = mb_substr( sanitize_text_field( $data[ $k ] ), 0, 190 );
			}
		}
		if ( isset( $row['website'] ) ) {
			$row['website'] = esc_url_raw( $row['website'] );
		}
		if ( isset( $data['email'] ) ) {
			$row['email'] = sanitize_email( $data['email'] );
		}
		if ( isset( $data['npa'] ) ) {
			$row['npa'] = substr( preg_replace( '/\D/', '', (string) $data['npa'] ), 0, 4 );
		}
		if ( isset( $data['canton'] ) ) {
			$c             = strtoupper( sanitize_key( $data['canton'] ) );
			$row['canton'] = isset( Util::cantons()[ $c ] ) ? $c : '';
		}
		if ( isset( $data['cantons'] ) ) {
			$list           = array_values( array_intersect( array_map( 'strtoupper', (array) $data['cantons'] ), array_keys( Util::cantons() ) ) );
			$row['cantons'] = implode( ',', $list );
		}
		if ( isset( $data['npa_ranges'] ) ) {
			$row['npa_ranges'] = self::clean_ranges( $data['npa_ranges'] );
		}
		if ( isset( $data['status'] ) ) {
			$row['status'] = isset( Util::artisan_statuses()[ $data['status'] ] ) ? $data['status'] : 'candidat';
		}
		if ( array_key_exists( 'rating', $data ) ) {
			$rating        = str_replace( ',', '.', (string) $data['rating'] );
			$row['rating'] = is_numeric( $rating ) ? max( 0, min( 5, round( (float) $rating, 1 ) ) ) : null;
		}
		if ( array_key_exists( 'rc_expiry', $data ) ) {
			$row['rc_expiry'] = preg_match( '/^\d{4}-\d{2}-\d{2}$/', (string) $data['rc_expiry'] ) ? $data['rc_expiry'] : null;
		}
		if ( isset( $data['notes'] ) ) {
			$row['notes'] = sanitize_textarea_field( $data['notes'] );
		}

		$now = Util::now();
		if ( $id ) {
			if ( isset( $row['company'] ) && '' === $row['company'] ) {
				return new \WP_Error( 'rn_company', 'Le nom de l’entreprise est obligatoire.' );
			}
			$row['updated_at'] = $now;
			$wpdb->update( self::table(), $row, array( 'id' => (int) $id ) );
		} else {
			if ( empty( $row['company'] ) ) {
				return new \WP_Error( 'rn_company', 'Le nom de l’entreprise est obligatoire.' );
			}
			if ( empty( $row['canton'] ) && ! empty( $row['npa'] ) ) {
				$row['canton'] = Util::canton_from_npa( $row['npa'] );
			}
			$row['status']     = isset( $row['status'] ) ? $row['status'] : 'candidat';
			$row['created_at'] = $now;
			$row['updated_at'] = $now;
			$wpdb->insert( self::table(), $row );
			$id = (int) $wpdb->insert_id;
			if ( ! $id ) {
				return new \WP_Error( 'rn_db', 'Impossible d’enregistrer l’artisan.' );
			}
		}
		if ( isset( $data['trades'] ) ) {
			self::set_trades( $id, (array) $data['trades'] );
		}
		return (int) $id;
	}

	/**
	 * « 1000-1099, 1110 » -> format normalisé.
	 *
	 * @param string $raw Texte.
	 * @return string
	 */
	public static function clean_ranges( $raw ) {
		$out = array();
		foreach ( preg_split( '/[,;\s]+/', (string) $raw ) as $part ) {
			if ( preg_match( '/^(\d{4})(?:-(\d{4}))?$/', trim( $part ), $m ) ) {
				$a     = (int) $m[1];
				$b     = isset( $m[2] ) && '' !== $m[2] ? (int) $m[2] : $a;
				$out[] = $a === $b ? (string) $a : min( $a, $b ) . '-' . max( $a, $b );
			}
		}
		return implode( ', ', array_unique( $out ) );
	}

	public static function set_trades( $id, array $activity_ids ) {
		global $wpdb;
		$t = Installer::table( 'artisan_activity' );
		$wpdb->delete( $t, array( 'artisan_id' => (int) $id ), array( '%d' ) );
		foreach ( array_unique( array_map( 'intval', $activity_ids ) ) as $aid ) {
			if ( $aid > 0 ) {
				$wpdb->insert(
					$t,
					array(
						'artisan_id'  => (int) $id,
						'activity_id' => $aid,
					)
				);
			}
		}
	}

	public static function trades( $id ) {
		global $wpdb;
		return array_map( 'intval', (array) $wpdb->get_col( $wpdb->prepare( 'SELECT activity_id FROM ' . Installer::table( 'artisan_activity' ) . ' WHERE artisan_id = %d', $id ) ) ); // phpcs:ignore WordPress.DB.PreparedSQL
	}

	/**
	 * @param int $id Artisan.
	 * @return array|null
	 */
	public static function get( $id ) {
		global $wpdb;
		$row = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . self::table() . ' WHERE id = %d', $id ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
		return $row ? self::hydrate( $row ) : null;
	}

	public static function hydrate( array $row ) {
		$row['id']          = (int) $row['id'];
		$row['cantons']     = array_filter( explode( ',', (string) $row['cantons'] ) );
		$row['trades']      = self::trades( $row['id'] );
		$row['trade_names'] = array();
		foreach ( $row['trades'] as $aid ) {
			$title = get_the_title( $aid );
			if ( $title ) {
				$row['trade_names'][ $aid ] = $title;
			}
		}
		$row['flags'] = array_filter( explode( ',', (string) $row['flags'] ) );
		return $row;
	}

	public static function delete( $id ) {
		global $wpdb;
		foreach ( Files::query( array( 'artisan_id' => (int) $id, 'context' => 'artisan_doc' ) ) as $f ) {
			Files::delete( $f['id'] );
		}
		$wpdb->delete( Installer::table( 'artisan_activity' ), array( 'artisan_id' => (int) $id ), array( '%d' ) );
		$wpdb->delete( Installer::table( 'tasks' ), array( 'artisan_id' => (int) $id ), array( '%d' ) );
		return (bool) $wpdb->delete( self::table(), array( 'id' => (int) $id ), array( '%d' ) );
	}

	/**
	 * Liste paginée.
	 *
	 * @param array $args status, activity_id, canton, search, docs (expiring|missing), per_page, page, orderby, order.
	 * @return array{items:array,total:int}
	 */
	public static function query( array $args = array() ) {
		global $wpdb;
		$args   = wp_parse_args(
			$args,
			array(
				'status'      => '',
				'activity_id' => 0,
				'canton'      => '',
				'search'      => '',
				'docs'        => '',
				'per_page'    => 20,
				'page'        => 1,
				'orderby'     => 'company',
				'order'       => 'ASC',
			)
		);
		$t      = self::table();
		$where  = array( '1=1' );
		$params = array();
		if ( $args['status'] ) {
			$where[]  = 'a.status = %s';
			$params[] = $args['status'];
		}
		if ( $args['activity_id'] ) {
			$where[]  = 'a.id IN (SELECT artisan_id FROM ' . Installer::table( 'artisan_activity' ) . ' WHERE activity_id = %d)';
			$params[] = (int) $args['activity_id'];
		}
		if ( $args['canton'] ) {
			$where[]  = '(a.cantons LIKE %s OR a.canton = %s)';
			$params[] = '%' . $wpdb->esc_like( strtoupper( $args['canton'] ) ) . '%';
			$params[] = strtoupper( $args['canton'] );
		}
		if ( 'expiring' === $args['docs'] ) {
			$where[]  = 'a.rc_expiry IS NOT NULL AND a.rc_expiry <= %s';
			$params[] = gmdate( 'Y-m-d', time() + 30 * DAY_IN_SECONDS );
		} elseif ( 'missing' === $args['docs'] ) {
			$where[] = 'a.rc_expiry IS NULL';
		}
		if ( '' !== trim( (string) $args['search'] ) ) {
			$like     = '%' . $wpdb->esc_like( trim( $args['search'] ) ) . '%';
			$where[]  = '(a.company LIKE %s OR a.contact_name LIKE %s OR a.email LIKE %s OR a.city LIKE %s OR a.npa LIKE %s OR a.ide LIKE %s)';
			$params   = array_merge( $params, array_fill( 0, 6, $like ) );
		}
		$orderby = in_array( $args['orderby'], array( 'company', 'created_at', 'status', 'rating', 'city' ), true ) ? $args['orderby'] : 'company';
		$order   = 'DESC' === strtoupper( $args['order'] ) ? 'DESC' : 'ASC';
		$limit   = max( 1, (int) $args['per_page'] );
		$offset  = max( 0, ( (int) $args['page'] - 1 ) * $limit );
		$w       = implode( ' AND ', $where );
		// phpcs:disable WordPress.DB.PreparedSQL
		$count_sql = "SELECT COUNT(*) FROM $t a WHERE $w";
		$total     = (int) ( $params ? $wpdb->get_var( $wpdb->prepare( $count_sql, $params ) ) : $wpdb->get_var( $count_sql ) );
		$rows      = $wpdb->get_results( $wpdb->prepare( "SELECT a.* FROM $t a WHERE $w ORDER BY a.$orderby $order, a.id ASC LIMIT %d OFFSET %d", array_merge( $params, array( $limit, $offset ) ) ), ARRAY_A );
		// phpcs:enable
		return array(
			'items' => array_map( array( __CLASS__, 'hydrate' ), (array) $rows ),
			'total' => $total,
		);
	}

	public static function counts() {
		global $wpdb;
		$rows = $wpdb->get_results( 'SELECT status, COUNT(*) AS n FROM ' . self::table() . ' GROUP BY status', ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
		$out  = array_fill_keys( array_keys( Util::artisan_statuses() ), 0 );
		foreach ( (array) $rows as $r ) {
			$out[ $r['status'] ] = (int) $r['n'];
		}
		return $out;
	}

	/**
	 * Indique si l'artisan couvre une zone : 2 = plage de NPA, 1 = canton, 0 = non.
	 *
	 * @param array  $a      Artisan.
	 * @param string $npa    NPA.
	 * @param string $canton Canton.
	 * @return int
	 */
	public static function coverage( array $a, $npa, $canton ) {
		$n = (int) $npa;
		if ( $n && ! empty( $a['npa_ranges'] ) ) {
			foreach ( explode( ',', $a['npa_ranges'] ) as $range ) {
				$range = trim( $range );
				if ( '' === $range ) {
					continue;
				}
				$parts = explode( '-', $range );
				$lo    = (int) $parts[0];
				$hi    = isset( $parts[1] ) ? (int) $parts[1] : $lo;
				if ( $n >= $lo && $n <= $hi ) {
					return 2;
				}
			}
		}
		if ( $canton && ( in_array( $canton, $a['cantons'], true ) || ( empty( $a['cantons'] ) && empty( $a['npa_ranges'] ) && $a['canton'] === $canton ) ) ) {
			return 1;
		}
		return 0;
	}

	/**
	 * Artisans suggérés pour une demande (métier + zone), classés.
	 *
	 * @param array $request Demande.
	 * @param int   $limit   Nombre.
	 * @return array
	 */
	public static function suggestions( array $request, $limit = 6 ) {
		global $wpdb;
		$assigned = array_map( 'intval', (array) $wpdb->get_col( $wpdb->prepare( 'SELECT artisan_id FROM ' . Installer::table( 'quotes' ) . ' WHERE request_id = %d', $request['id'] ) ) ); // phpcs:ignore WordPress.DB.PreparedSQL
		$list     = self::query(
			array(
				'status'      => 'actif',
				'activity_id' => $request['activity_id'],
				'per_page'    => 200,
			)
		)['items'];
		$out = array();
		foreach ( $list as $a ) {
			if ( in_array( $a['id'], $assigned, true ) ) {
				continue;
			}
			$zone = self::coverage( $a, $request['npa'], $request['canton'] );
			if ( ! $zone ) {
				continue;
			}
			$stats    = self::stats( $a['id'] );
			$score    = $zone * 10 + (float) $a['rating'] * 2 + $stats['response_rate'] / 20 - $stats['open'] * 1.5;
			$a['why'] = array_filter(
				array(
					2 === $zone ? 'NPA couvert' : 'Canton couvert',
					$a['rating'] ? 'Note ' . number_format( (float) $a['rating'], 1, ',', '' ) : '',
					$stats['requested'] ? 'Réponse ' . $stats['response_rate'] . ' %' : 'Nouveau partenaire',
					$stats['open'] ? $stats['open'] . ' devis en attente' : '',
				)
			);
			$a['score'] = $score;
			$out[]      = $a;
		}
		usort(
			$out,
			static function ( $x, $y ) {
				return $y['score'] <=> $x['score'];
			}
		);
		return array_slice( $out, 0, $limit );
	}

	/**
	 * Statistiques sur 12 mois.
	 *
	 * @param int $id Artisan.
	 * @return array
	 */
	public static function stats( $id ) {
		global $wpdb;
		$q     = Installer::table( 'quotes' );
		$since = gmdate( 'Y-m-d H:i:s', time() - 365 * DAY_IN_SECONDS );
		$row   = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT COUNT(*) AS requested,
				SUM(CASE WHEN status IN ('recu','accepte','refuse') THEN 1 ELSE 0 END) AS received,
				SUM(CASE WHEN status = 'accepte' THEN 1 ELSE 0 END) AS won,
				SUM(CASE WHEN status = 'attendu' THEN 1 ELSE 0 END) AS open_q,
				SUM(CASE WHEN status = 'accepte' THEN amount ELSE 0 END) AS won_amount
				FROM $q WHERE artisan_id = %d AND created_at >= %s", // phpcs:ignore WordPress.DB.PreparedSQL
				$id,
				$since
			),
			ARRAY_A
		);
		$pairs = $wpdb->get_results( $wpdb->prepare( "SELECT sent_at, received_at FROM $q WHERE artisan_id = %d AND received_at IS NOT NULL AND sent_at IS NOT NULL", $id ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
		$days  = array();
		foreach ( (array) $pairs as $p ) {
			$days[] = max( 0, ( strtotime( $p['received_at'] ) - strtotime( $p['sent_at'] ) ) / DAY_IN_SECONDS );
		}
		$requested = (int) $row['requested'];
		$received  = (int) $row['received'];
		return array(
			'requested'     => $requested,
			'received'      => $received,
			'won'           => (int) $row['won'],
			'open'          => (int) $row['open_q'],
			'won_amount'    => (float) $row['won_amount'],
			'response_rate' => $requested ? (int) round( $received / $requested * 100 ) : 0,
			'avg_days'      => $days ? round( array_sum( $days ) / count( $days ), 1 ) : null,
		);
	}

	public static function has_flag( array $a, $flag ) {
		return in_array( $flag, $a['flags'], true );
	}

	public static function add_flag( $id, $flag ) {
		global $wpdb;
		$a = self::get( $id );
		if ( ! $a || self::has_flag( $a, $flag ) ) {
			return;
		}
		$flags   = $a['flags'];
		$flags[] = sanitize_key( $flag );
		$wpdb->update( self::table(), array( 'flags' => implode( ',', $flags ) ), array( 'id' => (int) $id ) );
	}

	/**
	 * Liste simple pour les menus déroulants.
	 *
	 * @param string $status Statut.
	 * @return array id => company
	 */
	public static function options( $status = 'actif' ) {
		global $wpdb;
		$rows = $status
			? $wpdb->get_results( $wpdb->prepare( 'SELECT id, company, city FROM ' . self::table() . ' WHERE status = %s ORDER BY company', $status ), ARRAY_A ) // phpcs:ignore WordPress.DB.PreparedSQL
			: $wpdb->get_results( 'SELECT id, company, city FROM ' . self::table() . ' ORDER BY company', ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
		$out  = array();
		foreach ( (array) $rows as $r ) {
			$out[ (int) $r['id'] ] = $r['company'] . ( $r['city'] ? ' — ' . $r['city'] : '' );
		}
		return $out;
	}
}
