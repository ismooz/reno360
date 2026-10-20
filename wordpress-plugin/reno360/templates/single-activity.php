<?php
/**
 * Page publique d'un type de travaux (mise en page automatique).
 * Pour la mettre en page avec Divi, décochez « Mise en page automatique » dans la fiche du travail.
 *
 * @package Reno360
 */

use Reno360\Activities;
use Reno360\Frontend;

defined( 'ABSPATH' ) || exit;

Frontend::enqueue();
require __DIR__ . '/parts/page-open.php';
while ( have_posts() ) :
	the_post();
	$rn_activity = Activities::get( get_the_ID() );
	echo '<div class="rn-app rn-activity-page">' . Frontend::render( 'activity', array( 'a' => $rn_activity ) ) . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput
endwhile;
require __DIR__ . '/parts/page-close.php';
