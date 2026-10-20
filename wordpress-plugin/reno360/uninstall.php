<?php
/**
 * Désinstallation : supprime les données uniquement si l'option a été cochée
 * (Réglages → Données → « Supprimer toutes les données… »).
 *
 * @package Reno360
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

$reno360_settings = get_option( 'reno360_settings', array() );
if ( empty( $reno360_settings['delete_on_uninstall'] ) ) {
	return;
}

global $wpdb;

foreach ( array( 'requests', 'artisans', 'artisan_activity', 'quotes', 'events', 'tasks', 'files', 'search_log' ) as $reno360_table ) {
	$wpdb->query( 'DROP TABLE IF EXISTS ' . $wpdb->prefix . 'rn_' . $reno360_table ); // phpcs:ignore WordPress.DB.PreparedSQL
}

$reno360_posts = get_posts(
	array(
		'post_type'      => 'rn_travail',
		'post_status'    => 'any',
		'posts_per_page' => -1,
		'fields'         => 'ids',
	)
);
foreach ( $reno360_posts as $reno360_id ) {
	wp_delete_post( $reno360_id, true );
}
$reno360_terms = get_terms(
	array(
		'taxonomy'   => 'rn_categorie',
		'hide_empty' => false,
		'fields'     => 'ids',
	)
);
if ( ! is_wp_error( $reno360_terms ) ) {
	foreach ( $reno360_terms as $reno360_term ) {
		wp_delete_term( $reno360_term, 'rn_categorie' );
	}
}

foreach ( array( 'reno360_settings', 'reno360_pages', 'reno360_db_version', 'reno360_version', 'reno360_seeded', 'reno360_search_index' ) as $reno360_option ) {
	delete_option( $reno360_option );
}

$reno360_upload = wp_upload_dir( null, false );
$reno360_dir    = trailingslashit( $reno360_upload['basedir'] ) . 'reno360-private';
if ( is_dir( $reno360_dir ) ) {
	$reno360_it = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $reno360_dir, FilesystemIterator::SKIP_DOTS ), RecursiveIteratorIterator::CHILD_FIRST );
	foreach ( $reno360_it as $reno360_file ) {
		$reno360_file->isDir() ? rmdir( $reno360_file->getPathname() ) : unlink( $reno360_file->getPathname() ); // phpcs:ignore WordPress.WP.AlternativeFunctions
	}
	rmdir( $reno360_dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions
}

remove_role( 'rn_conseiller' );
$reno360_admin = get_role( 'administrator' );
if ( $reno360_admin ) {
	$reno360_admin->remove_cap( 'manage_reno360' );
}
wp_clear_scheduled_hook( 'reno360_cron' );
