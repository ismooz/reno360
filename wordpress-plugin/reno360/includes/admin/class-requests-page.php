<?php
/**
 * Demandes : liste, Kanban, fiche détaillée, création et modification.
 *
 * @package Reno360
 */

namespace Reno360\Admin;

use Reno360\Activities;
use Reno360\Artisans;
use Reno360\Events;
use Reno360\Files;
use Reno360\Notifications;
use Reno360\Portal;
use Reno360\Quotes;
use Reno360\Requests;
use Reno360\Settings;
use Reno360\Tasks;
use Reno360\Util;

defined( 'ABSPATH' ) || exit;

class Requests_Page {

	public static function render() {
		// phpcs:disable WordPress.Security.NonceVerification
		if ( ! empty( $_GET['view'] ) ) {
			$r = Requests::get( (int) $_GET['view'] );
			if ( ! $r ) {
				echo '<div class="wrap rn-wrap"><p>Demande introuvable.</p></div>';
				return;
			}
			if ( ! empty( $_GET['edit'] ) ) {
				self::render_form( $r );
				return;
			}
			self::render_detail( $r );
			return;
		}
		if ( ! empty( $_GET['new'] ) ) {
			self::render_form( null );
			return;
		}
		$view = isset( $_GET['mode'] ) && 'kanban' === $_GET['mode'] ? 'kanban' : 'list';
		if ( ! isset( $_GET['mode'] ) ) {
			$view = get_user_meta( get_current_user_id(), 'rn_requests_mode', true ) ? get_user_meta( get_current_user_id(), 'rn_requests_mode', true ) : 'list';
		} else {
			update_user_meta( get_current_user_id(), 'rn_requests_mode', $view );
		}
		self::render_list( 'kanban' === $view ? 'kanban' : 'list' );
		// phpcs:enable
	}

	private static function filters() {
		// phpcs:disable WordPress.Security.NonceVerification
		return array(
			'status'      => isset( $_GET['status'] ) ? sanitize_key( $_GET['status'] ) : '',
			'activity_id' => isset( $_GET['activity_id'] ) ? (int) $_GET['activity_id'] : 0,
			'canton'      => isset( $_GET['canton'] ) ? sanitize_key( $_GET['canton'] ) : '',
			'owner_id'    => isset( $_GET['owner_id'] ) ? (int) $_GET['owner_id'] : 0,
			'search'      => isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : '',
			'email'       => isset( $_GET['email'] ) ? sanitize_email( wp_unslash( $_GET['email'] ) ) : '',
		);
		// phpcs:enable
	}

	/* ------------------------------------------------------------------ */
	/* Liste et Kanban                                                    */
	/* ------------------------------------------------------------------ */

	private static function render_list( $view ) {
		$filters = self::filters();
		$base    = Util::admin_url( 'reno360-requests' );
		$counts  = Requests::counts( $filters );
		$total   = array_sum( $counts );

		echo '<div class="wrap rn-wrap">';
		Admin::header(
			'Demandes',
			'<a class="button" href="' . esc_url( Admin::action_url( 'rn_requests_export', array_filter( $filters ) ) ) . '">Exporter CSV</a> <a class="button button-primary" href="' . esc_url( add_query_arg( 'new', 1, $base ) ) . '">+ Saisir une demande</a>'
		);

		// Onglets de statut.
		echo '<ul class="subsubsub">';
		$links   = array();
		$links[] = '<li><a href="' . esc_url( remove_query_arg( array( 'status', 'paged' ) ) ) . '"' . ( '' === $filters['status'] ? ' class="current"' : '' ) . '>Toutes <span class="count">(' . (int) $total . ')</span></a>';
		foreach ( Util::statuses() as $k => $s ) {
			$links[] = '<li><a href="' . esc_url( add_query_arg( array( 'status' => $k, 'paged' => false ) ) ) . '"' . ( $filters['status'] === $k ? ' class="current"' : '' ) . '>' . esc_html( $s['label'] ) . ' <span class="count">(' . (int) $counts[ $k ] . ')</span></a>';
		}
		echo implode( ' |</li>', $links ) . '</li></ul>'; // phpcs:ignore WordPress.Security.EscapeOutput

		// Filtres.
		$acts = array();
		foreach ( Activities::all( array( 'status' => 'any' ) ) as $a ) {
			$acts[ $a['id'] ] = $a['name'];
		}
		$cantons = array();
		foreach ( (array) Settings::get( 'cantons', array() ) as $c ) {
			$cantons[ $c ] = Util::cantons()[ $c ];
		}
		echo '<form method="get" class="rn-filterbar">';
		echo '<input type="hidden" name="page" value="reno360-requests"><input type="hidden" name="mode" value="' . esc_attr( $view ) . '">';
		if ( $filters['status'] ) {
			echo '<input type="hidden" name="status" value="' . esc_attr( $filters['status'] ) . '">';
		}
		echo '<label class="screen-reader-text" for="rn-s">Rechercher</label><input type="search" id="rn-s" name="s" value="' . esc_attr( $filters['search'] ) . '" placeholder="N°, client, e-mail, téléphone, NPA…" class="rn-search-input">';
		echo Admin::select( 'activity_id', $acts, (string) $filters['activity_id'], 'aria-label="Travaux"', 'Tous les travaux' ); // phpcs:ignore WordPress.Security.EscapeOutput
		echo Admin::select( 'canton', $cantons, strtoupper( $filters['canton'] ), 'aria-label="Canton"', 'Tous les cantons' ); // phpcs:ignore WordPress.Security.EscapeOutput
		echo Admin::select( 'owner_id', Admin::staff_options(), (string) $filters['owner_id'], 'aria-label="Responsable"', 'Tous les responsables' ); // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<button class="button">Filtrer</button>';
		if ( array_filter( $filters ) ) {
			echo ' <a class="button-link" href="' . esc_url( add_query_arg( 'mode', $view, $base ) ) . '">Réinitialiser</a>';
		}
		echo '<span class="rn-view-toggle" role="group" aria-label="Affichage">';
		echo '<a class="' . ( 'kanban' === $view ? 'is-active' : '' ) . '" href="' . esc_url( add_query_arg( 'mode', 'kanban' ) ) . '"' . ( 'kanban' === $view ? ' aria-current="true"' : '' ) . '>' . Admin::icon( 'kanban', 16 ) . 'Kanban</a>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<a class="' . ( 'list' === $view ? 'is-active' : '' ) . '" href="' . esc_url( add_query_arg( 'mode', 'list' ) ) . '"' . ( 'list' === $view ? ' aria-current="true"' : '' ) . '>' . Admin::icon( 'list', 16 ) . 'Liste</a>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '</span></form>';

		if ( 'kanban' === $view ) {
			self::render_kanban( $filters );
		} else {
			$table = new Requests_Table( $filters );
			$table->prepare_items();
			Admin::form_open( 'rn_requests_bulk', array( '_redirect' => isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '' ), 'id="rn-requests-form"' );
			$table->display();
			echo '</form>';
		}
		echo '</div>';
	}

	private static function render_kanban( array $filters ) {
		global $wpdb;
		$q_table = \Reno360\Installer::table( 'quotes' );
		$counts  = Requests::counts( $filters );
		echo '<p class="rn-muted rn-kanban-help">Glissez une carte d’une colonne à l’autre pour changer son statut (le client est informé selon vos réglages de notifications).</p>';
		echo '<div class="rn-kanban" data-rn-kanban>';
		foreach ( Util::statuses() as $key => $s ) {
			if ( 'perdue' === $key && empty( $filters['status'] ) ) {
				continue;
			}
			if ( $filters['status'] && $filters['status'] !== $key ) {
				continue;
			}
			$items = Requests::query(
				array_merge(
					$filters,
					array(
						'status'   => $key,
						'per_page' => 'terminee' === $key ? 10 : 40,
						'orderby'  => 'updated_at',
					)
				)
			)['items'];
			$qc    = array();
			if ( $items ) {
				$rows = $wpdb->get_results( 'SELECT request_id, COUNT(*) AS total, SUM(CASE WHEN status IN (\'recu\',\'accepte\',\'refuse\') THEN 1 ELSE 0 END) AS rec FROM ' . $q_table . ' WHERE request_id IN (' . implode( ',', array_map( 'intval', wp_list_pluck( $items, 'id' ) ) ) . ') GROUP BY request_id', ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
				foreach ( (array) $rows as $row ) {
					$qc[ (int) $row['request_id'] ] = $row['rec'] . '/' . $row['total'] . ' devis';
				}
			}
			printf( '<section class="rn-kcol" data-status="%1$s" aria-label="%2$s"><header><span class="rn-kdot" style="background:%3$s"></span><strong>%2$s</strong><span class="rn-kcount" data-rn-count>%4$d</span></header><div class="rn-kcards" data-rn-drop>', esc_attr( $key ), esc_html( $s['label'] ), esc_attr( $s['fg'] ), (int) $counts[ $key ] );
			foreach ( $items as $r ) {
				$late = 'nouvelle' === $r['status'] && strtotime( $r['created_at'] . ' UTC' ) < time() - (int) Settings::get( 'sla_hours', 24 ) * HOUR_IN_SECONDS;
				printf(
					'<a class="rn-kcard" draggable="true" data-id="%1$d" href="%2$s"><span class="rn-kcard__top"><strong>%3$s</strong><span>%4$s</span></span><strong class="rn-kcard__title">%5$s</strong><span class="rn-kcard__meta">%6$s</span><span class="rn-kcard__tags">%7$s%8$s%9$s</span><span class="rn-kcard__foot">%10$s%11$s</span></a>',
					(int) $r['id'],
					esc_url( Util::admin_url( 'reno360-requests', array( 'view' => $r['id'] ) ) ),
					esc_html( $r['ref'] ),
					esc_html( Util::ago( $r['created_at'] ) ),
					esc_html( $r['activity_name'] ),
					esc_html( $r['name'] . ' · ' . $r['place'] ),
					$r['budget'] ? '<span class="rn-chip-xs">' . esc_html( $r['budget'] ) . '</span>' : '',
					$r['priority'] ? '<span class="rn-chip-xs rn-chip-xs--red">Urgent</span>' : '',
					isset( $qc[ $r['id'] ] ) ? '<span class="rn-chip-xs rn-chip-xs--amber">' . esc_html( $qc[ $r['id'] ] ) . '</span>' : '',
					$r['owner_id'] ? '<span class="rn-avatar-xs" title="' . esc_attr( Util::user_name( $r['owner_id'] ) ) . '">' . esc_html( Util::initials( Util::user_name( $r['owner_id'] ) ) ) . '</span>' : '<span class="rn-muted">Non attribuée</span>',
					$late ? '<span class="rn-late">' . Admin::icon( 'clock', 13 ) . 'Hors délai</span>' : '' // phpcs:ignore WordPress.Security.EscapeOutput
				);
			}
			if ( $counts[ $key ] > count( $items ) ) {
				printf( '<a class="rn-kmore" href="%s">+ %d autres</a>', esc_url( add_query_arg( array( 'status' => $key, 'mode' => 'list' ) ) ), (int) ( $counts[ $key ] - count( $items ) ) );
			}
			echo '</div></section>';
		}
		echo '</div>';
	}

	/* ------------------------------------------------------------------ */
	/* Fiche                                                              */
	/* ------------------------------------------------------------------ */

	private static function render_detail( array $r ) {
		$base     = Util::admin_url( 'reno360-requests', array( 'view' => $r['id'] ) );
		$quotes   = Quotes::for_request( $r['id'] );
		$events   = Events::for_request( $r['id'] );
		$tasks    = Tasks::query(
			array(
				'request_id' => $r['id'],
				'open'       => false,
			)
		);
		$files    = Files::query( array( 'request_id' => $r['id'] ) );
		$statuses = Util::statuses();
		$keys     = array_keys( $statuses );
		$pos      = array_search( $r['status'], $keys, true );
		$notify   = (array) Settings::get( 'notify_client_status', array() );
		$phone    = preg_replace( '/[^\d+]/', '', $r['phone'] );

		echo '<div class="wrap rn-wrap rn-detail">';
		echo '<nav class="rn-crumbs"><a href="' . esc_url( Util::admin_url( 'reno360-requests' ) ) . '">Demandes</a> / ' . esc_html( $r['ref'] ) . '</nav>';
		$actions  = $phone ? '<a class="button" href="tel:' . esc_attr( $phone ) . '">' . Admin::icon( 'phone', 15 ) . ' Appeler</a> ' : '';
		$actions .= $r['email'] ? '<a class="button" href="#activite" data-rn-tab-open="email">' . Admin::icon( 'mail', 15 ) . ' E-mail</a> ' : '';
		$actions .= '<a class="button" href="' . esc_url( add_query_arg( 'edit', 1, $base ) ) . '">Modifier</a> ';
		$actions .= '<a class="button rn-button-danger" href="' . esc_url( Admin::action_url( 'rn_request_delete', array( 'id' => $r['id'] ) ) ) . '" data-rn-confirm="Supprimer définitivement cette demande, ses devis, fichiers et son historique ?">Supprimer</a>';
		Admin::header(
			$r['ref'] . ' · ' . $r['activity_name'] . ( $r['name'] ? ' — ' . $r['name'] : '' ),
			$actions,
			esc_html( implode( ' · ', array_filter( array( $r['place'], 'reçue le ' . Util::datetime( $r['created_at'] ), $r['source'] ? 'via ' . $r['source'] : '', $r['device'] ) ) ) )
		);

		// Barre de statut.
		Admin::form_open( 'rn_request_status', array( 'id' => $r['id'] ), 'class="rn-stagebar"' );
		echo '<ol class="rn-stages">';
		foreach ( $statuses as $k => $s ) {
			if ( 'perdue' === $k ) {
				continue;
			}
			$i     = array_search( $k, $keys, true );
			$class = ( 'perdue' !== $r['status'] && $i < $pos ) ? 'is-done' : ( $k === $r['status'] ? 'is-current' : '' );
			printf( '<li class="%1$s"><button type="submit" name="status" value="%2$s"%4$s title="Passer en « %3$s »">%5$s%3$s</button></li>', esc_attr( $class ), esc_attr( $k ), esc_html( $s['label'] ), $k === $r['status'] ? ' aria-current="step" disabled' : '', 'is-done' === $class ? Admin::icon( 'check', 13 ) : '' ); // phpcs:ignore WordPress.Security.EscapeOutput
		}
		echo '</ol>';
		echo '<label class="rn-inline-check"><input type="checkbox" name="notify" value="1" checked> Informer le client <span class="rn-muted">(selon réglages)</span></label>';
		echo '</form>';
		if ( 'perdue' === $r['status'] ) {
			echo '<div class="notice notice-error inline"><p><strong>Demande perdue.</strong> ' . esc_html( $r['lost_reason'] ) . '</p></div>';
		} else {
			echo '<details class="rn-lost"><summary>Marquer comme perdue</summary>';
			Admin::form_open( 'rn_request_status', array( 'id' => $r['id'], 'status' => 'perdue' ) );
			echo Admin::select( 'lost_reason', array_combine( self::lost_reasons(), self::lost_reasons() ), '', 'aria-label="Motif"', 'Motif…' ); // phpcs:ignore WordPress.Security.EscapeOutput
			echo ' <button class="button rn-button-danger">Confirmer</button></form></details>';
		}

		echo '<div class="rn-detail-grid">';

		// Colonne gauche.
		echo '<div class="rn-detail-col">';
		echo '<section class="rn-card"><div class="rn-card__head"><h2>Client</h2></div>';
		echo '<div class="rn-person"><span class="rn-avatar">' . esc_html( Util::initials( $r['name'] ) ) . '</span><span><strong>' . esc_html( $r['name'] ) . '</strong><small class="rn-muted">' . esc_html( trim( $r['client_type'] . ( count( Requests::for_email( $r['email'] ) ) > 1 ? ' · ' . count( Requests::for_email( $r['email'] ) ) . ' demandes' : '' ), ' ·' ) ) . '</small></span></div>';
		echo '<dl class="rn-kv">';
		self::kv( 'E-mail', $r['email'] ? '<a href="mailto:' . esc_attr( $r['email'] ) . '">' . esc_html( $r['email'] ) . '</a>' : '—', true );
		self::kv( 'Téléphone', $phone ? '<a href="tel:' . esc_attr( $phone ) . '">' . esc_html( $r['phone'] ) . '</a>' : '—', true );
		self::kv( 'Préférence', trim( $r['contact_pref'] . ', ' . $r['contact_time'], ', ' ) );
		self::kv( 'Adresse', trim( $r['address'] . "\n" . $r['place'] . ( $r['canton'] ? ' (' . $r['canton'] . ')' : '' ) ) );
		echo '</dl>';
		if ( $r['email'] ) {
			echo '<p class="rn-small"><a href="' . esc_url( Portal::link( $r['email'], $r['ref'] ) ) . '" target="_blank" rel="noopener">Voir l’espace client</a> · <a href="' . esc_url( Admin::action_url( 'rn_client_link', array( 'email' => $r['email'] ) ) ) . '">Envoyer le lien d’accès</a></p>';
		}
		if ( $r['consent_at'] ) {
			echo '<span class="rn-chip-xs">Consentement nLPD ' . esc_html( Util::date( $r['consent_at'] ) ) . '</span>';
		}
		echo '</section>';

		echo '<section class="rn-card"><div class="rn-card__head"><h2>Projet</h2><a href="' . esc_url( add_query_arg( 'edit', 1, $base ) ) . '">Modifier</a></div><dl class="rn-kv">';
		self::kv( 'Travaux', $r['activity_id'] && get_post( $r['activity_id'] ) ? '<a href="' . esc_url( Util::admin_url( 'reno360-activities', array( 'edit' => $r['activity_id'] ) ) ) . '">' . esc_html( $r['activity_name'] ) . '</a>' : esc_html( $r['activity_name'] ), true );
		foreach ( $r['answers'] as $ans ) {
			self::kv( $ans['label'], is_array( $ans['value'] ) ? implode( ', ', $ans['value'] ) : $ans['value'] );
		}
		self::kv( 'Bien', $r['property_type'] );
		self::kv( 'Début souhaité', $r['start_wish'] );
		self::kv( 'Date souhaitée', $r['preferred_date'] ? Util::date( $r['preferred_date'] ) : '' );
		self::kv( 'Budget', $r['budget'] );
		echo '</dl>';
		if ( $r['description'] ) {
			echo '<blockquote class="rn-blockquote">' . nl2br( esc_html( $r['description'] ) ) . '</blockquote>';
		}
		self::files_block( $files, array( 'request_id' => $r['id'] ) );
		echo '</section>';

		echo '<section class="rn-card"><div class="rn-card__head"><h2>Informations</h2></div><dl class="rn-kv">';
		self::kv( 'Source', $r['source'] );
		self::kv( 'Page d’entrée', $r['landing'] ? wp_parse_url( $r['landing'], PHP_URL_PATH ) : '' );
		foreach ( $r['utm'] as $k => $v ) {
			self::kv( $k, $v );
		}
		self::kv( 'Appareil', $r['device'] );
		self::kv( 'Créée le', Util::datetime( $r['created_at'] ) );
		self::kv( 'Modifiée le', Util::datetime( $r['updated_at'] ) );
		self::kv( '1re réponse', $r['first_response_at'] ? Util::datetime( $r['first_response_at'] ) : 'en attente' );
		echo '</dl></section>';
		echo '</div>';

		// Colonne centrale : activité.
		echo '<div class="rn-detail-col rn-detail-col--main">';
		echo '<section class="rn-card rn-card--flush" id="activite"><div class="rn-card__head rn-pad"><h2>Activité</h2>';
		Admin::form_open( 'rn_request_owner', array( 'id' => $r['id'] ), 'class="rn-inline"' );
		echo '<label class="rn-inline-label">Responsable ' . Admin::select( 'owner_id', Admin::staff_options(), (string) $r['owner_id'], 'onchange="this.form.submit()"', '— aucun —' ) . '</label></form>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '</div>';
		Admin::form_open( 'rn_request_event', array( 'id' => $r['id'] ), 'class="rn-composer-admin" data-rn-composer' );
		$tabs = array(
			'note'    => 'Note interne',
			'message' => 'Message au client',
			'email'   => 'E-mail',
			'call'    => 'Appel',
		);
		echo '<div class="rn-tabs" role="radiogroup" aria-label="Type d’entrée">';
		foreach ( $tabs as $k => $label ) {
			if ( in_array( $k, array( 'message', 'email' ), true ) && ! $r['email'] ) {
				continue;
			}
			printf( '<label class="rn-tab"><input type="radio" name="type" value="%1$s"%2$s><span>%3$s</span></label>', esc_attr( $k ), 'note' === $k ? ' checked' : '', esc_html( $label ) );
		}
		echo '</div>';
		echo '<div class="rn-composer-fields">';
		echo '<input type="text" name="subject" class="rn-full" placeholder="Objet de l’e-mail" data-rn-for="email" value="' . esc_attr( 'Votre demande ' . $r['ref'] ) . '" hidden>';
		echo '<input type="number" name="duration" min="0" class="small-text" placeholder="min" aria-label="Durée de l’appel en minutes" data-rn-for="call" hidden>';
		echo '<textarea name="content" rows="3" class="rn-full" placeholder="Écrire une note interne (invisible pour le client et les artisans)…" data-rn-placeholders="' . esc_attr( wp_json_encode( array( 'note' => 'Écrire une note interne (invisible pour le client et les artisans)…', 'message' => 'Message visible dans l’espace du client (il est aussi prévenu par e-mail)…', 'email' => 'Texte de l’e-mail au client…', 'call' => 'Résumé de l’appel…' ) ) ) . '" required></textarea>';
		echo '<div class="rn-composer-row"><span class="rn-muted rn-small" data-rn-hint>Visible uniquement par votre équipe.</span><button class="button button-primary">Enregistrer</button></div>';
		echo '</div></form>';
		echo '<ol class="rn-timeline">';
		foreach ( $events as $e ) {
			$type = Events::types()[ $e['type'] ] ?? Events::types()['note'];
			printf(
				'<li class="rn-ev rn-ev--%1$s"><span class="rn-ev__icon">%2$s</span><div class="rn-ev__body"><div class="rn-ev__head"><strong>%3$s</strong>%4$s<span class="rn-muted">%5$s</span></div><div class="rn-ev__text">%6$s</div></div></li>',
				esc_attr( $e['type'] ),
				Admin::icon( $type['icon'], 15 ), // phpcs:ignore WordPress.Security.EscapeOutput
				esc_html( $type['label'] . ( $e['author_name'] ? ' · ' . $e['author_name'] : '' ) ),
				'client' === $e['visibility'] ? ' <span class="rn-chip-xs">Visible client</span>' : '',
				esc_html( Util::datetime( $e['created_at'] ) ),
				nl2br( esc_html( $e['content'] ) )
			);
		}
		echo '</ol></section>';
		echo '</div>';

		// Colonne droite : artisans, tâches.
		echo '<div class="rn-detail-col">';
		$max = (int) Settings::get( 'max_artisans', 3 );
		echo '<section class="rn-card" id="artisans"><div class="rn-card__head"><h2>Artisans consultés <span class="rn-muted">' . count( $quotes ) . '/' . $max . '</span></h2></div>';
		if ( ! $quotes ) {
			echo '<p class="rn-muted">Aucun artisan consulté pour l’instant.</p>';
		}
		foreach ( $quotes as $q ) {
			self::quote_card( $q, $r );
		}
		self::assign_block( $r, count( $quotes ) >= $max, count( $quotes ) );
		echo '</section>';

		echo '<section class="rn-card rn-card--flush" id="taches"><div class="rn-card__head rn-pad"><h2>Tâches</h2></div>';
		Dashboard_Page::tasks_list( $tasks, false );
		Admin::form_open( 'rn_task_add', array( 'request_id' => $r['id'] ), 'class="rn-task-form"' );
		echo '<input type="text" name="title" placeholder="Nouvelle tâche…" required aria-label="Intitulé de la tâche"><input type="date" name="due" aria-label="Échéance" value="' . esc_attr( wp_date( 'Y-m-d' ) ) . '"><button class="button">Ajouter</button></form>';
		echo '</section>';
		echo '</div>';

		echo '</div></div>';
	}

	private static function lost_reasons() {
		return array( 'Client injoignable', 'Projet abandonné ou reporté', 'Budget insuffisant', 'A choisi une autre entreprise', 'Hors zone ou hors métier', 'Demande en double', 'Spam ou fausse demande' );
	}

	private static function kv( $label, $value, $html = false ) {
		if ( '' === trim( (string) $value ) ) {
			return;
		}
		echo '<div><dt>' . esc_html( $label ) . '</dt><dd>' . ( $html ? wp_kses_post( $value ) : nl2br( esc_html( $value ) ) ) . '</dd></div>';
	}

	public static function files_block( array $files, array $links ) {
		$images = array_filter( $files, array( Files::class, 'is_image' ) );
		$others = array_diff_key( $files, $images );
		if ( $images ) {
			echo '<div class="rn-thumbs-admin">';
			foreach ( $images as $f ) {
				echo '<span class="rn-thumb-admin"><a href="' . esc_url( Files::admin_url( $f['id'] ) ) . '" target="_blank" rel="noopener"><img src="' . esc_url( Files::url( $f['id'] ) ) . '" alt="' . esc_attr( $f['name'] ) . '" loading="lazy"></a><a class="rn-thumb-del" href="' . esc_url( Admin::action_url( 'rn_file_delete', array( 'id' => $f['id'] ) ) ) . '" data-rn-confirm="Supprimer ce fichier ?" aria-label="Supprimer ' . esc_attr( $f['name'] ) . '">×</a></span>';
			}
			echo '</div>';
		}
		if ( $others ) {
			echo '<ul class="rn-filelist">';
			foreach ( $others as $f ) {
				echo '<li><a href="' . esc_url( Files::admin_url( $f['id'] ) ) . '" target="_blank" rel="noopener">' . Admin::icon( 'file', 15 ) . esc_html( $f['name'] ) . '</a> <span class="rn-muted">' . esc_html( Files::size_label( $f['size'] ) ) . '</span> <a href="' . esc_url( Admin::action_url( 'rn_file_delete', array( 'id' => $f['id'] ) ) ) . '" class="rn-danger" data-rn-confirm="Supprimer ce fichier ?">Supprimer</a></li>'; // phpcs:ignore WordPress.Security.EscapeOutput
			}
			echo '</ul>';
		}
		Admin::form_open( 'rn_file_upload', $links, 'enctype="multipart/form-data" class="rn-upload-inline"' );
		echo '<label class="button button-small">' . Admin::icon( 'upload', 14 ) . ' Ajouter des fichiers<input type="file" name="files[]" multiple accept="image/*,.heic,.heif,application/pdf" onchange="this.form.submit()" class="rn-hidden-file"></label></form>'; // phpcs:ignore WordPress.Security.EscapeOutput
	}

	private static function quote_card( array $q, array $r ) {
		$a     = $q['artisan'];
		$files = Files::query( array( 'quote_id' => $q['id'] ) );
		echo '<div class="rn-quote-admin rn-quote-admin--' . esc_attr( $q['status'] ) . '">';
		echo '<div class="rn-quote-admin__top"><strong>' . ( $a ? '<a href="' . esc_url( Util::admin_url( 'reno360-artisans', array( 'edit' => $a['id'] ) ) ) . '">' . esc_html( $q['company'] ) . '</a>' : esc_html( $q['company'] ) ) . '</strong>' . Util::quote_badge( $q['status'] ) . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<div class="rn-quote-admin__meta">';
		if ( null !== $q['amount'] ) {
			echo '<strong class="rn-amount">' . esc_html( Util::chf( $q['amount'] ) ) . '</strong>';
		}
		$bits = array_filter(
			array(
				$q['start_date'] ? 'début ' . Util::date( $q['start_date'] ) : '',
				$q['duration'],
				'attendu' === $q['status'] ? 'envoyé ' . Util::ago( $q['sent_at'] ) : '',
				$q['received_at'] ? 'reçu le ' . Util::date( $q['received_at'] ) : '',
			)
		);
		echo '<span class="rn-muted">' . esc_html( implode( ' · ', $bits ) ) . '</span></div>';
		foreach ( $files as $f ) {
			echo '<a class="rn-filelink" href="' . esc_url( Files::admin_url( $f['id'] ) ) . '" target="_blank" rel="noopener">' . Admin::icon( 'file', 14 ) . esc_html( $f['name'] ) . '</a>'; // phpcs:ignore WordPress.Security.EscapeOutput
		}
		echo '<div class="rn-quote-admin__actions">';
		if ( in_array( $q['status'], array( 'recu', 'refuse' ), true ) && ! in_array( $r['status'], array( 'acceptee', 'travaux', 'terminee' ), true ) ) {
			echo '<a class="button button-small button-primary" href="' . esc_url( Admin::action_url( 'rn_quote_accept', array( 'quote_id' => $q['id'] ) ) ) . '" data-rn-confirm="Accepter ce devis au nom du client ? Les autres artisans seront informés.">Accepter</a>';
		}
		if ( 'attendu' === $q['status'] ) {
			echo '<a class="button button-small" href="' . esc_url( Admin::action_url( 'rn_quote_resend', array( 'quote_id' => $q['id'] ) ) ) . '">Relancer</a>';
			echo '<a class="button button-small" href="' . esc_url( Admin::action_url( 'rn_quote_status', array( 'quote_id' => $q['id'], 'status' => 'decline' ) ) ) . '">Indisponible</a>';
		}
		echo '<button type="button" class="button button-small" data-rn-copy="' . esc_attr( Quotes::artisan_link( $q ) ) . '">Copier le lien artisan</button>';
		echo '<a class="button-link rn-danger" href="' . esc_url( Admin::action_url( 'rn_quote_delete', array( 'quote_id' => $q['id'] ) ) ) . '" data-rn-confirm="Retirer cet artisan de la demande ?">Retirer</a>';
		echo '</div>';

		echo '<details class="rn-quote-edit"><summary>' . ( 'attendu' === $q['status'] ? 'Saisir le devis reçu' : 'Détails du devis' ) . '</summary>';
		Admin::form_open( 'rn_quote_save', array( 'quote_id' => $q['id'] ), 'enctype="multipart/form-data" class="rn-form-grid"' );
		printf( '<label>Montant TTC (CHF)<input type="text" name="amount" value="%s" inputmode="decimal"></label>', esc_attr( null !== $q['amount'] ? Util::chf( $q['amount'], false ) : '' ) );
		printf( '<label>Début possible<input type="date" name="start_date" value="%s"></label>', esc_attr( (string) $q['start_date'] ) );
		printf( '<label>Durée<input type="text" name="duration" value="%s" placeholder="8 jours ouvrés"></label>', esc_attr( $q['duration'] ) );
		printf( '<label>Valable jusqu’au<input type="date" name="valid_until" value="%s"></label>', esc_attr( (string) $q['valid_until'] ) );
		printf( '<label class="rn-span2">Compris (une ligne par élément)<textarea name="includes" rows="3">%s</textarea></label>', esc_textarea( (string) $q['includes'] ) );
		printf( '<label class="rn-span2">Non compris<textarea name="excludes" rows="2">%s</textarea></label>', esc_textarea( (string) $q['excludes'] ) );
		printf( '<label class="rn-span2">Notes internes<textarea name="notes" rows="2">%s</textarea></label>', esc_textarea( (string) $q['notes'] ) );
		echo '<label class="rn-span2">Devis (PDF)<input type="file" name="quote_file" accept="application/pdf,image/*"></label>';
		if ( in_array( $q['status'], array( 'attendu', 'decline' ), true ) ) {
			echo '<label class="rn-span2 rn-inline-check"><input type="checkbox" name="mark_received" value="1" checked> Marquer comme reçu (le client est prévenu selon vos réglages)</label>';
		}
		echo '<div class="rn-span2"><button class="button button-primary">Enregistrer le devis</button></div></form></details>';
		echo '</div>';
	}

	private static function assign_block( array $r, $full, $assigned = 0 ) {
		$suggest = $r['activity_id'] ? Artisans::suggestions( $r, 4 ) : array();
		echo '<div class="rn-assign">';
		if ( $full ) {
			echo '<p class="rn-muted rn-small">Nombre maximal d’artisans atteint (' . (int) Settings::get( 'max_artisans', 3 ) . '). Vous pouvez tout de même en ajouter.</p>';
		}
		if ( $suggest ) {
			echo '<h3 class="rn-overline">Suggestions (métier et zone)</h3><ul class="rn-suggest">';
			foreach ( $suggest as $a ) {
				echo '<li><span><strong>' . esc_html( $a['company'] ) . '</strong><small class="rn-muted">' . esc_html( implode( ' · ', $a['why'] ) ) . '</small></span>';
				Admin::form_open( 'rn_request_assign', array( 'id' => $r['id'], 'artisan_id' => $a['id'], 'notify' => 1 ), 'class="rn-inline"' );
				echo '<button class="button button-small">Proposer</button></form></li>';
			}
			echo '</ul>';
		} elseif ( $r['activity_id'] ) {
			echo '<p class="rn-muted rn-small">' . ( ! $assigned ? 'Aucun artisan actif ne couvre ce métier et cette zone.' : 'Aucun autre artisan actif ne couvre ce métier et cette zone.' ) . ' <a href="' . esc_url( Util::admin_url( 'reno360-artisans', array( 'new' => 1 ) ) ) . '">Ajouter un artisan</a></p>';
		}
		$options = Artisans::options( 'actif' );
		if ( $options ) {
			echo '<details class="rn-assign-any"><summary>Choisir un autre artisan</summary>';
			Admin::form_open( 'rn_request_assign', array( 'id' => $r['id'] ), 'class="rn-stack-admin"' );
			echo Admin::select( 'artisan_id', $options, '', 'required aria-label="Artisan"', 'Choisir un artisan…' ); // phpcs:ignore WordPress.Security.EscapeOutput
			echo '<label class="rn-inline-check"><input type="checkbox" name="notify" value="1" checked> Envoyer la demande par e-mail</label><button class="button">Ajouter</button></form></details>';
		}
		echo '</div>';
	}

	/* ------------------------------------------------------------------ */
	/* Formulaire création / modification                                 */
	/* ------------------------------------------------------------------ */

	private static function render_form( $r ) {
		$is_new = null === $r;
		$r      = $r ? $r : array(
			'id'             => 0,
			'activity_id'    => 0,
			'activity_name'  => '',
			'answers'        => array(),
			'first_name'     => '',
			'last_name'      => '',
			'email'          => '',
			'phone'          => '',
			'contact_pref'   => '',
			'contact_time'   => '',
			'address'        => '',
			'npa'            => '',
			'city'           => '',
			'canton'         => '',
			'property_type'  => '',
			'client_type'    => '',
			'start_wish'     => '',
			'budget'         => '',
			'preferred_date' => '',
			'description'    => '',
			'source'         => 'Téléphone',
			'owner_id'       => get_current_user_id(),
			'priority'       => 0,
		);
		$acts   = array();
		foreach ( Activities::all( array( 'status' => 'any' ) ) as $a ) {
			$acts[ $a['id'] ] = ( $a['category'] ? $a['category'] . ' › ' : '' ) . $a['name'];
		}
		asort( $acts );
		echo '<div class="wrap rn-wrap">';
		Admin::header( $is_new ? 'Saisir une demande' : 'Modifier ' . $r['ref'], '<a class="button" href="' . esc_url( $is_new ? Util::admin_url( 'reno360-requests' ) : Util::admin_url( 'reno360-requests', array( 'view' => $r['id'] ) ) ) . '">Annuler</a>', $is_new ? 'Pour une demande reçue par téléphone, e-mail ou sur un salon.' : '' );
		Admin::form_open( 'rn_request_save', array( 'id' => $r['id'] ), 'class="rn-card rn-form-card"' );
		echo '<h2>Travaux</h2><div class="rn-form-grid">';
		echo '<label>Type de travaux' . Admin::select( 'activity_id', $acts, (string) $r['activity_id'], '', '— Autre (texte libre) —' ) . '</label>'; // phpcs:ignore WordPress.Security.EscapeOutput
		printf( '<label>Si autre : intitulé<input type="text" name="activity_name" value="%s"></label>', esc_attr( $r['activity_id'] ? '' : $r['activity_name'] ) );
		echo '</div>';
		echo '<div class="rn-answers"><h3 class="rn-overline">Réponses aux questions</h3>';
		$answers = $r['answers'] ? $r['answers'] : array();
		$answers = array_pad( $answers, count( $answers ) + 2, array( 'label' => '', 'value' => '' ) );
		foreach ( $answers as $i => $ans ) {
			printf( '<div class="rn-answer-row"><input type="text" name="answers[%1$d][label]" value="%2$s" placeholder="Question" aria-label="Question"><input type="text" name="answers[%1$d][value]" value="%3$s" placeholder="Réponse" aria-label="Réponse"></div>', (int) $i, esc_attr( $ans['label'] ), esc_attr( is_array( $ans['value'] ) ? implode( ', ', $ans['value'] ) : $ans['value'] ) );
		}
		echo '</div>';
		printf( '<label class="rn-block">Description<textarea name="description" rows="5" class="rn-full">%s</textarea></label>', esc_textarea( (string) $r['description'] ) );

		echo '<h2>Client</h2><div class="rn-form-grid">';
		foreach ( array( 'first_name' => 'Prénom', 'last_name' => 'Nom', 'email' => 'E-mail', 'phone' => 'Téléphone' ) as $k => $label ) {
			printf( '<label>%1$s<input type="%4$s" name="%2$s" value="%3$s"></label>', esc_html( $label ), esc_attr( $k ), esc_attr( $r[ $k ] ), 'email' === $k ? 'email' : 'text' );
		}
		echo '<label>Préférence de contact' . Admin::select( 'contact_pref', Admin::list_options( Settings::lines( 'contact_prefs' ), $r['contact_pref'] ), $r['contact_pref'], '', '—' ) . '</label>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<label>Meilleur moment' . Admin::select( 'contact_time', Admin::list_options( Settings::lines( 'contact_times' ), $r['contact_time'] ), $r['contact_time'], '', '—' ) . '</label>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<label>Statut du client' . Admin::select( 'client_type', Admin::list_options( Settings::lines( 'client_types' ), $r['client_type'] ), $r['client_type'], '', '—' ) . '</label>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '</div>';

		echo '<h2>Lieu et délai</h2><div class="rn-form-grid">';
		printf( '<label class="rn-span2">Adresse<input type="text" name="address" value="%s"></label>', esc_attr( $r['address'] ) );
		printf( '<label>NPA<input type="text" name="npa" value="%s" maxlength="4" inputmode="numeric"></label>', esc_attr( $r['npa'] ) );
		printf( '<label>Localité<input type="text" name="city" value="%s"></label>', esc_attr( $r['city'] ) );
		$cantons = array();
		foreach ( Util::cantons() as $code => $name ) {
			$cantons[ $code ] = $name;
		}
		echo '<label>Canton' . Admin::select( 'canton', $cantons, $r['canton'], '', 'Automatique (d’après le NPA)' ) . '</label>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<label>Type de bien' . Admin::select( 'property_type', Admin::list_options( Settings::lines( 'property_types' ), $r['property_type'] ), $r['property_type'], '', '—' ) . '</label>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<label>Début souhaité' . Admin::select( 'start_wish', Admin::list_options( Settings::lines( 'start_options' ), $r['start_wish'] ), $r['start_wish'], '', '—' ) . '</label>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<label>Budget' . Admin::select( 'budget', Admin::list_options( Settings::lines( 'budgets' ), $r['budget'] ), $r['budget'], '', '—' ) . '</label>'; // phpcs:ignore WordPress.Security.EscapeOutput
		printf( '<label>Date souhaitée<input type="date" name="preferred_date" value="%s"></label>', esc_attr( (string) $r['preferred_date'] ) );
		echo '</div>';

		echo '<h2>Suivi</h2><div class="rn-form-grid">';
		echo '<label>Responsable' . Admin::select( 'owner_id', Admin::staff_options(), (string) $r['owner_id'], '', '— aucun —' ) . '</label>'; // phpcs:ignore WordPress.Security.EscapeOutput
		printf( '<label>Source<input type="text" name="source" value="%s" placeholder="Téléphone, salon, recommandation…"></label>', esc_attr( $r['source'] ) );
		echo '<label class="rn-inline-check"><input type="hidden" name="priority" value="0"><input type="checkbox" name="priority" value="1"' . checked( (int) $r['priority'], 1, false ) . '> Urgent</label>';
		if ( $is_new ) {
			echo '<label class="rn-inline-check"><input type="checkbox" name="send_confirmation" value="1"> Envoyer l’e-mail de confirmation au client (avec le lien de son espace)</label>';
		}
		echo '</div>';
		echo '<p class="submit"><button class="button button-primary button-hero">' . ( $is_new ? 'Créer la demande' : 'Enregistrer' ) . '</button></p>';
		echo '</form></div>';
	}
}
