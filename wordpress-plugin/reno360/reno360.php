<?php
/**
 * Plugin Name:       Reno360 — Devis travaux et CRM
 * Plugin URI:        https://reno360.ch
 * Description:       Plateforme de demandes de devis travaux : recherche intelligente par mots-clés, formulaire guidé, espace client, liens artisans et back-office complet (demandes, travaux, artisans, devis, automatisations). Compatible Divi 5 via shortcodes.
 * Version:           1.1.0
 * Requires at least: 6.2
 * Requires PHP:      7.4
 * Author:            Reno360
 * Text Domain:       reno360
 * Domain Path:       /languages
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 *
 * @package Reno360
 */

defined( 'ABSPATH' ) || exit;

define( 'RENO360_VERSION', '1.1.0' );
define( 'RENO360_DB_VERSION', '1' );
define( 'RENO360_FILE', __FILE__ );
define( 'RENO360_DIR', plugin_dir_path( __FILE__ ) );
define( 'RENO360_URL', plugin_dir_url( __FILE__ ) );

/*
 * Autoloader : Reno360\Foo_Bar -> includes/class-foo-bar.php,
 * Reno360\Admin\Foo -> includes/admin/class-foo.php.
 */
spl_autoload_register(
	static function ( $class ) {
		if ( 0 !== strpos( $class, 'Reno360\\' ) ) {
			return;
		}
		$parts = explode( '\\', substr( $class, 8 ) );
		$name  = array_pop( $parts );
		$dir   = RENO360_DIR . 'includes/' . ( $parts ? strtolower( implode( '/', $parts ) ) . '/' : '' );
		$file  = $dir . 'class-' . str_replace( '_', '-', strtolower( $name ) ) . '.php';
		if ( is_readable( $file ) ) {
			require $file;
		}
	}
);

register_activation_hook( __FILE__, array( 'Reno360\\Installer', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'Reno360\\Installer', 'deactivate' ) );

add_action( 'plugins_loaded', array( 'Reno360\\Plugin', 'boot' ) );
