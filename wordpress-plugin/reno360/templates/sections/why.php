<?php
/**
 * Accueil : pourquoi Reno360 (comparaison avec une annonce classique).
 *
 * @package Reno360
 */

use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

$rn_company = Settings::get( 'company', 'Reno360' );
$rn_rows    = array(
	array( 'Entreprises qui reçoivent vos coordonnées', Settings::fill( '{max_artisans} au maximum, choisies pour vous' ), 'Souvent davantage' ),
	array( 'Contrôle des artisans', 'Registre du commerce, RC Pro, références', 'Variable' ),
	array( 'Accompagnement', 'Conseiller dédié et relances', 'Vous gérez seul' ),
	array( 'Comparaison des offres', 'Côte à côte, en ligne', 'PDF reçus par e-mail' ),
	array( 'Coût pour vous', 'Gratuit', 'Gratuit' ),
);
?>
<section class="rn-section rn-why">
	<div class="rn-container rn-split">
		<div>
			<span class="rn-overline">Pourquoi <?php echo esc_html( $rn_company ); ?></span>
			<h2 class="rn-h2">Une demande de devis, pas une <em>mise aux enchères</em>.</h2>
			<p class="rn-lead rn-lead--sm" style="margin:20px 0 28px;max-width:520px">Sur une plateforme d’annonces, votre demande peut être diffusée à de nombreuses entreprises, et votre téléphone ne s’arrête plus. Chez <?php echo esc_html( $rn_company ); ?>, un conseiller choisit pour vous les artisans les plus adaptés à votre projet, puis vous accompagne jusqu’à la fin du chantier.</p>
			<a class="rn-btn rn-btn--primary rn-btn--lg" href="<?php echo esc_url( Settings::page_url( 'form' ) ); ?>" data-rn-quote>Essayer gratuitement</a>
		</div>
		<div class="rn-compare-box">
			<table class="rn-compare">
				<colgroup><col class="is-crit"><col><col></colgroup>
				<thead>
					<tr><th scope="col" class="is-crit">Critère</th><th scope="col" class="is-us"><?php echo esc_html( $rn_company ); ?></th><th scope="col" class="is-other">Annonce classique</th></tr>
				</thead>
				<tbody>
					<?php foreach ( $rn_rows as $rn_r ) : ?>
						<tr>
							<th scope="row"><?php echo esc_html( $rn_r[0] ); ?></th>
							<td class="is-us"><?php echo esc_html( $rn_r[1] ); ?></td>
							<td class="is-other"><?php echo esc_html( $rn_r[2] ); ?></td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
		</div>
	</div>
</section>
