<?php
/**
 * Engagements (réassurance).
 *
 * @package Reno360
 */

use Reno360\Frontend;
use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

$rn_items = array(
	array( 'shield', 'Artisans contrôlés', 'Registre du commerce, assurance RC Pro et références vérifiés avant tout partenariat.' ),
	array( 'file', Settings::fill( 'Jusqu’à {max_artisans} devis, pas plus' ), 'Des offres pertinentes et comparables, sans être sollicité par dix entreprises.' ),
	array( 'phone', 'Un conseiller dédié', 'Il complète votre demande, relance les artisans et vous aide à choisir.' ),
	array( 'dashboard', 'Tout suivre en ligne', 'Devis, messages, photos et documents réunis dans votre espace client.' ),
);
?>
<section class="rn-trust">
	<div class="rn-container rn-grid rn-grid--4">
		<?php foreach ( $rn_items as $rn_item ) : ?>
			<div class="rn-trust__item">
				<span class="rn-icon-tile"><?php echo Frontend::icon( $rn_item[0], 22 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
				<strong><?php echo esc_html( $rn_item[1] ); ?></strong>
				<span class="rn-muted"><?php echo esc_html( $rn_item[2] ); ?></span>
			</div>
		<?php endforeach; ?>
	</div>
</section>
