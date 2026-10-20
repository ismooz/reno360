<?php
/**
 * Artisans partenaires : liste, validation des candidatures, fiche complète.
 *
 * @package Reno360
 */

namespace Reno360\Admin;

use Reno360\Activities;
use Reno360\Artisans;
use Reno360\Files;
use Reno360\Quotes;
use Reno360\Settings;
use Reno360\Util;

defined( 'ABSPATH' ) || exit;

class Artisans_Page {

	public static function render() {
		// phpcs:disable WordPress.Security.NonceVerification
		if ( isset( $_GET['edit'] ) || isset( $_GET['new'] ) ) {
			self::render_edit( isset( $_GET['edit'] ) ? (int) $_GET['edit'] : 0 );
			return;
		}
		$status = isset( $_GET['status'] ) ? sanitize_key( $_GET['status'] ) : 'actif';
		$args   = array(
			'status'      => 'all' === $status ? '' : $status,
			'activity_id' => isset( $_GET['activity_id'] ) ? (int) $_GET['activity_id'] : 0,
			'canton'      => isset( $_GET['canton'] ) ? sanitize_key( $_GET['canton'] ) : '',
			'docs'        => isset( $_GET['docs'] ) ? sanitize_key( $_GET['docs'] ) : '',
			'search'      => isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : '',
			'per_page'    => 30,
			'page'        => isset( $_GET['paged'] ) ? max( 1, (int) $_GET['paged'] ) : 1,
		);
		// phpcs:enable
		$counts = Artisans::counts();
		$res    = Artisans::query( $args );

		echo '<div class="wrap rn-wrap">';
		Admin::header(
			'Artisans partenaires',
			'<a class="button" href="' . esc_url( Admin::action_url( 'rn_artisans_export' ) ) . '">Exporter CSV</a> <a class="button button-primary" href="' . esc_url( Util::admin_url( 'reno360-artisans', array( 'new' => 1 ) ) ) . '">+ Ajouter un artisan</a>',
			'Formulaire de candidature public : <a href="' . esc_url( Settings::page_url( 'partner' ) ) . '" target="_blank" rel="noopener">' . esc_html( Settings::page_url( 'partner' ) ) . '</a>'
		);

		// Candidatures à valider.
		if ( $counts['candidat'] && 'candidat' !== $status ) {
			$pending = Artisans::query(
				array(
					'status'   => 'candidat',
					'per_page' => 3,
				)
			)['items'];
			foreach ( $pending as $a ) {
				$docs = Files::query( array( 'artisan_id' => $a['id'] ) );
				echo '<section class="rn-card rn-validate"><div><span class="rn-badge rn-badge--amber">À valider</span><h2>' . esc_html( $a['company'] ) . '</h2><p class="rn-muted">' . esc_html( implode( ' · ', array_filter( array( implode( ', ', $a['trade_names'] ), trim( $a['npa'] . ' ' . $a['city'] ), $a['cantons'] ? 'Cantons : ' . implode( ', ', $a['cantons'] ) : '' ) ) ) ) . '</p><p class="rn-muted rn-small">Candidature du ' . esc_html( Util::date( $a['created_at'] ) ) . ' · ' . esc_html( $a['contact_name'] . ' · ' . $a['email'] . ' · ' . $a['phone'] ) . '</p></div>';
				echo '<ul class="rn-checklist">';
				echo '<li class="' . ( $a['ide'] ? 'ok' : 'todo' ) . '">' . ( $a['ide'] ? 'N° IDE : ' . esc_html( $a['ide'] ) . ' — <a href="https://www.zefix.ch/fr/search/entity/list?name=' . rawurlencode( $a['ide'] ) . '" target="_blank" rel="noopener">vérifier sur Zefix</a>' : 'N° IDE manquant' ) . '</li>';
				echo '<li class="' . ( $docs ? 'ok' : 'todo' ) . '">' . ( $docs ? count( $docs ) . ' document(s) joint(s)' : 'Aucun document (RC Pro, registre)' ) . '</li>';
				echo '<li class="' . ( $a['rc_expiry'] ? 'ok' : 'todo' ) . '">' . ( $a['rc_expiry'] ? 'RC Pro valable jusqu’au ' . esc_html( Util::date( $a['rc_expiry'] ) ) : 'Échéance RC Pro à saisir' ) . '</li>';
				echo '</ul><div class="rn-validate__actions">';
				echo '<a class="button button-primary" href="' . esc_url( Admin::action_url( 'rn_artisan_status', array( 'id' => $a['id'], 'status' => 'actif' ) ) ) . '" data-rn-confirm="Valider ce partenaire ? Un e-mail de bienvenue lui sera envoyé.">Valider le partenaire</a>';
				echo '<a class="button" href="' . esc_url( Util::admin_url( 'reno360-artisans', array( 'edit' => $a['id'] ) ) ) . '">Examiner la fiche</a>';
				echo '<a class="button-link rn-danger" href="' . esc_url( Admin::action_url( 'rn_artisan_status', array( 'id' => $a['id'], 'status' => 'suspendu' ) ) ) . '">Refuser</a>';
				echo '</div></section>';
			}
		}

		echo '<ul class="subsubsub">';
		$tabs = array(
			'actif'    => 'Actifs',
			'candidat' => 'En validation',
			'suspendu' => 'Suspendus',
			'all'      => 'Tous',
		);
		$links = array();
		foreach ( $tabs as $k => $label ) {
			$n       = 'all' === $k ? array_sum( $counts ) : $counts[ $k ];
			$links[] = '<li><a href="' . esc_url( Util::admin_url( 'reno360-artisans', array( 'status' => $k ) ) ) . '"' . ( $status === $k ? ' class="current"' : '' ) . '>' . esc_html( $label ) . ' <span class="count">(' . (int) $n . ')</span></a>';
		}
		echo implode( ' |</li>', $links ) . '</li></ul>'; // phpcs:ignore WordPress.Security.EscapeOutput

		$acts = array();
		foreach ( Activities::all() as $a ) {
			$acts[ $a['id'] ] = $a['name'];
		}
		asort( $acts );
		$cantons = array();
		foreach ( (array) Settings::get( 'cantons', array() ) as $c ) {
			$cantons[ $c ] = Util::cantons()[ $c ];
		}
		echo '<form method="get" class="rn-filterbar"><input type="hidden" name="page" value="reno360-artisans"><input type="hidden" name="status" value="' . esc_attr( $status ) . '">';
		echo '<input type="search" name="s" value="' . esc_attr( $args['search'] ) . '" placeholder="Entreprise, IDE, localité…" class="rn-search-input" aria-label="Rechercher un artisan">';
		echo Admin::select( 'activity_id', $acts, (string) $args['activity_id'], 'aria-label="Métier"', 'Tous les métiers' ); // phpcs:ignore WordPress.Security.EscapeOutput
		echo Admin::select( 'canton', $cantons, strtoupper( $args['canton'] ), 'aria-label="Canton"', 'Tous les cantons' ); // phpcs:ignore WordPress.Security.EscapeOutput
		echo Admin::select( 'docs', array( 'expiring' => 'RC Pro à renouveler (30 j)', 'missing' => 'Échéance RC Pro manquante' ), $args['docs'], 'aria-label="Documents"', 'Tous les documents' ); // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<button class="button">Filtrer</button></form>';

		echo '<section class="rn-card rn-card--flush"><div class="rn-scroll"><table class="rn-table"><thead><tr><th>Entreprise</th><th>Métiers</th><th>Zone</th><th>Note</th><th>Réponse</th><th>Consultés / signés (12 m)</th><th>RC Pro</th><th>Statut</th></tr></thead><tbody>';
		if ( ! $res['items'] ) {
			echo '<tr><td colspan="8" class="rn-muted">Aucun artisan.</td></tr>';
		}
		$soon = gmdate( 'Y-m-d', time() + 30 * DAY_IN_SECONDS );
		foreach ( $res['items'] as $a ) {
			$s      = Artisans::stats( $a['id'] );
			$trades = array_slice( $a['trade_names'], 0, 3 );
			$more   = count( $a['trade_names'] ) - count( $trades );
			$rc     = $a['rc_expiry'] ? ( $a['rc_expiry'] <= $soon ? '<span class="rn-badge rn-badge--amber">Expire le ' . esc_html( Util::date( $a['rc_expiry'] ) ) . '</span>' : '<span class="rn-badge rn-badge--green">' . esc_html( Util::date( $a['rc_expiry'] ) ) . '</span>' ) : '<span class="rn-badge rn-badge--red">Manquante</span>';
			echo '<tr><td><span class="rn-act-name"><span class="rn-avatar-sq">' . esc_html( Util::initials( $a['company'] ) ) . '</span><span><a class="row-title" href="' . esc_url( Util::admin_url( 'reno360-artisans', array( 'edit' => $a['id'] ) ) ) . '">' . esc_html( $a['company'] ) . '</a><small class="rn-muted">' . esc_html( trim( $a['npa'] . ' ' . $a['city'] ) ) . '</small></span></span></td>';
			echo '<td><span class="rn-kw-list">';
			foreach ( $trades as $t ) {
				echo '<span class="rn-kw">' . esc_html( $t ) . '</span>';
			}
			echo $more > 0 ? '<span class="rn-kw rn-kw--more">+' . (int) $more . '</span>' : ''; // phpcs:ignore WordPress.Security.EscapeOutput
			echo '</span></td>';
			echo '<td class="rn-muted">' . esc_html( trim( implode( ', ', $a['cantons'] ) . ( $a['npa_ranges'] ? ' · ' . $a['npa_ranges'] : '' ), ' ·' ) ) . '</td>';
			echo '<td>' . ( $a['rating'] ? '<strong>' . esc_html( number_format( (float) $a['rating'], 1, ',', '' ) ) . '</strong>' : '<span class="rn-muted">—</span>' ) . '</td>';
			echo '<td>' . ( $s['requested'] ? '<strong class="' . ( $s['response_rate'] < 70 ? 'rn-bad' : '' ) . '">' . (int) $s['response_rate'] . ' %</strong>' : '<span class="rn-muted">—</span>' ) . '</td>';
			echo '<td>' . (int) $s['requested'] . ' / ' . (int) $s['won'] . '</td>';
			echo '<td>' . $rc . '</td><td>' . Util::artisan_badge( $a['status'] ) . '</td></tr>'; // phpcs:ignore WordPress.Security.EscapeOutput
		}
		echo '</tbody></table></div></section>';
		$pages = (int) ceil( $res['total'] / $args['per_page'] );
		if ( $pages > 1 ) {
			echo '<div class="tablenav"><div class="tablenav-pages">' . paginate_links( array( 'base' => add_query_arg( 'paged', '%#%' ), 'format' => '', 'current' => $args['page'], 'total' => $pages ) ) . '</div></div>'; // phpcs:ignore WordPress.Security.EscapeOutput
		}
		echo '</div>';
	}

	private static function render_edit( $id ) {
		$a = $id ? Artisans::get( $id ) : null;
		if ( $id && ! $a ) {
			echo '<div class="wrap rn-wrap"><p>Artisan introuvable.</p></div>';
			return;
		}
		$a = $a ? $a : array(
			'id'           => 0,
			'company'      => '',
			'contact_name' => '',
			'email'        => '',
			'phone'        => '',
			'address'      => '',
			'npa'          => '',
			'city'         => '',
			'canton'       => '',
			'ide'          => '',
			'website'      => '',
			'cantons'      => array(),
			'npa_ranges'   => '',
			'status'       => 'actif',
			'rating'       => '',
			'rc_expiry'    => '',
			'notes'        => '',
			'trades'       => array(),
			'created_at'   => '',
		);
		echo '<div class="wrap rn-wrap">';
		echo '<nav class="rn-crumbs"><a href="' . esc_url( Util::admin_url( 'reno360-artisans' ) ) . '">Artisans</a> / ' . esc_html( $a['id'] ? $a['company'] : 'Nouveau' ) . '</nav>';
		Admin::header( $a['id'] ? $a['company'] : 'Nouvel artisan', $a['id'] ? Util::artisan_badge( $a['status'] ) : '', $a['id'] ? 'Fiche créée le ' . esc_html( Util::date( $a['created_at'] ) ) : '' );

		Admin::form_open( 'rn_artisan_save', array( 'id' => $a['id'] ), 'enctype="multipart/form-data" class="rn-edit-layout"' );
		echo '<div class="rn-edit-main">';
		echo '<section class="rn-card"><div class="rn-card__head"><h2>Entreprise</h2></div><div class="rn-form-grid">';
		$fields = array(
			'company'      => 'Raison sociale *',
			'ide'          => 'N° IDE (CHE-…)',
			'contact_name' => 'Personne de contact',
			'website'      => 'Site internet',
			'email'        => 'E-mail (reçoit les demandes)',
			'phone'        => 'Téléphone',
			'address'      => 'Adresse',
			'npa'          => 'NPA',
			'city'         => 'Localité',
		);
		foreach ( $fields as $k => $label ) {
			printf( '<label>%1$s<input type="%4$s" name="%2$s" value="%3$s"%5$s></label>', esc_html( $label ), esc_attr( $k ), esc_attr( $a[ $k ] ), 'email' === $k ? 'email' : 'text', 'company' === $k ? ' required' : '' );
		}
		echo '</div></section>';

		echo '<section class="rn-card"><div class="rn-card__head"><h2>Métiers <span class="rn-muted" data-rn-trade-count>' . count( $a['trades'] ) . '</span></h2><input type="search" placeholder="Filtrer…" data-rn-trade-filter aria-label="Filtrer les métiers"></div><div class="rn-trade-grid" data-rn-trades>';
		$groups = array();
		foreach ( Activities::all( array( 'status' => 'any' ) ) as $act ) {
			$groups[ $act['category'] ? $act['category'] : 'Autres' ][] = $act;
		}
		foreach ( $groups as $cat => $items ) {
			echo '<fieldset><legend>' . esc_html( $cat ) . '</legend>';
			foreach ( $items as $act ) {
				printf( '<label data-rn-trade="%3$s"><input type="checkbox" name="trades[]" value="%1$d"%4$s> %2$s</label>', (int) $act['id'], esc_html( $act['name'] ), esc_attr( strtolower( remove_accents( $act['name'] ) ) ), checked( in_array( $act['id'], $a['trades'], true ), true, false ) );
			}
			echo '</fieldset>';
		}
		echo '</div></section>';

		echo '<section class="rn-card"><div class="rn-card__head"><h2>Zone d’intervention</h2></div><div class="rn-pills-check">';
		foreach ( Util::cantons() as $code => $name ) {
			printf( '<label><input type="checkbox" name="cantons[]" value="%1$s"%3$s> %2$s</label>', esc_attr( $code ), esc_html( $name ), checked( in_array( $code, $a['cantons'], true ), true, false ) );
		}
		echo '</div>';
		printf( '<label class="rn-block">Plages de NPA couvertes <small class="rn-muted">(prioritaires sur les cantons pour les suggestions, ex. 1000-1099, 1110-1170)</small><input type="text" name="npa_ranges" value="%s" class="rn-full"></label>', esc_attr( $a['npa_ranges'] ) );
		echo '</section>';

		echo '<section class="rn-card"><div class="rn-card__head"><h2>Notes internes</h2></div><textarea name="notes" rows="5" class="rn-full">' . esc_textarea( (string) $a['notes'] ) . '</textarea></section>';

		if ( $a['id'] ) {
			$quotes = Quotes::query(
				array(
					'artisan_id' => $a['id'],
					'per_page'   => 20,
				)
			)['items'];
			$s      = Artisans::stats( $a['id'] );
			echo '<section class="rn-card rn-card--flush"><div class="rn-card__head rn-pad"><h2>Historique des demandes</h2><span class="rn-muted">' . sprintf( '%d consulté(s) · %d devis remis · %d signé(s) · %s', (int) $s['requested'], (int) $s['received'], (int) $s['won'], esc_html( Util::chf( $s['won_amount'] ) ) ) . ( null !== $s['avg_days'] ? ' · délai moyen ' . esc_html( (string) $s['avg_days'] ) . ' j' : '' ) . '</span></div>';
			echo '<div class="rn-scroll"><table class="rn-table"><thead><tr><th>Demande</th><th>Statut du devis</th><th>Montant</th><th>Envoyée</th></tr></thead><tbody>';
			if ( ! $quotes ) {
				echo '<tr><td colspan="4" class="rn-muted">Aucune demande transmise pour l’instant.</td></tr>';
			}
			foreach ( $quotes as $q ) {
				$r = \Reno360\Requests::get( $q['request_id'] );
				printf( '<tr><td>%1$s</td><td>%2$s</td><td>%3$s</td><td class="rn-muted">%4$s</td></tr>', $r ? '<a href="' . esc_url( Util::admin_url( 'reno360-requests', array( 'view' => $r['id'] ) ) ) . '">' . esc_html( $r['ref'] . ' · ' . $r['activity_name'] . ' · ' . $r['place'] ) . '</a>' : '—', Util::quote_badge( $q['status'] ), esc_html( Util::chf( $q['amount'] ) ), esc_html( Util::date( $q['sent_at'] ) ) ); // phpcs:ignore WordPress.Security.EscapeOutput
			}
			echo '</tbody></table></div></section>';
		}
		echo '</div>';

		echo '<aside class="rn-edit-side"><section class="rn-card"><div class="rn-card__head"><h2>Statut</h2></div>';
		$st = array();
		foreach ( Util::artisan_statuses() as $k => $s ) {
			$st[ $k ] = $s['label'];
		}
		echo '<label>Statut' . Admin::select( 'status', $st, $a['status'] ) . '</label>'; // phpcs:ignore WordPress.Security.EscapeOutput
		if ( 'candidat' === $a['status'] ) {
			echo '<label class="rn-inline-check"><input type="checkbox" name="welcome" value="1" checked> Envoyer l’e-mail de bienvenue en passant à « Actif »</label>';
		}
		printf( '<label>Note moyenne (0 à 5)<input type="number" name="rating" min="0" max="5" step="0.1" value="%s"></label>', esc_attr( (string) $a['rating'] ) );
		printf( '<label>Échéance de l’attestation RC Pro<input type="date" name="rc_expiry" value="%s"></label>', esc_attr( (string) $a['rc_expiry'] ) );
		echo '<p class="submit"><button class="button button-primary button-large rn-full">' . ( $a['id'] ? 'Enregistrer' : 'Créer' ) . '</button></p>';
		if ( $a['id'] ) {
			echo '<a class="rn-danger" href="' . esc_url( Admin::action_url( 'rn_artisan_delete', array( 'id' => $a['id'] ) ) ) . '" data-rn-confirm="Supprimer définitivement cet artisan ? Ses devis passés sont conservés.">Supprimer cet artisan</a>';
		}
		echo '</section>';
		echo '<section class="rn-card"><div class="rn-card__head"><h2>Documents</h2></div>';
		if ( $a['id'] ) {
			$docs = Files::query( array( 'artisan_id' => $a['id'], 'context' => 'artisan_doc' ) );
			echo '<ul class="rn-filelist">';
			foreach ( $docs as $f ) {
				echo '<li><a href="' . esc_url( Files::admin_url( $f['id'] ) ) . '" target="_blank" rel="noopener">' . Admin::icon( 'file', 15 ) . esc_html( $f['name'] ) . '</a> <a class="rn-danger" href="' . esc_url( Admin::action_url( 'rn_file_delete', array( 'id' => $f['id'] ) ) ) . '" data-rn-confirm="Supprimer ce document ?">×</a></li>'; // phpcs:ignore WordPress.Security.EscapeOutput
			}
			if ( ! $docs ) {
				echo '<li class="rn-muted">Aucun document.</li>';
			}
			echo '</ul>';
		}
		echo '<label>Ajouter (PDF, images)<input type="file" name="docs[]" multiple accept="application/pdf,image/*"></label>';
		echo '</section></aside>';
		echo '</form></div>';
	}
}
