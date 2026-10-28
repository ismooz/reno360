<?php
/**
 * En-tête du site : bandeau d'information, logo, menu (avec le panneau « Travaux ») et menu mobile.
 * Surcharge possible : votre-theme/reno360/chrome/header.php
 *
 * @package Reno360
 */

use Reno360\Chrome;
use Reno360\Frontend;
use Reno360\Settings;

defined( 'ABSPATH' ) || exit;

$rn_logo   = Chrome::logo_url();
$rn_home   = home_url( '/' );
$rn_email  = Settings::get( 'public_email' );
$rn_groups = Chrome::groups();
$rn_count  = 0;
foreach ( $rn_groups as $rn_g ) {
	$rn_count += count( $rn_g['items'] );
}
$rn_nav = array(
	array( 'Comment ça marche', Chrome::home_anchor( 'comment-ca-marche' ) ),
	array( 'Subventions', Chrome::home_anchor( 'subventions' ) ),
	array( 'Artisans', Chrome::home_anchor( 'artisans' ) ),
	array( 'FAQ', Chrome::home_anchor( 'faq' ) ),
);
$rn_uid = wp_unique_id( 'rn-hd-' );
?>
<?php if ( Settings::get( 'show_utility' ) ) : ?>
	<div class="rn-app rn-chrome rn-utility">
		<div class="rn-container rn-utility__inner">
			<span class="rn-utility__region"><?php echo esc_html( Chrome::region_text() ); ?></span>
			<span class="rn-utility__links">
				<?php if ( $rn_email ) : ?>
					<a class="rn-utility__mail" href="<?php echo esc_attr( 'mailto:' . $rn_email ); ?>"><?php echo esc_html( $rn_email ); ?></a>
				<?php endif; ?>
				<a href="<?php echo esc_url( Chrome::home_anchor( 'artisans' ) ); ?>">Espace artisan</a>
			</span>
		</div>
	</div>
<?php endif; ?>
<header class="rn-app rn-chrome rn-site-header" data-rn-header>
	<div class="rn-container rn-site-header__bar">
		<a class="rn-site-header__logo" href="<?php echo esc_url( $rn_home ); ?>" rel="home">
			<?php if ( $rn_logo ) : ?>
				<img src="<?php echo esc_url( $rn_logo ); ?>" alt="<?php echo esc_attr( Settings::get( 'company', 'Reno360' ) ); ?>" height="34">
			<?php else : ?>
				<span class="rn-logo-text"><?php echo Chrome::logo_text(); // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
			<?php endif; ?>
		</a>
		<nav class="rn-site-nav" aria-label="Navigation principale">
			<?php if ( $rn_groups ) : ?>
				<button type="button" class="rn-site-nav__link" aria-expanded="false" aria-controls="<?php echo esc_attr( $rn_uid ); ?>-mega" data-rn-mega-toggle>Travaux<?php echo Frontend::icon( 'chevrondown', 14 ); // phpcs:ignore WordPress.Security.EscapeOutput ?></button>
			<?php endif; ?>
			<?php foreach ( $rn_nav as $rn_l ) : ?>
				<a class="rn-site-nav__link" href="<?php echo esc_url( $rn_l[1] ); ?>"><?php echo esc_html( $rn_l[0] ); ?></a>
			<?php endforeach; ?>
		</nav>
		<div class="rn-site-header__actions">
			<a class="rn-btn rn-btn--ghost" href="<?php echo esc_url( Settings::page_url( 'portal' ) ); ?>">Mon espace</a>
			<a class="rn-btn rn-btn--primary" href="<?php echo esc_url( Settings::page_url( 'form' ) ); ?>" data-rn-quote>Demander mes devis</a>
		</div>
		<button type="button" class="rn-btn rn-btn--ghost rn-btn--sm rn-site-header__menu" aria-expanded="false" aria-controls="<?php echo esc_attr( $rn_uid ); ?>-mnav" data-rn-mnav-toggle data-label-open="Fermer">Menu</button>
	</div>

	<?php if ( $rn_groups ) : ?>
		<div class="rn-mega" id="<?php echo esc_attr( $rn_uid ); ?>-mega" hidden data-rn-mega>
			<div class="rn-mega__panel">
				<div class="rn-container">
					<div class="rn-mega__head">
						<strong><?php echo esc_html( sprintf( '%d types de travaux', $rn_count ) ); ?></strong>
						<a href="<?php echo esc_url( Settings::page_url( 'form' ) ); ?>" data-rn-quote>Vous ne trouvez pas ? Décrivez votre projet librement →</a>
					</div>
					<div class="rn-mega__grid">
						<?php foreach ( $rn_groups as $rn_g ) : ?>
							<div>
								<div class="rn-overline rn-mega__cat"><?php echo esc_html( $rn_g['name'] ); ?></div>
								<ul class="rn-mega__list">
									<?php foreach ( $rn_g['items'] as $rn_a ) : ?>
										<li><a href="<?php echo esc_url( $rn_a['url'] ); ?>"><?php echo esc_html( $rn_a['name'] ); ?></a></li>
									<?php endforeach; ?>
								</ul>
							</div>
						<?php endforeach; ?>
					</div>
				</div>
			</div>
		</div>
	<?php endif; ?>

	<nav class="rn-mnav" id="<?php echo esc_attr( $rn_uid ); ?>-mnav" hidden data-rn-mnav aria-label="Menu">
		<a href="<?php echo esc_url( Settings::page_url( 'catalog' ) ); ?>">Tous les travaux</a>
		<?php foreach ( $rn_nav as $rn_l ) : ?>
			<a href="<?php echo esc_url( $rn_l[1] ); ?>"><?php echo esc_html( $rn_l[0] ); ?></a>
		<?php endforeach; ?>
		<a href="<?php echo esc_url( Settings::page_url( 'portal' ) ); ?>">Mon espace</a>
		<a class="rn-btn rn-btn--primary rn-btn--block" href="<?php echo esc_url( Settings::page_url( 'form' ) ); ?>" data-rn-quote>Demander mes devis</a>
	</nav>
</header>
