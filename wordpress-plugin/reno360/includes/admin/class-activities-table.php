<?php
/**
 * Liste des types de travaux (WP_List_Table).
 *
 * @package Reno360
 */

namespace Reno360\Admin;

use Reno360\Activities;
use Reno360\Icons;
use Reno360\Installer;
use Reno360\Search;
use Reno360\Util;

defined( 'ABSPATH' ) || exit;

if ( ! class_exists( 'WP_List_Table' ) ) {
	require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

class Activities_Table extends \WP_List_Table {

	/** @var array */
	private $request_counts = array();

	public function __construct() {
		parent::__construct(
			array(
				'singular' => 'travail',
				'plural'   => 'travaux',
				'ajax'     => false,
			)
		);
	}

	public function get_columns() {
		return array(
			'cb'        => '<input type="checkbox">',
			'name'      => 'Type de travaux',
			'category'  => 'Catégorie',
			'keywords'  => 'Mots-clés',
			'questions' => 'Questions',
			'flags'     => 'Mise en avant',
			'requests'  => 'Demandes',
			'status'    => 'Statut',
		);
	}

	public function prepare_items() {
		global $wpdb;
		// phpcs:disable WordPress.Security.NonceVerification
		$cat    = isset( $_GET['cat'] ) ? (int) $_GET['cat'] : 0;
		$state  = isset( $_GET['state'] ) ? sanitize_key( $_GET['state'] ) : '';
		$search = isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : '';
		// phpcs:enable
		$items = Activities::all(
			array(
				'status'   => 'any',
				'category' => $cat,
			)
		);
		if ( 'active' === $state || 'inactive' === $state ) {
			$items = array_values(
				array_filter(
					$items,
					static function ( $a ) use ( $state ) {
						return 'active' === $state ? $a['active'] : ! $a['active'];
					}
				)
			);
		}
		if ( '' !== $search ) {
			$needle = Search::normalize( $search );
			$items  = array_values(
				array_filter(
					$items,
					static function ( $a ) use ( $needle ) {
						$hay = Search::normalize( $a['name'] . ' ' . $a['slug'] . ' ' . implode( ' ', $a['keywords'] ) . ' ' . $a['excerpt'] );
						return false !== strpos( $hay, $needle );
					}
				)
			);
		}
		$rows = $wpdb->get_results( 'SELECT activity_id, COUNT(*) AS n FROM ' . Installer::table( 'requests' ) . ' GROUP BY activity_id', ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
		foreach ( (array) $rows as $row ) {
			$this->request_counts[ (int) $row['activity_id'] ] = (int) $row['n'];
		}
		$per_page = 50;
		$total    = count( $items );
		$page     = $this->get_pagenum();
		$this->items           = array_slice( $items, ( $page - 1 ) * $per_page, $per_page );
		$this->_column_headers = array( $this->get_columns(), array(), array(), 'name' );
		$this->set_pagination_args(
			array(
				'total_items' => $total,
				'per_page'    => $per_page,
			)
		);
	}

	public function no_items() {
		echo 'Aucun type de travaux. Ajoutez-en un ou importez un fichier CSV.';
	}

	protected function column_cb( $item ) {
		return '<input type="checkbox" name="ids[]" value="' . (int) $item['id'] . '">';
	}

	protected function column_name( $item ) {
		$edit    = Util::admin_url( 'reno360-activities', array( 'edit' => $item['id'] ) );
		$actions = array(
			'edit'   => '<a href="' . esc_url( $edit ) . '">Modifier</a>',
			'view'   => '<a href="' . esc_url( $item['url'] ) . '" target="_blank" rel="noopener">Voir la page</a>',
			'toggle' => '<a href="' . esc_url( Admin::action_url( 'rn_activity_toggle', array( 'id' => $item['id'] ) ) ) . '">' . ( $item['active'] ? 'Désactiver' : 'Activer' ) . '</a>',
			'delete' => '<a class="rn-danger" href="' . esc_url( Admin::action_url( 'rn_activity_delete', array( 'id' => $item['id'] ) ) ) . '" data-rn-confirm="Supprimer définitivement « ' . esc_attr( $item['name'] ) . ' » ? Les demandes existantes conservent leur intitulé.">Supprimer</a>',
		);
		return '<span class="rn-act-name"><span class="rn-act-ico">' . Icons::svg( $item['icon'], 18 ) . '</span><span><a class="row-title" href="' . esc_url( $edit ) . '">' . esc_html( $item['name'] ) . '</a><small class="rn-muted">/' . esc_html( $item['slug'] ) . '</small></span></span>' . $this->row_actions( $actions );
	}

	protected function column_category( $item ) {
		return $item['category'] ? esc_html( $item['category'] ) : '<span class="rn-muted">—</span>';
	}

	protected function column_keywords( $item ) {
		$kw   = $item['keywords'];
		$show = array_slice( $kw, 0, 8 );
		$html = '<span class="rn-kw-list">';
		foreach ( $show as $k ) {
			$html .= '<span class="rn-kw">' . esc_html( $k ) . '</span>';
		}
		if ( count( $kw ) > 8 ) {
			$html .= '<a class="rn-kw rn-kw--more" href="' . esc_url( Util::admin_url( 'reno360-activities', array( 'edit' => $item['id'] ) ) . '#rn-keywords' ) . '">+' . ( count( $kw ) - 8 ) . '</a>';
		}
		if ( ! $kw ) {
			$html .= '<span class="rn-badge rn-badge--amber">Aucun mot-clé</span>';
		}
		return $html . '</span>';
	}

	protected function column_questions( $item ) {
		return $item['questions'] ? (int) count( $item['questions'] ) : '<span class="rn-muted" title="Questions par défaut">défaut</span>';
	}

	protected function column_flags( $item ) {
		$out = array();
		if ( $item['popular'] ) {
			$out[] = '<span class="rn-chip-xs">Populaire</span>';
		}
		if ( $item['featured'] ) {
			$out[] = '<span class="rn-chip-xs">Vedette</span>';
		}
		if ( $item['boost'] ) {
			$out[] = '<span class="rn-chip-xs" title="Priorité de recherche">+' . (int) $item['boost'] . '</span>';
		}
		return $out ? implode( ' ', $out ) : '<span class="rn-muted">—</span>';
	}

	protected function column_requests( $item ) {
		$n = isset( $this->request_counts[ $item['id'] ] ) ? $this->request_counts[ $item['id'] ] : 0;
		return $n ? '<a href="' . esc_url( Util::admin_url( 'reno360-requests', array( 'activity_id' => $item['id'], 'mode' => 'list' ) ) ) . '">' . (int) $n . '</a>' : '<span class="rn-muted">0</span>';
	}

	protected function column_status( $item ) {
		return $item['active'] ? '<span class="rn-badge" style="color:#145F32;background:#E3F2E8">Actif</span>' : '<span class="rn-badge" style="color:#3C434A;background:#F0F0F1">Inactif</span>';
	}

	protected function extra_tablenav( $which ) {
		if ( 'top' !== $which ) {
			return;
		}
		$ops = array(
			''           => 'Actions groupées',
			'activate'   => 'Activer',
			'deactivate' => 'Désactiver',
		);
		foreach ( Activities::categories() as $c ) {
			$ops[ 'cat_' . $c['id'] ] = 'Déplacer vers « ' . $c['name'] . ' »';
		}
		$ops['delete'] = 'Supprimer';
		echo '<div class="alignleft actions">' . Admin::select( 'bulk_action', $ops, '', 'aria-label="Actions groupées"' ) . ' <button type="submit" class="button" data-rn-bulk>Appliquer</button></div>'; // phpcs:ignore WordPress.Security.EscapeOutput
	}
}
