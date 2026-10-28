<?php
/**
 * Catalogue intégré : recherche, catégories à gauche, travaux à droite (accueil et [reno360_categories]).
 *
 * Variables : $groups (facultatif, sinon toutes les catégories actives).
 *
 * @package Reno360
 */

use Reno360\Chrome;
use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

$rn_groups = isset( $groups ) ? $groups : Chrome::groups();
if ( ! $rn_groups ) {
	return;
}
$rn_total = 0;
foreach ( $rn_groups as $rn_g ) {
	$rn_total += count( $rn_g['items'] );
}
$rn_quote = static function ( $a ) {
	return ' href="' . esc_url( Settings::page_url( 'form', array( 'travail' => $a['slug'] ) ) ) . '" data-rn-quote="' . (int) $a['id'] . '"';
};
?>
<div class="rn-browser" id="catalogue" data-rn-browser>
	<div class="rn-browser__head">
		<div>
			<strong class="rn-browser__title"><?php echo esc_html( sprintf( 'Parcourir les %d types de travaux', $rn_total ) ); ?></strong>
			<span class="rn-browser__sub">Tapez quelques mots : « fuite », « douche italienne », « boiler »…</span>
		</div>
		<input type="search" class="rn-browser__search" placeholder="Rechercher un type de travaux" aria-label="Rechercher un type de travaux" autocomplete="off" data-rn-browser-input>
	</div>
	<div class="rn-browser__body">
		<div class="rn-browser__tabs" role="tablist" aria-label="Catégories de travaux">
			<?php foreach ( $rn_groups as $rn_i => $rn_g ) : ?>
				<button type="button" class="rn-browser__tab" role="tab" aria-selected="<?php echo 0 === $rn_i ? 'true' : 'false'; ?>" data-rn-browser-tab="<?php echo esc_attr( $rn_g['slug'] ); ?>" data-name="<?php echo esc_attr( $rn_g['name'] ); ?>"><?php echo esc_html( $rn_g['name'] ); ?><span class="rn-mono"><?php echo (int) count( $rn_g['items'] ); ?></span></button>
			<?php endforeach; ?>
		</div>
		<div class="rn-browser__panel" role="tabpanel" aria-live="polite">
			<div class="rn-browser__panel-head">
				<strong data-rn-browser-title><?php echo esc_html( $rn_groups[0]['name'] ); ?></strong>
				<span class="rn-mono" data-rn-browser-count><?php echo esc_html( sprintf( _n( '%d type', '%d types', count( $rn_groups[0]['items'] ), 'reno360' ), count( $rn_groups[0]['items'] ) ) ); ?></span>
			</div>
			<div class="rn-browser__grid">
				<?php foreach ( $rn_groups as $rn_i => $rn_g ) : ?>
					<?php foreach ( $rn_g['items'] as $rn_a ) : ?>
						<a class="rn-browser__item"<?php echo $rn_quote( $rn_a ); // phpcs:ignore WordPress.Security.EscapeOutput ?> data-rn-browser-item="<?php echo (int) $rn_a['id']; ?>" data-cat="<?php echo esc_attr( $rn_g['slug'] ); ?>"<?php echo 0 === $rn_i ? '' : ' hidden'; ?>>
							<span class="rn-browser__item-top"><strong><?php echo esc_html( $rn_a['name'] ); ?></strong><span aria-hidden="true">→</span></span>
							<span class="rn-browser__item-desc"><?php echo esc_html( $rn_a['excerpt'] ); ?></span>
							<span class="rn-browser__item-cat" data-cat-name="<?php echo esc_attr( $rn_g['name'] ); ?>">Demander un devis</span>
						</a>
					<?php endforeach; ?>
				<?php endforeach; ?>
			</div>
			<div class="rn-browser__empty" hidden data-rn-browser-empty>Aucun résultat. <a href="<?php echo esc_url( Settings::page_url( 'form' ) ); ?>" data-rn-quote data-rn-browser-free>Décrivez votre projet librement →</a></div>
		</div>
	</div>
	<noscript><style>.rn-app .rn-browser .rn-browser__item[hidden] { display: flex !important; }</style></noscript>
</div>
