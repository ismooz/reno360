<?php
/**
 * Travaux (activités) : type de contenu, catégories, métadonnées et CRUD.
 *
 * @package Reno360
 */

namespace Reno360;

defined( 'ABSPATH' ) || exit;

class Activities {

	const PT  = 'rn_travail';
	const TAX = 'rn_categorie';

	/** @var array */
	private static $cache = array();

	public static function init() {
		add_action( 'init', array( __CLASS__, 'register' ) );
		add_action( 'save_post_' . self::PT, array( __CLASS__, 'changed' ) );
		add_action( 'deleted_post', array( __CLASS__, 'changed' ) );
		add_action( 'trashed_post', array( __CLASS__, 'changed' ) );
		add_action( 'created_' . self::TAX, array( __CLASS__, 'changed' ) );
		add_action( 'edited_' . self::TAX, array( __CLASS__, 'changed' ) );
		add_action( 'delete_' . self::TAX, array( __CLASS__, 'changed' ) );
	}

	public static function register() {
		register_post_type(
			self::PT,
			array(
				'labels'              => array(
					'name'          => 'Travaux',
					'singular_name' => 'Travail',
					'add_new_item'  => 'Ajouter un type de travaux',
					'edit_item'     => 'Modifier le type de travaux',
					'view_item'     => 'Voir la page',
					'search_items'  => 'Rechercher',
					'not_found'     => 'Aucun type de travaux',
				),
				'public'              => true,
				'publicly_queryable'  => true,
				'exclude_from_search' => false,
				'show_ui'             => true,
				'show_in_menu'        => false,
				'show_in_rest'        => true,
				'has_archive'         => false,
				'hierarchical'        => false,
				'menu_icon'           => 'dashicons-hammer',
				'rewrite'             => array(
					'slug'       => sanitize_title( Settings::get( 'activities_slug', 'travaux' ) ),
					'with_front' => false,
				),
				'supports'            => array( 'title', 'editor', 'excerpt', 'thumbnail', 'page-attributes', 'revisions' ),
			)
		);

		register_taxonomy(
			self::TAX,
			self::PT,
			array(
				'labels'            => array(
					'name'          => 'Catégories de travaux',
					'singular_name' => 'Catégorie',
				),
				'hierarchical'      => true,
				'public'            => false,
				'show_ui'           => true,
				'show_in_menu'      => false,
				'show_admin_column' => true,
				'show_in_rest'      => true,
				'rewrite'           => false,
			)
		);
	}

	public static function changed() {
		self::$cache = array();
		Search::flush();
	}

	/**
	 * Données complètes d'un type de travaux.
	 *
	 * @param int|\WP_Post $post Article.
	 * @return array|null
	 */
	public static function get( $post ) {
		$post = get_post( $post );
		if ( ! $post || self::PT !== $post->post_type ) {
			return null;
		}
		$terms = get_the_terms( $post, self::TAX );
		$term  = ( $terms && ! is_wp_error( $terms ) ) ? $terms[0] : null;

		$keywords  = get_post_meta( $post->ID, '_rn_keywords', true );
		$questions = get_post_meta( $post->ID, '_rn_questions', true );
		$prices    = get_post_meta( $post->ID, '_rn_prices', true );
		$faq       = get_post_meta( $post->ID, '_rn_faq', true );

		return array(
			'id'          => $post->ID,
			'slug'        => $post->post_name,
			'name'        => $post->post_title,
			'excerpt'     => $post->post_excerpt,
			'content'     => $post->post_content,
			'status'      => $post->post_status,
			'active'      => 'publish' === $post->post_status,
			'order'       => (int) $post->menu_order,
			'category_id' => $term ? (int) $term->term_id : 0,
			'category'    => $term ? $term->name : '',
			'cat_slug'    => $term ? $term->slug : '',
			'icon'        => get_post_meta( $post->ID, '_rn_icon', true ) ?: 'hammer',
			'keywords'    => is_array( $keywords ) ? $keywords : array(),
			'questions'   => is_array( $questions ) ? $questions : array(),
			'prices'      => is_array( $prices ) ? $prices : array(),
			'faq'         => is_array( $faq ) ? $faq : array(),
			'popular'     => (bool) get_post_meta( $post->ID, '_rn_popular', true ),
			'featured'    => (bool) get_post_meta( $post->ID, '_rn_featured', true ),
			'boost'       => (int) get_post_meta( $post->ID, '_rn_boost', true ),
			'auto_layout' => '0' !== (string) get_post_meta( $post->ID, '_rn_auto_layout', true ),
			'image'       => self::image_url( $post->ID ),
			'url'         => get_permalink( $post ),
		);
	}

	public static function image_url( $post_id, $size = 'large' ) {
		$thumb = get_the_post_thumbnail_url( $post_id, $size );
		if ( $thumb ) {
			return $thumb;
		}
		$file = (string) get_post_meta( $post_id, '_rn_image', true );
		if ( $file && preg_match( '/^[a-z0-9\-]+\.(jpe?g|png|webp)$/', $file ) && file_exists( RENO360_DIR . 'assets/img/' . $file ) ) {
			return RENO360_URL . 'assets/img/' . $file;
		}
		return '';
	}

	/**
	 * Liste des travaux.
	 *
	 * @param array $args status (publish|any), category (term id), search.
	 * @return array[]
	 */
	public static function all( array $args = array() ) {
		$args = wp_parse_args(
			$args,
			array(
				'status'   => 'publish',
				'category' => 0,
			)
		);
		$key = md5( wp_json_encode( $args ) );
		if ( isset( self::$cache[ $key ] ) ) {
			return self::$cache[ $key ];
		}
		$q = array(
			'post_type'              => self::PT,
			'post_status'            => 'any' === $args['status'] ? array( 'publish', 'draft', 'pending', 'private' ) : $args['status'],
			'posts_per_page'         => -1,
			'orderby'                => array(
				'menu_order' => 'ASC',
				'title'      => 'ASC',
			),
			'no_found_rows'          => true,
			'update_post_term_cache' => true,
			'update_post_meta_cache' => true,
		);
		if ( $args['category'] ) {
			$q['tax_query'] = array( // phpcs:ignore WordPress.DB.SlowDBQuery
				array(
					'taxonomy' => self::TAX,
					'field'    => 'term_id',
					'terms'    => (int) $args['category'],
				),
			);
		}
		$out = array();
		foreach ( get_posts( $q ) as $post ) {
			$out[] = self::get( $post );
		}

		// Tri : ordre de la catégorie, puis ordre du travail, puis nom.
		$cat_order = array();
		foreach ( self::categories() as $c ) {
			$cat_order[ $c['id'] ] = $c['order'];
		}
		usort(
			$out,
			static function ( $a, $b ) use ( $cat_order ) {
				$ca = isset( $cat_order[ $a['category_id'] ] ) ? $cat_order[ $a['category_id'] ] : 999;
				$cb = isset( $cat_order[ $b['category_id'] ] ) ? $cat_order[ $b['category_id'] ] : 999;
				if ( $ca !== $cb ) {
					return $ca - $cb;
				}
				if ( $a['order'] !== $b['order'] ) {
					return $a['order'] - $b['order'];
				}
				return strcmp( remove_accents( $a['name'] ), remove_accents( $b['name'] ) );
			}
		);
		self::$cache[ $key ] = $out;
		return $out;
	}

	/**
	 * Catégories triées.
	 *
	 * @return array[]
	 */
	public static function categories() {
		if ( isset( self::$cache['__cats'] ) ) {
			return self::$cache['__cats'];
		}
		$terms = get_terms(
			array(
				'taxonomy'   => self::TAX,
				'hide_empty' => false,
			)
		);
		$out = array();
		if ( ! is_wp_error( $terms ) ) {
			foreach ( $terms as $t ) {
				$out[] = array(
					'id'          => (int) $t->term_id,
					'slug'        => $t->slug,
					'name'        => $t->name,
					'description' => $t->description,
					'count'       => (int) $t->count,
					'order'       => (int) get_term_meta( $t->term_id, '_rn_order', true ),
					'icon'        => get_term_meta( $t->term_id, '_rn_icon', true ) ?: 'hammer',
				);
			}
		}
		usort(
			$out,
			static function ( $a, $b ) {
				return $a['order'] === $b['order'] ? strcmp( $a['name'], $b['name'] ) : $a['order'] - $b['order'];
			}
		);
		self::$cache['__cats'] = $out;
		return $out;
	}

	public static function find_by_slug( $slug ) {
		$post = get_page_by_path( sanitize_title( $slug ), OBJECT, self::PT );
		return $post ? self::get( $post ) : null;
	}

	/**
	 * Nettoie une liste de mots-clés (texte ou tableau).
	 *
	 * @param string|array $raw Mots-clés.
	 * @return string[]
	 */
	public static function clean_keywords( $raw ) {
		if ( is_string( $raw ) ) {
			$raw = preg_split( '/[,;\r\n|]+/', $raw );
		}
		$seen = array();
		$out  = array();
		foreach ( (array) $raw as $kw ) {
			$kw = trim( preg_replace( '/\s+/u', ' ', wp_strip_all_tags( (string) $kw ) ) );
			$kw = mb_strtolower( mb_substr( $kw, 0, 100 ) );
			if ( '' === $kw ) {
				continue;
			}
			$norm = Search::normalize( $kw );
			if ( '' === $norm || isset( $seen[ $norm ] ) ) {
				continue;
			}
			$seen[ $norm ] = true;
			$out[]         = $kw;
			if ( count( $out ) >= 250 ) {
				break;
			}
		}
		return $out;
	}

	/**
	 * Questions spécifiques : [{label, type, options[]}].
	 *
	 * @param mixed $raw Données brutes.
	 * @return array
	 */
	public static function clean_questions( $raw ) {
		$out = array();
		foreach ( (array) $raw as $q ) {
			if ( ! is_array( $q ) ) {
				continue;
			}
			$label = sanitize_text_field( isset( $q['label'] ) ? $q['label'] : '' );
			if ( '' === $label ) {
				continue;
			}
			$type    = isset( $q['type'] ) && in_array( $q['type'], array( 'single', 'multiple', 'text' ), true ) ? $q['type'] : 'single';
			$options = isset( $q['options'] ) ? $q['options'] : array();
			if ( is_string( $options ) ) {
				$options = preg_split( '/\r\n|\r|\n/', $options );
			}
			$options = array_values( array_filter( array_map( 'sanitize_text_field', array_map( 'trim', (array) $options ) ) ) );
			if ( 'text' !== $type && ! $options ) {
				$type = 'text';
			}
			$out[] = array(
				'label'    => $label,
				'type'     => $type,
				'options'  => 'text' === $type ? array() : array_slice( $options, 0, 20 ),
				'required' => ! empty( $q['required'] ),
			);
			if ( count( $out ) >= 10 ) {
				break;
			}
		}
		return $out;
	}

	public static function clean_pairs( $raw, array $keys ) {
		$out = array();
		foreach ( (array) $raw as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}
			$item  = array();
			$empty = true;
			foreach ( $keys as $k ) {
				$v          = isset( $row[ $k ] ) ? ( 'a' === $k ? wp_kses_post( $row[ $k ] ) : sanitize_text_field( $row[ $k ] ) ) : '';
				$item[ $k ] = trim( $v );
				if ( '' !== $item[ $k ] ) {
					$empty = false;
				}
			}
			if ( ! $empty ) {
				$out[] = $item;
			}
		}
		return $out;
	}

	/**
	 * Crée ou met à jour un type de travaux.
	 *
	 * @param array $data Données (name, slug, excerpt, content, category_id, icon, keywords, questions, prices, faq, popular, featured, boost, active, order, auto_layout, thumbnail_id, image).
	 * @param int   $id   0 pour créer.
	 * @return int|\WP_Error
	 */
	public static function save( array $data, $id = 0 ) {
		$existing = $id ? get_post( (int) $id ) : null;
		if ( $id && ( ! $existing || self::PT !== $existing->post_type ) ) {
			return new \WP_Error( 'rn_missing', 'Type de travaux introuvable.' );
		}
		$name = isset( $data['name'] ) ? sanitize_text_field( $data['name'] ) : ( $existing ? $existing->post_title : '' );
		if ( '' === $name ) {
			return new \WP_Error( 'rn_name', 'Le nom est obligatoire.' );
		}
		$postarr = array(
			'post_type'  => self::PT,
			'post_title' => $name,
		);
		if ( ! empty( $data['slug'] ) ) {
			$postarr['post_name'] = sanitize_title( $data['slug'] );
		} elseif ( ! $existing ) {
			$postarr['post_name'] = sanitize_title( $name );
		}
		if ( isset( $data['excerpt'] ) ) {
			$postarr['post_excerpt'] = sanitize_textarea_field( $data['excerpt'] );
		}
		if ( isset( $data['active'] ) || ! $existing ) {
			$postarr['post_status'] = ( ! isset( $data['active'] ) || $data['active'] ) ? 'publish' : 'draft';
		}
		if ( isset( $data['order'] ) ) {
			$postarr['menu_order'] = (int) $data['order'];
		}
		if ( isset( $data['content'] ) ) {
			$postarr['post_content'] = wp_kses_post( $data['content'] );
		}
		if ( $id ) {
			$postarr['ID'] = (int) $id;
			$result        = wp_update_post( wp_slash( $postarr ), true );
		} else {
			$result = wp_insert_post( wp_slash( $postarr ), true );
		}
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		$id = (int) $result;

		if ( isset( $data['category_id'] ) ) {
			$cat = (int) $data['category_id'];
			wp_set_object_terms( $id, $cat ? array( $cat ) : array(), self::TAX );
		}
		if ( isset( $data['icon'] ) ) {
			$icon = in_array( $data['icon'], Icons::activity_keys(), true ) ? $data['icon'] : 'hammer';
			update_post_meta( $id, '_rn_icon', $icon );
		}
		if ( isset( $data['keywords'] ) ) {
			update_post_meta( $id, '_rn_keywords', self::clean_keywords( $data['keywords'] ) );
		}
		if ( isset( $data['questions'] ) ) {
			update_post_meta( $id, '_rn_questions', self::clean_questions( $data['questions'] ) );
		}
		if ( isset( $data['prices'] ) ) {
			update_post_meta( $id, '_rn_prices', self::clean_pairs( $data['prices'], array( 'label', 'range', 'duration' ) ) );
		}
		if ( isset( $data['faq'] ) ) {
			update_post_meta( $id, '_rn_faq', self::clean_pairs( $data['faq'], array( 'q', 'a' ) ) );
		}
		foreach ( array( 'popular', 'featured' ) as $flag ) {
			if ( isset( $data[ $flag ] ) ) {
				update_post_meta( $id, '_rn_' . $flag, $data[ $flag ] ? '1' : '' );
			}
		}
		if ( isset( $data['boost'] ) ) {
			update_post_meta( $id, '_rn_boost', max( 0, min( 10, (int) $data['boost'] ) ) );
		}
		if ( isset( $data['auto_layout'] ) ) {
			update_post_meta( $id, '_rn_auto_layout', $data['auto_layout'] ? '1' : '0' );
		}
		if ( isset( $data['thumbnail_id'] ) ) {
			$thumb = (int) $data['thumbnail_id'];
			if ( $thumb ) {
				set_post_thumbnail( $id, $thumb );
			} else {
				delete_post_thumbnail( $id );
			}
		}
		if ( isset( $data['image'] ) ) {
			update_post_meta( $id, '_rn_image', sanitize_file_name( $data['image'] ) );
		}
		self::changed();
		return $id;
	}

	public static function delete( $id ) {
		$post = get_post( $id );
		if ( ! $post || self::PT !== $post->post_type ) {
			return false;
		}
		$ok = (bool) wp_delete_post( $post->ID, true );
		global $wpdb;
		$wpdb->delete( Installer::table( 'artisan_activity' ), array( 'activity_id' => $post->ID ), array( '%d' ) );
		self::changed();
		return $ok;
	}

	/**
	 * Ajoute des mots-clés à un travail existant (depuis le journal des recherches).
	 *
	 * @param int          $id       Travail.
	 * @param string|array $keywords Mots-clés.
	 * @return bool
	 */
	public static function add_keywords( $id, $keywords ) {
		$a = self::get( $id );
		if ( ! $a ) {
			return false;
		}
		$merged = self::clean_keywords( array_merge( $a['keywords'], self::clean_keywords( $keywords ) ) );
		update_post_meta( $a['id'], '_rn_keywords', $merged );
		self::changed();
		return true;
	}

	/**
	 * Crée ou met à jour une catégorie.
	 *
	 * @param array $data name, slug, description, order, icon.
	 * @param int   $id   Terme.
	 * @return int|\WP_Error
	 */
	public static function save_category( array $data, $id = 0 ) {
		$name = sanitize_text_field( isset( $data['name'] ) ? $data['name'] : '' );
		if ( '' === $name ) {
			return new \WP_Error( 'rn_name', 'Le nom de la catégorie est obligatoire.' );
		}
		$args = array(
			'slug'        => sanitize_title( ! empty( $data['slug'] ) ? $data['slug'] : $name ),
			'description' => sanitize_textarea_field( isset( $data['description'] ) ? $data['description'] : '' ),
		);
		if ( $id ) {
			$args['name'] = $name;
			$r            = wp_update_term( (int) $id, self::TAX, $args );
		} else {
			$r = wp_insert_term( $name, self::TAX, $args );
		}
		if ( is_wp_error( $r ) ) {
			return $r;
		}
		$term_id = (int) $r['term_id'];
		update_term_meta( $term_id, '_rn_order', isset( $data['order'] ) ? (int) $data['order'] : 0 );
		$icon = isset( $data['icon'] ) && in_array( $data['icon'], Icons::activity_keys(), true ) ? $data['icon'] : 'hammer';
		update_term_meta( $term_id, '_rn_icon', $icon );
		self::changed();
		return $term_id;
	}

	public static function delete_category( $id ) {
		$r = wp_delete_term( (int) $id, self::TAX );
		self::changed();
		return $r && ! is_wp_error( $r );
	}

	/**
	 * Importe les données de départ (data/activities.json).
	 *
	 * @param bool $only_missing N'ajoute que les travaux absents (par slug).
	 * @return int Nombre de travaux créés.
	 */
	public static function seed( $only_missing = true ) {
		$file = RENO360_DIR . 'data/activities.json';
		if ( ! is_readable( $file ) ) {
			return 0;
		}
		$data = json_decode( (string) file_get_contents( $file ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		if ( ! is_array( $data ) || empty( $data['activities'] ) ) {
			return 0;
		}
		if ( $only_missing && get_option( 'reno360_seeded' ) && self::count_all() > 0 ) {
			return 0;
		}

		$cat_ids = array();
		foreach ( (array) $data['categories'] as $cat ) {
			$term = get_term_by( 'slug', $cat['slug'], self::TAX );
			if ( $term ) {
				$cat_ids[ $cat['slug'] ] = (int) $term->term_id;
				continue;
			}
			$r = self::save_category(
				array(
					'name'  => $cat['name'],
					'slug'  => $cat['slug'],
					'order' => isset( $cat['order'] ) ? $cat['order'] : 0,
					'icon'  => isset( $cat['icon'] ) ? $cat['icon'] : 'hammer',
				)
			);
			if ( ! is_wp_error( $r ) ) {
				$cat_ids[ $cat['slug'] ] = $r;
			}
		}

		$created = 0;
		foreach ( (array) $data['activities'] as $a ) {
			if ( get_page_by_path( $a['slug'], OBJECT, self::PT ) ) {
				continue;
			}
			$r = self::save(
				array(
					'name'        => $a['name'],
					'slug'        => $a['slug'],
					'excerpt'     => isset( $a['excerpt'] ) ? $a['excerpt'] : '',
					'content'     => isset( $a['content'] ) ? $a['content'] : '',
					'category_id' => isset( $cat_ids[ $a['category'] ] ) ? $cat_ids[ $a['category'] ] : 0,
					'icon'        => isset( $a['icon'] ) ? $a['icon'] : 'hammer',
					'keywords'    => isset( $a['keywords'] ) ? $a['keywords'] : array(),
					'questions'   => isset( $a['questions'] ) ? $a['questions'] : array(),
					'popular'     => ! empty( $a['popular'] ),
					'featured'    => ! empty( $a['featured'] ),
					'order'       => isset( $a['order'] ) ? (int) $a['order'] : 0,
					'image'       => isset( $a['image'] ) ? $a['image'] : '',
					'active'      => true,
				)
			);
			if ( ! is_wp_error( $r ) ) {
				++$created;
			}
		}
		update_option( 'reno360_seeded', 1, false );
		self::changed();
		return $created;
	}

	public static function count_all() {
		$counts = wp_count_posts( self::PT );
		$total  = 0;
		foreach ( (array) $counts as $status => $n ) {
			if ( 'trash' !== $status && 'auto-draft' !== $status ) {
				$total += (int) $n;
			}
		}
		return $total;
	}

	/**
	 * Questions par défaut si un travail n'en définit aucune.
	 *
	 * @return array
	 */
	public static function default_questions() {
		return array(
			array(
				'label'    => 'De quel type de travaux s’agit-il ?',
				'type'     => 'single',
				'options'  => array( 'Installation neuve', 'Rénovation ou remplacement', 'Réparation', 'Entretien', 'Je ne sais pas' ),
				'required' => false,
			),
			array(
				'label'    => 'Surface ou quantité approximative',
				'type'     => 'text',
				'options'  => array(),
				'required' => false,
			),
		);
	}
}
