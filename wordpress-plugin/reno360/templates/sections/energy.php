<?php
/**
 * Accueil : rénovation énergétique et simulateur « Votre projet est-il subventionné ? ».
 *
 * @package Reno360
 */

use Reno360\Activities;
use Reno360\Settings;
use Reno360\Util;

defined( 'ABSPATH' ) || exit;

$rn_energy = array_values(
	array_filter(
		Activities::all(),
		static function ( $a ) {
			return 'energie' === $a['cat_slug'] && $a['active'];
		}
	)
);
if ( ! $rn_energy ) {
	return;
}
$rn_cantons = array();
$rn_special = array(
	'VS' => 'du Valais',
	'JU' => 'du Jura',
	'TI' => 'du Tessin',
	'GR' => 'des Grisons',
);
foreach ( (array) Settings::get( 'cantons', array() ) as $rn_c ) {
	if ( ! isset( Util::cantons()[ $rn_c ] ) ) {
		continue;
	}
	$rn_name             = Util::cantons()[ $rn_c ];
	$rn_cantons[ $rn_c ] = array(
		'name'  => $rn_name,
		'where' => 'dans le canton ' . ( isset( $rn_special[ $rn_c ] ) ? $rn_special[ $rn_c ] : ( preg_match( '/^[AEIOUÉÈÂÎaeiou]/u', $rn_name ) ? 'd’' : 'de ' ) . $rn_name ),
	);
}
$rn_years = array( 'Avant 1990' => 'old', '1990 à 2009' => 'mid', '2010 et après' => 'new', 'Je ne sais pas' => 'unknown' );
?>
<section class="rn-section rn-section--soft rn-energy" id="subventions">
	<div class="rn-container rn-split rn-split--top">
		<div>
			<span class="rn-overline">Rénovation énergétique</span>
			<h2 class="rn-h2" style="margin-bottom:20px">Isolation, pompe à chaleur, solaire : profitez des subventions.</h2>
			<p class="rn-lead rn-lead--sm">Les cantons et le Programme Bâtiments soutiennent l’assainissement énergétique. Nos partenaires vous aident à préparer le dossier, CECB® compris.</p>
			<div class="rn-chips">
				<?php foreach ( array_slice( $rn_energy, 0, 4 ) as $rn_a ) : ?>
					<a class="rn-chip rn-chip--line" href="<?php echo esc_url( Settings::page_url( 'form', array( 'travail' => $rn_a['slug'] ) ) ); ?>" data-rn-quote="<?php echo (int) $rn_a['id']; ?>"><?php echo esc_html( $rn_a['name'] ); ?> →</a>
				<?php endforeach; ?>
			</div>
		</div>
		<div class="rn-sim" data-rn-sim>
			<strong class="rn-sim__title">Votre projet est-il subventionné ?</strong>
			<p class="rn-sim__sub">Trois questions pour une première orientation.</p>
			<?php if ( $rn_cantons ) : ?>
				<span class="rn-sim__q" id="rn-sim-q1"><span class="rn-mono">1</span>Canton</span>
				<div class="rn-opts-row" role="group" aria-labelledby="rn-sim-q1">
					<?php foreach ( $rn_cantons as $rn_code => $rn_c ) : ?>
						<button type="button" class="rn-opt" aria-pressed="false" data-rn-sim-opt="canton" data-value="<?php echo esc_attr( $rn_code ); ?>" data-where="<?php echo esc_attr( $rn_c['where'] ); ?>"><?php echo esc_html( $rn_c['name'] ); ?></button>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>
			<span class="rn-sim__q" id="rn-sim-q2"><span class="rn-mono">2</span>Type de travaux</span>
			<div class="rn-opts-row" role="group" aria-labelledby="rn-sim-q2">
				<?php foreach ( $rn_energy as $rn_a ) : ?>
					<button type="button" class="rn-opt" aria-pressed="false" data-rn-sim-opt="type" data-value="<?php echo (int) $rn_a['id']; ?>" data-slug="<?php echo esc_attr( $rn_a['slug'] ); ?>" data-name="<?php echo esc_attr( $rn_a['name'] ); ?>"><?php echo esc_html( $rn_a['name'] ); ?></button>
				<?php endforeach; ?>
			</div>
			<span class="rn-sim__q" id="rn-sim-q3"><span class="rn-mono">3</span>Année de construction</span>
			<div class="rn-opts-row" role="group" aria-labelledby="rn-sim-q3" style="margin-bottom:24px">
				<?php foreach ( $rn_years as $rn_label => $rn_key ) : ?>
					<button type="button" class="rn-opt" aria-pressed="false" data-rn-sim-opt="year" data-value="<?php echo esc_attr( $rn_key ); ?>"><?php echo esc_html( $rn_label ); ?></button>
				<?php endforeach; ?>
			</div>
			<div aria-live="polite">
				<p class="rn-sim__pending" data-rn-sim-pending>Indiquez le canton, le type de travaux et l’année de construction pour obtenir une orientation.</p>
				<div class="rn-sim__result" hidden data-rn-sim-result>
					<strong class="rn-sim__result-title" data-rn-sim-title>Projet potentiellement subventionnable</strong>
					<p data-rn-sim-body></p>
					<a class="rn-btn rn-btn--accent" href="<?php echo esc_url( Settings::page_url( 'form' ) ); ?>" data-rn-quote data-rn-sim-cta>Vérifier avec un conseiller →</a>
				</div>
			</div>
			<p class="rn-sim__note">Les aides dépendent du canton et du projet : votre conseiller confirme l’éligibilité.</p>
		</div>
	</div>
</section>
