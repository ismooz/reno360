<?php
/**
 * Clients : regroupement des demandes par adresse e-mail, accès à l'espace, effacement (nLPD).
 *
 * @package Reno360
 */

namespace Reno360\Admin;

use Reno360\Installer;
use Reno360\Portal;
use Reno360\Util;

defined( 'ABSPATH' ) || exit;

class Clients_Page {

	public static function render() {
		global $wpdb;
		$t      = Installer::table( 'requests' );
		$search = isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		$page   = isset( $_GET['paged'] ) ? max( 1, (int) $_GET['paged'] ) : 1; // phpcs:ignore WordPress.Security.NonceVerification
		$per    = 40;
		$where  = "email <> ''";
		$params = array();
		if ( '' !== $search ) {
			$like   = '%' . $wpdb->esc_like( $search ) . '%';
			$where .= ' AND (email LIKE %s OR first_name LIKE %s OR last_name LIKE %s OR phone LIKE %s OR city LIKE %s)';
			$params = array_fill( 0, 5, $like );
		}
		// phpcs:disable WordPress.DB.PreparedSQL
		$count_sql = "SELECT COUNT(DISTINCT email) FROM $t WHERE $where";
		$total     = (int) ( $params ? $wpdb->get_var( $wpdb->prepare( $count_sql, $params ) ) : $wpdb->get_var( $count_sql ) );
		$sql       = "SELECT email, MAX(first_name) AS first_name, MAX(last_name) AS last_name, MAX(phone) AS phone, MAX(city) AS city, COUNT(*) AS n,
			SUM(CASE WHEN status IN ('acceptee','travaux','terminee') THEN 1 ELSE 0 END) AS won, MAX(created_at) AS last_at
			FROM $t WHERE $where GROUP BY email ORDER BY last_at DESC LIMIT %d OFFSET %d";
		$rows      = $wpdb->get_results( $wpdb->prepare( $sql, array_merge( $params, array( $per, ( $page - 1 ) * $per ) ) ), ARRAY_A );
		// phpcs:enable

		echo '<div class="wrap rn-wrap">';
		Admin::header( 'Clients', '', 'Les clients n’ont pas de mot de passe : ils accèdent à leur espace par un lien personnel envoyé par e-mail.' );
		echo '<form method="get" class="rn-filterbar"><input type="hidden" name="page" value="reno360-clients"><input type="search" name="s" value="' . esc_attr( $search ) . '" class="rn-search-input" placeholder="Nom, e-mail, téléphone, localité…" aria-label="Rechercher un client"><button class="button">Rechercher</button></form>';
		echo '<section class="rn-card rn-card--flush"><div class="rn-scroll"><table class="rn-table"><thead><tr><th>Client</th><th>Téléphone</th><th>Localité</th><th>Demandes</th><th>Signées</th><th>Dernière</th><th>Actions</th></tr></thead><tbody>';
		if ( ! $rows ) {
			echo '<tr><td colspan="7" class="rn-muted">Aucun client.</td></tr>';
		}
		foreach ( (array) $rows as $c ) {
			$name = trim( $c['first_name'] . ' ' . $c['last_name'] );
			echo '<tr><td><strong>' . esc_html( $name ) . '</strong><br><a href="mailto:' . esc_attr( $c['email'] ) . '">' . esc_html( $c['email'] ) . '</a></td>';
			echo '<td>' . esc_html( $c['phone'] ) . '</td><td>' . esc_html( $c['city'] ) . '</td>';
			echo '<td><a href="' . esc_url( Util::admin_url( 'reno360-requests', array( 'email' => $c['email'], 'mode' => 'list' ) ) ) . '">' . (int) $c['n'] . '</a></td><td>' . (int) $c['won'] . '</td>';
			echo '<td class="rn-muted">' . esc_html( Util::ago( $c['last_at'] ) ) . '</td><td class="rn-nowrap">';
			echo '<a class="button button-small" href="' . esc_url( Admin::action_url( 'rn_client_link', array( 'email' => $c['email'] ) ) ) . '">Envoyer le lien d’accès</a> ';
			echo '<a class="button button-small" href="' . esc_url( Portal::link( $c['email'] ) ) . '" target="_blank" rel="noopener">Voir son espace</a> ';
			echo '<a class="button-link rn-danger" href="' . esc_url( Admin::action_url( 'rn_client_erase', array( 'email' => $c['email'] ) ) ) . '" data-rn-confirm="Effacer définitivement toutes les données de ce client (demandes, fichiers, historique) ? Cette action est irréversible.">Effacer ses données</a>';
			echo '</td></tr>';
		}
		echo '</tbody></table></div></section>';
		$pages = (int) ceil( $total / $per );
		if ( $pages > 1 ) {
			echo '<div class="tablenav"><div class="tablenav-pages">' . paginate_links( array( 'base' => add_query_arg( 'paged', '%#%' ), 'format' => '', 'current' => $page, 'total' => $pages ) ) . '</div></div>'; // phpcs:ignore WordPress.Security.EscapeOutput
		}
		echo '</div>';
	}
}
