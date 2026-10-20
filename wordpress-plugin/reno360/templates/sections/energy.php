<?php
/**
 * Rénovation énergétique + mini-formulaire d'éligibilité (mène au formulaire de devis).
 *
 * @package Reno360
 */

use Reno360\Activities;
use Reno360\Frontend;
use Reno360\Settings;
use Reno360\Util;

defined( 'ABSPATH' ) || exit;

$rn_energy = array_values(
	array_filter(
		Activities::all(),
		static function ( $a ) {
			return 'energie' === $a['cat_slug'];
		}
	)
);
if ( ! $rn_energy ) {
	return;
}
$rn_cantons = (array) Settings::get( 'cantons', array() );
?>
<section class="rn-section">
	<div class="rn-container rn-split">
		<div>
			<span class="rn-eyebrow">Rénovation énergétique</span>
			<h2 class="rn-h2">Isolation, pompe à chaleur, solaire : profitez des subventions.</h2>
			<p class="rn-lead rn-lead--sm">Les cantons et le Programme Bâtiments soutiennent l’assainissement énergétique. Nos partenaires vous aident à préparer le dossier, CECB® compris.</p>
			<div class="rn-grid rn-grid--2 rn-mt-sm">
				<?php foreach ( array_slice( $rn_energy, 0, 4 ) as $rn_a ) : ?>
					<a class="rn-mini-tile" href="<?php echo esc_url( $rn_a['url'] ); ?>"><?php echo Frontend::icon( $rn_a['icon'], 20 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo esc_html( $rn_a['name'] ); ?></a>
				<?php endforeach; ?>
			</div>
		</div>
		<form class="rn-panel rn-energy-form" action="<?php echo esc_url( Settings::page_url( 'form' ) ); ?>" method="get" data-rn-energy>
			<strong class="rn-h3">Votre projet est-il subventionné ?</strong>
			<span class="rn-muted">Trois questions pour une première orientation.</span>
			<label class="rn-field"><span class="rn-label">Canton</span>
				<select name="canton" class="rn-input">
					<?php foreach ( $rn_cantons as $rn_c ) : ?>
						<option value="<?php echo esc_attr( $rn_c ); ?>"><?php echo esc_html( isset( Util::cantons()[ $rn_c ] ) ? Util::cantons()[ $rn_c ] : $rn_c ); ?></option>
					<?php endforeach; ?>
				</select>
			</label>
			<label class="rn-field"><span class="rn-label">Type de travaux</span>
				<select name="travail" class="rn-input">
					<?php foreach ( $rn_energy as $rn_a ) : ?>
						<option value="<?php echo esc_attr( $rn_a['slug'] ); ?>"><?php echo esc_html( $rn_a['name'] ); ?></option>
					<?php endforeach; ?>
				</select>
			</label>
			<label class="rn-field"><span class="rn-label">Année de construction</span>
				<select name="annee" class="rn-input">
					<option>Avant 1990</option>
					<option>1990 à 2009</option>
					<option>2010 et après</option>
					<option>Je ne sais pas</option>
				</select>
			</label>
			<button type="submit" class="rn-btn rn-btn--primary rn-btn--block rn-btn--lg">Vérifier avec un conseiller</button>
			<small class="rn-muted">Les aides dépendent du canton et du projet : votre conseiller confirme l’éligibilité.</small>
		</form>
	</div>
</section>
