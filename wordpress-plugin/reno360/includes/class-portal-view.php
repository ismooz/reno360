<?php
/**
 * Rendu de l'espace client : connexion, liste des demandes, détail (suivi, devis, messages).
 *
 * @package Reno360
 */

namespace Reno360;

defined( 'ABSPATH' ) || exit;

class Portal_View {

	public static function render() {
		$email = Portal::current_email();
		if ( ! $email ) {
			return Frontend::render( 'portal/login' );
		}
		$ref = isset( $_GET['demande'] ) ? sanitize_text_field( wp_unslash( $_GET['demande'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		$all = Requests::for_email( $email );
		if ( ! $all ) {
			return Frontend::render( 'portal/empty', array( 'email' => $email ) );
		}
		$current = null;
		if ( $ref ) {
			$current = Portal::request_for_current( $ref );
		}
		if ( ! $current ) {
			$current = $all[0];
		}
		return Frontend::render(
			'portal/detail',
			array(
				'email'    => $email,
				'requests' => $all,
				'r'        => $current,
				'quotes'   => Quotes::for_request( $current['id'], true ),
				'messages' => Events::for_request( $current['id'], 'client', 'ASC' ),
				'files'    => Files::query( array( 'request_id' => $current['id'] ) ),
				'csrf'     => Portal::csrf(),
			)
		);
	}
}
