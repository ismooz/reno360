<?php
/**
 * Espace client sans demande.
 *
 * Variables : $email.
 *
 * @package Reno360
 */

use Reno360\Settings;

defined( 'ABSPATH' ) || exit;
?>
<section class="rn-section rn-section--tight">
	<div class="rn-container rn-narrow">
		<div class="rn-panel rn-login">
			<h1 class="rn-h2">Mon espace client</h1>
			<p class="rn-muted">Aucune demande n’est associée à <strong><?php echo esc_html( $email ); ?></strong>.</p>
			<p><a class="rn-btn rn-btn--primary" href="<?php echo esc_url( Settings::page_url( 'form' ) ); ?>">Faire une demande de devis</a> <a class="rn-btn rn-btn--ghost" href="<?php echo esc_url( add_query_arg( 'rn_logout', 1 ) ); ?>">Se déconnecter</a></p>
		</div>
	</div>
</section>
