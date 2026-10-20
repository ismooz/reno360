<?php
/**
 * Ouverture de page compatible thèmes classiques (Divi…) et thèmes à blocs.
 *
 * @package Reno360
 */

defined( 'ABSPATH' ) || exit;

if ( function_exists( 'wp_is_block_theme' ) && wp_is_block_theme() ) : ?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div class="wp-site-blocks">
	<?php block_template_part( 'header' ); ?>
<?php else : ?>
	<?php get_header(); ?>
<?php endif; ?>
<main id="main-content" class="rn-main">
