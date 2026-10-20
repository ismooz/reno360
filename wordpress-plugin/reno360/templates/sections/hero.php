<?php
/**
 * Section d'accueil : titre, recherche, réassurance et visuel avec suivi de demande.
 *
 * Variables : $title (HTML limité), $subtitle, $image.
 *
 * @package Reno360
 */

use Reno360\Frontend;
use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

$rn_romand = array( 'VD', 'GE', 'FR', 'VS', 'NE', 'JU' );
$rn_region = array_diff( (array) Settings::get( 'cantons', array() ), $rn_romand ) ? 'Suisse' : 'Suisse romande';
$rn_image  = ! empty( $image ) ? $image : RENO360_URL . 'assets/img/renovation-complete.jpg';
$rn_sub    = ! empty( $subtitle ) ? $subtitle : Settings::fill( 'Décrivez votre projet en 2 minutes. Un conseiller {company} vérifie votre demande, sélectionne jusqu’à {max_artisans} entreprises qualifiées près de chez vous, et vous suivez tout en ligne, du devis à la fin du chantier.' );
?>
<section class="rn-hero">
	<div class="rn-container rn-hero__grid">
		<div class="rn-hero__content">
			<span class="rn-pill"><span class="rn-dot" aria-hidden="true"></span>Devis travaux · <?php echo esc_html( $rn_region ); ?></span>
			<h1 class="rn-h1"><?php echo wp_kses( $title, array( 'em' => array(), 'strong' => array(), 'br' => array(), 'span' => array( 'class' => array() ) ) ); ?></h1>
			<p class="rn-lead"><?php echo esc_html( $rn_sub ); ?></p>
			<?php
			echo Frontend::render( // phpcs:ignore WordPress.Security.EscapeOutput
				'parts/search-box',
				array(
					'source' => 'home',
					'target' => 'form',
				)
			);
			?>
			<ul class="rn-checks rn-checks--inline">
				<li><?php echo Frontend::icon( 'check', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>100 % gratuit</li>
				<li><?php echo Frontend::icon( 'check', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>Sans engagement</li>
				<li><?php echo Frontend::icon( 'check', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>Coordonnées jamais revendues</li>
			</ul>
		</div>
		<div class="rn-hero__media">
			<img src="<?php echo esc_url( $rn_image ); ?>" alt="" class="rn-hero__img" loading="eager" decoding="async" width="1400" height="788">
			<div class="rn-float rn-float--top">
				<span class="rn-float__icon"><?php echo Frontend::icon( 'shield', 22 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
				<span><strong>Partenaires vérifiés</strong><small>Registre du commerce · RC Pro · Références</small></span>
			</div>
			<div class="rn-float rn-float--bottom" aria-hidden="true">
				<div class="rn-float__head"><strong>Salle de bain · Lausanne</strong><small>Exemple de suivi</small></div>
				<ul class="rn-track-mini">
					<li class="is-done"><span></span>Demande vérifiée par un conseiller</li>
					<li class="is-done"><span></span><?php echo esc_html( Settings::fill( '{max_artisans} artisans sélectionnés' ) ); ?></li>
					<li class="is-current"><span></span>Devis reçus — à comparer</li>
				</ul>
			</div>
		</div>
	</div>
</section>
