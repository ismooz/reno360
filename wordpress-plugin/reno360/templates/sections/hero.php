<?php
/**
 * Accueil : héros (titre, recherche, travaux populaires, exemple de suivi).
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
$rn_max    = (int) Settings::get( 'max_artisans', 3 );
?>
<section class="rn-hero" id="top">
	<div class="rn-container rn-hero__grid">
		<div class="rn-hero__content">
			<span class="rn-overline rn-overline--dot">Devis travaux · <?php echo esc_html( $rn_region ); ?></span>
			<h1 class="rn-h1"><?php echo wp_kses( $title, array( 'em' => array(), 'strong' => array(), 'br' => array(), 'span' => array( 'class' => array() ) ) ); ?></h1>
			<p class="rn-lead"><?php echo esc_html( $rn_sub ); ?></p>
			<?php
			echo Frontend::render( // phpcs:ignore WordPress.Security.EscapeOutput
				'parts/search-box',
				array(
					'source' => 'home',
					'target' => 'modal',
				)
			);
			?>
			<ul class="rn-checks rn-checks--inline">
				<li><span class="rn-tick"><?php echo Frontend::icon( 'check', 12 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>100 % gratuit</li>
				<li><span class="rn-tick"><?php echo Frontend::icon( 'check', 12 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>Sans engagement</li>
				<li><span class="rn-tick"><?php echo Frontend::icon( 'check', 12 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>Coordonnées jamais revendues</li>
			</ul>
		</div>
		<div class="rn-hero__media">
			<img src="<?php echo esc_url( $rn_image ); ?>" alt="Rénovation d’un intérieur" class="rn-hero__img" loading="eager" fetchpriority="high" decoding="async" width="1000" height="1200">
			<div class="rn-float rn-float--top">
				<strong>Partenaires vérifiés</strong>
				<small>Registre du commerce · RC Pro · Références</small>
			</div>
			<div class="rn-float rn-float--bottom" aria-hidden="true">
				<div class="rn-float__head"><strong>Salle de bain · Lausanne</strong><small>Exemple de suivi</small></div>
				<ul class="rn-track-mini">
					<li><span class="rn-tick rn-tick--solid"><?php echo Frontend::icon( 'check', 12 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>Demande vérifiée par un conseiller</li>
					<li><span class="rn-tick rn-tick--solid"><?php echo Frontend::icon( 'check', 12 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span><?php echo esc_html( $rn_max . ' artisans sélectionnés' ); ?></li>
					<li class="is-current"><span class="rn-tick rn-tick--ring"></span>Devis reçus — à comparer<span class="rn-offers"><?php echo esc_html( $rn_max . ' offres' ); ?></span></li>
				</ul>
			</div>
		</div>
	</div>
</section>
