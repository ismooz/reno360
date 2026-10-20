<?php
/**
 * Test de pertinence de la recherche (moteur PHP) et export de l'index pour le test JS.
 *
 * Usage : php search-test.php /chemin/vers/wordpress [fichier-requetes]
 */
$rn_root = isset( $argv[1] ) ? $argv[1] : "";
$rn_file = isset( $argv[2] ) ? $argv[2] : __DIR__ . '/search-queries.txt';
$_SERVER['HTTP_HOST'] = '127.0.0.1:8899';
$_SERVER['REQUEST_URI'] = '/';
require $rn_root . '/wp-load.php';

$lines = file( $rn_file, FILE_IGNORE_NEW_LINES );
$total = 0;
$fail  = array();
$cases = array();
foreach ( $lines as $line ) {
	$line = trim( $line );
	if ( '' === $line || '#' === $line[0] || false === strpos( $line, '=>' ) ) {
		continue;
	}
	list( $q, $expect ) = array_map( 'trim', explode( '=>', $line, 2 ) );
	$expect  = array_map( 'trim', explode( '|', $expect ) );
	$res     = Reno360\Search::query( $q, 3 )['results'];
	$top     = $res ? $res[0]['slug'] : '(aucun)';
	$cases[] = array( 'q' => $q, 'expect' => $expect, 'php' => $top );
	++$total;
	$ok = in_array( $top, $expect, true ) || ( array( '' ) === $expect && ! $res );
	if ( ! $ok ) {
		$fail[] = sprintf( '%-45s attendu %-35s obtenu %s', $q, implode( '|', $expect ), $top );
	}
}
printf( "PHP : %d/%d requêtes avec le bon résultat en premier (%.1f %%)\n", $total - count( $fail ), $total, ( $total - count( $fail ) ) / max( 1, $total ) * 100 );
foreach ( $fail as $f ) {
	echo '  ÉCHEC ' . $f . "\n";
}
file_put_contents( sys_get_temp_dir() . '/rn-index.json', wp_json_encode( Reno360\Search::client_index() ) );
file_put_contents( sys_get_temp_dir() . '/rn-cases.json', wp_json_encode( $cases ) );
