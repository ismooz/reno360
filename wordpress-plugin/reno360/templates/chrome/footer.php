<?php
/**
 * Pied de page du site.
 * Surcharge possible : votre-theme/reno360/chrome/footer.php
 *
 * @package Reno360
 */

use Reno360\Chrome;
use Reno360\Settings;
use Reno360\Util;

defined( 'ABSPATH' ) || exit;

$rn_logo    = Chrome::logo_url();
$rn_email   = Settings::get( 'public_email' );
$rn_company = Settings::get( 'company', 'Reno360' );
$rn_works   = Chrome::highlights( 4, array( 'salle-de-bain', 'cuisine', 'pompe-a-chaleur', 'renovation-complete' ) );
$rn_cantons = array();
foreach ( (array) Settings::get( 'cantons', array() ) as $rn_c ) {
	if ( isset( Util::cantons()[ $rn_c ] ) ) {
		$rn_cantons[] = Util::cantons()[ $rn_c ];
	}
}
$rn_regions = array_map(
	static function ( $pair ) {
		return implode( ' · ', $pair );
	},
	array_chunk( $rn_cantons, 2 )
);
$rn_romand  = ! array_diff( (array) Settings::get( 'cantons', array() ), array( 'VD', 'GE', 'FR', 'VS', 'NE', 'JU' ) );
?>
<footer class="rn-app rn-chrome rn-site-footer">
	<div class="rn-container">
		<div class="rn-site-footer__top">
			<div class="rn-site-footer__brand">
				<?php if ( $rn_logo ) : ?>
					<img src="<?php echo esc_url( $rn_logo ); ?>" alt="<?php echo esc_attr( $rn_company ); ?>" height="32" loading="lazy">
				<?php else : ?>
					<span class="rn-logo-text"><?php echo Chrome::logo_text(); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
				<?php endif; ?>
				<?php if ( Settings::get( 'footer_text' ) ) : ?>
					<p><?php echo esc_html( Settings::get( 'footer_text' ) ); ?></p>
				<?php endif; ?>
				<?php if ( $rn_email ) : ?>
					<a href="<?php echo esc_attr( 'mailto:' . $rn_email ); ?>"><?php echo esc_html( $rn_email ); ?></a>
				<?php endif; ?>
			</div>
			<div class="rn-site-footer__col">
				<div class="rn-overline">Travaux</div>
				<?php foreach ( $rn_works as $rn_a ) : ?>
					<a href="<?php echo esc_url( $rn_a['url'] ); ?>"><?php echo esc_html( Chrome::short_name( $rn_a['name'] ) ); ?></a>
				<?php endforeach; ?>
				<a class="is-strong" href="<?php echo esc_url( Settings::page_url( 'catalog' ) ); ?>">Tous les travaux</a>
			</div>
			<div class="rn-site-footer__col">
				<div class="rn-overline">Particuliers</div>
				<a href="<?php echo esc_url( Settings::page_url( 'form' ) ); ?>">Demande de devis</a>
				<a href="<?php echo esc_url( Settings::page_url( 'portal' ) ); ?>">Mon espace</a>
				<a href="<?php echo esc_url( Chrome::home_anchor( 'subventions' ) ); ?>">Subventions</a>
				<a href="<?php echo esc_url( Chrome::home_anchor( 'faq' ) ); ?>">Questions fréquentes</a>
			</div>
			<div class="rn-site-footer__col">
				<div class="rn-overline">Artisans</div>
				<a href="<?php echo esc_url( Settings::page_url( 'partner' ) ); ?>">Devenir partenaire</a>
				<a href="<?php echo esc_url( Settings::page_url( 'artisan' ) ); ?>">Espace artisan</a>
			</div>
			<?php if ( $rn_regions ) : ?>
				<div class="rn-site-footer__col">
					<div class="rn-overline">Régions</div>
					<?php foreach ( $rn_regions as $rn_r ) : ?>
						<span><?php echo esc_html( $rn_r ); ?></span>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>
		</div>
		<div class="rn-site-footer__bottom">
			<span>© <?php echo esc_html( wp_date( 'Y' ) . ' ' . $rn_company . ( $rn_romand ? ' · Suisse romande' : '' ) ); ?></span>
			<?php if ( Chrome::legal_links() ) : ?>
				<nav class="rn-site-footer__legal" aria-label="Informations légales">
					<?php foreach ( Chrome::legal_links() as $rn_label => $rn_url ) : ?>
						<a href="<?php echo esc_url( $rn_url ); ?>"><?php echo esc_html( $rn_label ); ?></a>
					<?php endforeach; ?>
				</nav>
			<?php endif; ?>
		</div>
	</div>
</footer>
