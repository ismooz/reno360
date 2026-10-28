<?php
/**
 * Questions fréquentes (Réglages → Contenu). Une seule réponse ouverte à la fois.
 *
 * @package Reno360
 */

use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

$rn_items = Settings::faq();
if ( ! $rn_items ) {
	return;
}
$rn_mail = Settings::get( 'public_email' );
?>
<section class="rn-section" id="faq">
	<div class="rn-container rn-faq-wrap">
		<div class="rn-faq-wrap__intro">
			<span class="rn-overline">FAQ</span>
			<h2 class="rn-h2"><?php echo esc_html( isset( $title ) ? $title : 'Questions fréquentes' ); ?></h2>
			<?php if ( $rn_mail ) : ?>
				<p>Une autre question ? Écrivez-nous à <a href="<?php echo esc_attr( 'mailto:' . $rn_mail ); ?>"><?php echo esc_html( $rn_mail ); ?></a>.</p>
			<?php endif; ?>
		</div>
		<div class="rn-faq">
			<?php foreach ( $rn_items as $rn_i => $rn_f ) : ?>
				<details class="rn-faq__item" name="rn-faq"<?php echo 0 === $rn_i ? ' open' : ''; ?>>
					<summary><?php echo esc_html( $rn_f['q'] ); ?><span class="rn-faq__sign" aria-hidden="true"></span></summary>
					<div class="rn-faq__answer"><?php echo wp_kses_post( wpautop( $rn_f['a'] ) ); ?></div>
				</details>
			<?php endforeach; ?>
		</div>
	</div>
</section>
