<?php
/**
 * Formulaire de demande de devis en 5 étapes.
 * Les étapes 1 et 2 (choix des travaux, questions spécifiques) sont construites par request-form.js.
 *
 * @package Reno360
 */

use Reno360\Activities;
use Reno360\Frontend;
use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

$rn_questions = array();
foreach ( Activities::all() as $rn_a ) {
	$rn_questions[ $rn_a['id'] ] = $rn_a['questions'];
}
wp_add_inline_script(
	'reno360-form',
	'window.RENO360_FORM = ' . \Reno360\Util::json_script(
		array(
			'questions'      => $rn_questions,
			'defaults'       => Activities::default_questions(),
			'maxFiles'       => (int) Settings::get( 'max_files', 10 ),
			'maxFileMb'      => (int) Settings::get( 'max_file_mb', 10 ),
			'minDescription' => (int) Settings::get( 'min_description', 15 ),
			'requirePhone'   => (bool) Settings::get( 'require_phone' ),
			'portalUrl'      => Settings::page_url( 'portal' ),
		)
	) . ';',
	'before'
);

$rn_lists = array(
	'property_type' => array( 'Type de bien', Settings::lines( 'property_types' ) ),
	'client_type'   => array( 'Vous êtes', Settings::lines( 'client_types' ) ),
	'start_wish'    => array( 'Début souhaité', Settings::lines( 'start_options' ) ),
);
$rn_phone     = Settings::get( 'phone' );
$rn_max_files = (int) Settings::get( 'max_files', 10 );
?>
<div class="rn-wizard" data-rn-wizard>
	<form class="rn-wizard__form" novalidate data-rn-wizard-form>
		<input type="hidden" name="rn_ts" value="<?php echo esc_attr( Frontend::form_stamp() ); ?>">
		<input type="hidden" name="activity_id" value="">
		<input type="hidden" name="q" value="">
		<input type="hidden" name="answers" value="">
		<div class="rn-hp" aria-hidden="true">
			<label>Ne pas remplir <input type="text" name="website" tabindex="-1" autocomplete="off"></label>
		</div>

		<div class="rn-wizard__top">
			<div class="rn-container rn-container--wide">
				<ol class="rn-stepper" data-rn-stepper>
					<?php foreach ( array( 'Travaux', 'Détails', 'Photos', 'Lieu et délai', 'Coordonnées' ) as $rn_i => $rn_label ) : ?>
						<li><button type="button" class="rn-stepper__btn" data-rn-goto="<?php echo (int) $rn_i + 1; ?>"><span class="rn-stepper__num"><?php echo (int) $rn_i + 1; ?></span><span class="rn-stepper__label"><?php echo esc_html( $rn_label ); ?></span></button></li>
					<?php endforeach; ?>
				</ol>
				<div class="rn-progress" aria-hidden="true"><span data-rn-progress></span></div>
			</div>
		</div>

		<div class="rn-container rn-container--wide rn-wizard__main">
			<section class="rn-wizard__card">
				<p class="rn-step-count" data-rn-step-count aria-live="polite">Étape 1 sur 5</p>
				<div class="rn-notice" data-rn-draft hidden>Nous avons restauré votre demande en cours. <button type="button" class="rn-link" data-rn-clear-draft>Recommencer</button></div>

				<!-- Étape 1 -->
				<fieldset class="rn-wstep" data-step="1">
					<legend class="rn-h2 rn-wstep__title">Quels travaux souhaitez-vous réaliser ?</legend>
					<div class="rn-wsearch" data-rn-search data-rn-target="select" data-rn-source="form">
						<label class="rn-searchbar">
							<?php echo Frontend::icon( 'search', 20 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
							<input type="text" class="rn-searchbar__input" data-rn-search-input placeholder="Tapez quelques mots : douche, fuite, peinture salon…" aria-label="Rechercher un type de travaux" autocomplete="off">
						</label>
					</div>
					<div class="rn-choice-grid" data-rn-grid></div>
					<button type="button" class="rn-link rn-mt-sm" data-rn-show-all aria-expanded="false">Voir tous les types de travaux par catégorie</button>
					<div class="rn-all-acts" data-rn-all hidden></div>
					<div class="rn-free" data-rn-free hidden>
						<p>Vous ne trouvez pas ? <button type="button" class="rn-link" data-rn-use-free>Continuer avec « <span data-rn-free-text></span> »</button> : un conseiller identifiera l’artisan adapté.</p>
					</div>
					<p class="rn-muted rn-small rn-mt-sm">Plusieurs corps de métier ? Choisissez « Rénovation complète » : un conseiller coordonne l’ensemble.</p>
					<p class="rn-field-error" data-rn-err="activity" hidden></p>
				</fieldset>

				<!-- Étape 2 -->
				<fieldset class="rn-wstep" data-step="2" hidden>
					<legend class="rn-h2 rn-wstep__title">Votre projet : <span data-rn-act-name></span></legend>
					<p class="rn-muted">Ces questions aident les artisans à chiffrer précisément. Répondez à ce que vous savez.</p>
					<div data-rn-questions></div>
				</fieldset>

				<!-- Étape 3 -->
				<fieldset class="rn-wstep" data-step="3" hidden>
					<legend class="rn-h2 rn-wstep__title">Photos et description</legend>
					<p class="rn-muted">Les demandes avec photos reçoivent des devis plus précis, souvent sans visite préalable.</p>
					<label class="rn-drop" data-rn-drop>
						<input type="file" accept="image/*,.heic,.heif,application/pdf" multiple data-rn-files class="rn-drop__input">
						<span class="rn-drop__icon"><?php echo Frontend::icon( 'photo', 24 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
						<strong>Ajoutez des photos ou des plans</strong>
						<span class="rn-muted rn-small"><?php echo esc_html( sprintf( 'Glissez-déposez ou cliquez · JPG, PNG, HEIC, PDF · %d Mo max · %d fichiers max', (int) Settings::get( 'max_file_mb', 10 ), $rn_max_files ) ); ?></span>
					</label>
					<ul class="rn-thumbs" data-rn-thumbs></ul>
					<p class="rn-field-error" data-rn-err="photos" hidden></p>
					<label class="rn-field rn-mt">
						<span class="rn-label">Décrivez votre projet <span class="rn-req">*</span></span>
						<textarea class="rn-input" name="description" rows="6" placeholder="Ex. : salle de bain de 6 m² au 2e étage avec ascenseur. Remplacer la baignoire par une douche à l’italienne, garder la fenêtre…"></textarea>
						<span class="rn-help">Pensez à : dimensions, état actuel, ce que vous souhaitez conserver, accès au chantier.</span>
					</label>
					<p class="rn-field-error" data-rn-err="description" hidden></p>
				</fieldset>

				<!-- Étape 4 -->
				<fieldset class="rn-wstep" data-step="4" hidden>
					<legend class="rn-h2 rn-wstep__title">Où et quand ?</legend>
					<div class="rn-row">
						<label class="rn-field rn-field--npa"><span class="rn-label">NPA <span class="rn-req">*</span></span><input class="rn-input" type="text" name="npa" inputmode="numeric" maxlength="4" autocomplete="postal-code" placeholder="1003"></label>
						<label class="rn-field rn-field--grow"><span class="rn-label">Localité <span class="rn-req">*</span></span><input class="rn-input" type="text" name="city" autocomplete="address-level2" placeholder="Lausanne"></label>
					</div>
					<p class="rn-field-error" data-rn-err="npa" hidden></p>
					<p class="rn-field-error" data-rn-err="city" hidden></p>
					<label class="rn-field">
						<span class="rn-label">Adresse du chantier <span class="rn-help-inline">(transmise uniquement aux artisans retenus)</span></span>
						<input class="rn-input" type="text" name="address" autocomplete="street-address" placeholder="Rue et numéro">
					</label>
					<div class="rn-grid rn-grid--2 rn-mt">
						<?php foreach ( $rn_lists as $rn_name => $rn_list ) : ?>
							<?php
							if ( ! $rn_list[1] ) {
								continue;
							}
							?>
							<fieldset class="rn-opts">
								<legend class="rn-label"><?php echo esc_html( $rn_list[0] ); ?></legend>
								<div class="rn-pills">
									<?php foreach ( $rn_list[1] as $rn_opt ) : ?>
										<label class="rn-pill-opt"><input type="radio" name="<?php echo esc_attr( $rn_name ); ?>" value="<?php echo esc_attr( $rn_opt ); ?>"><span><?php echo esc_html( $rn_opt ); ?></span></label>
									<?php endforeach; ?>
								</div>
							</fieldset>
						<?php endforeach; ?>
						<div>
							<label class="rn-field"><span class="rn-label">Budget envisagé</span>
								<select class="rn-input" name="budget">
									<option value="">Choisir…</option>
									<?php foreach ( Settings::lines( 'budgets' ) as $rn_opt ) : ?>
										<option value="<?php echo esc_attr( $rn_opt ); ?>"><?php echo esc_html( $rn_opt ); ?></option>
									<?php endforeach; ?>
								</select>
							</label>
							<label class="rn-field"><span class="rn-label">Date souhaitée <span class="rn-help-inline">(facultatif)</span></span>
								<input class="rn-input" type="date" name="preferred_date" min="<?php echo esc_attr( wp_date( 'Y-m-d' ) ); ?>">
							</label>
						</div>
					</div>
				</fieldset>

				<!-- Étape 5 -->
				<fieldset class="rn-wstep" data-step="5" hidden>
					<legend class="rn-h2 rn-wstep__title">Vos coordonnées</legend>
					<p class="rn-muted"><?php echo esc_html( Settings::fill( 'Transmises uniquement à votre conseiller et aux {max_artisans} artisans retenus, jamais revendues.' ) ); ?></p>
					<div class="rn-grid rn-grid--2">
						<label class="rn-field"><span class="rn-label">Prénom <span class="rn-req">*</span></span><input class="rn-input" type="text" name="first_name" autocomplete="given-name"></label>
						<label class="rn-field"><span class="rn-label">Nom <span class="rn-req">*</span></span><input class="rn-input" type="text" name="last_name" autocomplete="family-name"></label>
						<label class="rn-field"><span class="rn-label">E-mail <span class="rn-req">*</span></span><input class="rn-input" type="email" name="email" autocomplete="email" placeholder="nom@exemple.ch"></label>
						<label class="rn-field"><span class="rn-label">Téléphone<?php echo Settings::get( 'require_phone' ) ? ' <span class="rn-req">*</span>' : ''; // phpcs:ignore WordPress.Security.EscapeOutput ?></span><input class="rn-input" type="tel" name="phone" autocomplete="tel" placeholder="+41 79 000 00 00"></label>
					</div>
					<p class="rn-field-error" data-rn-err="first_name" hidden></p>
					<p class="rn-field-error" data-rn-err="last_name" hidden></p>
					<p class="rn-field-error" data-rn-err="email" hidden></p>
					<p class="rn-field-error" data-rn-err="phone" hidden></p>
					<div class="rn-grid rn-grid--2 rn-mt">
						<fieldset class="rn-opts">
							<legend class="rn-label">Comment préférez-vous être contacté ?</legend>
							<div class="rn-pills">
								<?php foreach ( Settings::lines( 'contact_prefs' ) as $rn_opt ) : ?>
									<label class="rn-pill-opt"><input type="radio" name="contact_pref" value="<?php echo esc_attr( $rn_opt ); ?>"><span><?php echo esc_html( $rn_opt ); ?></span></label>
								<?php endforeach; ?>
							</div>
						</fieldset>
						<fieldset class="rn-opts">
							<legend class="rn-label">Meilleur moment</legend>
							<div class="rn-pills">
								<?php foreach ( Settings::lines( 'contact_times' ) as $rn_opt ) : ?>
									<label class="rn-pill-opt"><input type="radio" name="contact_time" value="<?php echo esc_attr( $rn_opt ); ?>"><span><?php echo esc_html( $rn_opt ); ?></span></label>
								<?php endforeach; ?>
							</div>
						</fieldset>
					</div>
					<label class="rn-check rn-mt">
						<input type="checkbox" name="consent" value="1">
						<span><?php echo Frontend::consent_html(); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
					</label>
					<p class="rn-field-error" data-rn-err="consent" hidden></p>
				</fieldset>

				<div class="rn-alert rn-alert--error" role="alert" data-rn-error hidden></div>

				<div class="rn-wizard__nav">
					<button type="button" class="rn-btn rn-btn--ghost" data-rn-back hidden><?php echo Frontend::icon( 'arrowleft', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>Retour</button>
					<span class="rn-muted rn-small" data-rn-free-note>Gratuit · sans engagement</span>
					<button type="button" class="rn-btn rn-btn--primary rn-btn--lg" data-rn-next>Continuer<?php echo Frontend::icon( 'arrow', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
					<button type="submit" class="rn-btn rn-btn--primary rn-btn--lg" data-rn-submit hidden>Envoyer ma demande<?php echo Frontend::icon( 'send', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
				</div>
			</section>

			<aside class="rn-wizard__aside">
				<div class="rn-panel">
					<strong>Votre demande</strong>
					<dl class="rn-summary" data-rn-summary></dl>
				</div>
				<div class="rn-panel rn-panel--dark">
					<strong>Et ensuite ?</strong>
					<ol class="rn-next-steps">
						<li><span>1</span><?php echo esc_html( Settings::fill( 'Un conseiller vérifie votre demande sous {sla_hours} h ouvrées.' ) ); ?></li>
						<li><span>2</span><?php echo esc_html( Settings::fill( 'Jusqu’à {max_artisans} artisans vérifiés vous contactent.' ) ); ?></li>
						<li><span>3</span>Vous comparez les devis dans votre espace client.</li>
					</ol>
				</div>
				<p class="rn-secure"><?php echo Frontend::icon( 'lock', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><span>Vos données sont traitées conformément à la loi fédérale sur la protection des données (nLPD).<?php if ( $rn_phone ) : ?> Besoin d’aide ? <a href="tel:<?php echo esc_attr( preg_replace( '/[^\d+]/', '', $rn_phone ) ); ?>"><?php echo esc_html( $rn_phone ); ?></a><?php endif; ?></span></p>
			</aside>
		</div>
	</form>

	<div class="rn-container rn-wizard__done" data-rn-done hidden tabindex="-1">
		<div class="rn-panel rn-done">
			<span class="rn-done__icon"><?php echo Frontend::icon( 'check', 32 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
			<h2 class="rn-h2">Merci, votre demande est envoyée !</h2>
			<p class="rn-lead rn-lead--sm" data-rn-done-message></p>
			<p class="rn-done__ref" data-rn-done-ref></p>
			<p><a class="rn-btn rn-btn--primary rn-btn--lg" href="<?php echo esc_url( Settings::page_url( 'portal' ) ); ?>" data-rn-done-portal>Suivre ma demande</a></p>
			<p class="rn-muted rn-small">Un e-mail de confirmation vous a été envoyé avec le lien vers votre espace personnel.</p>
		</div>
	</div>
</div>
