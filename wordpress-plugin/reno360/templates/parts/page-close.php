<?php
/**
 * Fermeture de page (voir page-open.php).
 *
 * @package Reno360
 */

defined( 'ABSPATH' ) || exit;
?>
</main>
<?php if ( function_exists( 'wp_is_block_theme' ) && wp_is_block_theme() ) : ?>
	<?php block_template_part( 'footer' ); ?>
</div>
	<?php wp_footer(); ?>
</body>
</html>
<?php else : ?>
	<?php get_footer(); ?>
<?php endif; ?>
