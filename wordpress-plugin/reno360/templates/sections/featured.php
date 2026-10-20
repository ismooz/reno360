<?php
/**
 * Travaux mis en avant (cartes avec photo) + accès aux catégories.
 *
 * Variables : $title.
 *
 * @package Reno360
 */

use Reno360\Activities;
use Reno360\Frontend;
use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

$rn_all      = Activities::all();
$rn_featured = array_values(
	array_filter(
		$rn_all,
		static function ( $a ) {
			return $a['featured'];
		}
	)
);
$rn_cats     = Activities::categories();
?>
<section class="rn-section" id="travaux">
	<div class="rn-container">
		<div class="rn-section__head">
			<div>
				<h2 class="rn-h2"><?php echo esc_html( isset( $title ) ? $title : 'Quels travaux souhaitez-vous réaliser ?' ); ?></h2>
				<p class="rn-lead rn-lead--sm"><?php echo esc_html( sprintf( '%d types de travaux, de la petite réparation à la rénovation complète.', count( $rn_all ) ) ); ?></p>
			</div>
			<a class="rn-link-arrow" href="<?php echo esc_url( Settings::page_url( 'catalog' ) ); ?>">Voir tous les travaux<?php echo Frontend::icon( 'arrow', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></a>
		</div>
		<?php if ( $rn_featured ) : ?>
			<div class="rn-grid rn-grid--3">
				<?php foreach ( $rn_featured as $rn_a ) : ?>
					<a class="rn-cat-card" href="<?php echo esc_url( $rn_a['url'] ); ?>">
						<?php if ( $rn_a['image'] ) : ?>
							<img src="<?php echo esc_url( $rn_a['image'] ); ?>" alt="" loading="lazy" decoding="async">
						<?php else : ?>
							<span class="rn-cat-card__placeholder"><?php echo Frontend::icon( $rn_a['icon'], 40 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
						<?php endif; ?>
						<span class="rn-cat-card__body">
							<span class="rn-cat-card__title"><?php echo esc_html( $rn_a['name'] ); ?></span>
							<span class="rn-muted"><?php echo esc_html( $rn_a['excerpt'] ); ?></span>
							<span class="rn-cat-card__cta">Demander un devis<?php echo Frontend::icon( 'arrow', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
						</span>
					</a>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>
		<?php if ( $rn_cats ) : ?>
			<div class="rn-grid rn-grid--tiles">
				<?php foreach ( $rn_cats as $rn_c ) : ?>
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
		<?php endif; ?>
	</div>
</section>
