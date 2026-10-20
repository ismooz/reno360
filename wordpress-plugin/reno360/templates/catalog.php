<?php
/**
 * Catalogue de tous les travaux, filtrable par catégorie et par recherche instantanée.
 *
 * Variables : $title, $target (page|form).
 *
 * @package Reno360
 */

use Reno360\Activities;
use Reno360\Frontend;
use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

$rn_target = isset( $target ) && 'form' === $target ? 'form' : 'page';
$rn_all    = Activities::all();
$rn_groups = array();
foreach ( $rn_all as $rn_a ) {
	$rn_groups[ $rn_a['category_id'] ][] = $rn_a;
}
$rn_cats = Activities::categories();
?>
<section class="rn-section rn-section--tight">
	<div class="rn-container">
		<div class="rn-catalog__head">
			<h1 class="rn-h1 rn-h1--md"><?php echo esc_html( isset( $title ) ? $title : 'Tous les travaux' ); ?></h1>
			<p class="rn-lead rn-lead--sm"><?php echo esc_html( sprintf( '%d types de travaux. Tapez quelques mots : « fuite », « douche italienne », « boiler »…', count( $rn_all ) ) ); ?></p>
			<div class="rn-catalog__search" data-rn-catalog-search>
				<label class="rn-searchbar">
					<?php echo Frontend::icon( 'search', 20 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
					<input type="search" class="rn-searchbar__input" placeholder="Rechercher un type de travaux…" aria-label="Rechercher un type de travaux" autocomplete="off" data-rn-catalog-input>
				</label>
			</div>
			<div class="rn-filters" role="group" aria-label="Filtrer par catégorie">
				<button type="button" class="rn-filter is-active" data-rn-filter="" aria-pressed="true">Tout</button>
				<?php foreach ( $rn_cats as $rn_c ) : ?>
					<?php if ( ! empty( $rn_groups[ $rn_c['id'] ] ) ) : ?>
						<button type="button" class="rn-filter" data-rn-filter="<?php echo esc_attr( $rn_c['slug'] ); ?>" aria-pressed="false"><?php echo esc_html( $rn_c['name'] ); ?></button>
					<?php endif; ?>
				<?php endforeach; ?>
			</div>
		</div>

		<p class="rn-catalog__status rn-muted" data-rn-catalog-status role="status" aria-live="polite"></p>

		<div class="rn-catalog" data-rn-catalog>
			<?php foreach ( $rn_cats as $rn_c ) : ?>
				<?php
				if ( empty( $rn_groups[ $rn_c['id'] ] ) ) {
					continue;
				}
				?>
				<div class="rn-cat-group" id="cat-<?php echo esc_attr( $rn_c['slug'] ); ?>" data-rn-group="<?php echo esc_attr( $rn_c['slug'] ); ?>">
					<h2 class="rn-cat-group__title"><span class="rn-icon-tile rn-icon-tile--sm"><?php echo Frontend::icon( $rn_c['icon'], 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span><?php echo esc_html( $rn_c['name'] ); ?></h2>
					<div class="rn-grid rn-grid--cards">
						<?php foreach ( $rn_groups[ $rn_c['id'] ] as $rn_a ) : ?>
							<a class="rn-act-card" data-rn-item="<?php echo (int) $rn_a['id']; ?>" href="<?php echo esc_url( 'form' === $rn_target ? Settings::page_url( 'form', array( 'travail' => $rn_a['slug'] ) ) : $rn_a['url'] ); ?>">
								<span class="rn-act-card__icon"><?php echo Frontend::icon( $rn_a['icon'], 22 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
								<span class="rn-act-card__body">
									<strong class="rn-act-card__name"><?php echo esc_html( $rn_a['name'] ); ?></strong>
									<span class="rn-act-card__ex"><?php echo esc_html( $rn_a['excerpt'] ); ?></span>
									<span class="rn-act-card__hint" data-rn-hint hidden></span>
								</span>
							</a>
						<?php endforeach; ?>
					</div>
				</div>
			<?php endforeach; ?>
			<?php if ( ! empty( $rn_groups[0] ) ) : ?>
				<div class="rn-cat-group" id="cat-autres" data-rn-group="autres">
					<h2 class="rn-cat-group__title">Autres travaux</h2>
					<div class="rn-grid rn-grid--cards">
						<?php foreach ( $rn_groups[0] as $rn_a ) : ?>
							<a class="rn-act-card" data-rn-item="<?php echo (int) $rn_a['id']; ?>" href="<?php echo esc_url( 'form' === $rn_target ? Settings::page_url( 'form', array( 'travail' => $rn_a['slug'] ) ) : $rn_a['url'] ); ?>">
								<span class="rn-act-card__icon"><?php echo Frontend::icon( $rn_a['icon'], 22 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
								<span class="rn-act-card__body"><strong class="rn-act-card__name"><?php echo esc_html( $rn_a['name'] ); ?></strong><span class="rn-act-card__ex"><?php echo esc_html( $rn_a['excerpt'] ); ?></span><span class="rn-act-card__hint" data-rn-hint hidden></span></span>
							</a>
						<?php endforeach; ?>
					</div>
				</div>
			<?php endif; ?>
		</div>

		<div class="rn-empty" data-rn-catalog-empty hidden>
			<strong>Aucun type de travaux ne correspond à votre recherche.</strong>
			<p class="rn-muted">Décrivez simplement votre projet : un conseiller trouvera l’artisan adapté.</p>
			<a class="rn-btn rn-btn--primary" href="<?php echo esc_url( Settings::page_url( 'form' ) ); ?>" data-rn-catalog-free>Décrire mon projet</a>
		</div>
	</div>
</section>
<?php
echo Frontend::render( 'sections/cta' ); // phpcs:ignore WordPress.Security.EscapeOutput
