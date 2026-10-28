<?php
/**
 * Accueil : appel aux artisans.
 *
 * @package Reno360
 */

use Reno360\Frontend;
use Reno360\Settings;

defined( 'ABSPATH' ) || exit;
?>
<section class="rn-section rn-section--dark rn-artisans" id="artisans">
	<div class="rn-container rn-split">
		<img class="rn-artisans__img" src="<?php echo esc_url( RENO360_URL . 'assets/img/artisan.jpg' ); ?>" alt="Artisan au travail" loading="lazy" decoding="async" width="800" height="600">
		<div>
			<span class="rn-overline rn-overline--light">Espace artisans</span>
			<h2 class="rn-h2">Vous êtes artisan ?</h2>
			<p class="rn-lead rn-lead--light">Recevez des demandes vérifiées et complètes, dans vos métiers et votre zone d’intervention. Jamais mises en concurrence avec dix entreprises.</p>
			<ul class="rn-checks rn-checks--light">
				<li><span class="rn-tick rn-tick--accent"><?php echo Frontend::icon( 'check', 13 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>Demandes qualifiées par téléphone</li>
				<li><span class="rn-tick rn-tick--accent"><?php echo Frontend::icon( 'check', 13 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>Photos, budget et délai connus avant de vous déplacer</li>
				<li><span class="rn-tick rn-tick--accent"><?php echo Frontend::icon( 'check', 13 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>Dépôt du devis en ligne, en deux minutes</li>
			</ul>
			<div class="rn-btn-row">
				<a class="rn-btn rn-btn--accent rn-btn--lg" href="<?php echo esc_url( Settings::page_url( 'partner' ) ); ?>">Devenir partenaire</a>
				<a class="rn-btn rn-btn--outline-light rn-btn--lg" href="<?php echo esc_url( Settings::page_url( 'artisan' ) ); ?>">Accéder à l’espace artisan</a>
			</div>
		</div>
	</div>
</section>
