<?php
/**
 * Grille des catégories.
 *
 * Variables : $title.
 *
 * @package Reno360
 */

use Reno360\Activities;
use Reno360\Frontend;
use Reno360\Settings;

defined( 'ABSPATH' ) || exit;
?>
<section class="rn-section">
	<div class="rn-container">
		<?php if ( ! empty( $title ) ) : ?>
			<h2 class="rn-h2 rn-mb"><?php echo esc_html( $title ); ?></h2>
		<?php endif; ?>
		<div class="rn-grid rn-grid--tiles">
			<?php foreach ( Activities::categories() as $rn_c ) : ?>
				<?php
				if ( ! $rn_c['count'] ) {
					continue;
				}
				?>
				<a class="rn-tile" href="<?php echo esc_url( Settings::page_url( 'catalog' ) . '#cat-' . $rn_c['slug'] ); ?>">
					<span class="rn-tile__icon"><?php echo Frontend::icon( $rn_c['icon'], 21 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
					<span class="rn-tile__text"><strong><?php echo esc_html( $rn_c['name'] ); ?></strong><small><?php echo esc_html( sprintf( _n( '%d type de travaux', '%d types de travaux', $rn_c['count'], 'reno360' ), $rn_c['count'] ) ); ?></small></span>
					<?php echo Frontend::icon( 'chevron', 18, 'rn-icon rn-tile__chev' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
				</a>
			<?php endforeach; ?>
		</div>
	</div>
</section>
