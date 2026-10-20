<?php
/**
 * Activation, mises à jour du schéma, pages et données initiales.
 *
 * @package Reno360
 */

namespace Reno360;

defined( 'ABSPATH' ) || exit;

class Installer {

	public static function activate() {
		self::create_tables();
		self::add_roles();
		Activities::register();
		Activities::seed();
		self::create_pages();
		Files::protect_dir();
		if ( ! wp_next_scheduled( 'reno360_cron' ) ) {
			wp_schedule_event( time() + 300, 'hourly', 'reno360_cron' );
		}
		update_option( 'reno360_db_version', RENO360_DB_VERSION, false );
		update_option( 'reno360_version', RENO360_VERSION, false );
		Search::flush();
		flush_rewrite_rules();
	}

	public static function deactivate() {
		wp_clear_scheduled_hook( 'reno360_cron' );
		flush_rewrite_rules();
	}

	public static function maybe_upgrade() {
		if ( get_option( 'reno360_db_version' ) !== RENO360_DB_VERSION ) {
			self::create_tables();
			self::add_roles();
			update_option( 'reno360_db_version', RENO360_DB_VERSION, false );
		}
		if ( ! wp_next_scheduled( 'reno360_cron' ) ) {
			wp_schedule_event( time() + 300, 'hourly', 'reno360_cron' );
		}
	}

	public static function table( $name ) {
		global $wpdb;
		return $wpdb->prefix . 'rn_' . $name;
	}

	public static function create_tables() {
		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$c = $wpdb->get_charset_collate();

		$sql = array();

		$sql[] = 'CREATE TABLE ' . self::table( 'requests' ) . " (
id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
ref varchar(20) NOT NULL DEFAULT '',
status varchar(20) NOT NULL DEFAULT 'nouvelle',
activity_id bigint(20) unsigned NOT NULL DEFAULT 0,
activity_name varchar(190) NOT NULL DEFAULT '',
answers longtext NULL,
description text NULL,
first_name varchar(100) NOT NULL DEFAULT '',
last_name varchar(100) NOT NULL DEFAULT '',
email varchar(190) NOT NULL DEFAULT '',
phone varchar(50) NOT NULL DEFAULT '',
contact_pref varchar(60) NOT NULL DEFAULT '',
contact_time varchar(60) NOT NULL DEFAULT '',
address varchar(190) NOT NULL DEFAULT '',
npa varchar(10) NOT NULL DEFAULT '',
city varchar(100) NOT NULL DEFAULT '',
canton varchar(2) NOT NULL DEFAULT '',
property_type varchar(60) NOT NULL DEFAULT '',
client_type varchar(60) NOT NULL DEFAULT '',
start_wish varchar(60) NOT NULL DEFAULT '',
budget varchar(60) NOT NULL DEFAULT '',
preferred_date date NULL,
owner_id bigint(20) unsigned NOT NULL DEFAULT 0,
priority tinyint(1) NOT NULL DEFAULT 0,
source varchar(100) NOT NULL DEFAULT '',
landing varchar(255) NOT NULL DEFAULT '',
utm text NULL,
device varchar(20) NOT NULL DEFAULT '',
lost_reason varchar(190) NOT NULL DEFAULT '',
accepted_quote_id bigint(20) unsigned NOT NULL DEFAULT 0,
flags text NULL,
consent_at datetime NULL,
first_response_at datetime NULL,
status_changed_at datetime NULL,
created_at datetime NOT NULL,
updated_at datetime NOT NULL,
PRIMARY KEY  (id),
KEY status (status),
KEY email (email),
KEY activity_id (activity_id),
KEY created_at (created_at)
) $c;";

		$sql[] = 'CREATE TABLE ' . self::table( 'artisans' ) . " (
id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
company varchar(190) NOT NULL DEFAULT '',
contact_name varchar(150) NOT NULL DEFAULT '',
email varchar(190) NOT NULL DEFAULT '',
phone varchar(50) NOT NULL DEFAULT '',
address varchar(190) NOT NULL DEFAULT '',
npa varchar(10) NOT NULL DEFAULT '',
city varchar(100) NOT NULL DEFAULT '',
canton varchar(2) NOT NULL DEFAULT '',
ide varchar(30) NOT NULL DEFAULT '',
website varchar(190) NOT NULL DEFAULT '',
cantons varchar(120) NOT NULL DEFAULT '',
npa_ranges text NULL,
status varchar(20) NOT NULL DEFAULT 'candidat',
rating decimal(2,1) NULL,
rc_expiry date NULL,
notes text NULL,
flags text NULL,
created_at datetime NOT NULL,
updated_at datetime NOT NULL,
PRIMARY KEY  (id),
KEY status (status),
KEY email (email)
) $c;";

		$sql[] = 'CREATE TABLE ' . self::table( 'artisan_activity' ) . " (
artisan_id bigint(20) unsigned NOT NULL,
activity_id bigint(20) unsigned NOT NULL,
PRIMARY KEY  (artisan_id,activity_id),
KEY activity_id (activity_id)
) $c;";

		$sql[] = 'CREATE TABLE ' . self::table( 'quotes' ) . " (
id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
request_id bigint(20) unsigned NOT NULL DEFAULT 0,
artisan_id bigint(20) unsigned NOT NULL DEFAULT 0,
status varchar(20) NOT NULL DEFAULT 'attendu',
amount decimal(12,2) NULL,
start_date date NULL,
duration varchar(100) NOT NULL DEFAULT '',
valid_until date NULL,
includes text NULL,
excludes text NULL,
notes text NULL,
token varchar(64) NOT NULL DEFAULT '',
sent_at datetime NULL,
received_at datetime NULL,
decided_at datetime NULL,
reminded_at datetime NULL,
created_at datetime NOT NULL,
updated_at datetime NOT NULL,
PRIMARY KEY  (id),
KEY request_id (request_id),
KEY artisan_id (artisan_id),
KEY token (token),
KEY status (status)
) $c;";

		$sql[] = 'CREATE TABLE ' . self::table( 'events' ) . " (
id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
request_id bigint(20) unsigned NOT NULL DEFAULT 0,
type varchar(20) NOT NULL DEFAULT 'note',
visibility varchar(10) NOT NULL DEFAULT 'internal',
author_type varchar(10) NOT NULL DEFAULT 'admin',
author_id bigint(20) unsigned NOT NULL DEFAULT 0,
author_name varchar(150) NOT NULL DEFAULT '',
content text NULL,
meta longtext NULL,
created_at datetime NOT NULL,
PRIMARY KEY  (id),
KEY request_id (request_id),
KEY created_at (created_at)
) $c;";

		$sql[] = 'CREATE TABLE ' . self::table( 'tasks' ) . " (
id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
request_id bigint(20) unsigned NOT NULL DEFAULT 0,
artisan_id bigint(20) unsigned NOT NULL DEFAULT 0,
title varchar(255) NOT NULL DEFAULT '',
due_at datetime NULL,
owner_id bigint(20) unsigned NOT NULL DEFAULT 0,
source varchar(10) NOT NULL DEFAULT 'manual',
auto_key varchar(80) NOT NULL DEFAULT '',
done_at datetime NULL,
created_at datetime NOT NULL,
PRIMARY KEY  (id),
KEY request_id (request_id),
KEY done_at (done_at),
KEY auto_key (auto_key)
) $c;";

		$sql[] = 'CREATE TABLE ' . self::table( 'files' ) . " (
id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
request_id bigint(20) unsigned NOT NULL DEFAULT 0,
quote_id bigint(20) unsigned NOT NULL DEFAULT 0,
artisan_id bigint(20) unsigned NOT NULL DEFAULT 0,
context varchar(20) NOT NULL DEFAULT 'photo',
path varchar(255) NOT NULL DEFAULT '',
name varchar(190) NOT NULL DEFAULT '',
mime varchar(100) NOT NULL DEFAULT '',
size bigint(20) unsigned NOT NULL DEFAULT 0,
created_at datetime NOT NULL,
PRIMARY KEY  (id),
KEY request_id (request_id),
KEY quote_id (quote_id),
KEY artisan_id (artisan_id)
) $c;";

		$sql[] = 'CREATE TABLE ' . self::table( 'search_log' ) . " (
id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
q varchar(190) NOT NULL DEFAULT '',
norm varchar(190) NOT NULL DEFAULT '',
results int(11) NOT NULL DEFAULT 0,
top_id bigint(20) unsigned NOT NULL DEFAULT 0,
selected_id bigint(20) unsigned NOT NULL DEFAULT 0,
source varchar(20) NOT NULL DEFAULT '',
created_at datetime NOT NULL,
PRIMARY KEY  (id),
KEY norm (norm),
KEY created_at (created_at)
) $c;";

		foreach ( $sql as $statement ) {
			dbDelta( $statement );
		}
	}

	public static function add_roles() {
		$admin = get_role( 'administrator' );
		if ( $admin && ! $admin->has_cap( Util::CAP ) ) {
			$admin->add_cap( Util::CAP );
		}
		if ( ! get_role( 'rn_conseiller' ) ) {
			add_role(
				'rn_conseiller',
				'Conseiller Reno360',
				array(
					'read'         => true,
					'upload_files' => true,
					Util::CAP      => true,
				)
			);
		}
	}

	/**
	 * Pages publiques créées à l'activation (réutilisées si elles existent déjà).
	 *
	 * @return array
	 */
	public static function page_definitions() {
		return array(
			'home'    => array( 'title' => 'Accueil Reno360', 'slug' => 'accueil-reno360', 'content' => '[reno360_home]' ),
			'catalog' => array( 'title' => 'Tous les travaux', 'slug' => 'tous-les-travaux', 'content' => '[reno360_activities]' ),
			'form'    => array( 'title' => 'Demande de devis', 'slug' => 'demande-de-devis', 'content' => '[reno360_request_form]' ),
			'portal'  => array( 'title' => 'Mon espace', 'slug' => 'mon-espace', 'content' => '[reno360_client_portal]' ),
			'artisan' => array( 'title' => 'Espace artisan', 'slug' => 'espace-artisan', 'content' => '[reno360_artisan]' ),
			'partner' => array( 'title' => 'Devenir partenaire', 'slug' => 'devenir-partenaire', 'content' => '[reno360_partner_form]' ),
		);
	}

	public static function create_pages( $force_missing = false ) {
		$pages   = (array) get_option( 'reno360_pages', array() );
		$created = 0;
		foreach ( self::page_definitions() as $key => $def ) {
			$id = isset( $pages[ $key ] ) ? (int) $pages[ $key ] : 0;
			if ( $id && get_post( $id ) && 'trash' !== get_post_status( $id ) ) {
				continue;
			}
			$existing = get_page_by_path( $def['slug'] );
			if ( $existing && ! $force_missing ) {
				$pages[ $key ] = $existing->ID;
				continue;
			}
			$id = wp_insert_post(
				array(
					'post_type'    => 'page',
					'post_status'  => 'publish',
					'post_title'   => $def['title'],
					'post_name'    => $def['slug'],
					'post_content' => $def['content'],
				)
			);
			if ( $id && ! is_wp_error( $id ) ) {
				update_post_meta( $id, '_wp_page_template', Frontend::PAGE_TEMPLATE );
				// Divi : pleine largeur, sans barre latérale ni titre.
				update_post_meta( $id, '_et_pb_page_layout', 'et_full_width_page' );
				update_post_meta( $id, '_et_pb_side_nav', 'off' );
				update_post_meta( $id, '_et_pb_show_title', 'off' );
				$pages[ $key ] = $id;
				++$created;
			}
		}
		update_option( 'reno360_pages', $pages, false );
		return $created;
	}
}
