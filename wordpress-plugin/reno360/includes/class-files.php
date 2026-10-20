<?php
/**
 * Fichiers privés (photos des clients, devis PDF, documents des artisans).
 *
 * Stockés hors de la médiathèque dans uploads/reno360-private/ (accès direct bloqué),
 * servis uniquement via des liens signés à durée limitée.
 *
 * @package Reno360
 */

namespace Reno360;

defined( 'ABSPATH' ) || exit;

class Files {

	const DIR = 'reno360-private';

	public static function init() {
		add_action( 'admin_post_rn_file', array( __CLASS__, 'admin_download' ) );
	}

	public static function allowed_types() {
		return array(
			'jpg|jpeg|jpe' => 'image/jpeg',
			'png'          => 'image/png',
			'gif'          => 'image/gif',
			'webp'         => 'image/webp',
			'heic'         => 'image/heic',
			'heif'         => 'image/heif',
			'pdf'          => 'application/pdf',
		);
	}

	public static function base_dir() {
		$up = wp_upload_dir( null, false );
		return trailingslashit( $up['basedir'] ) . self::DIR;
	}

	public static function protect_dir() {
		$dir = self::base_dir();
		if ( ! is_dir( $dir ) ) {
			wp_mkdir_p( $dir );
		}
		if ( ! file_exists( $dir . '/.htaccess' ) ) {
			file_put_contents( $dir . '/.htaccess', "Require all denied\nDeny from all\n" ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		}
		if ( ! file_exists( $dir . '/index.php' ) ) {
			file_put_contents( $dir . '/index.php', "<?php\n// Silence.\n" ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		}
		if ( ! file_exists( $dir . '/web.config' ) ) {
			file_put_contents( $dir . '/web.config', '<?xml version="1.0" encoding="UTF-8"?><configuration><system.webServer><authorization><deny users="*" /></authorization></system.webServer></configuration>' ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		}
	}

	/**
	 * Transforme un champ $_FILES multiple en liste de fichiers.
	 *
	 * @param array|null $field Entrée de $_FILES.
	 * @return array[]
	 */
	public static function normalize( $field ) {
		if ( empty( $field ) || ! isset( $field['name'] ) ) {
			return array();
		}
		if ( ! is_array( $field['name'] ) ) {
			return array( $field );
		}
		$out = array();
		foreach ( $field['name'] as $i => $name ) {
			$out[] = array(
				'name'     => $name,
				'type'     => $field['type'][ $i ],
				'tmp_name' => $field['tmp_name'][ $i ],
				'error'    => $field['error'][ $i ],
				'size'     => $field['size'][ $i ],
			);
		}
		return $out;
	}

	/**
	 * Valide et enregistre un fichier téléversé.
	 *
	 * @param array  $file    Un fichier ($_FILES normalisé).
	 * @param string $context photo|quote|artisan_doc|message.
	 * @param array  $links   request_id, quote_id, artisan_id.
	 * @param bool   $only_pdf N'accepter que les PDF.
	 * @return int|\WP_Error
	 */
	public static function store( array $file, $context, array $links = array(), $only_pdf = false ) {
		global $wpdb;
		if ( ! empty( $file['error'] ) && UPLOAD_ERR_NO_FILE === (int) $file['error'] ) {
			return new \WP_Error( 'rn_nofile', 'Aucun fichier.' );
		}
		if ( ! empty( $file['error'] ) ) {
			return new \WP_Error( 'rn_upload', 'Le fichier « ' . sanitize_file_name( $file['name'] ) . ' » n’a pas pu être téléversé.' );
		}
		$max = (int) Settings::get( 'max_file_mb', 10 ) * MB_IN_BYTES;
		if ( (int) $file['size'] > $max ) {
			return new \WP_Error( 'rn_size', 'Le fichier « ' . sanitize_file_name( $file['name'] ) . ' » dépasse ' . (int) Settings::get( 'max_file_mb', 10 ) . ' Mo.' );
		}
		$types = self::allowed_types();
		if ( $only_pdf ) {
			$types = array( 'pdf' => 'application/pdf' );
		}
		$check = wp_check_filetype_and_ext( $file['tmp_name'], $file['name'], $types );
		if ( empty( $check['ext'] ) || empty( $check['type'] ) ) {
			return new \WP_Error( 'rn_type', 'Format non accepté pour « ' . sanitize_file_name( $file['name'] ) . ' » (' . ( $only_pdf ? 'PDF' : 'JPG, PNG, WEBP, HEIC ou PDF' ) . ').' );
		}

		self::protect_dir();
		$sub = gmdate( 'Y/m' );
		$dir = self::base_dir() . '/' . $sub;
		if ( ! is_dir( $dir ) ) {
			wp_mkdir_p( $dir );
		}
		$clean = sanitize_file_name( $file['name'] );
		$base  = pathinfo( $clean, PATHINFO_FILENAME );
		$name  = Util::token( 24 ) . '-' . substr( $base, 0, 60 ) . '.' . $check['ext'];
		$dest  = $dir . '/' . $name;
		$moved = is_uploaded_file( $file['tmp_name'] ) ? move_uploaded_file( $file['tmp_name'], $dest ) : copy( $file['tmp_name'], $dest );
		if ( ! $moved ) {
			return new \WP_Error( 'rn_move', 'Impossible d’enregistrer le fichier.' );
		}
		@chmod( $dest, 0640 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors

		$wpdb->insert(
			Installer::table( 'files' ),
			array(
				'request_id' => isset( $links['request_id'] ) ? (int) $links['request_id'] : 0,
				'quote_id'   => isset( $links['quote_id'] ) ? (int) $links['quote_id'] : 0,
				'artisan_id' => isset( $links['artisan_id'] ) ? (int) $links['artisan_id'] : 0,
				'context'    => sanitize_key( $context ),
				'path'       => $sub . '/' . $name,
				'name'       => mb_substr( $clean, 0, 190 ),
				'mime'       => $check['type'],
				'size'       => (int) $file['size'],
				'created_at' => Util::now(),
			)
		);
		return (int) $wpdb->insert_id;
	}

	/**
	 * Enregistre plusieurs fichiers ; renvoie les ids et les erreurs.
	 *
	 * @param array  $files    Liste normalisée.
	 * @param string $context  Contexte.
	 * @param array  $links    Liens.
	 * @param int    $max      Nombre maximum.
	 * @param bool   $only_pdf PDF uniquement.
	 * @return array{ids:int[],errors:string[]}
	 */
	public static function store_many( array $files, $context, array $links, $max = 10, $only_pdf = false ) {
		$ids    = array();
		$errors = array();
		foreach ( array_slice( $files, 0, $max ) as $f ) {
			if ( isset( $f['error'] ) && UPLOAD_ERR_NO_FILE === (int) $f['error'] ) {
				continue;
			}
			$r = self::store( $f, $context, $links, $only_pdf );
			if ( is_wp_error( $r ) ) {
				$errors[] = $r->get_error_message();
			} else {
				$ids[] = $r;
			}
		}
		return array(
			'ids'    => $ids,
			'errors' => $errors,
		);
	}

	public static function get( $id ) {
		global $wpdb;
		return $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . Installer::table( 'files' ) . ' WHERE id = %d', $id ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
	}

	/**
	 * @param array $args request_id, quote_id, artisan_id, context.
	 * @return array
	 */
	public static function query( array $args ) {
		global $wpdb;
		$where  = array();
		$params = array();
		foreach ( array( 'request_id', 'quote_id', 'artisan_id' ) as $k ) {
			if ( isset( $args[ $k ] ) ) {
				$where[]  = "$k = %d";
				$params[] = (int) $args[ $k ];
			}
		}
		if ( isset( $args['context'] ) ) {
			$where[]  = 'context = %s';
			$params[] = $args['context'];
		}
		if ( ! $where ) {
			return array();
		}
		$sql = 'SELECT * FROM ' . Installer::table( 'files' ) . ' WHERE ' . implode( ' AND ', $where ) . ' ORDER BY id ASC';
		return (array) $wpdb->get_results( $wpdb->prepare( $sql, $params ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
	}

	public static function delete( $id ) {
		global $wpdb;
		$f = self::get( $id );
		if ( ! $f ) {
			return false;
		}
		$path = self::path( $f );
		if ( $path && file_exists( $path ) ) {
			wp_delete_file( $path );
		}
		return (bool) $wpdb->delete( Installer::table( 'files' ), array( 'id' => (int) $id ), array( '%d' ) );
	}

	public static function path( array $f ) {
		$rel = str_replace( array( '..', '\\' ), '', (string) $f['path'] );
		return $rel ? self::base_dir() . '/' . $rel : '';
	}

	public static function is_image( array $f ) {
		return 0 === strpos( (string) $f['mime'], 'image/' ) && ! in_array( $f['mime'], array( 'image/heic', 'image/heif' ), true );
	}

	/**
	 * Lien signé, valable $ttl secondes.
	 *
	 * @param int $id  Fichier.
	 * @param int $ttl Durée de validité.
	 * @return string
	 */
	public static function url( $id, $ttl = 0 ) {
		$ttl = $ttl ? $ttl : 6 * HOUR_IN_SECONDS;
		$exp = time() + $ttl;
		$exp = $exp - ( $exp % 600 ) + 600; // Arrondi : liens stables sur 10 minutes (cache navigateur).
		return add_query_arg(
			array(
				'e' => $exp,
				's' => self::signature( $id, $exp ),
			),
			rest_url( 'reno360/v1/file/' . (int) $id )
		);
	}

	public static function signature( $id, $exp ) {
		return substr( hash_hmac( 'sha256', 'file|' . (int) $id . '|' . (int) $exp, wp_salt( 'auth' ) ), 0, 32 );
	}

	public static function verify( $id, $exp, $sig ) {
		return (int) $exp >= time() && hash_equals( self::signature( $id, $exp ), (string) $sig );
	}

	/**
	 * Envoie le fichier au navigateur et termine.
	 *
	 * @param array $f        Fichier.
	 * @param bool  $download Forcer le téléchargement.
	 */
	public static function output( array $f, $download = false ) {
		$path = self::path( $f );
		if ( ! $path || ! is_readable( $path ) ) {
			status_header( 404 );
			exit;
		}
		nocache_headers();
		header( 'Content-Type: ' . $f['mime'] );
		header( 'Content-Length: ' . filesize( $path ) );
		header( 'X-Content-Type-Options: nosniff' );
		header( 'Content-Disposition: ' . ( $download ? 'attachment' : 'inline' ) . '; filename="' . str_replace( '"', '', $f['name'] ) . '"' );
		readfile( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		exit;
	}

	/** Téléchargement depuis l'administration. */
	public static function admin_download() {
		$id = isset( $_GET['id'] ) ? (int) $_GET['id'] : 0; // phpcs:ignore WordPress.Security.NonceVerification
		check_admin_referer( 'rn_file_' . $id );
		if ( ! current_user_can( Util::CAP ) ) {
			wp_die( 'Accès refusé.' );
		}
		$f = self::get( $id );
		if ( ! $f ) {
			wp_die( 'Fichier introuvable.' );
		}
		self::output( $f, ! empty( $_GET['dl'] ) ); // phpcs:ignore WordPress.Security.NonceVerification
	}

	public static function admin_url( $id, $download = false ) {
		return wp_nonce_url( admin_url( 'admin-post.php?action=rn_file&id=' . (int) $id . ( $download ? '&dl=1' : '' ) ), 'rn_file_' . (int) $id );
	}

	public static function size_label( $bytes ) {
		return size_format( (int) $bytes, $bytes > MB_IN_BYTES ? 1 : 0 );
	}
}
