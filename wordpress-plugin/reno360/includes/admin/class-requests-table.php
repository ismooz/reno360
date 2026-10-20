<?php
/**
 * Liste des demandes (WP_List_Table).
 *
 * @package Reno360
 */

namespace Reno360\Admin;

use Reno360\Installer;
use Reno360\Requests;
use Reno360\Util;

defined( 'ABSPATH' ) || exit;

if ( ! class_exists( 'WP_List_Table' ) ) {
	require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

class Requests_Table extends \WP_List_Table {

	/** @var array */
	public $filters = array();

	/** @var array id => [total, received] */
	private $quote_counts = array();

	public function __construct( array $filters ) {
		parent::__construct(
			array(
				'singular' => 'demande',
				'plural'   => 'demandes',
				'ajax'     => false,
			)
		);
		$this->filters = $filters;
	}

	public function get_columns() {
		return array(
			'cb'       => '<input type="checkbox">',
			'ref'      => 'N°',
			'client'   => 'Client',
			'activity' => 'Travaux',
			'place'    => 'Lieu',
			'budget'   => 'Budget',
			'status'   => 'Statut',
			'quotes'   => 'Devis',
			'owner'    => 'Resp.',
			'created'  => 'Reçue',
		);
	}

	protected function get_sortable_columns() {
		return array(
			'ref'      => array( 'id', false ),
			'client'   => array( 'last_name', false ),
			'activity' => array( 'activity_name', false ),
			'place'    => array( 'npa', false ),
			'status'   => array( 'status', false ),
			'created'  => array( 'created_at', true ),
		);
	}

	public function prepare_items() {
		global $wpdb;
		$per_page = 25;
		$orderby  = isset( $_GET['orderby'] ) ? sanitize_key( $_GET['orderby'] ) : 'created_at'; // phpcs:ignore WordPress.Security.NonceVerification
		$order    = isset( $_GET['order'] ) ? sanitize_key( $_GET['order'] ) : 'desc'; // phpcs:ignore WordPress.Security.NonceVerification
		$res      = Requests::query(
			array_merge(
				$this->filters,
				array(
					'per_page' => $per_page,
					'page'     => $this->get_pagenum(),
					'orderby'  => $orderby,
					'order'    => $order,
				)
			)
		);
		$this->items = $res['items'];
		$ids         = wp_list_pluck( $this->items, 'id' );
		if ( $ids ) {
			$q    = Installer::table( 'quotes' );
			$rows = $wpdb->get_results( 'SELECT request_id, COUNT(*) AS total, SUM(CASE WHEN status IN (\'recu\',\'accepte\',\'refuse\') THEN 1 ELSE 0 END) AS rec FROM ' . $q . ' WHERE request_id IN (' . implode( ',', array_map( 'intval', $ids ) ) . ') GROUP BY request_id', ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
			foreach ( (array) $rows as $row ) {
				$this->quote_counts[ (int) $row['request_id'] ] = array( (int) $row['total'], (int) $row['rec'] );
			}
		}
		$this->_column_headers = array( $this->get_columns(), array(), $this->get_sortable_columns(), 'ref' );
		$this->set_pagination_args(
			array(
				'total_items' => $res['total'],
				'per_page'    => $per_page,
			)
		);
	}

	public function no_items() {
		echo 'Aucune demande ne correspond.';
	}

	protected function column_cb( $item ) {
		return '<input type="checkbox" name="ids[]" value="' . (int) $item['id'] . '">';
	}

	protected function column_ref( $item ) {
		$url     = Util::admin_url( 'reno360-requests', array( 'view' => $item['id'] ) );
		$actions = array(
			'view'   => '<a href="' . esc_url( $url ) . '">Ouvrir</a>',
			'edit'   => '<a href="' . esc_url( add_query_arg( 'edit', 1, $url ) ) . '">Modifier</a>',
			'delete' => '<a href="' . esc_url( Admin::action_url( 'rn_request_delete', array( 'id' => $item['id'] ) ) ) . '" data-rn-confirm="Supprimer définitivement la demande ' . esc_attr( $item['ref'] ) . ' (devis, fichiers et historique inclus) ?" class="rn-danger">Supprimer</a>',
		);
		return '<a class="rn-strong" href="' . esc_url( $url ) . '">' . esc_html( $item['ref'] ) . '</a>' . ( $item['priority'] ? ' <span class="rn-badge rn-badge--red">Urgent</span>' : '' ) . $this->row_actions( $actions );
	}

	protected function column_client( $item ) {
		return '<strong>' . esc_html( $item['name'] ) . '</strong><br><span class="rn-muted">' . esc_html( $item['email'] ) . '</span>';
	}

	protected function column_activity( $item ) {
		return esc_html( $item['activity_name'] );
	}

	protected function column_place( $item ) {
		return esc_html( $item['place'] ) . ( $item['canton'] ? ' <span class="rn-muted">(' . esc_html( $item['canton'] ) . ')</span>' : '' );
	}

	protected function column_budget( $item ) {
		return esc_html( $item['budget'] );
	}

	protected function column_status( $item ) {
		return Util::status_badge( $item['status'] );
	}

	protected function column_quotes( $item ) {
		if ( empty( $this->quote_counts[ $item['id'] ] ) ) {
			return '<span class="rn-muted">—</span>';
		}
		list( $total, $rec ) = $this->quote_counts[ $item['id'] ];
		return esc_html( $rec . '/' . $total );
	}

	protected function column_owner( $item ) {
		$name = Util::user_name( $item['owner_id'] );
		return $name ? '<span class="rn-avatar-xs" title="' . esc_attr( $name ) . '">' . esc_html( Util::initials( $name ) ) . '</span>' : '<span class="rn-muted">—</span>';
	}

	protected function column_created( $item ) {
		return '<span title="' . esc_attr( Util::datetime( $item['created_at'] ) ) . '">' . esc_html( Util::ago( $item['created_at'] ) ) . '</span>';
	}

	protected function extra_tablenav( $which ) {
		if ( 'top' !== $which ) {
			return;
		}
		$ops = array( '' => 'Actions groupées' );
		foreach ( Util::statuses() as $k => $s ) {
			$ops[ 'status_' . $k ] = 'Passer en « ' . $s['label'] . ' »';
		}
		foreach ( Admin::staff_options() as $uid => $name ) {
			$ops[ 'owner_' . $uid ] = 'Attribuer à ' . $name;
		}
		$ops['export'] = 'Exporter la sélection (CSV)';
		$ops['delete'] = 'Supprimer';
		echo '<div class="alignleft actions">' . Admin::select( 'bulk_action', $ops, '', 'aria-label="Actions groupées"' ) . ' <button type="submit" class="button" data-rn-bulk>Appliquer</button></div>'; // phpcs:ignore WordPress.Security.EscapeOutput
	}
}
