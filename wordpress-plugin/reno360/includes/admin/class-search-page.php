<?php
/**
 * Analyse des recherches : ce que tapent les visiteurs, ce qui ne donne rien, ajout de mots-clés en un clic.
 *
 * @package Reno360
 */

namespace Reno360\Admin;

use Reno360\Activities;
use Reno360\Search;
use Reno360\Settings;
use Reno360\Util;

defined( 'ABSPATH' ) || exit;

class Search_Page {

	public static function render() {
		$days  = isset( $_GET['period'] ) ? max( 1, min( 365, (int) $_GET['period'] ) ) : 30; // phpcs:ignore WordPress.Security.NonceVerification
		$stats = Search::stats( $days );
		$empty = Search::top_queries( $days, 50, true );
		$top   = Search::top_queries( $days, 50, false );
		$acts  = array();
		foreach ( Activities::all() as $a ) {
			$acts[ $a['id'] ] = $a['name'];
		}
		asort( $acts );

		echo '<div class="wrap rn-wrap">';
		Admin::header(
			'Analyse des recherches',
			'<form method="get" class="rn-inline"><input type="hidden" name="page" value="reno360-search"><label class="rn-inline-label">Période ' . Admin::select( 'period', Dashboard_Page::periods() + array( '7' => '7 derniers jours' ), (string) $days, 'onchange="this.form.submit()"' ) . '</label></form>'
			. '<a class="button" href="' . esc_url( Admin::action_url( 'rn_search_clear' ) ) . '" data-rn-confirm="Vider tout le journal des recherches ?">Vider le journal</a>',
			sprintf( 'Le journal ne contient aucune donnée personnelle (ni adresse IP, ni identité) et est conservé %d jours.', (int) Settings::get( 'search_log_days', 180 ) )
		);

		$rate = $stats['total'] ? round( ( $stats['total'] - $stats['empty'] ) / $stats['total'] * 100 ) : 0;
		echo '<div class="rn-kpis">';
		printf( '<div class="rn-card rn-kpi"><span class="rn-kpi__label">Recherches</span><span class="rn-kpi__value">%d</span><span class="rn-kpi__note">%d expressions différentes</span></div>', (int) $stats['total'], (int) $stats['uniques'] );
		printf( '<div class="rn-card rn-kpi"><span class="rn-kpi__label">Avec résultats</span><span class="rn-kpi__value">%d %%</span><span class="rn-kpi__note">Objectif : plus de 95 %%</span></div>', (int) $rate );
		printf( '<div class="rn-card rn-kpi"><span class="rn-kpi__label">Sans résultat</span><span class="rn-kpi__value">%d</span><span class="rn-kpi__note %s">À traiter ci-dessous</span></div>', (int) $stats['empty'], $stats['empty'] ? 'bad' : '' );
		printf( '<div class="rn-card rn-kpi"><span class="rn-kpi__label">Suivies d’un choix</span><span class="rn-kpi__value">%d</span><span class="rn-kpi__note">Le visiteur a cliqué un résultat</span></div>', (int) $stats['picked'] );
		echo '</div>';

		echo '<div class="rn-cols rn-cols--top">';
		echo '<section class="rn-card rn-col-main rn-card--flush"><div class="rn-card__head rn-pad"><h2>Recherches sans résultat</h2><span class="rn-muted">Ajoutez le terme comme mot-clé du bon travail</span></div>';
		echo '<div class="rn-scroll"><table class="rn-table"><thead><tr><th>Recherche</th><th>Fois</th><th>Dernière</th><th>Ajouter comme mot-clé à…</th><th></th></tr></thead><tbody>';
		if ( ! $empty ) {
			echo '<tr><td colspan="5" class="rn-muted">Aucune recherche sans résultat sur la période.</td></tr>';
		}
		foreach ( $empty as $row ) {
			$guess = Search::query( $row['q'], 1 )['results'];
			echo '<tr><td><strong>' . esc_html( $row['q'] ) . '</strong></td><td>' . (int) $row['hits'] . '</td><td class="rn-muted rn-nowrap">' . esc_html( Util::ago( $row['last_at'] ) ) . '</td><td>';
			Admin::form_open( 'rn_keyword_add', array( 'keyword' => $row['q'] ), 'class="rn-inline"' );
			echo Admin::select( 'activity_id', $acts, $guess ? (string) $guess[0]['id'] : '', 'aria-label="Type de travaux" required', 'Choisir…' ); // phpcs:ignore WordPress.Security.EscapeOutput
			echo ' <button class="button button-small button-primary">Ajouter</button></form>';
			if ( $guess ) {
				echo '<small class="rn-muted">Aujourd’hui, la recherche propose : ' . esc_html( $guess[0]['name'] ) . '</small>';
			}
			echo '</td><td><a class="button-link" href="' . esc_url( Admin::action_url( 'rn_search_ignore', array( 'norm' => $row['norm'] ) ) ) . '">Ignorer</a></td></tr>';
		}
		echo '</tbody></table></div></section>';

		echo '<section class="rn-card rn-col-side rn-tester" data-rn-tester><div class="rn-card__head"><h2>Tester la recherche</h2></div>';
		echo '<input type="search" class="rn-full" placeholder="Tapez comme un client…" data-rn-tester-input aria-label="Tester la recherche">';
		echo '<ol class="rn-tester__results" data-rn-tester-results></ol>';
		echo '<p class="rn-muted rn-small">Score = pertinence calculée (nom, mots-clés, catégorie, description, fautes de frappe, expressions). Utilisez la « priorité dans la recherche » d’un travail pour départager.</p></section>';
		echo '</div>';

		echo '<section class="rn-card rn-card--flush"><div class="rn-card__head rn-pad"><h2>Recherches les plus fréquentes</h2></div>';
		echo '<div class="rn-scroll"><table class="rn-table"><thead><tr><th>Recherche</th><th>Fois</th><th>Résultat proposé en premier</th><th>Choisi par le visiteur</th><th>Dernière</th></tr></thead><tbody>';
		if ( ! $top ) {
			echo '<tr><td colspan="5" class="rn-muted">Pas encore de recherches enregistrées.</td></tr>';
		}
		foreach ( $top as $row ) {
			$top_name = $row['top_id'] && isset( $acts[ $row['top_id'] ] ) ? $acts[ $row['top_id'] ] : '—';
			$sel_name = $row['selected_id'] && isset( $acts[ $row['selected_id'] ] ) ? $acts[ $row['selected_id'] ] : '—';
			printf(
				'<tr><td><strong>%1$s</strong></td><td>%2$d</td><td>%3$s</td><td>%4$s</td><td class="rn-muted rn-nowrap">%5$s</td></tr>',
				esc_html( $row['q'] ),
				(int) $row['hits'],
				0 === (int) $row['results'] ? '<span class="rn-badge rn-badge--red">Aucun résultat</span>' : esc_html( $top_name ),
				esc_html( $sel_name ),
				esc_html( Util::ago( $row['last_at'] ) )
			);
		}
		echo '</tbody></table></div></section>';
		echo '</div>';
	}
}
