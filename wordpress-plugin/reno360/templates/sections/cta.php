<?php
/**
 * Bandeau d'appel à l'action.
 *
 * Variables : $title, $text.
 *
 * @package Reno360
 */

use Reno360\Frontend;
use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

$rn_title = isset( $title ) ? $title : 'Prêt à lancer votre projet ?';
$rn_text  = isset( $text ) ? $text : 'Recevez jusqu’à {max_artisans} devis d’artisans vérifiés. Gratuit et sans engagement.';
$rn_url   = isset( $url ) ? $url : Settings::page_url( 'form' );
?>
<section class="rn-cta-band">
	<div class="rn-container rn-cta-band__inner">
		<div>
			<h2 class="rn-h2"><?php echo esc_html( $rn_title ); ?></h2>
			<p><?php echo esc_html( Settings::fill( $rn_text ) ); ?></p>
		</div>
		<a class="rn-btn rn-btn--white rn-btn--lg" href="<?php echo esc_url( $rn_url ); ?>">Demander mes devis<?php echo Frontend::icon( 'arrow', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
	</div>
</section>
