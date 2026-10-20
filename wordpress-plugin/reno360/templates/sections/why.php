<?php
/**
 * Comparatif « Reno360 vs annonce classique ».
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
<section class="rn-section rn-section--dark">
	<div class="rn-container rn-split">
		<div>
			<span class="rn-eyebrow rn-eyebrow--light">Pourquoi <?php echo esc_html( $rn_company ); ?></span>
			<h2 class="rn-h2">Une demande de devis, pas une mise aux enchères.</h2>
			<p class="rn-lead rn-lead--light">Sur une plateforme d’annonces, votre demande peut être diffusée à de nombreuses entreprises, et votre téléphone ne s’arrête plus. Chez <?php echo esc_html( $rn_company ); ?>, un conseiller choisit pour vous les artisans les plus adaptés à votre projet, puis vous accompagne jusqu’à la fin du chantier.</p>
			<a class="rn-btn rn-btn--white rn-btn--lg" href="<?php echo esc_url( Settings::page_url( 'form' ) ); ?>">Essayer gratuitement</a>
		</div>
		<div class="rn-table-scroll">
			<table class="rn-compare">
				<thead>
					<tr><th scope="col"><span class="screen-reader-text">Critère</span></th><th scope="col" class="is-us"><?php echo esc_html( $rn_company ); ?></th><th scope="col">Annonce classique</th></tr>
				</thead>
				<tbody>
					<?php foreach ( $rn_rows as $rn_i => $rn_r ) : ?>
						<tr<?php echo count( $rn_rows ) - 1 === $rn_i ? ' class="is-last"' : ''; ?>>
							<th scope="row"><?php echo esc_html( $rn_r[0] ); ?></th>
							<td class="is-us"><?php echo esc_html( $rn_r[1] ); ?></td>
							<td><?php echo esc_html( $rn_r[2] ); ?></td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
		</div>
	</div>
</section>
