<?php
/**
 * Site public : shortcodes, gabarits, ressources et données structurées.
 *
 * Tous les blocs sont des shortcodes : ils s'insèrent tels quels dans un module
 * « Code » ou « Texte » de Divi 5 (ou n'importe quel thème / constructeur).
 *
 * @package Reno360
 */

namespace Reno360;

defined( 'ABSPATH' ) || exit;

class Frontend {

	const PAGE_TEMPLATE = 'reno360-full-width.php';

	/** @var bool */
	private static $assets_done = false;

	public static function init() {
		$shortcodes = array(
			'reno360_home'          => 'sc_home',
			'reno360_search'        => 'sc_search',
			'reno360_trust'         => 'sc_trust',
			'reno360_featured'      => 'sc_featured',
			'reno360_categories'    => 'sc_categories',
			'reno360_how_it_works'  => 'sc_how',
			'reno360_why'           => 'sc_why',
			'reno360_energy'        => 'sc_energy',
			'reno360_partner_cta'   => 'sc_partner_cta',
			'reno360_faq'           => 'sc_faq',
			'reno360_cta'           => 'sc_cta',
			'reno360_activities'    => 'sc_activities',
			'reno360_request_form'  => 'sc_request_form',
			'reno360_client_portal' => 'sc_portal',
			'reno360_artisan'       => 'sc_artisan',
			'reno360_partner_form'  => 'sc_partner_form',
		);
		foreach ( $shortcodes as $tag => $method ) {
			add_shortcode( $tag, array( __CLASS__, $method ) );
		}

		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'register_assets' ), 5 );
		add_action( 'wp', array( __CLASS__, 'maybe_enqueue' ) );
		add_filter( 'theme_page_templates', array( __CLASS__, 'page_templates' ) );
		add_filter( 'template_include', array( __CLASS__, 'template_include' ), 99 );
		add_filter( 'body_class', array( __CLASS__, 'body_class' ) );
		add_action( 'wp_head', array( __CLASS__, 'json_ld' ) );
		add_filter( 'wp_robots', array( __CLASS__, 'robots' ) );
	}

	/* ------------------------------------------------------------------ */
	/* Ressources                                                         */
	/* ------------------------------------------------------------------ */

	public static function register_assets() {
		wp_register_style( 'reno360', RENO360_URL . 'assets/css/frontend.css', array(), RENO360_VERSION );
		wp_register_script( 'reno360-search', RENO360_URL . 'assets/js/search.js', array(), RENO360_VERSION, true );
		wp_register_script( 'reno360-front', RENO360_URL . 'assets/js/frontend.js', array( 'reno360-search' ), RENO360_VERSION, true );
		wp_register_script( 'reno360-form', RENO360_URL . 'assets/js/request-form.js', array( 'reno360-search' ), RENO360_VERSION, true );
	}

	public static function maybe_enqueue() {
		if ( is_admin() ) {
			return;
		}
		$load = is_singular( Activities::PT );
		if ( ! $load && is_singular() ) {
			$post = get_queried_object();
			$load = $post && isset( $post->post_content ) && false !== strpos( $post->post_content, '[reno360_' );
		}
		if ( $load ) {
			add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue' ), 20 );
		}
	}

	/** Charge les styles et scripts (appelé aussi par chaque shortcode, au besoin). */
	public static function enqueue() {
		if ( self::$assets_done ) {
			return;
		}
		if ( ! wp_style_is( 'reno360', 'registered' ) ) {
			self::register_assets();
		}
		self::$assets_done = true;
		wp_enqueue_style( 'reno360' );
		wp_add_inline_style( 'reno360', self::inline_css() );
		wp_enqueue_script( 'reno360-search' );
		wp_enqueue_script( 'reno360-front' );
		wp_add_inline_script( 'reno360-search', 'window.RENO360 = ' . Util::json_script( self::js_config() ) . ';', 'before' );
	}

	public static function js_config() {
		$icons = array();
		$all   = Icons::all();
		foreach ( array_merge( Icons::activity_keys(), array( 'search', 'check', 'x', 'arrow', 'photo', 'file', 'plus' ) ) as $k ) {
			$icons[ $k ] = $all[ $k ];
		}
		return array(
			'rest'       => esc_url_raw( rest_url( Rest::NS . '/' ) ),
			'formUrl'    => Settings::page_url( 'form' ),
			'catalogUrl' => Settings::page_url( 'catalog' ),
			'portalUrl'  => Settings::page_url( 'portal' ),
			'index'      => Search::client_index(),
			'icons'      => $icons,
		);
	}

	/**
	 * Couleurs et polices calculées depuis les réglages.
	 *
	 * @return string
	 */
	public static function inline_css() {
		$primary = sanitize_hex_color( Settings::get( 'primary_color', '#187A3E' ) );
		$primary = $primary ? $primary : '#187A3E';
		$css     = ':root{--rn-primary:' . $primary . ';--rn-primary-dark:' . self::mix( $primary, '#000000', 0.22 ) . ';--rn-primary-ink:' . self::mix( $primary, '#000000', 0.18 ) . ';--rn-primary-soft:' . self::mix( $primary, '#FFFFFF', 0.9 ) . ';--rn-primary-line:' . self::mix( $primary, '#FFFFFF', 0.6 ) . ';}';
		if ( Settings::get( 'use_fonts' ) ) {
			$url  = RENO360_URL . 'assets/fonts/';
			$css .= "@font-face{font-family:'Reno360 Display';font-style:normal;font-weight:200 800;font-display:swap;src:url('{$url}bricolage-grotesque-latin-wght-normal.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}";
			$css .= "@font-face{font-family:'Reno360 Display';font-style:normal;font-weight:200 800;font-display:swap;src:url('{$url}bricolage-grotesque-latin-ext-wght-normal.woff2') format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}";
			$css .= "@font-face{font-family:'Reno360 Text';font-style:normal;font-weight:300 900;font-display:swap;src:url('{$url}figtree-latin-wght-normal.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}";
			$css .= "@font-face{font-family:'Reno360 Text';font-style:normal;font-weight:300 900;font-display:swap;src:url('{$url}figtree-latin-ext-wght-normal.woff2') format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}";
			$css .= ".rn-app{--rn-font-display:'Reno360 Display','Reno360 Text',system-ui,sans-serif;--rn-font-text:'Reno360 Text',system-ui,-apple-system,'Segoe UI',sans-serif;}";
		}
		return $css;
	}

	/**
	 * Mélange deux couleurs hexadécimales.
	 *
	 * @param string $a     Couleur A.
	 * @param string $b     Couleur B.
	 * @param float  $ratio Part de B (0 à 1).
	 * @return string
	 */
	public static function mix( $a, $b, $ratio ) {
		$a   = ltrim( $a, '#' );
		$b   = ltrim( $b, '#' );
		$out = '#';
		for ( $i = 0; $i < 3; $i++ ) {
			$ca   = hexdec( substr( $a, $i * 2, 2 ) );
			$cb   = hexdec( substr( $b, $i * 2, 2 ) );
			$out .= str_pad( dechex( (int) round( $ca + ( $cb - $ca ) * $ratio ) ), 2, '0', STR_PAD_LEFT );
		}
		return strtoupper( $out );
	}

	/* ------------------------------------------------------------------ */
	/* Gabarits                                                           */
	/* ------------------------------------------------------------------ */

	public static function page_templates( $templates ) {
		$templates[ self::PAGE_TEMPLATE ] = 'Reno360 — pleine largeur';
		return $templates;
	}

	public static function template_include( $template ) {
		if ( is_page() && self::PAGE_TEMPLATE === get_page_template_slug() ) {
			$theme = locate_template( array( 'reno360/page-full-width.php' ) );
			return $theme ? $theme : RENO360_DIR . 'templates/page-full-width.php';
		}
		if ( is_singular( Activities::PT ) ) {
			$a = Activities::get( get_queried_object_id() );
			if ( $a && $a['auto_layout'] ) {
				$theme = locate_template( array( 'single-' . Activities::PT . '.php', 'reno360/single-activity.php' ) );
				return $theme ? $theme : RENO360_DIR . 'templates/single-activity.php';
			}
		}
		return $template;
	}

	public static function body_class( $classes ) {
		if ( is_page() && self::PAGE_TEMPLATE === get_page_template_slug() ) {
			$classes[] = 'rn-full-width';
			$classes[] = 'et_full_width_page';
		}
		if ( is_singular( Activities::PT ) ) {
			$classes[] = 'rn-full-width';
			$classes[] = 'et_full_width_page';
		}
		return $classes;
	}

	public static function robots( $robots ) {
		if ( is_page() ) {
			$id = get_queried_object_id();
			if ( in_array( $id, array( Settings::page_id( 'artisan' ), Settings::page_id( 'portal' ) ), true ) ) {
				$robots['noindex']  = true;
				$robots['nofollow'] = true;
			}
		}
		return $robots;
	}

	/**
	 * Affiche un gabarit (surchargeable dans le thème : votre-theme/reno360/{nom}.php).
	 *
	 * @param string $name Nom relatif sans extension.
	 * @param array  $vars Variables.
	 * @return string
	 */
	public static function render( $name, array $vars = array() ) {
		$name  = preg_replace( '/[^a-z0-9\-\/]/', '', $name );
		$theme = locate_template( array( 'reno360/' . $name . '.php' ) );
		$file  = $theme ? $theme : RENO360_DIR . 'templates/' . $name . '.php';
		if ( ! is_readable( $file ) ) {
			return '';
		}
		ob_start();
		extract( $vars, EXTR_SKIP ); // phpcs:ignore WordPress.PHP.DontExtract
		include $file;
		return (string) ob_get_clean();
	}

	private static function wrap( $html, $class = '' ) {
		self::enqueue();
		return '<div class="rn-app' . ( $class ? ' ' . esc_attr( $class ) : '' ) . '">' . $html . '</div>';
	}

	/* ------------------------------------------------------------------ */
	/* Shortcodes                                                         */
	/* ------------------------------------------------------------------ */

	public static function sc_home( $atts ) {
		$atts = shortcode_atts(
			array(
				'title'    => 'Des artisans <em>vérifiés</em> pour tous vos travaux.',
				'subtitle' => '',
				'image'    => '',
			),
			$atts,
			'reno360_home'
		);
		$html  = self::render( 'sections/hero', $atts );
		$html .= self::render( 'sections/trust' );
		$html .= self::render( 'sections/featured', array( 'title' => 'Quels travaux souhaitez-vous réaliser ?' ) );
		$html .= self::render( 'sections/how' );
		$html .= self::render( 'sections/why' );
		$html .= self::render( 'sections/energy' );
		$html .= self::render( 'sections/partner-cta' );
		$html .= self::render( 'sections/faq', array( 'title' => 'Questions fréquentes' ) );
		$html .= self::render( 'sections/cta' );
		return self::wrap( $html, 'rn-home' );
	}

	public static function sc_search( $atts ) {
		$atts = shortcode_atts(
			array(
				'title'       => '',
				'subtitle'    => '',
				'placeholder' => 'Ex. salle de bain, peinture, fuite…',
				'button'      => 'Recevoir mes devis',
				'npa'         => 'yes',
				'target'      => 'form',
				'popular'     => 'yes',
			),
			$atts,
			'reno360_search'
		);
		return self::wrap( self::render( 'parts/search-box', $atts ), 'rn-block' );
	}

	public static function sc_trust() {
		return self::wrap( self::render( 'sections/trust' ) );
	}

	public static function sc_featured( $atts ) {
		$atts = shortcode_atts( array( 'title' => 'Quels travaux souhaitez-vous réaliser ?' ), $atts, 'reno360_featured' );
		return self::wrap( self::render( 'sections/featured', $atts ) );
	}

	public static function sc_categories( $atts ) {
		$atts = shortcode_atts( array( 'title' => 'Tous les corps de métier' ), $atts, 'reno360_categories' );
		return self::wrap( self::render( 'sections/categories', $atts ) );
	}

	public static function sc_how() {
		return self::wrap( self::render( 'sections/how' ) );
	}

	public static function sc_why() {
		return self::wrap( self::render( 'sections/why' ) );
	}

	public static function sc_energy() {
		return self::wrap( self::render( 'sections/energy' ) );
	}

	public static function sc_partner_cta() {
		return self::wrap( self::render( 'sections/partner-cta' ) );
	}

	public static function sc_faq( $atts ) {
		$atts = shortcode_atts( array( 'title' => 'Questions fréquentes' ), $atts, 'reno360_faq' );
		return self::wrap( self::render( 'sections/faq', $atts ) );
	}

	public static function sc_cta( $atts ) {
		$atts = shortcode_atts(
			array(
				'title' => 'Prêt à lancer votre projet ?',
				'text'  => 'Recevez jusqu’à {max_artisans} devis d’artisans vérifiés. Gratuit et sans engagement.',
			),
			$atts,
			'reno360_cta'
		);
		return self::wrap( self::render( 'sections/cta', $atts ) );
	}

	public static function sc_activities( $atts ) {
		$atts = shortcode_atts(
			array(
				'title'  => 'Tous les travaux',
				'target' => 'page',
			),
			$atts,
			'reno360_activities'
		);
		return self::wrap( self::render( 'catalog', $atts ), 'rn-catalog-page' );
	}

	public static function sc_request_form() {
		self::enqueue();
		wp_enqueue_script( 'reno360-form' );
		return self::wrap( self::render( 'request-form' ), 'rn-form-page' );
	}

	public static function sc_portal() {
		return self::wrap( Portal_View::render(), 'rn-portal-page' );
	}

	public static function sc_artisan() {
		return self::wrap( self::render( 'artisan' ), 'rn-artisan-page' );
	}

	public static function sc_partner_form() {
		return self::wrap( self::render( 'partner-form' ), 'rn-partner-page' );
	}

	/* ------------------------------------------------------------------ */
	/* Aides pour les gabarits                                            */
	/* ------------------------------------------------------------------ */

	/** Horodatage signé du formulaire (anti-robots). */
	public static function form_stamp() {
		$ts = time();
		return $ts . '.' . self::form_stamp_sig( $ts );
	}

	public static function form_stamp_sig( $ts ) {
		return substr( hash_hmac( 'sha256', 'form|' . (int) $ts, wp_salt( 'nonce' ) ), 0, 20 );
	}

	public static function icon( $key, $size = 20, $class = 'rn-icon' ) {
		return Icons::svg( $key, $size, $class );
	}

	public static function consent_html() {
		$text  = esc_html( Settings::fill( Settings::get( 'consent_text' ) ) );
		$terms = Settings::get( 'terms_url' );
		$priv  = Settings::get( 'privacy_url' );
		if ( ! $priv ) {
			$priv = get_privacy_policy_url();
		}
		if ( $terms ) {
			$text = str_replace( 'conditions générales', '<a href="' . esc_url( $terms ) . '" target="_blank" rel="noopener">conditions générales</a>', $text );
		}
		if ( $priv ) {
			$text = str_replace( 'politique de confidentialité', '<a href="' . esc_url( $priv ) . '" target="_blank" rel="noopener">politique de confidentialité</a>', $text );
		}
		return $text;
	}

	/* ------------------------------------------------------------------ */
	/* Données structurées (SEO)                                          */
	/* ------------------------------------------------------------------ */

	public static function json_ld() {
		if ( ! is_singular( Activities::PT ) ) {
			return;
		}
		$a = Activities::get( get_queried_object_id() );
		if ( ! $a ) {
			return;
		}
		$graph   = array();
		$graph[] = array(
			'@type'       => 'Service',
			'name'        => $a['name'],
			'description' => $a['excerpt'] ? $a['excerpt'] : wp_trim_words( wp_strip_all_tags( $a['content'] ), 30 ),
			'serviceType' => $a['name'],
			'areaServed'  => array_map(
				static function ( $c ) {
					return array(
						'@type' => 'AdministrativeArea',
						'name'  => isset( Util::cantons()[ $c ] ) ? Util::cantons()[ $c ] : $c,
					);
				},
				(array) Settings::get( 'cantons', array() )
			),
			'provider'    => array(
				'@type'     => 'Organization',
				'name'      => Settings::get( 'company' ),
				'url'       => home_url( '/' ),
				'telephone' => Settings::get( 'phone' ),
			),
			'url'         => $a['url'],
		);
		$crumbs  = array(
			array(
				'@type'    => 'ListItem',
				'position' => 1,
				'name'     => 'Accueil',
				'item'     => home_url( '/' ),
			),
			array(
				'@type'    => 'ListItem',
				'position' => 2,
				'name'     => 'Travaux',
				'item'     => Settings::page_url( 'catalog' ),
			),
			array(
				'@type'    => 'ListItem',
				'position' => 3,
				'name'     => $a['name'],
				'item'     => $a['url'],
			),
		);
		$graph[] = array(
			'@type'           => 'BreadcrumbList',
			'itemListElement' => $crumbs,
		);
		if ( $a['faq'] ) {
			$graph[] = array(
				'@type'      => 'FAQPage',
				'mainEntity' => array_map(
					static function ( $f ) {
						return array(
							'@type'          => 'Question',
							'name'           => $f['q'],
							'acceptedAnswer' => array(
								'@type' => 'Answer',
								'text'  => wp_strip_all_tags( $f['a'] ),
							),
						);
					},
					$a['faq']
				),
			);
		}
		echo '<script type="application/ld+json">' . Util::json_script( array( '@context' => 'https://schema.org', '@graph' => $graph ) ) . "</script>\n"; // phpcs:ignore WordPress.Security.EscapeOutput
	}
}
