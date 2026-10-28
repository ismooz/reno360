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

	/** Shortcodes qui forment une page entière et appellent la pleine largeur. */
	const PAGE_SHORTCODES = array( 'reno360_home', 'reno360_activities', 'reno360_request_form', 'reno360_client_portal', 'reno360_artisan', 'reno360_partner_form' );

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

	public static function assets_loaded() {
		return self::$assets_done;
	}

	/**
	 * Charge les styles et scripts (appelé aussi par chaque shortcode, au besoin).
	 *
	 * @param bool $with_index Inclure l'index de recherche dans la page (sinon chargé à la demande).
	 */
	public static function enqueue( $with_index = true ) {
		if ( self::$assets_done ) {
			return;
		}
		// Appelée aussi comme action WordPress, qui transmet une chaîne vide : seul « false » exclut l'index.
		$with_index = false !== $with_index;
		if ( ! wp_style_is( 'reno360', 'registered' ) ) {
			self::register_assets();
		}
		self::$assets_done = true;
		wp_enqueue_style( 'reno360' );
		wp_add_inline_style( 'reno360', self::inline_css() );
		wp_enqueue_script( 'reno360-search' );
		wp_enqueue_script( 'reno360-front' );
		wp_add_inline_script( 'reno360-search', 'window.RENO360 = ' . Util::json_script( self::js_config( $with_index ) ) . ';', 'before' );
	}

	public static function js_config( $with_index = true ) {
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
			'index'      => $with_index ? Search::client_index() : null,
			'indexUrl'   => esc_url_raw( rest_url( Rest::NS . '/index' ) ),
			'icons'      => $icons,
		);
	}

	/**
	 * Palette et polices choisies dans les réglages.
	 *
	 * @return string
	 */
	public static function inline_css() {
		$css = Theme::css_vars();
		if ( Settings::get( 'use_fonts' ) ) {
			$css .= Theme::font_faces();
			$css .= ":root{--rn-font-sans:'Reno360 Sans',system-ui,-apple-system,'Segoe UI',sans-serif;--rn-font-serif:'Reno360 Serif',Georgia,serif;--rn-font-mono:'Reno360 Mono',ui-monospace,SFMono-Regular,Menlo,monospace;}";
		}
		return $css;
	}

	/* ------------------------------------------------------------------ */
	/* Gabarits                                                           */
	/* ------------------------------------------------------------------ */

	public static function page_templates( $templates ) {
		$templates[ self::PAGE_TEMPLATE ] = 'Reno360 — pleine largeur';
		return $templates;
	}

	/**
	 * Une page s'affiche-t-elle avec le gabarit pleine largeur Reno360 ?
	 *
	 * Oui si ce gabarit est choisi, ou si aucun gabarit n'est choisi et que la page est une page Reno360
	 * (créée par l'extension ou contenant un shortcode de page entière). Indispensable pour la page d'accueil
	 * des thèmes à blocs, où WordPress ne permet pas de choisir le modèle. Un autre modèle choisi
	 * explicitement, ou une page construite avec Divi, est respecté.
	 *
	 * @param \WP_Post|int|null $post Page.
	 */
	public static function is_full_width( $post = null ) {
		$post = get_post( $post );
		if ( ! $post || 'page' !== $post->post_type ) {
			return false;
		}
		$template = (string) get_page_template_slug( $post );
		if ( self::PAGE_TEMPLATE === $template ) {
			return true;
		}
		if ( '' !== $template && 'default' !== $template ) {
			return false;
		}
		if ( 'on' === get_post_meta( $post->ID, '_et_pb_use_builder', true ) || false !== strpos( $post->post_content, '[et_pb_' ) || false !== strpos( $post->post_content, '<!-- wp:divi/' ) ) {
			return false;
		}
		if ( in_array( (int) $post->ID, array_map( 'intval', (array) get_option( 'reno360_pages', array() ) ), true ) ) {
			return true;
		}
		foreach ( self::PAGE_SHORTCODES as $tag ) {
			if ( has_shortcode( $post->post_content, $tag ) ) {
				return true;
			}
		}
		return false;
	}

	public static function template_include( $template ) {
		if ( is_page() && self::is_full_width( get_queried_object() ) ) {
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
		if ( is_page() && self::is_full_width( get_queried_object() ) ) {
			$classes[] = 'rn-full-width';
			$classes[] = 'et_full_width_page';
		}
		if ( is_singular( Activities::PT ) ) {
			$classes[] = 'rn-full-width';
			$classes[] = 'et_full_width_page';
		}
		return $classes;
	}

	/* ------------------------------------------------------------------ */
	/* En-tête et pied de page des thèmes à blocs                          */
	/* ------------------------------------------------------------------ */

	/** @var array|null Blocs du modèle du thème avant et après la zone de contenu. */
	private static $chrome = null;

	/**
	 * Découpe le modèle que le thème utiliserait pour cette page (logo, menu, bandeaux…) autour de son
	 * bloc « Contenu », pour garder tout ce que l'utilisateur y a placé dans l'éditeur de site.
	 * À défaut, reprend les parties « header » et « footer » du thème.
	 */
	private static function chrome() {
		if ( null === self::$chrome ) {
			global $_wp_current_template_content;
			$split = empty( $_wp_current_template_content ) ? null : self::split_template( parse_blocks( $_wp_current_template_content ) );
			if ( ! $split ) {
				$split = array(
					array( array( 'blockName' => 'core/template-part', 'attrs' => array( 'slug' => 'header', 'tagName' => 'header' ), 'innerBlocks' => array(), 'innerHTML' => '', 'innerContent' => array() ) ),
					array( array( 'blockName' => 'core/template-part', 'attrs' => array( 'slug' => 'footer', 'tagName' => 'footer' ), 'innerBlocks' => array(), 'innerHTML' => '', 'innerContent' => array() ) ),
				);
			}
			self::$chrome = $split;
		}
		return self::$chrome;
	}

	public static function chrome_before() {
		return implode( '', array_map( 'render_block', self::chrome()[0] ) );
	}

	public static function chrome_after() {
		return implode( '', array_map( 'render_block', self::chrome()[1] ) );
	}

	/**
	 * @param array $blocks Blocs analysés.
	 * @return array|null [ blocs avant, blocs après ] ou null sans bloc « Contenu ».
	 */
	private static function split_template( array $blocks ) {
		foreach ( $blocks as $i => $block ) {
			if ( ! self::has_block( $block, 'core/post-content' ) ) {
				continue;
			}
			$before = array_slice( $blocks, 0, $i );
			$after  = array_slice( $blocks, $i + 1 );
			// En-tête ou pied de page dans le même conteneur que le contenu : on descend d'un niveau.
			if ( 'core/post-content' !== $block['blockName'] && self::has_chrome_part( $block ) ) {
				$inner = self::split_template( $block['innerBlocks'] );
				if ( $inner ) {
					return array( array_merge( $before, $inner[0] ), array_merge( $inner[1], $after ) );
				}
			}
			return array( $before, $after );
		}
		return null;
	}

	private static function has_block( array $block, $name ) {
		if ( $name === $block['blockName'] ) {
			return true;
		}
		foreach ( $block['innerBlocks'] as $inner ) {
			if ( self::has_block( $inner, $name ) ) {
				return true;
			}
		}
		return false;
	}

	private static function has_chrome_part( array $block ) {
		foreach ( $block['innerBlocks'] as $inner ) {
			if ( 'core/template-part' === $inner['blockName'] ) {
				$attrs = $inner['attrs'];
				$label = ( isset( $attrs['area'] ) ? $attrs['area'] : '' ) . ' ' . ( isset( $attrs['slug'] ) ? $attrs['slug'] : '' ) . ' ' . ( isset( $attrs['tagName'] ) ? $attrs['tagName'] : '' );
				if ( preg_match( '/header|footer/', $label ) ) {
					return true;
				}
			}
			if ( self::has_chrome_part( $inner ) ) {
				return true;
			}
		}
		return false;
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
		return '<div class="rn-app alignfull' . ( $class ? ' ' . esc_attr( $class ) : '' ) . '">' . $html . '</div>';
	}

	/* ------------------------------------------------------------------ */
	/* Shortcodes                                                         */
	/* ------------------------------------------------------------------ */

	public static function sc_home( $atts ) {
		$atts = shortcode_atts(
			array(
				'title'      => 'Des artisans <em>vérifiés</em> pour tous vos travaux.',
				'subtitle'   => '',
				'image'      => '',
				'catalog'    => 'yes',
				'comparison' => 'yes',
			),
			$atts,
			'reno360_home'
		);
		$html  = self::render( 'sections/hero', $atts );
		$html .= self::render( 'sections/trust' );
		$html .= self::render(
			'sections/featured',
			array(
				'title'   => 'Quels travaux souhaitez-vous réaliser ?',
				'browser' => $atts['catalog'],
			)
		);
		$html .= self::render( 'sections/how' );
		if ( 'no' !== $atts['comparison'] ) {
			$html .= self::render( 'sections/why' );
		}
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
		$atts = shortcode_atts(
			array(
				'title'   => 'Quels travaux souhaitez-vous réaliser ?',
				'browser' => 'yes',
			),
			$atts,
			'reno360_featured'
		);
		return self::wrap( self::render( 'sections/featured', $atts ) );
	}

	public static function sc_categories( $atts ) {
		$atts = shortcode_atts( array( 'title' => '' ), $atts, 'reno360_categories' );
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
				'title' => 'Prêt à lancer votre *projet* ?',
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
			'provider'    => array_filter(
				array(
					'@type'     => 'Organization',
					'name'      => Settings::get( 'company' ),
					'url'       => home_url( '/' ),
					'telephone' => Settings::get( 'phone' ),
				)
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
