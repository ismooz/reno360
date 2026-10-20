// Vérifie que le moteur JS (assets/js/search.js) donne exactement le même premier résultat que le moteur PHP.
// Usage : node search-parity.js  (après php search-test.php …)
const fs = require( 'fs' );
const os = require( 'os' );
const path = require( 'path' );
const index = JSON.parse( fs.readFileSync( path.join( os.tmpdir(), 'rn-index.json' ), 'utf8' ) );
const cases = JSON.parse( fs.readFileSync( path.join( os.tmpdir(), 'rn-cases.json' ), 'utf8' ) );
globalThis.RENO360 = { index };
require( path.join( __dirname, '../reno360/assets/js/search.js' ) );
const S = globalThis.Reno360Search;
let diff = 0;
let ok = 0;
for ( const c of cases ) {
	const r = S.query( c.q, 3 ).results;
	const top = r.length ? r[ 0 ].item.s : '(aucun)';
	if ( top !== c.php ) {
		diff++;
		console.log( 'DIFFÉRENCE', c.q, 'php=', c.php, 'js=', top );
	}
	if ( c.expect.includes( top ) || ( c.expect.length === 1 && c.expect[ 0 ] === '' && ! r.length ) ) {
		ok++;
	}
}
console.log( `JS : ${ ok }/${ cases.length } bons premiers résultats · ${ diff } différence(s) avec PHP` );
process.exit( diff ? 1 : 0 );
