<?php
/**
 * Encart recrutement des artisans.
 *
 * @package Reno360
 */

use Reno360\Frontend;
use Reno360\Settings;

defined( 'ABSPATH' ) || exit;
?>
<section class="rn-section" id="artisans">
	<div class="rn-container">
		<div class="rn-partner">
			<div class="rn-partner__body">
				<span class="rn-eyebrow">Espace artisans</span>
				<h2 class="rn-h2">Vous êtes artisan ?</h2>
				<p class="rn-lead rn-lead--sm">Recevez des demandes vérifiées et complètes, dans vos métiers et votre zone d’intervention. Jamais mises en concurrence avec dix entreprises.</p>
				<ul class="rn-checks">
					<li><?php echo Frontend::icon( 'check', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>Demandes qualifiées par téléphone</li>
					<li><?php echo Frontend::icon( 'check', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>Photos, budget et délai connus avant de vous déplacer</li>
					<li><?php echo Frontend::icon( 'check', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>Dépôt du devis en ligne, en deux minutes</li>
				</ul>
				<p><a class="rn-btn rn-btn--primary rn-btn--lg" href="<?php echo esc_url( Settings::page_url( 'partner' ) ); ?>">Devenir partenaire</a></p>
			</div>
			<img class="rn-partner__img" src="<?php echo esc_url( RENO360_URL . 'assets/img/artisan.jpg' ); ?>" alt="" loading="lazy" decoding="async">
		</div>
	</div>
</section>
