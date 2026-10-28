<?php
/**
 * Identité visuelle : palettes de couleurs et polices (hébergées localement, sans Google Fonts).
 *
 * @package Reno360
 */

namespace Reno360;

defined( 'ABSPATH' ) || exit;

class Theme {

	const DEFAULT_PALETTE = 'vert';

	/**
	 * Palettes reprises de la maquette. Chaque jeu définit toutes les couleurs qui varient ;
	 * les gris chauds (bordures, survols) sont communs et définis dans la feuille de styles.
	 *
	 * @return array<string, array>
	 */
	public static function palettes() {
		return array(
			'vert'         => array(
				'label'         => 'Vert forêt',
				'primary'       => '#1D5A3F',
				'primary-hover' => '#174A34',
				'ink'           => '#14201A',
				'ink-2'         => '#33423A',
				'muted'         => '#4A564F',
				'dark'          => '#0F2E22',
				'dark-2'        => '#1D3B2E',
				'on-dark'       => '#D6E2DA',
				'on-dark-2'     => '#C9D6CE',
				'on-primary'    => '#DCE8E0',
				'accent'        => '#C6E36A',
				'accent-hover'  => '#D6EE86',
				'accent-soft'   => '#EEF6D2',
				'accent-ink'    => '#3C4F0E',
				'soft'          => '#E3EEE6',
				'soft-2'        => '#F1F6F1',
				'soft-3'        => '#F7FAF7',
				'bg'            => '#F6F4EE',
				'disabled'      => '#A9B8AF',
				'shadow'        => '15, 46, 34',
			),
			'terracotta'   => array(
				'label'         => 'Terracotta',
				'primary'       => '#9E4426',
				'primary-hover' => '#863920',
				'ink'           => '#1E1612',
				'ink-2'         => '#4A3830',
				'muted'         => '#5A4B43',
				'dark'          => '#2A1913',
				'dark-2'        => '#3A2820',
				'on-dark'       => '#EAD9CF',
				'on-dark-2'     => '#DFCCC1',
				'on-primary'    => '#F2E2D9',
				'accent'        => '#F2C14E',
				'accent-hover'  => '#F6D27A',
				'accent-soft'   => '#FCEFCB',
				'accent-ink'    => '#6B4E0A',
				'soft'          => '#F4E2D7',
				'soft-2'        => '#FAEFE8',
				'soft-3'        => '#FBF5F1',
				'bg'            => '#F7F1EA',
				'disabled'      => '#C9AFA3',
				'shadow'        => '42, 25, 19',
			),
			'ardoise'      => array(
				'label'         => 'Ardoise',
				'primary'       => '#1F3A5F',
				'primary-hover' => '#18304F',
				'ink'           => '#131A23',
				'ink-2'         => '#33404F',
				'muted'         => '#4A535E',
				'dark'          => '#0E1C2E',
				'dark-2'        => '#1A2B40',
				'on-dark'       => '#D3DCE8',
				'on-dark-2'     => '#C6D1DE',
				'on-primary'    => '#DCE4EE',
				'accent'        => '#E39B5B',
				'accent-hover'  => '#EDB07A',
				'accent-soft'   => '#FBE6D4',
				'accent-ink'    => '#6B3A12',
				'soft'          => '#E4EAF2',
				'soft-2'        => '#F0F3F8',
				'soft-3'        => '#F6F8FB',
				'bg'            => '#F3F3EF',
				'disabled'      => '#A7B1BF',
				'shadow'        => '14, 28, 46',
			),
			'noir'         => array(
				'label'         => 'Noir',
				'primary'       => '#17191B',
				'primary-hover' => '#000000',
				'ink'           => '#111315',
				'ink-2'         => '#3A3D40',
				'muted'         => '#4D5157',
				'dark'          => '#0B0C0D',
				'dark-2'        => '#222426',
				'on-dark'       => '#D6D7D8',
				'on-dark-2'     => '#C9CACB',
				'on-primary'    => '#E0E1E2',
				'accent'        => '#FF6A2B',
				'accent-hover'  => '#FF8752',
				'accent-soft'   => '#FFE4D6',
				'accent-ink'    => '#7A2A0B',
				'soft'          => '#ECEBE6',
				'soft-2'        => '#F4F3EF',
				'soft-3'        => '#F8F7F4',
				'bg'            => '#F5F4F0',
				'disabled'      => '#A5A7A9',
				'shadow'        => '11, 12, 13',
			),
			'ardoise-noir' => array(
				'label'         => 'Ardoise et noir',
				'primary'       => '#1F3A5F',
				'primary-hover' => '#18304F',
				'ink'           => '#111315',
				'ink-2'         => '#33404F',
				'muted'         => '#4A535E',
				'dark'          => '#0E0F11',
				'dark-2'        => '#222426',
				'on-dark'       => '#D6D7D8',
				'on-dark-2'     => '#C9CACB',
				'on-primary'    => '#DCE4EE',
				'accent'        => '#E39B5B',
				'accent-hover'  => '#EDB07A',
				'accent-soft'   => '#FBE6D4',
				'accent-ink'    => '#6B3A12',
				'soft'          => '#E4EAF2',
				'soft-2'        => '#F0F3F8',
				'soft-3'        => '#F6F8FB',
				'bg'            => '#F3F3EF',
				'disabled'      => '#A7B1BF',
				'shadow'        => '11, 12, 13',
			),
		);
	}

	public static function palette_key() {
		$key = (string) Settings::get( 'palette', self::DEFAULT_PALETTE );
		return isset( self::palettes()[ $key ] ) ? $key : self::DEFAULT_PALETTE;
	}

	/** @return array Couleurs de la palette choisie. */
	public static function palette() {
		return self::palettes()[ self::palette_key() ];
	}

	public static function color( $token ) {
		$p = self::palette();
		return isset( $p[ $token ] ) ? $p[ $token ] : '';
	}

	/** Variables CSS de la palette, à placer sur :root. */
	public static function css_vars() {
		$css = '';
		foreach ( self::palette() as $k => $v ) {
			if ( 'label' !== $k ) {
				$css .= '--rn-' . $k . ':' . $v . ';';
			}
		}
		return ':root{' . $css . '}';
	}

	/** Déclarations @font-face des polices de la maquette (fichiers dans assets/fonts). */
	public static function font_faces() {
		$url   = RENO360_URL . 'assets/fonts/';
		$latin = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
		$ext   = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
		$faces = array(
			array( 'Reno360 Sans', 'normal', '400 900', 'schibsted-grotesk-%s-wght-normal' ),
			array( 'Reno360 Serif', 'normal', '400', 'instrument-serif-%s-400-normal' ),
			array( 'Reno360 Serif', 'italic', '400', 'instrument-serif-%s-400-italic' ),
			array( 'Reno360 Mono', 'normal', '400', 'ibm-plex-mono-%s-400-normal' ),
			array( 'Reno360 Mono', 'normal', '500', 'ibm-plex-mono-%s-500-normal' ),
		);
		$css   = '';
		foreach ( $faces as $f ) {
			foreach ( array( 'latin' => $latin, 'latin-ext' => $ext ) as $subset => $range ) {
				$css .= "@font-face{font-family:'{$f[0]}';font-style:{$f[1]};font-weight:{$f[2]};font-display:swap;src:url('" . $url . sprintf( $f[3], $subset ) . ".woff2') format('woff2');unicode-range:{$range}}";
			}
		}
		return $css;
	}
}
