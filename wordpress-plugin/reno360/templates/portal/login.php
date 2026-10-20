<?php
/**
 * Espace client : connexion par lien magique.
 *
 * @package Reno360
 */

use Reno360\Frontend;
use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

$rn_expired = isset( $_GET['rn_expired'] ); // phpcs:ignore WordPress.Security.NonceVerification
?>
<section class="rn-section rn-section--tight">
	<div class="rn-container rn-narrow">
		<div class="rn-panel rn-login">
			<span class="rn-icon-tile rn-icon-tile--lg"><?php echo Frontend::icon( 'lock', 26 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
			<h1 class="rn-h2">Mon espace client</h1>
			<?php if ( $rn_expired ) : ?>
				<div class="rn-alert rn-alert--warn">Ce lien a expiré. Demandez un nouveau lien ci-dessous.</div>
			<?php endif; ?>
			<p class="rn-muted">Pas de mot de passe à retenir : indiquez l’adresse e-mail utilisée pour votre demande, nous vous envoyons un lien d’accès personnel.</p>
			<form class="rn-stack" data-rn-portal-login novalidate>
				<label class="rn-field"><span class="rn-label">Adresse e-mail</span><input class="rn-input" type="email" name="email" required autocomplete="email" placeholder="nom@exemple.ch"></label>
				<button type="submit" class="rn-btn rn-btn--primary rn-btn--lg rn-btn--block">Recevoir mon lien d’accès</button>
				<div class="rn-alert" role="status" data-rn-msg hidden></div>
			</form>
			<p class="rn-small rn-muted rn-mt">Pas encore de demande ? <a href="<?php echo esc_url( Settings::page_url( 'form' ) ); ?>">Demander un devis gratuit</a></p>
		</div>
	</div>
</section>
