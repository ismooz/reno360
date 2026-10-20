<?php
/**
 * Contenu de la page d'un type de travaux.
 *
 * Variables : $a (tableau Activities::get()).
 *
 * @package Reno360
 */

use Reno360\Activities;
use Reno360\Frontend;
use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

if ( empty( $a ) ) {
	return;
}
$rn_form_url = Settings::page_url( 'form', array( 'travail' => $a['slug'] ) );
$rn_services = array();
foreach ( $a['questions'] as $rn_q ) {
	if ( in_array( $rn_q['type'], array( 'single', 'multiple' ), true ) ) {
		$rn_services = array_values(
			array_filter(
				$rn_q['options'],
				static function ( $o ) {
					return false === stripos( $o, 'je ne sais pas' ) && false === stripos( $o, 'autre' );
				}
			)
		);
		break;
	}
}
$rn_related = array_slice(
	array_values(
		array_filter(
			Activities::all(),
			static function ( $x ) use ( $a ) {
				return $x['id'] !== $a['id'] && $x['category_id'] === $a['category_id'];
			}
		)
	),
	0,
	6
);
$rn_faq     = $a['faq'] ? $a['faq'] : array();
$rn_content = trim( (string) $a['content'] );
?>
<section class="rn-section rn-section--muted rn-activity-hero">
	<div class="rn-container">
		<nav class="rn-breadcrumb" aria-label="Fil d’Ariane">
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>">Accueil</a><span aria-hidden="true">/</span>
			<a href="<?php echo esc_url( Settings::page_url( 'catalog' ) ); ?>">Travaux</a><span aria-hidden="true">/</span>
			<span aria-current="page"><?php echo esc_html( $a['name'] ); ?></span>
		</nav>
		<div class="rn-split">
			<div>
				<?php if ( $a['category'] ) : ?>
					<span class="rn-eyebrow"><?php echo esc_html( $a['category'] ); ?></span>
				<?php endif; ?>
				<h1 class="rn-h1 rn-h1--md"><?php echo esc_html( $a['name'] ); ?></h1>
				<?php if ( $a['excerpt'] ) : ?>
					<p class="rn-lead"><?php echo esc_html( $a['excerpt'] ); ?>.</p>
				<?php endif; ?>
				<form class="rn-panel rn-quickstart" action="<?php echo esc_url( Settings::page_url( 'form' ) ); ?>" method="get">
					<input type="hidden" name="travail" value="<?php echo esc_attr( $a['slug'] ); ?>">
					<strong>Démarrez votre demande</strong>
					<div class="rn-quickstart__row">
						<label class="rn-field"><span class="rn-label">NPA du chantier</span><input class="rn-input" type="text" name="npa" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="1003" autocomplete="postal-code"></label>
						<button type="submit" class="rn-btn rn-btn--primary rn-btn--lg"><?php echo esc_html( Settings::fill( 'Recevoir jusqu’à {max_artisans} devis' ) ); ?><?php echo Frontend::icon( 'arrow', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
					</div>
					<span class="rn-quickstart__note">Gratuit · Sans engagement · Artisans vérifiés</span>
				</form>
			</div>
			<div class="rn-activity-hero__media">
				<?php if ( $a['image'] ) : ?>
					<img src="<?php echo esc_url( $a['image'] ); ?>" alt="<?php echo esc_attr( $a['name'] ); ?>" loading="eager" decoding="async">
				<?php else : ?>
					<span class="rn-activity-hero__icon"><?php echo Frontend::icon( $a['icon'], 96 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
				<?php endif; ?>
			</div>
		</div>
	</div>
</section>

<?php if ( $rn_services ) : ?>
	<section class="rn-section rn-section--tight">
		<div class="rn-container">
			<h2 class="rn-h2 rn-mb">Ce que nos artisans réalisent</h2>
			<div class="rn-grid rn-grid--3">
				<?php foreach ( array_slice( $rn_services, 0, 9 ) as $rn_s ) : ?>
					<a class="rn-service" href="<?php echo esc_url( $rn_form_url ); ?>"><span class="rn-icon-tile"><?php echo Frontend::icon( $a['icon'], 20 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></span><strong><?php echo esc_html( $rn_s ); ?></strong></a>
				<?php endforeach; ?>
			</div>
		</div>
	</section>
<?php endif; ?>

<?php if ( $rn_content ) : ?>
	<section class="rn-section rn-section--tight">
		<div class="rn-container rn-prose">
			<?php echo apply_filters( 'the_content', $rn_content ); // phpcs:ignore WordPress.Security.EscapeOutput, WordPress.NamingConventions.PrefixAllGlobals ?>
		</div>
	</section>
<?php endif; ?>

<?php if ( $a['prices'] ) : ?>
	<section class="rn-section rn-section--tight">
		<div class="rn-container">
			<h2 class="rn-h2"><?php echo esc_html( 'Combien coûtent ces travaux ?' ); ?></h2>
			<p class="rn-muted rn-mb">Prix TTC indicatifs, main-d’œuvre et fournitures standards. Seul un devis après visite fait foi.</p>
			<div class="rn-table-scroll rn-table-box">
				<table class="rn-table">
					<thead><tr><th scope="col">Prestation</th><th scope="col">Fourchette indicative</th><th scope="col">Durée typique</th></tr></thead>
					<tbody>
						<?php foreach ( $a['prices'] as $rn_p ) : ?>
							<tr><th scope="row"><?php echo esc_html( $rn_p['label'] ); ?></th><td><?php echo esc_html( $rn_p['range'] ); ?></td><td class="rn-muted"><?php echo esc_html( $rn_p['duration'] ); ?></td></tr>
						<?php endforeach; ?>
					</tbody>
				</table>
			</div>
		</div>
	</section>
<?php endif; ?>

<?php echo Frontend::render( 'sections/how' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>

<?php if ( $rn_faq ) : ?>
	<?php
	echo Frontend::render( // phpcs:ignore WordPress.Security.EscapeOutput
		'sections/faq',
		array(
			'title' => 'Questions fréquentes',
			'items' => $rn_faq,
		)
	);
	?>
<?php endif; ?>

<?php if ( $rn_related ) : ?>
	<section class="rn-section rn-section--tight">
		<div class="rn-container">
			<h2 class="rn-h3 rn-mb">Travaux souvent associés</h2>
			<div class="rn-chips">
				<?php foreach ( $rn_related as $rn_r ) : ?>
					<a class="rn-chip rn-chip--soft" href="<?php echo esc_url( $rn_r['url'] ); ?>"><?php echo esc_html( $rn_r['name'] ); ?></a>
				<?php endforeach; ?>
			</div>
		</div>
	</section>
<?php endif; ?>

<?php
echo Frontend::render( // phpcs:ignore WordPress.Security.EscapeOutput
	'sections/cta',
	array(
		'title' => 'Votre projet « ' . $a['name'] . ' » commence ici.',
		'url'   => $rn_form_url,
	)
);
