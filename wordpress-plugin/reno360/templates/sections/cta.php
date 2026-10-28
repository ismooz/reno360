<?php
/**
 * Bandeau final « Prêt à lancer votre projet ? ».
 *
 * Variables : $title (le mot entre * * passe en italique), $text, $url.
 *
 * @package Reno360
 */

use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

$rn_title = isset( $title ) ? $title : 'Prêt à lancer votre *projet* ?';
$rn_text  = isset( $text ) ? $text : 'Recevez jusqu’à {max_artisans} devis d’artisans vérifiés. Gratuit et sans engagement.';
$rn_url   = isset( $url ) ? $url : Settings::page_url( 'form' );
$rn_title = preg_replace( '/\*([^*]+)\*/u', '<em>$1</em>', esc_html( $rn_title ) );
?>
<section class="rn-cta">
	<div class="rn-container">
		<div class="rn-cta__box">
			<div>
				<h2 class="rn-h2"><?php echo $rn_title; // phpcs:ignore WordPress.Security.EscapeOutput -- échappé ci-dessus. ?></h2>
				<p><?php echo esc_html( Settings::fill( $rn_text ) ); ?></p>
			</div>
			<div class="rn-cta__action">
				<a class="rn-btn rn-btn--white rn-btn--xl" href="<?php echo esc_url( $rn_url ); ?>" data-rn-quote>Demander mes devis →</a>
				<small><?php echo esc_html( Settings::fill( 'Réponse d’un conseiller sous {sla_hours} h ouvrées' ) ); ?></small>
			</div>
		</div>
	</div>
</section>
