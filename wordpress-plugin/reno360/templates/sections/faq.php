<?php
/**
 * Questions fréquentes (Réglages > Contenus).
 *
 * Variables : $title, $items (facultatif : [[q, a]]).
 *
 * @package Reno360
 */

use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

$rn_items = ! empty( $items ) ? $items : Settings::faq();
if ( ! $rn_items ) {
	return;
}
$rn_phone = Settings::get( 'phone' );
$rn_mail  = Settings::get( 'public_email' );
?>
<section class="rn-section" id="faq">
	<div class="rn-container rn-split rn-split--top">
		<div>
			<h2 class="rn-h2"><?php echo esc_html( isset( $title ) ? $title : 'Questions fréquentes' ); ?></h2>
			<p class="rn-lead rn-lead--sm">Une autre question ?
				<?php if ( $rn_phone ) : ?>
					Appelez-nous au <a href="tel:<?php echo esc_attr( preg_replace( '/[^\d+]/', '', $rn_phone ) ); ?>"><strong><?php echo esc_html( $rn_phone ); ?></strong></a>
				<?php endif; ?>
				<?php if ( $rn_mail ) : ?>
					ou écrivez à <a href="mailto:<?php echo esc_attr( $rn_mail ); ?>"><strong><?php echo esc_html( $rn_mail ); ?></strong></a>.
				<?php endif; ?>
			</p>
		</div>
		<div class="rn-faq">
			<?php foreach ( $rn_items as $rn_i => $rn_f ) : ?>
				<details class="rn-faq__item"<?php echo 0 === $rn_i ? ' open' : ''; ?>>
					<summary><?php echo esc_html( $rn_f['q'] ); ?><span class="rn-faq__sign" aria-hidden="true"></span></summary>
					<div class="rn-faq__answer"><?php echo wp_kses_post( wpautop( $rn_f['a'] ) ); ?></div>
				</details>
			<?php endforeach; ?>
		</div>
	</div>
</section>
