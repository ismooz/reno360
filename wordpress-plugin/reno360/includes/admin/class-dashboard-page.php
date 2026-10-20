<?php
/**
 * Vue d'ensemble : indicateurs, graphiques, tâches, automatisations, dernières demandes.
 *
 * @package Reno360
 */

namespace Reno360\Admin;

use Reno360\Automations;
use Reno360\Installer;
use Reno360\Requests;
use Reno360\Search;
use Reno360\Tasks;
use Reno360\Util;

defined( 'ABSPATH' ) || exit;

class Dashboard_Page {

	public static function periods() {
		return array(
			'30'  => '30 derniers jours',
			'90'  => '90 derniers jours',
			'365' => '12 derniers mois',
		);
	}

	public static function render() {
		global $wpdb;
		$days   = isset( $_GET['period'] ) ? max( 7, min( 365, (int) $_GET['period'] ) ) : 30; // phpcs:ignore WordPress.Security.NonceVerification
		$since  = gmdate( 'Y-m-d H:i:s', time() - $days * DAY_IN_SECONDS );
		$prev   = gmdate( 'Y-m-d H:i:s', time() - 2 * $days * DAY_IN_SECONDS );
		$t      = Installer::table( 'requests' );
		$q      = Installer::table( 'quotes' );
		$counts = Requests::counts();

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$new      = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $t WHERE created_at >= %s", $since ) );
		$new_prev = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $t WHERE created_at >= %s AND created_at < %s", $prev, $since ) );
		$late     = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $t WHERE status = 'nouvelle' AND created_at <= %s", gmdate( 'Y-m-d H:i:s', time() - (int) \Reno360\Settings::get( 'sla_hours', 24 ) * HOUR_IN_SECONDS ) ) );
		$pairs    = $wpdb->get_results( $wpdb->prepare( "SELECT created_at, first_response_at FROM $t WHERE first_response_at IS NOT NULL AND created_at >= %s LIMIT 2000", $since ), ARRAY_A );
		$avg_resp = null;
		if ( $pairs ) {
			$sum = 0;
			foreach ( $pairs as $p ) {
				$sum += max( 0, strtotime( $p['first_response_at'] ) - strtotime( $p['created_at'] ) ) / 60;
			}
			$avg_resp = $sum / count( $pairs );
		}
		$qualif   = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $t WHERE created_at >= %s AND status NOT IN ('nouvelle','perdue')", $since ) );
		$won      = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $t WHERE created_at >= %s AND status IN ('acceptee','travaux','terminee')", $since ) );
		$won_val  = (float) $wpdb->get_var( $wpdb->prepare( "SELECT SUM(amount) FROM $q WHERE status = 'accepte' AND decided_at >= %s", $since ) );
		$won_nb   = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $q WHERE status = 'accepte' AND decided_at >= %s", $since ) );
		$by_act   = $wpdb->get_results( $wpdb->prepare( "SELECT activity_name AS label, COUNT(*) AS n FROM $t WHERE created_at >= %s GROUP BY activity_name ORDER BY n DESC LIMIT 7", $since ), ARRAY_A );
		$by_cant  = $wpdb->get_results( $wpdb->prepare( "SELECT canton AS label, COUNT(*) AS n FROM $t WHERE created_at >= %s AND canton <> '' GROUP BY canton ORDER BY n DESC LIMIT 8", $since ), ARRAY_A );
		$by_src   = $wpdb->get_results( $wpdb->prepare( "SELECT source AS label, COUNT(*) AS n FROM $t WHERE created_at >= %s AND source <> '' GROUP BY source ORDER BY n DESC LIMIT 6", $since ), ARRAY_A );
		// phpcs:enable

		// Demandes par semaine (12 dernières semaines).
		$weeks = array();
		for ( $i = 11; $i >= 0; $i-- ) {
			$start   = strtotime( 'monday this week', time() ) - $i * WEEK_IN_SECONDS;
			$weeks[] = array(
				'label' => 'S' . gmdate( 'W', $start ),
				'from'  => gmdate( 'Y-m-d 00:00:00', $start ),
				'to'    => gmdate( 'Y-m-d 00:00:00', $start + WEEK_IN_SECONDS ),
				'n'     => 0,
			);
		}
		foreach ( $weeks as &$w ) {
			$w['n'] = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $t WHERE created_at >= %s AND created_at < %s", $w['from'], $w['to'] ) ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		}
		unset( $w );
		$max_w = max( 1, max( wp_list_pluck( $weeks, 'n' ) ) );
		$scale = max( 4, (int) ( ceil( $max_w / 4 ) * 4 ) );

		$delta     = $new_prev ? round( ( $new - $new_prev ) / $new_prev * 100 ) : null;
		$rate      = $qualif ? round( $won / $qualif * 100 ) : 0;
		$resp_text = null === $avg_resp ? '—' : ( $avg_resp < 60 ? round( $avg_resp ) . ' min' : floor( $avg_resp / 60 ) . ' h ' . str_pad( (string) round( fmod( $avg_resp, 60 ) ), 2, '0', STR_PAD_LEFT ) );
		$todo      = $counts['nouvelle'] + $counts['qualifiee'];
		$tasks     = Tasks::query(
			array(
				'due_before' => gmdate( 'Y-m-d 23:59:59', time() + DAY_IN_SECONDS ),
				'limit'      => 8,
			)
		);
		$recent    = Requests::query( array( 'per_page' => 8 ) )['items'];
		$sstats    = Search::stats( $days );

		echo '<div class="wrap rn-wrap">';
		Admin::header(
			'Vue d’ensemble',
			'<form method="get" class="rn-inline"><input type="hidden" name="page" value="reno360"><label class="rn-inline-label">Période ' . Admin::select( 'period', self::periods(), (string) $days, 'onchange="this.form.submit()"' ) . '</label></form>'
			. '<a class="button" href="' . esc_url( Admin::action_url( 'rn_requests_export' ) ) . '">Exporter</a>'
			. '<a class="button button-primary" href="' . esc_url( Util::admin_url( 'reno360-requests', array( 'new' => 1 ) ) ) . '">+ Saisir une demande</a>',
			wp_date( 'l j F Y' ) . ' · ' . sprintf( _n( '%d demande attend une action', '%d demandes attendent une action', $todo, 'reno360' ), $todo )
		);

		$kpis = array(
			array( 'Nouvelles demandes', $new, null === $delta ? 'Période précédente : ' . $new_prev : ( $delta >= 0 ? '+' : '' ) . $delta . ' % vs période précédente', null !== $delta && $delta < 0 ? 'down' : 'up' ),
			array( 'À traiter', $todo, $late ? $late . ' hors délai (> ' . (int) \Reno360\Settings::get( 'sla_hours', 24 ) . ' h)' : 'Aucune hors délai', $late ? 'bad' : '' ),
			array( 'Délai de 1re réponse', $resp_text, 'Moyenne sur la période', '' ),
			array( 'Taux de signature', $rate . ' %', 'Devis acceptés / demandes qualifiées', '' ),
			array( 'Devis acceptés', Util::chf( $won_val ), $won_nb . ' chantier(s) signé(s)', '' ),
		);
		echo '<div class="rn-kpis">';
		foreach ( $kpis as $k ) {
			printf( '<div class="rn-card rn-kpi"><span class="rn-kpi__label">%s</span><span class="rn-kpi__value">%s</span><span class="rn-kpi__note %s">%s</span></div>', esc_html( $k[0] ), esc_html( $k[1] ), esc_attr( $k[3] ), esc_html( $k[2] ) );
		}
		echo '</div>';

		echo '<div class="rn-cols">';
		// Graphique hebdomadaire.
		echo '<section class="rn-card rn-col-main"><div class="rn-card__head"><h2>Demandes reçues par semaine</h2></div>';
		echo '<div class="rn-chart" role="img" aria-label="Demandes reçues par semaine sur 12 semaines">';
		echo '<div class="rn-chart__grid">';
		foreach ( array( 1, 0.75, 0.5, 0.25, 0 ) as $f ) {
			printf( '<span style="bottom:%s%%"><em>%d</em></span>', esc_attr( (string) ( $f * 100 ) ), (int) round( $scale * $f ) );
		}
		echo '</div><div class="rn-chart__bars">';
		foreach ( $weeks as $i => $w ) {
			printf(
				'<div class="rn-chart__col" title="%1$s"><span class="rn-chart__val">%2$s</span><span class="rn-chart__bar" style="height:%3$s%%"></span><span class="rn-chart__x">%4$s</span></div>',
				esc_attr( 'Semaine ' . substr( $w['label'], 1 ) . ' : ' . $w['n'] . ' demande(s)' ),
				11 === $i || $w['n'] === $max_w ? (int) $w['n'] : '',
				esc_attr( (string) round( $w['n'] / $scale * 100, 2 ) ),
				esc_html( $w['label'] )
			);
		}
		echo '</div></div>';
		echo '<details class="rn-table-toggle"><summary>Voir les données</summary><table class="widefat striped"><thead><tr><th>Semaine</th><th>Demandes</th></tr></thead><tbody>';
		foreach ( $weeks as $w ) {
			echo '<tr><td>' . esc_html( $w['label'] ) . '</td><td>' . (int) $w['n'] . '</td></tr>';
		}
		echo '</tbody></table></details></section>';

		// Entonnoir.
		$funnel = array(
			array( 'Reçues', $new ),
			array( 'Qualifiées ou plus', $qualif ),
			array( 'Envoyées aux artisans', (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(DISTINCT r.id) FROM $t r INNER JOIN $q q ON q.request_id = r.id WHERE r.created_at >= %s", $since ) ) ), // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			array( 'Avec devis reçus', (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(DISTINCT r.id) FROM $t r INNER JOIN $q q ON q.request_id = r.id AND q.status IN ('recu','accepte','refuse') WHERE r.created_at >= %s", $since ) ) ), // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			array( 'Acceptées', $won ),
		);
		echo '<section class="rn-card rn-col-side"><div class="rn-card__head"><h2>Conversion sur la période</h2></div><div class="rn-bars">';
		foreach ( $funnel as $f ) {
			$pct = $new ? round( $f[1] / $new * 100 ) : 0;
			printf( '<div class="rn-bar" title="%1$s"><div class="rn-bar__top"><span>%2$s</span><span><strong>%3$d</strong> · %4$d %%</span></div><div class="rn-bar__track"><span style="width:%4$d%%"></span></div></div>', esc_attr( $f[0] . ' : ' . $f[1] ), esc_html( $f[0] ), (int) $f[1], (int) $pct );
		}
		echo '</div></section></div>';

		echo '<div class="rn-cols">';
		// Tâches.
		echo '<section class="rn-card rn-col-main rn-card--flush"><div class="rn-card__head"><h2>À faire aujourd’hui</h2><span class="rn-muted">' . count( $tasks ) . ' tâche(s)</span></div>';
		self::tasks_list( $tasks );
		echo '</section>';

		// Automatisations.
		echo '<section class="rn-card rn-col-side"><div class="rn-card__head"><h2>Automatisations</h2><a href="' . esc_url( Util::admin_url( 'reno360-settings', array( 'tab' => 'automations' ) ) ) . '">Gérer</a></div><ul class="rn-autos">';
		foreach ( Automations::describe() as $a ) {
			printf( '<li><span><strong>%s</strong><small>%s</small></span><span class="rn-switch %s" aria-label="%s"></span></li>', esc_html( $a['name'] ), esc_html( $a['when'] ), $a['enabled'] ? 'is-on' : '', $a['enabled'] ? 'Active' : 'Inactive' );
		}
		echo '</ul></section></div>';

		echo '<div class="rn-cols">';
		echo '<section class="rn-card rn-col-main rn-card--flush"><div class="rn-card__head"><h2>Dernières demandes</h2><a href="' . esc_url( Util::admin_url( 'reno360-requests' ) ) . '">Toutes les demandes</a></div>';
		echo '<div class="rn-scroll"><table class="rn-table"><thead><tr><th>N°</th><th>Client</th><th>Travaux</th><th>Lieu</th><th>Statut</th><th>Reçue</th></tr></thead><tbody>';
		if ( ! $recent ) {
			echo '<tr><td colspan="6" class="rn-muted">Aucune demande pour l’instant. Elles apparaîtront ici dès le premier envoi du formulaire.</td></tr>';
		}
		foreach ( $recent as $r ) {
			printf(
				'<tr><td><a class="rn-strong" href="%1$s">%2$s</a></td><td>%3$s</td><td>%4$s</td><td class="rn-muted">%5$s</td><td>%6$s</td><td class="rn-muted rn-nowrap">%7$s</td></tr>',
				esc_url( Util::admin_url( 'reno360-requests', array( 'view' => $r['id'] ) ) ),
				esc_html( $r['ref'] ),
				esc_html( $r['name'] ),
				esc_html( $r['activity_name'] ),
				esc_html( $r['place'] ),
				Util::status_badge( $r['status'] ), // phpcs:ignore WordPress.Security.EscapeOutput
				esc_html( Util::ago( $r['created_at'] ) )
			);
		}
		echo '</tbody></table></div></section>';

		echo '<section class="rn-card rn-col-side"><div class="rn-card__head"><h2>Par type de travaux</h2></div>';
		self::bar_list( $by_act );
		echo '<div class="rn-card__head rn-mt"><h2>Par canton</h2></div><div class="rn-pills-admin">';
		foreach ( $by_cant as $c ) {
			echo '<span><strong>' . esc_html( $c['label'] ) . '</strong> ' . (int) $c['n'] . '</span>';
		}
		echo '</div>';
		if ( $by_src ) {
			echo '<div class="rn-card__head rn-mt"><h2>Provenance</h2></div>';
			self::bar_list( $by_src );
		}
		echo '<div class="rn-card__head rn-mt"><h2>Recherche</h2><a href="' . esc_url( Util::admin_url( 'reno360-search' ) ) . '">Analyser</a></div>';
		printf( '<p class="rn-muted">%d recherche(s) · %d sans résultat · %d ont mené à un choix.</p>', (int) $sstats['total'], (int) $sstats['empty'], (int) $sstats['picked'] );
		echo '</section></div>';
		echo '</div>';
	}

	public static function bar_list( array $rows ) {
		if ( ! $rows ) {
			echo '<p class="rn-muted">Pas encore de données.</p>';
			return;
		}
		$max = max( 1, max( array_map( 'intval', wp_list_pluck( $rows, 'n' ) ) ) );
		echo '<div class="rn-barlist">';
		foreach ( $rows as $r ) {
			printf( '<div title="%1$s"><span class="rn-barlist__label">%2$s</span><span class="rn-barlist__track"><span style="width:%3$d%%"></span></span><strong>%4$d</strong></div>', esc_attr( $r['label'] . ' : ' . $r['n'] ), esc_html( $r['label'] ? $r['label'] : '—' ), (int) round( $r['n'] / $max * 100 ), (int) $r['n'] );
		}
		echo '</div>';
	}

	public static function tasks_list( array $tasks, $show_request = true ) {
		if ( ! $tasks ) {
			echo '<p class="rn-empty-line">Rien à faire pour l’instant.</p>';
			return;
		}
		echo '<ul class="rn-tasks">';
		foreach ( $tasks as $task ) {
			$done    = ! empty( $task['done_at'] );
			$overdue = ! $done && $task['due_at'] && strtotime( $task['due_at'] . ' UTC' ) < strtotime( 'today' );
			$due     = $task['due_at'] ? ( $overdue ? 'En retard' : ( wp_date( 'Y-m-d', strtotime( $task['due_at'] . ' UTC' ) ) === wp_date( 'Y-m-d' ) ? 'Aujourd’hui' : Util::date( $task['due_at'] ) ) ) : '';
			echo '<li class="' . ( $done ? 'is-done' : '' ) . '">';
			echo '<a class="rn-check-btn' . ( $done ? ' is-checked' : '' ) . '" href="' . esc_url( Admin::action_url( 'rn_task_toggle', array( 'id' => $task['id'] ) ) ) . '" aria-label="' . esc_attr( $done ? 'Marquer comme à faire' : 'Marquer comme fait' ) . '">' . ( $done ? Admin::icon( 'check', 14 ) : '' ) . '</a>'; // phpcs:ignore WordPress.Security.EscapeOutput
			echo '<span class="rn-tasks__text"><strong>' . esc_html( $task['title'] ) . '</strong>';
			if ( $show_request && ! empty( $task['ref'] ) ) {
				echo '<small><a href="' . esc_url( Util::admin_url( 'reno360-requests', array( 'view' => $task['request_id'] ) ) ) . '">' . esc_html( $task['ref'] ) . '</a> · ' . esc_html( trim( $task['first_name'] . ' ' . $task['last_name'] ) . ' · ' . $task['activity_name'] ) . '</small>';
			} elseif ( $task['source'] === 'auto' ) {
				echo '<small>Créée automatiquement</small>';
			}
			echo '</span>';
			if ( $due && ! $done ) {
				echo '<span class="rn-badge ' . ( $overdue ? 'rn-badge--red' : 'rn-badge--amber' ) . '">' . esc_html( $due ) . '</span>';
			}
			echo '<a class="rn-icon-btn" href="' . esc_url( Admin::action_url( 'rn_task_delete', array( 'id' => $task['id'] ) ) ) . '" aria-label="Supprimer la tâche" data-rn-confirm="Supprimer cette tâche ?">' . Admin::icon( 'x', 14 ) . '</a>'; // phpcs:ignore WordPress.Security.EscapeOutput
			echo '</li>';
		}
		echo '</ul>';
	}
}
