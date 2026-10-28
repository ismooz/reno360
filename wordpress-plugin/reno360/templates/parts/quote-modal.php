<?php
/**
 * Demande rapide en 3 étapes (fenêtre), ouverte par tous les boutons « Demander un devis ».
 * Sans JavaScript, ces boutons mènent au formulaire complet.
 *
 * @package Reno360
 */

use Reno360\Chrome;
use Reno360\Frontend;
use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

$rn_uid      = wp_unique_id( 'rn-qm-' );
$rn_popular  = array_map(
	static function ( $a ) {
		return (int) $a['id'];
	},
	Chrome::highlights( 12, array( 'salle-de-bain', 'cuisine', 'renovation-complete', 'peinture', 'electricite', 'plomberie', 'pompe-a-chaleur', 'fenetres-vitrerie', 'parquet', 'carrelage-faience', 'isolation', 'toiture-ferblanterie' ) )
);
$rn_phone_rq = (bool) Settings::get( 'require_phone' );
$rn_max      = (int) Settings::get( 'max_artisans', 3 );
$rn_fields   = array(
	array( 'first_name', 'Prénom', 'text', 'given-name', true ),
	array( 'last_name', 'Nom', 'text', 'family-name', true ),
	array( 'email', 'E-mail', 'email', 'email', true ),
	array( 'phone', 'Téléphone', 'tel', 'tel', $rn_phone_rq ),
	array( 'npa', 'NPA', 'text', 'postal-code', true ),
	array( 'city', 'Localité', 'text', 'address-level2', false ),
);
?>
<div class="rn-app rn-qm" hidden data-rn-qm data-popular="<?php echo esc_attr( wp_json_encode( $rn_popular ) ); ?>" data-require-phone="<?php echo $rn_phone_rq ? '1' : '0'; ?>" data-max-files="<?php echo (int) Settings::get( 'max_files', 10 ); ?>">
	<div class="rn-qm__overlay" data-rn-qm-close></div>
	<div class="rn-qm__dialog" role="dialog" aria-modal="true" aria-labelledby="<?php echo esc_attr( $rn_uid ); ?>-title">
		<form class="rn-qm__form" novalidate data-rn-qm-form>
			<input type="hidden" name="rn_ts" value="<?php echo esc_attr( Frontend::form_stamp() ); ?>">
			<input type="hidden" name="mode" value="quick">
			<input type="hidden" name="activity_id" value="">
			<input type="hidden" name="q" value="">
			<div class="rn-hp" aria-hidden="true"><label>Site web <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>

			<div class="rn-qm__head">
				<div class="rn-qm__top">
					<div>
						<span class="rn-overline" data-rn-qm-label>Étape 1 sur 3</span>
						<strong class="rn-qm__title" id="<?php echo esc_attr( $rn_uid ); ?>-title" tabindex="-1" data-rn-qm-title>Quels travaux ?</strong>
					</div>
					<button type="button" class="rn-qm__close" aria-label="Fermer" data-rn-qm-close>×</button>
				</div>
				<div class="rn-qm__bars" aria-hidden="true"><span class="is-on"></span><span></span><span></span></div>
			</div>

			<div class="rn-qm__body">
				<section data-rn-qm-step="1">
					<label class="screen-reader-text" for="<?php echo esc_attr( $rn_uid ); ?>-search">Rechercher un type de travaux</label>
					<input type="search" class="rn-input rn-qm__search" id="<?php echo esc_attr( $rn_uid ); ?>-search" placeholder="Rechercher : fuite, parquet, fenêtres…" autocomplete="off" data-rn-qm-search>
					<div class="rn-qm__label" data-rn-qm-list-label>Les plus demandés</div>
					<div class="rn-qm__list" data-rn-qm-list></div>
					<p class="rn-qm__free" hidden data-rn-qm-free>Aucun type de travaux ne correspond. <button type="button" class="rn-link" data-rn-qm-free-btn>Continuer avec « <span data-rn-qm-free-q></span> »</button></p>
				</section>

				<section data-rn-qm-step="2" hidden>
					<div class="rn-qm__chosen">
						<div><small>Type de travaux</small><strong data-rn-qm-svc></strong></div>
						<button type="button" class="rn-link" data-rn-qm-goto="1">Modifier</button>
					</div>
					<fieldset>
						<legend class="rn-qm__q">Type de bien</legend>
						<div class="rn-opts-row" data-rn-qm-required="property_type">
							<?php foreach ( Settings::lines( 'property_types' ) as $rn_o ) : ?>
								<button type="button" class="rn-opt" aria-pressed="false" data-rn-qm-opt="property_type" data-value="<?php echo esc_attr( $rn_o ); ?>"><?php echo esc_html( $rn_o ); ?></button>
							<?php endforeach; ?>
						</div>
						<input type="hidden" name="property_type" value="">
					</fieldset>
					<fieldset>
						<legend class="rn-qm__q">Quand souhaitez-vous commencer ?</legend>
						<div class="rn-opts-row" data-rn-qm-required="start_wish">
							<?php foreach ( Settings::lines( 'start_options' ) as $rn_o ) : ?>
								<button type="button" class="rn-opt" aria-pressed="false" data-rn-qm-opt="start_wish" data-value="<?php echo esc_attr( $rn_o ); ?>"><?php echo esc_html( $rn_o ); ?></button>
							<?php endforeach; ?>
						</div>
						<input type="hidden" name="start_wish" value="">
					</fieldset>
					<label class="rn-qm__q" for="<?php echo esc_attr( $rn_uid ); ?>-desc">Décrivez votre projet <span>(facultatif)</span></label>
					<textarea class="rn-input rn-qm__desc" id="<?php echo esc_attr( $rn_uid ); ?>-desc" name="description" rows="4" placeholder="Surface, état actuel, ce que vous souhaitez obtenir…"></textarea>
					<span class="rn-field-error" hidden data-rn-qm-err="description"></span>
					<label class="rn-qm__drop">
						<input type="file" name="photos[]" multiple accept="image/*,.pdf,.heic" data-rn-qm-files>
						<b aria-hidden="true">+</b><span data-rn-qm-files-label>Ajouter des photos ou plans (facultatif)</span>
					</label>
				</section>

				<section data-rn-qm-step="3" hidden>
					<div class="rn-qm__fields">
						<?php foreach ( $rn_fields as $rn_f ) : ?>
							<label class="rn-field">
								<span><?php echo esc_html( $rn_f[1] ); ?><?php echo $rn_f[4] ? ' <span class="rn-req" aria-hidden="true">*</span>' : ''; ?></span>
								<input class="rn-input" type="<?php echo esc_attr( $rn_f[2] ); ?>" name="<?php echo esc_attr( $rn_f[0] ); ?>" autocomplete="<?php echo esc_attr( $rn_f[3] ); ?>"<?php echo 'npa' === $rn_f[0] ? ' inputmode="numeric" maxlength="4"' : ''; ?><?php echo $rn_f[4] ? ' required' : ''; ?>>
								<span class="rn-field-error" hidden data-rn-qm-err="<?php echo esc_attr( $rn_f[0] ); ?>"></span>
							</label>
						<?php endforeach; ?>
					</div>
					<label class="rn-qm__consent">
						<input type="checkbox" name="consent" value="1" required>
						<span><?php echo Frontend::consent_html(); // phpcs:ignore WordPress.Security.EscapeOutput ?> Vos coordonnées ne sont jamais revendues.</span>
					</label>
					<span class="rn-field-error" hidden data-rn-qm-err="consent"></span>
				</section>

				<section data-rn-qm-step="4" hidden>
					<div class="rn-qm__done">
						<span class="rn-qm__done-icon"><?php echo Frontend::icon( 'check', 30 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
						<strong>Merci <span data-rn-qm-name></span>, c’est envoyé.</strong>
						<p><?php echo esc_html( Settings::fill( 'Un conseiller vous contacte sous {sla_hours} h ouvrées.' ) ); ?> Un lien vers votre espace a été envoyé à <b data-rn-qm-email></b>.</p>
					</div>
					<ul class="rn-qm__recap">
						<li><span class="rn-tick rn-tick--solid"><?php echo Frontend::icon( 'check', 12 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span><span><strong data-rn-qm-svc></strong> · <span data-rn-qm-recap></span></span></li>
						<li><span class="rn-tick rn-tick--ring"></span>Vérification par un conseiller</li>
						<li class="is-todo"><span class="rn-tick rn-tick--empty"></span><?php echo esc_html( sprintf( 'Sélection de %d artisans au maximum', $rn_max ) ); ?></li>
						<li class="is-todo"><span class="rn-tick rn-tick--empty"></span>Réception et comparaison des devis</li>
					</ul>
					<p class="rn-center rn-mt-sm"><a class="rn-btn rn-btn--ghost rn-btn--sm" href="<?php echo esc_url( Settings::page_url( 'portal' ) ); ?>" data-rn-qm-portal>Ouvrir mon espace</a></p>
				</section>
				<div class="rn-alert rn-alert--error" hidden data-rn-qm-error role="alert"></div>
			</div>

			<div class="rn-qm__foot">
				<button type="button" class="rn-btn rn-btn--ghost" hidden data-rn-qm-back>← Retour</button>
				<span class="rn-qm__note" data-rn-qm-note>Gratuit · Sans engagement</span>
				<button type="button" class="rn-btn rn-btn--primary rn-qm__next" aria-disabled="true" data-rn-qm-next>Continuer</button>
			</div>
		</form>
	</div>
</div>
