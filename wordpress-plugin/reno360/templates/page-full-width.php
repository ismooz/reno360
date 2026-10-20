<?php
/**
 * Gabarit de page « Reno360 — pleine largeur » : pas de titre ni de barre latérale,
 * le contenu (shortcodes Reno360 ou mise en page Divi) occupe toute la largeur.
 *
 * @package Reno360
 */

defined( 'ABSPATH' ) || exit;

require __DIR__ . '/parts/page-open.php';
while ( have_posts() ) :
	the_post();
	?>
	<article id="post-<?php the_ID(); ?>" <?php post_class( 'rn-page-article' ); ?>>
		<?php the_content(); ?>
	</article>
	<?php
endwhile;
require __DIR__ . '/parts/page-close.php';
