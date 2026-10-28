<?php
/**
 * Tous les corps de métier : catalogue intégré avec recherche ([reno360_categories]).
 *
 * @package Reno360
 */

use Reno360\Frontend;

defined( 'ABSPATH' ) || exit;
?>
<section class="rn-section">
	<div class="rn-container">
		<?php if ( ! empty( $title ) ) : ?>
			<h2 class="rn-h2"><?php echo esc_html( $title ); ?></h2>
		<?php endif; ?>
		<?php echo Frontend::render( 'parts/browser' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
	</div>
</section>
