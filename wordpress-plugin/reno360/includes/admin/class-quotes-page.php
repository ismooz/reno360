<?php
/**
 * Devis : vue transversale de tous les devis.
 *
 * @package Reno360
 */

namespace Reno360\Admin;

use Reno360\Artisans;
use Reno360\Quotes;
use Reno360\Requests;
use Reno360\Util;

defined( 'ABSPATH' ) || exit;

class Quotes_Page {

	public static function render() {
		// phpcs:disable WordPress.Security.NonceVerification
		$status  = isset( $_GET['status'] ) ? sanitize_key( $_GET['status'] ) : '';
		$artisan = isset( $_GET['artisan_id'] ) ? (int) $_GET['artisan_id'] : 0;
		$page    = isset( $_GET['paged'] ) ? max( 1, (int) $_GET['paged'] ) : 1;
		// phpcs:enable
		$res = Quotes::query(
			array(
				'status'     => $status,
				'artisan_id' => $artisan,
				'per_page'   => 30,
				'page'       => $page,
			)
		);
		echo '<div class="wrap rn-wrap">';
		Admin::header( 'Devis', '', 'Tous les devis demandés aux artisans. Ouvrez une demande pour saisir, accepter ou relancer un devis.' );
		$opts = array();
		foreach ( Util::quote_statuses() as $k => $s ) {
			$opts[ $k ] = $s['label'];
		}
		echo '<form method="get" class="rn-filterbar"><input type="hidden" name="page" value="reno360-quotes">';
		echo Admin::select( 'status', $opts, $status, 'aria-label="Statut"', 'Tous les statuts' ); // phpcs:ignore WordPress.Security.EscapeOutput
		echo Admin::select( 'artisan_id', Artisans::options( '' ), (string) $artisan, 'aria-label="Artisan"', 'Tous les artisans' ); // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<button class="button">Filtrer</button></form>';
		echo '<section class="rn-card rn-card--flush"><div class="rn-scroll"><table class="rn-table"><thead><tr><th>Demande</th><th>Artisan</th><th>Statut</th><th>Montant</th><th>Début</th><th>Envoyé</th><th>Reçu</th></tr></thead><tbody>';
		if ( ! $res['items'] ) {
			echo '<tr><td colspan="7" class="rn-muted">Aucun devis.</td></tr>';
		}
		foreach ( $res['items'] as $q ) {
			$r = Requests::get( $q['request_id'] );
			printf(
				'<tr><td>%1$s</td><td>%2$s</td><td>%3$s</td><td><strong>%4$s</strong></td><td>%5$s</td><td class="rn-muted">%6$s</td><td class="rn-muted">%7$s</td></tr>',
				$r ? '<a class="rn-strong" href="' . esc_url( Util::admin_url( 'reno360-requests', array( 'view' => $r['id'] ) ) . '#artisans' ) . '">' . esc_html( $r['ref'] ) . '</a> <span class="rn-muted">' . esc_html( $r['activity_name'] . ' · ' . $r['place'] ) . '</span>' : '—',
				$q['artisan'] ? '<a href="' . esc_url( Util::admin_url( 'reno360-artisans', array( 'edit' => $q['artisan_id'] ) ) ) . '">' . esc_html( $q['company'] ) . '</a>' : esc_html( $q['company'] ),
				Util::quote_badge( $q['status'] ), // phpcs:ignore WordPress.Security.EscapeOutput
				esc_html( Util::chf( $q['amount'] ) ),
				esc_html( Util::date( $q['start_date'] ) ),
				esc_html( Util::date( $q['sent_at'] ) ),
				esc_html( Util::date( $q['received_at'] ) )
			);
		}
		echo '</tbody></table></div></section>';
		$pages = (int) ceil( $res['total'] / 30 );
		if ( $pages > 1 ) {
			echo '<div class="tablenav"><div class="tablenav-pages">' . paginate_links( array( 'base' => add_query_arg( 'paged', '%#%' ), 'format' => '', 'current' => $page, 'total' => $pages ) ) . '</div></div>'; // phpcs:ignore WordPress.Security.EscapeOutput
		}
		echo '</div>';
	}
}
