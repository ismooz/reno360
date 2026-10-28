<?php
/**
 * Accueil : travaux en vedette + catalogue intégré (catégories à gauche, travaux à droite).
 *
 * Variables : $title, $browser (yes|no).
 *
 * @package Reno360
 */

use Reno360\Activities;
use Reno360\Chrome;
use Reno360\Frontend;
use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

$rn_groups   = Chrome::groups();
$rn_total    = 0;
$rn_featured = array();
foreach ( $rn_groups as $rn_g ) {
	$rn_total += count( $rn_g['items'] );
	foreach ( $rn_g['items'] as $rn_a ) {
		if ( $rn_a['featured'] ) {
			$rn_featured[] = $rn_a;
		}
	}
}
$rn_browser = ! isset( $browser ) || 'no' !== $browser;
$rn_quote   = static function ( $a ) {
	return ' href="' . esc_url( Settings::page_url( 'form', array( 'travail' => $a['slug'] ) ) ) . '" data-rn-quote="' . (int) $a['id'] . '"';
};
?>
<section class="rn-section" id="travaux">
	<div class="rn-container">
		<div class="rn-section__head">
			<div>
				<span class="rn-overline">Nos métiers</span>
				<h2 class="rn-h2"><?php echo esc_html( isset( $title ) ? $title : 'Quels travaux souhaitez-vous réaliser ?' ); ?></h2>
				<p class="rn-lead rn-lead--sm"><?php echo esc_html( sprintf( '%d types de travaux, de la petite réparation à la rénovation complète.', $rn_total ) ); ?></p>
			</div>
			<a class="rn-btn rn-btn--ghost" href="<?php echo esc_url( $rn_browser ? '#catalogue' : Settings::page_url( 'catalog' ) ); ?>">Voir tous les travaux →</a>
		</div>
		<?php if ( $rn_featured ) : ?>
			<div class="rn-grid rn-grid--3">
				<?php foreach ( $rn_featured as $rn_a ) : ?>
					<a class="rn-feature-card"<?php echo $rn_quote( $rn_a ); // phpcs:ignore WordPress.Security.EscapeOutput ?>>
						<?php if ( $rn_a['image'] ) : ?>
							<img class="rn-feature-card__img" src="<?php echo esc_url( $rn_a['image'] ); ?>" alt="" loading="lazy" decoding="async" width="640" height="400">
						<?php else : ?>
							<span class="rn-feature-card__ph"><?php echo Frontend::icon( $rn_a['icon'], 40 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
						<?php endif; ?>
						<span class="rn-feature-card__body">
							<span class="rn-feature-card__title"><?php echo esc_html( $rn_a['name'] ); ?></span>
							<span class="rn-feature-card__desc"><?php echo esc_html( $rn_a['excerpt'] ); ?></span>
							<span class="rn-feature-card__cta">Demander un devis →</span>
						</span>
					</a>
				<?php endforeach; ?>
			</div>
		<?php endif; ?>

		<?php
		if ( $rn_browser ) {
			echo Frontend::render( 'parts/browser', array( 'groups' => $rn_groups ) ); // phpcs:ignore WordPress.Security.EscapeOutput
		}
		?>
	</div>
</section>
