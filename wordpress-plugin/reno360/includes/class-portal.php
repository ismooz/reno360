<?php
/**
 * Espace client sans mot de passe : lien magique signé + cookie de session signé.
 *
 * @package Reno360
 */

namespace Reno360;

defined( 'ABSPATH' ) || exit;

class Portal {

	const COOKIE = 'rn_portal';

	public static function init() {
		add_action( 'template_redirect', array( __CLASS__, 'handle' ), 1 );
	}

	private static function b64( $s ) {
		return rtrim( strtr( base64_encode( $s ), '+/', '-_' ), '=' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions
	}

	private static function unb64( $s ) {
		return base64_decode( strtr( (string) $s, '-_', '+/' ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions
	}

	private static function sign( $payload ) {
		return substr( hash_hmac( 'sha256', $payload, wp_salt( 'auth' ) . '|reno360-portal' ), 0, 40 );
	}

	/**
	 * Jeton signé contenant l'e-mail et une date d'expiration.
	 *
	 * @param string $email E-mail.
	 * @param int    $ttl   Durée en secondes.
	 * @return string
	 */
	public static function token( $email, $ttl ) {
		$payload = strtolower( trim( $email ) ) . '|' . ( time() + (int) $ttl );
		return self::b64( $payload . '|' . self::sign( $payload ) );
	}

	/**
	 * @param string $token Jeton.
	 * @return string|false E-mail si valide.
	 */
	public static function verify( $token ) {
		$raw   = self::unb64( $token );
		$parts = $raw ? explode( '|', $raw ) : array();
		if ( 3 !== count( $parts ) ) {
			return false;
		}
		list( $email, $exp, $sig ) = $parts;
		if ( (int) $exp < time() || ! hash_equals( self::sign( $email . '|' . $exp ), $sig ) || ! is_email( $email ) ) {
			return false;
		}
		return $email;
	}

	/**
	 * Lien d'accès direct à l'espace client (valable 30 jours).
	 *
	 * @param string $email E-mail.
	 * @param string $ref   Demande à ouvrir.
	 * @param int    $ttl   Durée.
	 * @return string
	 */
	public static function link( $email, $ref = '', $ttl = 0 ) {
		$args = array( 'rn_token' => self::token( $email, $ttl ? $ttl : 30 * DAY_IN_SECONDS ) );
		if ( $ref ) {
			$args['demande'] = $ref;
		}
		return Settings::page_url( 'portal', $args );
	}

	public static function handle() {
		// phpcs:disable WordPress.Security.NonceVerification
		if ( isset( $_GET['rn_logout'] ) ) {
			self::clear_cookie();
			wp_safe_redirect( remove_query_arg( 'rn_logout' ) );
			exit;
		}
		if ( empty( $_GET['rn_token'] ) ) {
			return;
		}
		$email = self::verify( sanitize_text_field( wp_unslash( $_GET['rn_token'] ) ) );
		// phpcs:enable
		if ( $email ) {
			self::set_cookie( $email );
			wp_safe_redirect( remove_query_arg( 'rn_token' ) );
			exit;
		}
		wp_safe_redirect( add_query_arg( 'rn_expired', 1, remove_query_arg( 'rn_token' ) ) );
		exit;
	}

	public static function set_cookie( $email ) {
		$value = self::token( $email, 30 * DAY_IN_SECONDS );
		setcookie(
			self::COOKIE,
			$value,
			array(
				'expires'  => time() + 30 * DAY_IN_SECONDS,
				'path'     => COOKIEPATH ? COOKIEPATH : '/',
				'domain'   => COOKIE_DOMAIN,
				'secure'   => is_ssl(),
				'httponly' => true,
				'samesite' => 'Lax',
			)
		);
		$_COOKIE[ self::COOKIE ] = $value;
	}

	public static function clear_cookie() {
		setcookie(
			self::COOKIE,
			'',
			array(
				'expires'  => time() - 3600,
				'path'     => COOKIEPATH ? COOKIEPATH : '/',
				'domain'   => COOKIE_DOMAIN,
				'secure'   => is_ssl(),
				'httponly' => true,
				'samesite' => 'Lax',
			)
		);
		unset( $_COOKIE[ self::COOKIE ] );
	}

	/**
	 * E-mail du client connecté à l'espace, ou false.
	 *
	 * @return string|false
	 */
	public static function current_email() {
		if ( empty( $_COOKIE[ self::COOKIE ] ) ) {
			return false;
		}
		return self::verify( sanitize_text_field( wp_unslash( $_COOKIE[ self::COOKIE ] ) ) );
	}

	/** Jeton anti-CSRF lié à la session de l'espace client. */
	public static function csrf() {
		$cookie = isset( $_COOKIE[ self::COOKIE ] ) ? sanitize_text_field( wp_unslash( $_COOKIE[ self::COOKIE ] ) ) : '';
		return $cookie ? substr( hash_hmac( 'sha256', 'csrf|' . $cookie, wp_salt( 'nonce' ) ), 0, 32 ) : '';
	}

	public static function check_csrf( $value ) {
		$expected = self::csrf();
		return $expected && hash_equals( $expected, (string) $value );
	}

	/**
	 * Demande accessible par le client connecté.
	 *
	 * @param string $ref Référence.
	 * @return array|null
	 */
	public static function request_for_current( $ref ) {
		$email = self::current_email();
		if ( ! $email ) {
			return null;
		}
		$r = Requests::get_by_ref( $ref );
		return ( $r && strtolower( $r['email'] ) === strtolower( $email ) ) ? $r : null;
	}

	/**
	 * Envoie un lien de connexion si l'adresse a des demandes (réponse identique sinon).
	 *
	 * @param string $email E-mail.
	 * @return bool
	 */
	public static function send_login_link( $email ) {
		$email = sanitize_email( $email );
		if ( ! is_email( $email ) ) {
			return false;
		}
		$list = Requests::for_email( $email );
		if ( ! $list ) {
			return true;
		}
		return Notifications::client_login( $email, self::link( $email, '', 7 * DAY_IN_SECONDS ) );
	}
}
