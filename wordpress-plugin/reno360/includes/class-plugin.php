<?php
/**
 * Point d'entrée : branche tous les modules.
 *
 * @package Reno360
 */

namespace Reno360;

defined( 'ABSPATH' ) || exit;

class Plugin {

	/** @var bool */
	private static $booted = false;

	public static function boot() {
		if ( self::$booted ) {
			return;
		}
		self::$booted = true;

		load_plugin_textdomain( 'reno360', false, dirname( plugin_basename( RENO360_FILE ) ) . '/languages' );

		Installer::maybe_upgrade();
		Activities::init();
		Search::init();
		Rest::init();
		Portal::init();
		Files::init();
		Frontend::init();
		Chrome::init();
		Automations::init();
		Notifications::init();

		if ( is_admin() ) {
			Admin\Admin::init();
		}
	}
}
