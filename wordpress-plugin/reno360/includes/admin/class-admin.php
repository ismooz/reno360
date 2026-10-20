<?php
/**
 * Back-office : menus, ressources, messages et routage des actions.
 *
 * @package Reno360
 */

namespace Reno360\Admin;

use Reno360\Requests;
use Reno360\Util;

defined( 'ABSPATH' ) || exit;

class Admin {

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'assets' ) );
		add_action( 'admin_notices', array( __CLASS__, 'notices' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( RENO360_FILE ), array( __CLASS__, 'action_links' ) );
		add_action( 'wp_dashboard_setup', array( __CLASS__, 'dashboard_widget' ) );
		add_filter( 'admin_body_class', array( __CLASS__, 'body_class' ) );
		Actions::init();
	}

	public static function pages() {
		return array(
			'reno360'            => array( 'Vue d’ensemble', array( Dashboard_Page::class, 'render' ) ),
			'reno360-requests'   => array( 'Demandes', array( Requests_Page::class, 'render' ) ),
			'reno360-activities' => array( 'Travaux et mots-clés', array( Activities_Page::class, 'render' ) ),
			'reno360-search'     => array( 'Recherches', array( Search_Page::class, 'render' ) ),
			'reno360-artisans'   => array( 'Artisans', array( Artisans_Page::class, 'render' ) ),
			'reno360-quotes'     => array( 'Devis', array( Quotes_Page::class, 'render' ) ),
			'reno360-clients'    => array( 'Clients', array( Clients_Page::class, 'render' ) ),
			'reno360-settings'   => array( 'Réglages', array( Settings_Page::class, 'render' ) ),
		);
	}

	public static function menu() {
		$new    = Requests::counts()['nouvelle'];
		$bubble = $new ? ' <span class="awaiting-mod">' . (int) $new . '</span>' : '';
		add_menu_page( 'Reno360', 'Reno360' . $bubble, Util::CAP, 'reno360', array( Dashboard_Page::class, 'render' ), 'dashicons-hammer', 26 );
		foreach ( self::pages() as $slug => $def ) {
			$title = 'reno360-requests' === $slug ? $def[0] . $bubble : $def[0];
			add_submenu_page( 'reno360', $def[0] . ' — Reno360', $title, Util::CAP, $slug, $def[1] );
		}
	}

	public static function is_ours() {
		$page = isset( $_GET['page'] ) ? sanitize_key( $_GET['page'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		return 0 === strpos( $page, 'reno360' );
	}

	public static function body_class( $classes ) {
		return self::is_ours() ? $classes . ' rn-admin-page' : $classes;
	}

	public static function assets() {
		if ( ! self::is_ours() ) {
			return;
		}
		wp_enqueue_style( 'reno360-admin', RENO360_URL . 'assets/css/admin.css', array(), RENO360_VERSION );
		wp_enqueue_script( 'reno360-admin', RENO360_URL . 'assets/js/admin.js', array(), RENO360_VERSION, true );
		wp_localize_script(
			'reno360-admin',
			'RENO360_ADMIN',
			array(
				'rest'     => esc_url_raw( rest_url( 'reno360/v1/' ) ),
				'nonce'    => wp_create_nonce( 'wp_rest' ),
				'statuses' => Util::statuses(),
			)
		);
		$page = isset( $_GET['page'] ) ? sanitize_key( $_GET['page'] ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		if ( in_array( $page, array( 'reno360-activities', 'reno360-settings' ), true ) ) {
			wp_enqueue_media();
		}
	}

	public static function action_links( $links ) {
		array_unshift( $links, '<a href="' . esc_url( Util::admin_url( 'reno360-settings' ) ) . '">Réglages</a>' );
		return $links;
	}

	/* ------------------------------------------------------------------ */
	/* Messages                                                           */
	/* ------------------------------------------------------------------ */

	public static function flash( $message, $type = 'success' ) {
		$key   = 'rn_flash_' . get_current_user_id();
		$list  = (array) get_transient( $key );
		$list[] = array( $message, $type );
		set_transient( $key, $list, 120 );
	}

	public static function notices() {
		if ( ! self::is_ours() ) {
			return;
		}
		$key  = 'rn_flash_' . get_current_user_id();
		$list = (array) get_transient( $key );
		delete_transient( $key );
		foreach ( array_filter( $list ) as $item ) {
			printf( '<div class="notice notice-%1$s is-dismissible"><p>%2$s</p></div>', esc_attr( $item[1] ), wp_kses_post( $item[0] ) );
		}
	}

	/* ------------------------------------------------------------------ */
	/* Widget du tableau de bord WordPress                                */
	/* ------------------------------------------------------------------ */

	public static function dashboard_widget() {
		if ( current_user_can( Util::CAP ) ) {
			wp_add_dashboard_widget( 'reno360_widget', 'Reno360 — à traiter', array( __CLASS__, 'render_widget' ) );
		}
	}

	public static function render_widget() {
		$counts = Requests::counts();
		$list   = Requests::query(
			array(
				'status'   => array( 'nouvelle', 'qualifiee' ),
				'per_page' => 5,
			)
		)['items'];
		echo '<p><strong>' . (int) $counts['nouvelle'] . '</strong> nouvelle(s) demande(s) · <strong>' . (int) $counts['devis'] . '</strong> en attente du choix du client</p>';
		if ( $list ) {
			echo '<ul>';
			foreach ( $list as $r ) {
				printf( '<li><a href="%s">%s</a> — %s, %s <span style="color:#646970">(%s)</span></li>', esc_url( Util::admin_url( 'reno360-requests', array( 'view' => $r['id'] ) ) ), esc_html( $r['ref'] ), esc_html( $r['activity_name'] ), esc_html( $r['place'] ), esc_html( Util::ago( $r['created_at'] ) ) );
			}
			echo '</ul>';
		}
		echo '<p><a class="button button-primary" href="' . esc_url( Util::admin_url( 'reno360-requests' ) ) . '">Ouvrir les demandes</a></p>';
	}

	/* ------------------------------------------------------------------ */
	/* Aides d'affichage                                                  */
	/* ------------------------------------------------------------------ */

	public static function header( $title, $actions = '', $subtitle = '' ) {
		echo '<div class="rn-admin-head"><div><h1 class="rn-admin-title">' . esc_html( $title ) . '</h1>';
		if ( $subtitle ) {
			echo '<p class="rn-admin-sub">' . wp_kses_post( $subtitle ) . '</p>';
		}
		echo '</div>';
		if ( $actions ) {
			echo '<div class="rn-admin-actions">' . $actions . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput
		}
		echo '</div>';
	}

	/**
	 * Ouvre un formulaire admin-post avec nonce.
	 *
	 * @param string $action Action.
	 * @param array  $hidden Champs cachés.
	 * @param string $attrs  Attributs supplémentaires.
	 */
	public static function form_open( $action, array $hidden = array(), $attrs = '' ) {
		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" ' . $attrs . '>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<input type="hidden" name="action" value="' . esc_attr( $action ) . '">';
		wp_nonce_field( $action );
		foreach ( $hidden as $k => $v ) {
			echo '<input type="hidden" name="' . esc_attr( $k ) . '" value="' . esc_attr( $v ) . '">';
		}
	}

	public static function action_url( $action, array $args = array() ) {
		return wp_nonce_url( add_query_arg( array_merge( array( 'action' => $action ), $args ), admin_url( 'admin-post.php' ) ), $action );
	}

	public static function select( $name, array $options, $selected = '', $attrs = '', $placeholder = null ) {
		$html = '<select name="' . esc_attr( $name ) . '" ' . $attrs . '>';
		if ( null !== $placeholder ) {
			$html .= '<option value="">' . esc_html( $placeholder ) . '</option>';
		}
		foreach ( $options as $value => $label ) {
			$html .= '<option value="' . esc_attr( $value ) . '"' . selected( (string) $selected, (string) $value, false ) . '>' . esc_html( $label ) . '</option>';
		}
		return $html . '</select>';
	}

	public static function list_options( array $lines, $current = '' ) {
		$opts = array();
		foreach ( $lines as $l ) {
			$opts[ $l ] = $l;
		}
		if ( $current && ! isset( $opts[ $current ] ) ) {
			$opts[ $current ] = $current;
		}
		return $opts;
	}

	public static function staff_options() {
		$out = array();
		foreach ( Util::staff() as $u ) {
			$out[ $u->ID ] = $u->display_name;
		}
		return $out;
	}

	public static function icon( $key, $size = 18 ) {
		return \Reno360\Icons::svg( $key, $size );
	}
}
