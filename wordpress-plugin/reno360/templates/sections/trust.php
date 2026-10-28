<?php
/**
 * Bandeau des engagements (01 → 04).
 *
 * @package Reno360
 */

use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

$rn_items = array(
	array( 'Artisans contrôlés', 'Registre du commerce, assurance RC Pro et références vérifiés avant tout partenariat.' ),
	array( Settings::fill( 'Jusqu’à {max_artisans} devis, pas plus' ), 'Des offres pertinentes et comparables, sans être sollicité par dix entreprises.' ),
	array( 'Un conseiller dédié', 'Il complète votre demande, relance les artisans et vous aide à choisir.' ),
	array( 'Tout suivre en ligne', 'Devis, messages, photos et documents réunis dans votre espace client.' ),
);
?>
<section class="rn-strip">
	<div class="rn-container">
		<div class="rn-strip__grid">
			<?php foreach ( $rn_items as $rn_i => $rn_item ) : ?>
				<div class="rn-strip__item">
					<div class="rn-strip__num"><?php echo esc_html( sprintf( '%02d', $rn_i + 1 ) ); ?></div>
					<strong class="rn-strip__title"><?php echo esc_html( $rn_item[0] ); ?></strong>
					<p class="rn-strip__text"><?php echo esc_html( $rn_item[1] ); ?></p>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
</section>
