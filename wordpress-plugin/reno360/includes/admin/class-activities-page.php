<?php
/**
 * Travaux et mots-clés : liste, fiche (CRUD complet), catégories, import/export, test de la recherche.
 *
 * @package Reno360
 */

namespace Reno360\Admin;

use Reno360\Activities;
use Reno360\Icons;
use Reno360\Installer;
use Reno360\Search;
use Reno360\Util;

defined( 'ABSPATH' ) || exit;

class Activities_Page {

	public static function render() {
		// phpcs:disable WordPress.Security.NonceVerification
		if ( isset( $_GET['edit'] ) ) {
			$id = 'new' === $_GET['edit'] ? 0 : (int) $_GET['edit'];
			self::render_edit( $id );
			return;
		}
		$tab = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'list';
		// phpcs:enable
		echo '<div class="wrap rn-wrap">';
		Admin::header(
			'Travaux et mots-clés',
			'<a class="button" href="' . esc_url( Admin::action_url( 'rn_activities_export' ) ) . '">Exporter CSV</a> <a class="button button-primary" href="' . esc_url( Util::admin_url( 'reno360-activities', array( 'edit' => 'new' ) ) ) . '">+ Ajouter un type de travaux</a>',
			'Les mots-clés alimentent la recherche du site : synonymes, noms de métiers, problèmes (« fuite », « panne »), termes suisses (« boiler », « galetas »)… Chaque modification est prise en compte immédiatement.'
		);
		$tabs = array(
			'list'       => 'Travaux (' . Activities::count_all() . ')',
			'categories' => 'Catégories',
			'import'     => 'Import / export',
		);
		echo '<nav class="nav-tab-wrapper rn-tabs-nav">';
		foreach ( $tabs as $k => $label ) {
			printf( '<a class="nav-tab%s" href="%s">%s</a>', $tab === $k ? ' nav-tab-active' : '', esc_url( Util::admin_url( 'reno360-activities', 'list' === $k ? array() : array( 'tab' => $k ) ) ), esc_html( $label ) );
		}
		echo '<a class="nav-tab" href="' . esc_url( Util::admin_url( 'reno360-search' ) ) . '">Analyse des recherches</a>';
		echo '</nav>';

		if ( 'categories' === $tab ) {
			self::render_categories();
		} elseif ( 'import' === $tab ) {
			self::render_import();
		} else {
			self::render_list();
		}
		echo '</div>';
	}

	public static function category_options() {
		$out = array();
		foreach ( Activities::categories() as $c ) {
			$out[ $c['id'] ] = $c['name'];
		}
		return $out;
	}

	/* ------------------------------------------------------------------ */
	/* Liste                                                              */
	/* ------------------------------------------------------------------ */

	private static function render_list() {
		// phpcs:disable WordPress.Security.NonceVerification
		$cat    = isset( $_GET['cat'] ) ? (int) $_GET['cat'] : 0;
		$state  = isset( $_GET['state'] ) ? sanitize_key( $_GET['state'] ) : '';
		$search = isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : '';
		// phpcs:enable

		echo '<div class="rn-cols rn-cols--top">';
		echo '<section class="rn-card rn-col-main"><div class="rn-card__head"><h2>Ajout rapide</h2></div>';
		Admin::form_open( 'rn_activity_quick', array(), 'class="rn-quick-add"' );
		echo '<label>Nom<input type="text" name="name" required placeholder="Ex. Pose de poêle à pellets"></label>';
		echo '<label>Catégorie' . Admin::select( 'category_id', self::category_options(), '', '', '— Sans catégorie —' ) . '</label>'; // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<label class="rn-grow">Mots-clés<input type="text" name="keywords" placeholder="Séparés par des virgules : poêle, granulés…"></label>';
		echo '<button class="button button-primary">Ajouter</button></form></section>';

		echo '<section class="rn-card rn-col-side rn-tester" data-rn-tester><div class="rn-card__head"><h2>Tester la recherche</h2></div>';
		echo '<input type="search" class="rn-full" placeholder="Tapez comme un client : « toit qui fuit », « boiler »…" data-rn-tester-input aria-label="Tester la recherche">';
		echo '<ol class="rn-tester__results" data-rn-tester-results></ol></section>';
		echo '</div>';

		echo '<form method="get" class="rn-filterbar"><input type="hidden" name="page" value="reno360-activities">';
		echo '<input type="search" name="s" value="' . esc_attr( $search ) . '" placeholder="Nom ou mot-clé…" class="rn-search-input" aria-label="Rechercher un type de travaux">';
		echo Admin::select( 'cat', self::category_options(), (string) $cat, 'aria-label="Catégorie"', 'Toutes les catégories' ); // phpcs:ignore WordPress.Security.EscapeOutput
		echo Admin::select( 'state', array( 'active' => 'Actifs', 'inactive' => 'Inactifs' ), $state, 'aria-label="Statut"', 'Tous les statuts' ); // phpcs:ignore WordPress.Security.EscapeOutput
		echo '<button class="button">Filtrer</button></form>';

		$table = new Activities_Table();
		$table->prepare_items();
		Admin::form_open( 'rn_activities_bulk', array( '_redirect' => isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '' ) );
		$table->display();
		echo '</form>';
	}

	/* ------------------------------------------------------------------ */
	/* Fiche                                                              */
	/* ------------------------------------------------------------------ */

	private static function render_edit( $id ) {
		global $wpdb;
		$a = $id ? Activities::get( $id ) : null;
		if ( $id && ! $a ) {
			echo '<div class="wrap rn-wrap"><p>Type de travaux introuvable.</p></div>';
			return;
		}
		$a = $a ? $a : array(
			'id'          => 0,
			'name'        => '',
			'slug'        => '',
			'excerpt'     => '',
			'content'     => '',
			'category_id' => 0,
			'icon'        => 'hammer',
			'keywords'    => array(),
			'questions'   => array(),
			'prices'      => array(),
			'faq'         => array(),
			'popular'     => false,
			'featured'    => false,
			'active'      => true,
			'auto_layout' => true,
			'order'       => 0,
			'boost'       => 0,
			'image'       => '',
			'url'         => '',
		);
		$thumb_id = $a['id'] ? (int) get_post_thumbnail_id( $a['id'] ) : 0;

		echo '<div class="wrap rn-wrap">';
		echo '<nav class="rn-crumbs"><a href="' . esc_url( Util::admin_url( 'reno360-activities' ) ) . '">Travaux et mots-clés</a> / ' . esc_html( $a['id'] ? $a['name'] : 'Nouveau' ) . '</nav>';
		$actions = '';
		if ( $a['id'] ) {
			$actions .= '<a class="button" href="' . esc_url( $a['url'] ) . '" target="_blank" rel="noopener">Voir la page</a> ';
			$actions .= '<a class="button" href="' . esc_url( get_edit_post_link( $a['id'] ) ) . '">Ouvrir dans l’éditeur WordPress / Divi</a> ';
		}
		Admin::header( $a['id'] ? $a['name'] : 'Nouveau type de travaux', $actions );

		Admin::form_open( 'rn_activity_save', array( 'id' => $a['id'] ), 'class="rn-edit-layout" data-rn-activity-form' );
		echo '<div class="rn-edit-main">';

		// Général.
		echo '<section class="rn-card"><div class="rn-form-grid">';
		printf( '<label class="rn-span2"><span>Nom <span class="rn-req">*</span></span><input type="text" name="name" value="%s" required class="rn-input-lg"></label>', esc_attr( $a['name'] ) );
		printf( '<label>Adresse de la page (slug)<input type="text" name="slug" value="%s" placeholder="généré depuis le nom"></label>', esc_attr( $a['slug'] ) );
		echo '<label>Catégorie' . Admin::select( 'category_id', self::category_options(), (string) $a['category_id'], '', '— Sans catégorie —' ) . '</label>'; // phpcs:ignore WordPress.Security.EscapeOutput
		printf( '<label class="rn-span2">Description courte <small class="rn-muted">(cartes, résultats de recherche, haut de page)</small><textarea name="excerpt" rows="2" maxlength="200">%s</textarea></label>', esc_textarea( $a['excerpt'] ) );
		echo '</div></section>';

		// Mots-clés.
		echo '<section class="rn-card" id="rn-keywords"><div class="rn-card__head"><h2>Mots-clés de recherche <span class="rn-muted" data-rn-kw-count>' . count( $a['keywords'] ) . '</span></h2><button type="button" class="button-link" data-rn-kw-sort>Trier A→Z</button></div>';
		echo '<p class="rn-muted rn-small">Appuyez sur Entrée ou tapez une virgule pour ajouter. Vous pouvez coller une liste entière. Pas besoin des accents, des pluriels ni des fautes courantes : la recherche les gère.</p>';
		echo '<div class="rn-kw-editor" data-rn-kw-editor><div class="rn-kw-chips" data-rn-kw-chips></div><input type="text" class="rn-kw-input" data-rn-kw-input placeholder="Ajouter un mot-clé…" aria-label="Ajouter un mot-clé"></div>';
		echo '<textarea name="keywords" class="rn-kw-raw" data-rn-kw-raw rows="4" aria-label="Mots-clés (un par ligne)">' . esc_textarea( implode( "\n", $a['keywords'] ) ) . '</textarea>';
		if ( $a['id'] ) {
			$t        = Installer::table( 'search_log' );
			$no_res   = Search::top_queries( 60, 12, true );
			$selected = $wpdb->get_results( $wpdb->prepare( "SELECT MAX(q) AS q, COUNT(*) AS hits FROM $t WHERE selected_id = %d GROUP BY norm ORDER BY hits DESC LIMIT 10", $a['id'] ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
			if ( $no_res ) {
				echo '<div class="rn-kw-suggest"><strong>Recherches récentes sans résultat</strong> <span class="rn-muted rn-small">— cliquez pour ajouter comme mot-clé :</span><div>';
				foreach ( $no_res as $row ) {
					printf( '<button type="button" class="rn-kw rn-kw--add" data-rn-kw-add="%1$s">+ %2$s <small>×%3$d</small></button>', esc_attr( $row['q'] ), esc_html( $row['q'] ), (int) $row['hits'] );
				}
				echo '</div></div>';
			}
			if ( $selected ) {
				echo '<div class="rn-kw-suggest"><strong>Recherches qui ont mené à ce travail</strong><div>';
				foreach ( $selected as $row ) {
					printf( '<span class="rn-kw">%1$s <small>×%2$d</small></span>', esc_html( $row['q'] ), (int) $row['hits'] );
				}
				echo '</div></div>';
			}
		}
		echo '</section>';

		// Questions.
		echo '<section class="rn-card"><div class="rn-card__head"><h2>Questions du formulaire</h2></div>';
		echo '<p class="rn-muted rn-small">Posées à l’étape « Détails » quand le client choisit ce travail. Sans question, des questions génériques sont utilisées.</p>';
		echo '<div class="rn-repeater" data-rn-repeater="questions"><div data-rn-rows>';
		foreach ( $a['questions'] as $i => $q ) {
			self::question_row( $i, $q );
		}
		echo '</div><template data-rn-template>';
		self::question_row( '__i__', array( 'label' => '', 'type' => 'single', 'options' => array(), 'required' => false ) );
		echo '</template><button type="button" class="button" data-rn-add>+ Ajouter une question</button></div></section>';

		// Prix.
		echo '<section class="rn-card"><div class="rn-card__head"><h2>Prix indicatifs <small class="rn-muted">(page publique, facultatif)</small></h2></div>';
		echo '<div class="rn-repeater" data-rn-repeater="prices"><div data-rn-rows>';
		foreach ( $a['prices'] as $i => $p ) {
			self::price_row( $i, $p );
		}
		echo '</div><template data-rn-template>';
		self::price_row( '__i__', array( 'label' => '', 'range' => '', 'duration' => '' ) );
		echo '</template><button type="button" class="button" data-rn-add>+ Ajouter une ligne de prix</button></div></section>';

		// FAQ.
		echo '<section class="rn-card"><div class="rn-card__head"><h2>Questions fréquentes <small class="rn-muted">(page publique + données structurées Google)</small></h2></div>';
		echo '<div class="rn-repeater" data-rn-repeater="faq"><div data-rn-rows>';
		foreach ( $a['faq'] as $i => $f ) {
			self::faq_row( $i, $f );
		}
		echo '</div><template data-rn-template>';
		self::faq_row( '__i__', array( 'q' => '', 'a' => '' ) );
		echo '</template><button type="button" class="button" data-rn-add>+ Ajouter une question fréquente</button></div></section>';

		// Contenu.
		echo '<section class="rn-card"><div class="rn-card__head"><h2>Texte de la page <small class="rn-muted">(référencement)</small></h2></div>';
		wp_editor(
			$a['content'],
			'rn_content',
			array(
				'textarea_name' => 'content',
				'textarea_rows' => 12,
				'media_buttons' => true,
			)
		);
		echo '</section>';
		echo '</div>';

		// Colonne latérale.
		echo '<aside class="rn-edit-side">';
		echo '<section class="rn-card"><div class="rn-card__head"><h2>Publication</h2></div>';
		echo '<label class="rn-toggle"><input type="checkbox" name="active" value="1"' . checked( $a['active'], true, false ) . '><span>Actif (visible sur le site et dans la recherche)</span></label>';
		echo '<label class="rn-toggle"><input type="checkbox" name="popular" value="1"' . checked( $a['popular'], true, false ) . '><span>Populaire (raccourcis « Populaire » et formulaire)</span></label>';
		echo '<label class="rn-toggle"><input type="checkbox" name="featured" value="1"' . checked( $a['featured'], true, false ) . '><span>En vedette (grande carte sur l’accueil)</span></label>';
		echo '<label class="rn-toggle"><input type="checkbox" name="auto_layout" value="1"' . checked( $a['auto_layout'], true, false ) . '><span>Mise en page automatique de la page publique <small class="rn-muted">(décochez pour la composer avec Divi)</small></span></label>';
		printf( '<label>Ordre d’affichage<input type="number" name="order" value="%d" class="small-text"></label>', (int) $a['order'] );
		printf( '<label>Priorité dans la recherche <output data-rn-out>%1$d</output><input type="range" name="boost" min="0" max="10" value="%1$d" oninput="this.previousElementSibling.value=this.value"></label>', (int) $a['boost'] );
		echo '<p class="submit"><button class="button button-primary button-large rn-full">' . ( $a['id'] ? 'Enregistrer' : 'Créer' ) . '</button></p>';
		if ( $a['id'] ) {
			echo '<a class="rn-danger" href="' . esc_url( Admin::action_url( 'rn_activity_delete', array( 'id' => $a['id'] ) ) ) . '" data-rn-confirm="Supprimer définitivement « ' . esc_attr( $a['name'] ) . ' » ?">Supprimer ce type de travaux</a>';
		}
		echo '</section>';

		echo '<section class="rn-card"><div class="rn-card__head"><h2>Icône</h2></div><div class="rn-icon-picker" role="radiogroup" aria-label="Icône">';
		foreach ( Icons::activity_keys() as $key ) {
			printf( '<label title="%1$s"><input type="radio" name="icon" value="%1$s"%2$s><span>%3$s</span></label>', esc_attr( $key ), checked( $a['icon'], $key, false ), Icons::svg( $key, 20 ) ); // phpcs:ignore WordPress.Security.EscapeOutput
		}
		echo '</div></section>';

		echo '<section class="rn-card"><div class="rn-card__head"><h2>Image</h2></div><div class="rn-media" data-rn-media>';
		echo '<input type="hidden" name="thumbnail_id" value="' . (int) $thumb_id . '" data-rn-media-id>';
		echo '<div class="rn-media__preview" data-rn-media-preview>' . ( $a['image'] ? '<img src="' . esc_url( $a['image'] ) . '" alt="">' : '<span class="rn-muted">Aucune image</span>' ) . '</div>';
		echo '<button type="button" class="button" data-rn-media-pick>Choisir une image</button> <button type="button" class="button-link rn-danger" data-rn-media-clear>Retirer</button>';
		echo '</div></section>';
		echo '</aside>';
		echo '</form></div>';
	}

	private static function question_row( $i, array $q ) {
		$types = array(
			'single'   => 'Un seul choix',
			'multiple' => 'Plusieurs choix',
			'text'     => 'Texte libre',
		);
		echo '<div class="rn-rep-row" data-rn-row>';
		echo '<div class="rn-rep-fields rn-form-grid">';
		printf( '<label class="rn-span2">Question<input type="text" name="questions[%1$s][label]" value="%2$s" placeholder="Ex. Que souhaitez-vous faire ?"></label>', esc_attr( $i ), esc_attr( $q['label'] ) );
		echo '<label>Type' . Admin::select( 'questions[' . $i . '][type]', $types, $q['type'] ) . '</label>'; // phpcs:ignore WordPress.Security.EscapeOutput
		printf( '<label class="rn-inline-check"><input type="checkbox" name="questions[%1$s][required]" value="1"%2$s> Réponse obligatoire</label>', esc_attr( $i ), checked( ! empty( $q['required'] ), true, false ) );
		printf( '<label class="rn-span2">Choix proposés <small class="rn-muted">(un par ligne)</small><textarea name="questions[%1$s][options]" rows="4">%2$s</textarea></label>', esc_attr( $i ), esc_textarea( implode( "\n", (array) $q['options'] ) ) );
		echo '</div>';
		echo '<div class="rn-rep-tools"><button type="button" class="button-link" data-rn-up aria-label="Monter">↑</button><button type="button" class="button-link" data-rn-down aria-label="Descendre">↓</button><button type="button" class="button-link rn-danger" data-rn-remove>Supprimer</button></div>';
		echo '</div>';
	}

	private static function price_row( $i, array $p ) {
		echo '<div class="rn-rep-row" data-rn-row><div class="rn-rep-fields rn-form-grid rn-form-grid--3">';
		printf( '<label>Prestation<input type="text" name="prices[%1$s][label]" value="%2$s" placeholder="Rénovation complète (5 à 6 m²)"></label>', esc_attr( $i ), esc_attr( $p['label'] ) );
		printf( '<label>Fourchette<input type="text" name="prices[%1$s][range]" value="%2$s" placeholder="CHF 15\'000 – 25\'000"></label>', esc_attr( $i ), esc_attr( $p['range'] ) );
		printf( '<label>Durée typique<input type="text" name="prices[%1$s][duration]" value="%2$s" placeholder="2 à 3 semaines"></label>', esc_attr( $i ), esc_attr( $p['duration'] ) );
		echo '</div><div class="rn-rep-tools"><button type="button" class="button-link" data-rn-up aria-label="Monter">↑</button><button type="button" class="button-link" data-rn-down aria-label="Descendre">↓</button><button type="button" class="button-link rn-danger" data-rn-remove>Supprimer</button></div></div>';
	}

	private static function faq_row( $i, array $f ) {
		echo '<div class="rn-rep-row" data-rn-row><div class="rn-rep-fields rn-form-grid">';
		printf( '<label class="rn-span2">Question<input type="text" name="faq[%1$s][q]" value="%2$s"></label>', esc_attr( $i ), esc_attr( $f['q'] ) );
		printf( '<label class="rn-span2">Réponse<textarea name="faq[%1$s][a]" rows="3">%2$s</textarea></label>', esc_attr( $i ), esc_textarea( $f['a'] ) );
		echo '</div><div class="rn-rep-tools"><button type="button" class="button-link" data-rn-up aria-label="Monter">↑</button><button type="button" class="button-link" data-rn-down aria-label="Descendre">↓</button><button type="button" class="button-link rn-danger" data-rn-remove>Supprimer</button></div></div>';
	}

	/* ------------------------------------------------------------------ */
	/* Catégories                                                         */
	/* ------------------------------------------------------------------ */

	private static function render_categories() {
		$icons = array_combine( Icons::activity_keys(), Icons::activity_keys() );
		echo '<div class="rn-cols rn-cols--top"><section class="rn-card rn-col-main rn-card--flush"><table class="rn-table"><thead><tr><th>Catégorie</th><th>Travaux</th><th>Ordre</th><th></th></tr></thead><tbody>';
		$cats = Activities::categories();
		if ( ! $cats ) {
			echo '<tr><td colspan="4" class="rn-muted">Aucune catégorie.</td></tr>';
		}
		foreach ( $cats as $c ) {
			echo '<tr><td><span class="rn-act-name"><span class="rn-act-ico">' . Icons::svg( $c['icon'], 18 ) . '</span><span><strong>' . esc_html( $c['name'] ) . '</strong><small class="rn-muted">' . esc_html( $c['slug'] ) . '</small></span></span>'; // phpcs:ignore WordPress.Security.EscapeOutput
			echo '<details class="rn-inline-edit"><summary>Modifier</summary>';
			Admin::form_open( 'rn_category_save', array( 'id' => $c['id'] ), 'class="rn-form-grid"' );
			printf( '<label>Nom<input type="text" name="name" value="%s" required></label>', esc_attr( $c['name'] ) );
			printf( '<label>Slug<input type="text" name="slug" value="%s"></label>', esc_attr( $c['slug'] ) );
			printf( '<label>Ordre<input type="number" name="order" value="%d"></label>', (int) $c['order'] );
			echo '<label>Icône' . Admin::select( 'icon', $icons, $c['icon'] ) . '</label>'; // phpcs:ignore WordPress.Security.EscapeOutput
			printf( '<label class="rn-span2">Description<textarea name="description" rows="2">%s</textarea></label>', esc_textarea( $c['description'] ) );
			echo '<div><button class="button button-primary">Enregistrer</button></div></form></details></td>';
			echo '<td><a href="' . esc_url( Util::admin_url( 'reno360-activities', array( 'cat' => $c['id'] ) ) ) . '">' . (int) $c['count'] . '</a></td><td>' . (int) $c['order'] . '</td>';
			echo '<td><a class="rn-danger" href="' . esc_url( Admin::action_url( 'rn_category_delete', array( 'id' => $c['id'] ) ) ) . '" data-rn-confirm="Supprimer la catégorie « ' . esc_attr( $c['name'] ) . ' » ? Ses travaux ne sont pas supprimés.">Supprimer</a></td></tr>';
		}
		echo '</tbody></table></section>';
		echo '<section class="rn-card rn-col-side"><div class="rn-card__head"><h2>Nouvelle catégorie</h2></div>';
		Admin::form_open( 'rn_category_save', array(), 'class="rn-stack-admin"' );
		echo '<label>Nom<input type="text" name="name" required></label><label>Ordre<input type="number" name="order" value="' . ( count( $cats ) + 1 ) . '"></label>';
		echo '<label>Icône' . Admin::select( 'icon', $icons, 'hammer' ) . '</label><label>Description<textarea name="description" rows="2"></textarea></label><button class="button button-primary">Créer</button></form></section></div>'; // phpcs:ignore WordPress.Security.EscapeOutput
	}

	/* ------------------------------------------------------------------ */
	/* Import / export                                                    */
	/* ------------------------------------------------------------------ */

	private static function render_import() {
		echo '<div class="rn-cols rn-cols--top"><section class="rn-card rn-col-main"><div class="rn-card__head"><h2>Importer un fichier CSV</h2></div>';
		echo '<p>Format : séparateur point-virgule, encodage UTF-8, première ligne d’en-têtes :</p>';
		echo '<pre class="rn-code">slug;nom;categorie;mots_cles;description;icone;populaire;vedette;actif;ordre
poele-pellets;Poêle à pellets;energie;poêle | pellets | granulés | chauffage bois;Installation et entretien de poêles;flame;0;0;1;60</pre>';
		echo '<p class="rn-muted rn-small">Seule la colonne <code>nom</code> est obligatoire. Les travaux existants (même slug) sont mis à jour ; les catégories inconnues sont créées. Les mots-clés sont séparés par « | » ou des virgules. Astuce : exportez d’abord la liste actuelle, modifiez-la dans Excel, puis réimportez-la.</p>';
		Admin::form_open( 'rn_activities_import', array(), 'enctype="multipart/form-data" class="rn-stack-admin"' );
		echo '<input type="file" name="csv" accept=".csv,text/csv" required>';
		echo '<fieldset><legend class="rn-overline">Mots-clés des travaux existants</legend><label class="rn-inline-check"><input type="radio" name="mode" value="merge" checked> Ajouter aux mots-clés existants</label><label class="rn-inline-check"><input type="radio" name="mode" value="replace"> Remplacer par ceux du fichier</label></fieldset>';
		echo '<button class="button button-primary">Importer</button></form></section>';
		echo '<section class="rn-card rn-col-side"><div class="rn-card__head"><h2>Exporter</h2></div><p>Téléchargez tous les travaux, catégories et mots-clés au même format.</p><p><a class="button" href="' . esc_url( Admin::action_url( 'rn_activities_export' ) ) . '">Exporter CSV</a></p>';
		echo '<div class="rn-card__head rn-mt"><h2>Liste de départ</h2></div><p class="rn-muted rn-small">Recrée les types de travaux fournis avec l’extension qui auraient été supprimés (les autres ne sont pas modifiés).</p>';
		echo '<p><a class="button" href="' . esc_url( Admin::action_url( 'rn_activities_reseed' ) ) . '" data-rn-confirm="Restaurer les types de travaux de départ manquants ?">Restaurer les manquants</a></p></section></div>';
	}
}
