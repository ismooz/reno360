<?php
/**
 * « Comment ça marche » en 4 étapes.
 *
 * @package Reno360
 */

use Reno360\Frontend;
use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

$rn_steps = array(
	array( '2 minutes', 'Décrivez votre projet', 'Un formulaire guidé, adapté à chaque type de travaux. Ajoutez photos et plans pour des devis plus précis.' ),
	array( Settings::fill( 'Sous {sla_hours} h ouvrées' ), 'Nous qualifions', 'Un conseiller vérifie votre demande, la complète avec vous si besoin et choisit les artisans adaptés.' ),
	array( Settings::fill( 'Jusqu’à {max_artisans} offres' ), 'Recevez vos devis', 'Des entreprises vérifiées de votre région visitent si nécessaire et vous transmettent une offre détaillée.' ),
	array( 'En un clic', 'Choisissez et suivez', 'Comparez côte à côte, acceptez l’offre qui vous convient et suivez le chantier jusqu’à la réception.' ),
);
?>
<section class="rn-section rn-section--muted" id="comment-ca-marche">
	<div class="rn-container">
		<div class="rn-section__head rn-section__head--center">
			<h2 class="rn-h2">Comment ça marche</h2>
			<p class="rn-lead rn-lead--sm">Quatre étapes, un seul interlocuteur, et une vision claire à chaque instant.</p>
		</div>
		<ol class="rn-steps">
			<?php foreach ( $rn_steps as $rn_i => $rn_s ) : ?>
				<li class="rn-step">
					<span class="rn-step__top"><span class="rn-step__num"><?php echo (int) $rn_i + 1; ?></span><span class="rn-tag"><?php echo esc_html( $rn_s[0] ); ?></span></span>
					<strong class="rn-step__title"><?php echo esc_html( $rn_s[1] ); ?></strong>
					<span class="rn-muted"><?php echo esc_html( $rn_s[2] ); ?></span>
				</li>
			<?php endforeach; ?>
		</ol>
		<p class="rn-center rn-mt">
			<a class="rn-btn rn-btn--primary rn-btn--lg" href="<?php echo esc_url( Settings::page_url( 'form' ) ); ?>">Commencer ma demande<?php echo Frontend::icon( 'arrow', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
		</p>
	</div>
</section>
