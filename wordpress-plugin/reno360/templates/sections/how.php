<?php
/**
 * Accueil : comment ça marche (4 étapes).
 *
 * @package Reno360
 */

use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

$rn_steps = array(
	array( '2 minutes', 'Décrivez votre projet', 'Un formulaire guidé, adapté à chaque type de travaux. Ajoutez photos et plans pour des devis plus précis.' ),
	array( Settings::fill( 'Sous {sla_hours} h ouvrées' ), 'Nous qualifions', 'Un conseiller vérifie votre demande, la complète avec vous si besoin et choisit les artisans adaptés.' ),
	array( Settings::fill( 'Jusqu’à {max_artisans} offres' ), 'Recevez vos devis', 'Des entreprises vérifiées de votre région visitent si nécessaire et vous transmettent une offre détaillée.' ),
	array( 'En un clic', 'Choisissez et suivez', 'Comparez côte à côte, acceptez l’offre qui vous convient et suivez le chantier jusqu’à la réception.' ),
);
?>
<section class="rn-section rn-section--white" id="comment-ca-marche">
	<div class="rn-container">
		<div class="rn-section__head" style="margin-bottom:56px">
			<div>
				<span class="rn-overline">Comment ça marche</span>
				<h2 class="rn-h2">Quatre étapes, un seul interlocuteur.</h2>
				<p class="rn-lead rn-lead--sm">Et une vision claire à chaque instant, du premier message à la réception du chantier.</p>
			</div>
			<a class="rn-btn rn-btn--primary rn-btn--lg" href="<?php echo esc_url( Settings::page_url( 'form' ) ); ?>" data-rn-quote>Commencer ma demande</a>
		</div>
		<ol class="rn-how-steps">
			<?php foreach ( $rn_steps as $rn_i => $rn_s ) : ?>
				<li class="rn-how-step">
					<div class="rn-how-step__top"><span class="rn-how-step__num"><?php echo (int) $rn_i + 1; ?></span><span class="rn-tag"><?php echo esc_html( $rn_s[0] ); ?></span></div>
					<strong class="rn-how-step__title"><?php echo esc_html( $rn_s[1] ); ?></strong>
					<p class="rn-how-step__text"><?php echo esc_html( $rn_s[2] ); ?></p>
				</li>
			<?php endforeach; ?>
		</ol>
	</div>
</section>
