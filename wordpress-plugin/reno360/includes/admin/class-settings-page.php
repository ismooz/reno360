<?php
/**
 * Réglages : général, formulaire, notifications et e-mails, automatisations, données, intégration Divi.
 *
 * @package Reno360
 */

namespace Reno360\Admin;

use Reno360\Notifications;
use Reno360\Settings;
use Reno360\Util;

defined( 'ABSPATH' ) || exit;

class Settings_Page {

	public static function tabs() {
		return array(
			'general'       => 'Général',
			'form'          => 'Formulaire',
			'notifications' => 'Notifications et e-mails',
			'automations'   => 'Automatisations',
			'content'       => 'Contenus',
			'data'          => 'Données (nLPD)',
			'integration'   => 'Pages et intégration Divi',
		);
	}

	public static function render() {
		$tab = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'general'; // phpcs:ignore WordPress.Security.NonceVerification
		$tab = isset( self::tabs()[ $tab ] ) ? $tab : 'general';
		$s   = Settings::all();
		echo '<div class="wrap rn-wrap">';
		Admin::header( 'Réglages' );
		echo '<nav class="nav-tab-wrapper rn-tabs-nav">';
		foreach ( self::tabs() as $k => $label ) {
			printf( '<a class="nav-tab%s" href="%s">%s</a>', $tab === $k ? ' nav-tab-active' : '', esc_url( Util::admin_url( 'reno360-settings', array( 'tab' => $k ) ) ), esc_html( $label ) );
		}
		echo '</nav>';

		if ( 'integration' === $tab ) {
			self::integration();
			echo '</div>';
			return;
		}

		Admin::form_open( 'rn_settings_save', array( 'tab' => $tab ), 'class="rn-card rn-form-card rn-settings"' );
		call_user_func( array( __CLASS__, 'tab_' . $tab ), $s );
		echo '<p class="submit"><button class="button button-primary button-large">Enregistrer les réglages</button></p></form>';
		echo '</div>';
	}

	private static function text( $name, $label, $value, $help = '', $type = 'text', $attrs = '' ) {
		printf( '<label class="rn-setting"><span class="rn-setting__label">%1$s</span><input type="%4$s" name="%2$s" value="%3$s" %6$s>%5$s</label>', esc_html( $label ), esc_attr( $name ), esc_attr( (string) $value ), esc_attr( $type ), $help ? '<small class="rn-muted">' . wp_kses_post( $help ) . '</small>' : '', $attrs ); // phpcs:ignore WordPress.Security.EscapeOutput
	}

	private static function area( $name, $label, $value, $help = '', $rows = 5 ) {
		printf( '<label class="rn-setting"><span class="rn-setting__label">%1$s</span><textarea name="%2$s" rows="%5$d">%3$s</textarea>%4$s</label>', esc_html( $label ), esc_attr( $name ), esc_textarea( (string) $value ), $help ? '<small class="rn-muted">' . wp_kses_post( $help ) . '</small>' : '', (int) $rows ); // phpcs:ignore WordPress.Security.EscapeOutput
	}

	private static function check( $name, $label, $checked, $help = '' ) {
		printf( '<label class="rn-setting rn-setting--check"><input type="checkbox" name="%1$s" value="1"%3$s><span>%2$s%4$s</span></label>', esc_attr( $name ), esc_html( $label ), checked( (bool) $checked, true, false ), $help ? '<small class="rn-muted">' . wp_kses_post( $help ) . '</small>' : '' ); // phpcs:ignore WordPress.Security.EscapeOutput
	}

	private static function tab_general( array $s ) {
		echo '<h2>Entreprise</h2><div class="rn-settings-grid">';
		self::text( 'company', 'Nom affiché', $s['company'] );
		self::text( 'phone', 'Téléphone public', $s['phone'] );
		self::text( 'public_email', 'E-mail public', $s['public_email'], 'Aussi utilisé comme adresse de réponse des e-mails.', 'email' );
		self::text( 'address', 'Adresse', $s['address'] );
		echo '</div><h2>Apparence</h2><div class="rn-settings-grid">';
		self::text( 'primary_color', 'Couleur principale', $s['primary_color'], 'Boutons, liens et accents. Contraste conseillé avec le blanc : au moins 4,5:1.', 'color' );
		echo '<div class="rn-setting"><span class="rn-setting__label">Logo (e-mails)</span><div class="rn-media" data-rn-media><input type="hidden" name="logo_id" value="' . (int) $s['logo_id'] . '" data-rn-media-id><div class="rn-media__preview rn-media__preview--logo" data-rn-media-preview><img src="' . esc_url( Settings::logo_url() ) . '" alt=""></div><button type="button" class="button" data-rn-media-pick>Choisir</button> <button type="button" class="button-link rn-danger" data-rn-media-clear>Logo par défaut</button></div></div>';
		self::check( 'use_fonts', 'Utiliser la typographie Reno360 (hébergée sur votre site, sans Google Fonts)', $s['use_fonts'], 'Décochez pour reprendre les polices de votre thème Divi.' );
		echo '</div><h2>Fonctionnement</h2><div class="rn-settings-grid">';
		self::text( 'max_artisans', 'Nombre maximal d’artisans par demande', $s['max_artisans'], '', 'number', 'min="1" max="10"' );
		self::text( 'sla_hours', 'Délai de prise en charge annoncé (heures ouvrées)', $s['sla_hours'], 'Affiché aux clients et utilisé pour signaler les demandes hors délai.', 'number', 'min="1"' );
		self::text( 'activities_slug', 'Préfixe des pages de travaux', $s['activities_slug'], 'Ex. « travaux » → ' . esc_html( home_url( '/travaux/salle-de-bain/' ) ) );
		echo '</div><div class="rn-setting"><span class="rn-setting__label">Cantons desservis</span><div class="rn-pills-check">';
		foreach ( Util::cantons() as $code => $name ) {
			printf( '<label><input type="checkbox" name="cantons[]" value="%1$s"%3$s> %2$s</label>', esc_attr( $code ), esc_html( $name ), checked( in_array( $code, (array) $s['cantons'], true ), true, false ) );
		}
		echo '</div></div>';
	}

	private static function tab_form( array $s ) {
		echo '<p class="rn-muted">Une option par ligne. Les questions propres à chaque type de travaux se règlent dans <a href="' . esc_url( Util::admin_url( 'reno360-activities' ) ) . '">Travaux et mots-clés</a>.</p><div class="rn-settings-grid">';
		self::area( 'budgets', 'Budgets proposés', $s['budgets'] );
		self::area( 'start_options', 'Débuts souhaités', $s['start_options'] );
		self::area( 'property_types', 'Types de bien', $s['property_types'] );
		self::area( 'client_types', 'Statuts du client', $s['client_types'] );
		self::area( 'contact_prefs', 'Modes de contact', $s['contact_prefs'], '', 3 );
		self::area( 'contact_times', 'Moments de contact', $s['contact_times'], '', 4 );
		echo '</div><h2>Règles</h2><div class="rn-settings-grid">';
		self::text( 'max_files', 'Nombre maximal de fichiers', $s['max_files'], '', 'number', 'min="0" max="30"' );
		self::text( 'max_file_mb', 'Taille maximale par fichier (Mo)', $s['max_file_mb'], 'Limite actuelle du serveur : ' . esc_html( size_format( wp_max_upload_size() ) ) . '.', 'number', 'min="1" max="100"' );
		self::text( 'min_description', 'Longueur minimale de la description', $s['min_description'], '', 'number', 'min="0"' );
		self::check( 'require_phone', 'Téléphone obligatoire', $s['require_phone'] );
		echo '</div><h2>Textes</h2><div class="rn-settings-grid">';
		self::text( 'terms_url', 'Lien des conditions générales', $s['terms_url'], '', 'url' );
		self::text( 'privacy_url', 'Lien de la politique de confidentialité', $s['privacy_url'], 'Vide = page de confidentialité de WordPress.', 'url' );
		self::area( 'consent_text', 'Texte de consentement', $s['consent_text'], 'Les mots « conditions générales » et « politique de confidentialité » deviennent des liens. Variable : {max_artisans}.', 3 );
		self::area( 'success_text', 'Message après envoi', $s['success_text'], 'Variables : {sla_hours}, {company}.', 3 );
		echo '</div>';
	}

	private static function tab_notifications( array $s ) {
		echo '<h2>Expéditeur</h2><div class="rn-settings-grid">';
		self::text( 'notify_emails', 'E-mails de l’équipe (nouvelles demandes, alertes)', $s['notify_emails'], 'Plusieurs adresses séparées par des virgules.' );
		self::text( 'from_name', 'Nom de l’expéditeur', $s['from_name'] );
		self::text( 'from_email', 'Adresse de l’expéditeur', $s['from_email'], 'Doit appartenir à votre domaine. Pour une bonne délivrabilité, installez une extension SMTP (WP Mail SMTP, FluentSMTP) avec votre serveur Infomaniak.', 'email' );
		echo '<div class="rn-setting"><span class="rn-setting__label">Tester</span><a class="button" href="' . esc_url( Admin::action_url( 'rn_test_email' ) ) . '">M’envoyer un e-mail de test</a></div>';
		echo '</div><h2>Suivi</h2><div class="rn-setting"><span class="rn-setting__label">Prévenir le client quand la demande passe en</span><div class="rn-pills-check">';
		foreach ( Util::statuses() as $k => $st ) {
			if ( 'nouvelle' === $k ) {
				continue;
			}
			printf( '<label><input type="checkbox" name="notify_client_status[]" value="%1$s"%3$s> %2$s</label>', esc_attr( $k ), esc_html( $st['label'] ), checked( in_array( $k, (array) $s['notify_client_status'], true ), true, false ) );
		}
		echo '</div></div><div class="rn-settings-grid">';
		self::check( 'notify_client_quote', 'Prévenir le client à chaque devis reçu', $s['notify_client_quote'] );
		self::check( 'notify_admin_quote', 'Prévenir l’équipe quand un artisan dépose un devis', $s['notify_admin_quote'] );
		self::check( 'notify_losers', 'Informer les artisans non retenus', $s['notify_losers'] );
		self::check( 'share_client_contact', 'Montrer les coordonnées du client aux artisans consultés', $s['share_client_contact'], 'Sinon, elles ne sont transmises qu’à l’artisan dont le devis est accepté.' );
		self::text( 'review_url', 'Lien pour laisser un avis (Google)', $s['review_url'], 'Utilisé par la demande d’avis automatique après les travaux.', 'url' );
		echo '</div>';

		echo '<h2>Modèles d’e-mails</h2><p class="rn-muted">Variables disponibles : <code>' . esc_html( implode( ' ', Notifications::placeholders() ) ) . '</code>. Laissez un champ tel quel pour garder le texte par défaut.</p>';
		foreach ( Notifications::defaults() as $key => $d ) {
			$t = Notifications::template( $key );
			echo '<details class="rn-email-tpl"><summary><strong>' . esc_html( $d['label'] ) . '</strong>' . ( $t['enabled'] ? '' : ' <span class="rn-badge rn-badge--red">Désactivé</span>' ) . '</summary><div class="rn-email-tpl__body">';
			printf( '<label class="rn-setting rn-setting--check"><input type="checkbox" name="emails[%1$s][enabled]" value="1"%2$s><span>Envoyer cet e-mail</span></label>', esc_attr( $key ), checked( $t['enabled'], true, false ) );
			printf( '<label class="rn-setting"><span class="rn-setting__label">Objet</span><input type="text" name="emails[%1$s][subject]" value="%2$s"></label>', esc_attr( $key ), esc_attr( $t['subject'] ) );
			printf( '<label class="rn-setting"><span class="rn-setting__label">Message</span><textarea name="emails[%1$s][body]" rows="8">%2$s</textarea></label>', esc_attr( $key ), esc_textarea( $t['body'] ) );
			if ( ! empty( $d['cta'][0] ) ) {
				echo '<p class="rn-muted rn-small">Bouton ajouté automatiquement : « ' . esc_html( $d['cta'][0] ) . ' ».</p>';
			}
			echo '</div></details>';
		}
	}

	private static function tab_automations( array $s ) {
		echo '<p class="rn-muted">Exécutées toutes les heures par WP-Cron. Sur un site peu visité, ajoutez une tâche planifiée serveur (Infomaniak : « Tâches planifiées ») qui appelle <code>' . esc_html( site_url( 'wp-cron.php' ) ) . '</code> toutes les 15 minutes.</p>';
		$rows = array(
			array( 'auto_unhandled', 'auto_unhandled_hours', 'Alerter l’équipe si une demande reste « Nouvelle »', 'heures' ),
			array( 'auto_artisan', 'auto_artisan_days', 'Relancer l’artisan qui n’a pas envoyé son devis', 'jours après l’envoi' ),
			array( 'auto_client_choose', 'auto_client_days', 'Relancer le client qui n’a pas choisi de devis', 'jours après le dernier devis' ),
			array( 'auto_review', 'auto_review_days', 'Demander un avis au client après les travaux', 'jours après « Terminée »' ),
			array( 'auto_docs', 'auto_docs_days', 'Signaler les attestations RC Pro qui expirent', 'jours avant l’échéance' ),
		);
		echo '<table class="rn-table rn-auto-table"><tbody>';
		foreach ( $rows as $r ) {
			printf( '<tr><td><label class="rn-inline-check"><input type="checkbox" name="%1$s" value="1"%3$s> %4$s</label></td><td><input type="number" class="small-text" name="%2$s" value="%5$d" min="1" aria-label="Délai"> %6$s</td></tr>', esc_attr( $r[0] ), esc_attr( $r[1] ), checked( (bool) $s[ $r[0] ], true, false ), esc_html( $r[2] ), (int) $s[ $r[1] ], esc_html( $r[3] ) );
		}
		echo '</tbody></table>';
		$next = wp_next_scheduled( 'reno360_cron' );
		echo '<p class="rn-muted">Prochaine exécution : ' . esc_html( $next ? wp_date( 'd.m.Y H:i', $next ) : 'non planifiée' ) . ' · <a href="' . esc_url( Admin::action_url( 'rn_run_cron' ) ) . '">Exécuter maintenant</a></p>';
	}

	private static function tab_content( array $s ) {
		self::area( 'faq', 'Questions fréquentes (accueil)', $s['faq'], 'Une question par ligne, au format « Question ? :: Réponse ». Variables : {max_artisans}, {sla_hours}, {company}.', 10 );
	}

	private static function tab_data( array $s ) {
		echo '<div class="rn-settings-grid">';
		self::text( 'retention_months', 'Supprimer automatiquement les demandes terminées ou perdues après (mois)', $s['retention_months'], '0 = jamais. Recommandé : 24 à 36 mois.', 'number', 'min="0"' );
		self::text( 'search_log_days', 'Conservation du journal des recherches (jours)', $s['search_log_days'], 'Le journal ne contient aucune donnée personnelle.', 'number', 'min="7"' );
		self::check( 'delete_on_uninstall', 'Supprimer toutes les données Reno360 lors de la suppression de l’extension', $s['delete_on_uninstall'], 'Tables, réglages, travaux et fichiers privés. À utiliser avec prudence.' );
		echo '</div><div class="rn-notice-box"><strong>Protection des données (nLPD)</strong><ul><li>Les fichiers des clients sont stockés hors de la médiathèque, dans un dossier protégé, et servis par des liens signés à durée limitée.</li><li>Aucune adresse IP n’est conservée (la limitation anti-abus utilise une empreinte temporaire).</li><li>Le consentement et sa date sont enregistrés avec chaque demande.</li><li>Droit à l’effacement : menu Clients → « Effacer ses données ».</li><li>Les polices sont servies depuis votre site (pas de Google Fonts).</li></ul></div>';
	}

	private static function integration() {
		$pages = (array) get_option( 'reno360_pages', array() );
		$defs  = \Reno360\Installer::page_definitions();
		echo '<div class="rn-cols rn-cols--top"><section class="rn-card rn-col-main"><div class="rn-card__head"><h2>Pages du site</h2><a class="button" href="' . esc_url( Admin::action_url( 'rn_pages_create' ) ) . '">Recréer les pages manquantes</a></div>';
		echo '<table class="rn-table"><tbody>';
		foreach ( $defs as $key => $d ) {
			$id = isset( $pages[ $key ] ) ? (int) $pages[ $key ] : 0;
			$ok = $id && get_post( $id ) && 'trash' !== get_post_status( $id );
			echo '<tr><td><strong>' . esc_html( $d['title'] ) . '</strong><br><code>' . esc_html( $d['content'] ) . '</code></td><td>' . ( $ok ? '<a href="' . esc_url( get_permalink( $id ) ) . '" target="_blank" rel="noopener">' . esc_html( get_permalink( $id ) ) . '</a>' : '<span class="rn-badge rn-badge--red">Manquante</span>' ) . '</td><td>' . ( $ok ? '<a href="' . esc_url( get_edit_post_link( $id ) ) . '">Modifier</a>' : '' ) . '</td></tr>';
		}
		echo '</tbody></table>';
		$home = Settings::page_id( 'home' );
		if ( $home && (int) get_option( 'page_on_front' ) !== $home ) {
			echo '<p><a class="button button-primary" href="' . esc_url( Admin::action_url( 'rn_front_page' ) ) . '" data-rn-confirm="Utiliser « Accueil Reno360 » comme page d’accueil du site ?">Définir « Accueil Reno360 » comme page d’accueil</a></p>';
		}
		echo '</section>';

		echo '<section class="rn-card rn-col-side"><div class="rn-card__head"><h2>Avec Divi 5</h2></div><ol class="rn-steps-admin">';
		echo '<li>Les pages ci-contre fonctionnent telles quelles (gabarit « Reno360 — pleine largeur », en-tête et pied de page Divi conservés).</li>';
		echo '<li>Pour composer une page avec le Visual Builder, ajoutez un module <strong>Code</strong> (ou Texte) et collez un shortcode de la liste ci-dessous.</li>';
		echo '<li>Pour une page de travaux mise en page avec Divi : décochez « Mise en page automatique » dans la fiche du travail puis ouvrez-la dans l’éditeur.</li>';
		echo '<li>Les styles Reno360 sont isolés (préfixe <code>.rn-app</code>) et reprennent la couleur choisie dans Réglages → Général.</li>';
		echo '</ol></section></div>';

		$codes = array(
			'[reno360_home]'                                     => 'Page d’accueil complète (toutes les sections ci-dessous)',
			'[reno360_search title="" button="Recevoir mes devis"]' => 'Recherche « Quels travaux ? » + NPA avec suggestions',
			'[reno360_trust]'                                    => 'Bandeau des engagements',
			'[reno360_featured]'                                 => 'Travaux en vedette (photos) et catégories',
			'[reno360_categories]'                               => 'Grille des catégories',
			'[reno360_how_it_works]'                             => 'Comment ça marche (4 étapes)',
			'[reno360_why]'                                      => 'Comparatif « pourquoi nous »',
			'[reno360_energy]'                                   => 'Rénovation énergétique et subventions',
			'[reno360_partner_cta]'                              => 'Encart recrutement des artisans',
			'[reno360_faq]'                                      => 'Questions fréquentes',
			'[reno360_cta title="" text=""]'                     => 'Bandeau d’appel à l’action',
			'[reno360_activities target="page"]'                 => 'Catalogue de tous les travaux (target="form" pour aller directement au formulaire)',
			'[reno360_request_form]'                             => 'Formulaire de demande de devis',
			'[reno360_client_portal]'                            => 'Espace client',
			'[reno360_artisan]'                                  => 'Espace artisan (lien sécurisé)',
			'[reno360_partner_form]'                             => 'Candidature des artisans',
		);
		echo '<section class="rn-card rn-card--flush"><div class="rn-card__head rn-pad"><h2>Shortcodes</h2></div><table class="rn-table"><tbody>';
		foreach ( $codes as $code => $desc ) {
			echo '<tr><td><code>' . esc_html( $code ) . '</code></td><td>' . esc_html( $desc ) . '</td><td><button type="button" class="button button-small" data-rn-copy="' . esc_attr( $code ) . '">Copier</button></td></tr>';
		}
		echo '</tbody></table></section>';
		echo '<p class="rn-muted">Personnalisation avancée : copiez un fichier de <code>wp-content/plugins/reno360/templates/</code> dans <code>votre-theme-enfant/reno360/</code> pour le modifier sans perdre vos changements lors des mises à jour.</p>';
	}
}
