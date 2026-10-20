<?php
/**
 * Formulaire de candidature des artisans partenaires.
 *
 * @package Reno360
 */

use Reno360\Activities;
use Reno360\Frontend;
use Reno360\Settings;
use Reno360\Util;

defined( 'ABSPATH' ) || exit;

$rn_groups = array();
foreach ( Activities::all() as $rn_a ) {
	$rn_groups[ $rn_a['category'] ? $rn_a['category'] : 'Autres' ][] = $rn_a;
}
$rn_cantons = Util::cantons();
$rn_served  = (array) Settings::get( 'cantons', array() );
?>
<section class="rn-section rn-section--tight">
	<div class="rn-container rn-partner-form">
		<div class="rn-partner-form__intro">
			<span class="rn-eyebrow">Espace artisans</span>
			<h1 class="rn-h1 rn-h1--md">Devenez partenaire <?php echo esc_html( Settings::get( 'company' ) ); ?></h1>
			<p class="rn-lead rn-lead--sm">Recevez des demandes vérifiées dans vos métiers et votre zone. Chaque candidature est contrôlée : registre du commerce, assurance RC Pro et références.</p>
			<ul class="rn-checks">
				<li><?php echo Frontend::icon( 'check', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>Demandes qualifiées, avec photos, budget et délai</li>
				<li><?php echo Frontend::icon( 'check', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo esc_html( Settings::fill( '{max_artisans} entreprises consultées au maximum' ) ); ?></li>
				<li><?php echo Frontend::icon( 'check', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>Dépôt du devis en ligne en deux minutes</li>
			</ul>
		</div>
		<form class="rn-panel rn-stack" data-rn-partner-form novalidate>
			<input type="hidden" name="rn_ts" value="<?php echo esc_attr( Frontend::form_stamp() ); ?>">
			<div class="rn-hp" aria-hidden="true"><label>Ne pas remplir <input type="text" name="website_hp" tabindex="-1" autocomplete="off"></label></div>

			<h2 class="rn-h3">Votre entreprise</h2>
			<div class="rn-grid rn-grid--2">
				<label class="rn-field"><span class="rn-label">Raison sociale <span class="rn-req">*</span></span><input class="rn-input" name="company" autocomplete="organization"></label>
				<label class="rn-field"><span class="rn-label">N° IDE <span class="rn-help-inline">(CHE-…)</span></span><input class="rn-input" name="ide" placeholder="CHE-123.456.789"></label>
				<label class="rn-field"><span class="rn-label">Personne de contact <span class="rn-req">*</span></span><input class="rn-input" name="contact_name" autocomplete="name"></label>
				<label class="rn-field"><span class="rn-label">Site internet</span><input class="rn-input" name="site" type="url" placeholder="https://"></label>
				<label class="rn-field"><span class="rn-label">E-mail <span class="rn-req">*</span></span><input class="rn-input" name="email" type="email" autocomplete="email"></label>
				<label class="rn-field"><span class="rn-label">Téléphone <span class="rn-req">*</span></span><input class="rn-input" name="phone" type="tel" autocomplete="tel"></label>
				<label class="rn-field"><span class="rn-label">Adresse</span><input class="rn-input" name="address" autocomplete="street-address"></label>
				<div class="rn-row">
					<label class="rn-field rn-field--npa"><span class="rn-label">NPA <span class="rn-req">*</span></span><input class="rn-input" name="npa" inputmode="numeric" maxlength="4" autocomplete="postal-code"></label>
					<label class="rn-field rn-field--grow"><span class="rn-label">Localité <span class="rn-req">*</span></span><input class="rn-input" name="city" autocomplete="address-level2"></label>
				</div>
			</div>
			<p class="rn-field-error" data-rn-err="company" hidden></p>
			<p class="rn-field-error" data-rn-err="contact_name" hidden></p>
			<p class="rn-field-error" data-rn-err="email" hidden></p>
			<p class="rn-field-error" data-rn-err="phone" hidden></p>
			<p class="rn-field-error" data-rn-err="npa" hidden></p>
			<p class="rn-field-error" data-rn-err="city" hidden></p>

			<h2 class="rn-h3 rn-mt">Vos métiers <span class="rn-req">*</span></h2>
			<label class="rn-searchbar rn-searchbar--sm"><?php echo Frontend::icon( 'search', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><input type="search" class="rn-searchbar__input" placeholder="Filtrer les métiers…" aria-label="Filtrer les métiers" data-rn-trade-filter></label>
			<div class="rn-trades" data-rn-trades>
				<?php foreach ( $rn_groups as $rn_cat => $rn_items ) : ?>
					<fieldset class="rn-trades__group">
						<legend><?php echo esc_html( $rn_cat ); ?></legend>
						<?php foreach ( $rn_items as $rn_a ) : ?>
							<label class="rn-pill-opt rn-pill-opt--sm" data-rn-trade="<?php echo esc_attr( strtolower( remove_accents( $rn_a['name'] . ' ' . implode( ' ', array_slice( $rn_a['keywords'], 0, 8 ) ) ) ) ); ?>"><input type="checkbox" name="trades[]" value="<?php echo (int) $rn_a['id']; ?>"><span><?php echo esc_html( $rn_a['name'] ); ?></span></label>
						<?php endforeach; ?>
					</fieldset>
				<?php endforeach; ?>
			</div>
			<p class="rn-field-error" data-rn-err="trades" hidden></p>

			<h2 class="rn-h3 rn-mt">Zone d’intervention <span class="rn-req">*</span></h2>
			<div class="rn-pills">
				<?php foreach ( $rn_cantons as $rn_code => $rn_name ) : ?>
					<?php
					if ( $rn_served && ! in_array( $rn_code, $rn_served, true ) ) {
						continue;
					}
					?>
					<label class="rn-pill-opt"><input type="checkbox" name="cantons[]" value="<?php echo esc_attr( $rn_code ); ?>"><span><?php echo esc_html( $rn_name ); ?></span></label>
				<?php endforeach; ?>
			</div>
			<p class="rn-field-error" data-rn-err="cantons" hidden></p>
			<label class="rn-field"><span class="rn-label">NPA couverts <span class="rn-help-inline">(facultatif, ex. 1000-1099, 1110)</span></span><input class="rn-input" name="npa_ranges"></label>

			<h2 class="rn-h3 rn-mt">Documents <span class="rn-help-inline">(facultatif : attestation RC Pro, extrait du registre du commerce)</span></h2>
			<input class="rn-input" type="file" name="docs[]" multiple accept="application/pdf,image/*">
			<label class="rn-field"><span class="rn-label">Message</span><textarea class="rn-input" name="message" rows="3" placeholder="Années d’expérience, taille de l’équipe, spécialités…"></textarea></label>
			<label class="rn-check"><input type="checkbox" name="consent" value="1"><span>J’accepte que <?php echo esc_html( Settings::get( 'company' ) ); ?> vérifie les informations fournies et me contacte au sujet de ma candidature.</span></label>
			<p class="rn-field-error" data-rn-err="consent" hidden></p>
			<div class="rn-alert" role="status" data-rn-msg hidden></div>
			<button type="submit" class="rn-btn rn-btn--primary rn-btn--lg">Envoyer ma candidature</button>
		</form>
	</div>
</section>
