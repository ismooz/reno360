<?php
/**
 * Champ de recherche « Quels travaux ? » + NPA, avec suggestions et travaux populaires.
 *
 * Variables : $placeholder, $button, $npa (yes|no), $target (modal|form|page), $popular (yes|no), $source, $title, $subtitle.
 *
 * @package Reno360
 */

use Reno360\Activities;
use Reno360\Chrome;
use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

$placeholder = isset( $placeholder ) ? $placeholder : 'Ex. salle de bain, fuite, PAC…';
$button      = isset( $button ) ? $button : 'Recevoir mes devis';
$show_npa    = ! isset( $npa ) || 'no' !== $npa;
$target      = isset( $target ) && in_array( $target, array( 'modal', 'form', 'page' ), true ) ? $target : 'modal';
$show_pop    = ! isset( $popular ) || 'no' !== $popular;
$source      = isset( $source ) ? $source : 'search';
$uid         = wp_unique_id( 'rn-sb-' );
?>
<?php if ( ! empty( $title ) ) : ?>
	<h2 class="rn-h2"><?php echo esc_html( $title ); ?></h2>
<?php endif; ?>
<?php if ( ! empty( $subtitle ) ) : ?>
	<p class="rn-lead"><?php echo esc_html( $subtitle ); ?></p>
<?php endif; ?>
<form class="rn-searchbox<?php echo $show_npa ? '' : ' rn-searchbox--single'; ?>" role="search" action="<?php echo esc_url( Settings::page_url( 'form' ) ); ?>" method="get" data-rn-search data-rn-target="<?php echo esc_attr( $target ); ?>" data-rn-source="<?php echo esc_attr( $source ); ?>">
	<label class="rn-searchbox__field rn-searchbox__field--main" for="<?php echo esc_attr( $uid ); ?>-q">
		<span class="rn-searchbox__label">Quels travaux ?</span>
		<span class="rn-searchbox__input">
			<input id="<?php echo esc_attr( $uid ); ?>-q" type="text" name="q" data-rn-search-input placeholder="<?php echo esc_attr( $placeholder ); ?>" autocomplete="off" enterkeyhint="search">
		</span>
	</label>
	<?php if ( $show_npa ) : ?>
		<span class="rn-searchbox__sep" aria-hidden="true"></span>
		<label class="rn-searchbox__field rn-searchbox__field--npa" for="<?php echo esc_attr( $uid ); ?>-npa">
			<span class="rn-searchbox__label">NPA</span>
			<span class="rn-searchbox__input">
				<input id="<?php echo esc_attr( $uid ); ?>-npa" type="text" name="npa" data-rn-npa inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="1003" autocomplete="postal-code">
			</span>
		</label>
	<?php endif; ?>
	<button type="submit" class="rn-btn rn-btn--primary rn-searchbox__btn" data-rn-search-submit><?php echo esc_html( $button ); ?></button>
	<div class="rn-searchbox__anchor" data-rn-search-anchor></div>
</form>
<?php
if ( $show_pop ) :
	$rn_popular = array_slice(
		array_filter(
			Activities::all(),
			static function ( $a ) {
				return $a['popular'] && $a['active'];
			}
		),
		0,
		7
	);
	if ( $rn_popular ) :
		?>
		<div class="rn-popular">
			<span class="rn-popular__label">Populaire :</span>
			<?php foreach ( $rn_popular as $rn_a ) : ?>
				<a class="rn-chip" href="<?php echo esc_url( 'page' === $target ? $rn_a['url'] : Settings::page_url( 'form', array( 'travail' => $rn_a['slug'] ) ) ); ?>"<?php echo 'modal' === $target ? ' data-rn-quote="' . (int) $rn_a['id'] . '"' : ''; ?>><?php echo esc_html( Chrome::short_name( $rn_a['name'] ) ); ?></a>
			<?php endforeach; ?>
		</div>
		<?php
	endif;
endif;
