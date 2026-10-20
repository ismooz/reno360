/*!
 * Reno360 — recherche instantanée par mots-clés.
 * Algorithme identique à includes/class-search.php (normalisation, racinisation,
 * tolérance aux fautes, préfixes, racines communes, pondération et bonus d'expression).
 */
( function ( root ) {
	'use strict';

	var WEIGHTS = { n: 10, k: 8, c: 3, d: 2 };
	var FIELDS = [ 'n', 'k', 'c', 'd' ];
	var THRESHOLD = 3;

	var cfg = root.RENO360 || {};
	var idx = cfg.index || { items: [], stop: [], weak: [] };
	var STOP = toSet( idx.stop || [] );
	var WEAK = toSet( idx.weak || [] );

	function toSet( list ) {
		var s = Object.create( null );
		for ( var i = 0; i < list.length; i++ ) {
			s[ list[ i ] ] = 1;
		}
		return s;
	}

	function stripAccents( s ) {
		return s.normalize ? s.normalize( 'NFD' ).replace( /[̀-ͯ]/g, '' ) : s;
	}

	function normalize( s ) {
		s = String( s == null ? '' : s ).replace( /<[^>]*>/g, ' ' );
		s = s.replace( /[œŒ]/g, 'oe' ).replace( /[æÆ]/g, 'ae' ).replace( /ß/g, 'ss' )
			.replace( /[’‘'`\-_/]/g, ' ' ).replace( /²/g, '2' ).replace( /³/g, '3' );
		s = stripAccents( s ).toLowerCase();
		s = s.replace( /[^a-z0-9]+/g, ' ' );
		return s.replace( /\s+/g, ' ' ).trim();
	}

	function stem( t ) {
		var l = t.length;
		if ( l > 5 && t.slice( -4 ) === 'eaux' ) {
			return t.slice( 0, -1 );
		}
		if ( l > 4 && t.slice( -3 ) === 'aux' ) {
			return t.slice( 0, -3 ) + 'al';
		}
		if ( l > 3 && ( t.slice( -1 ) === 's' || t.slice( -1 ) === 'x' ) && t.slice( -2 ) !== 'ss' ) {
			return t.slice( 0, -1 );
		}
		return t;
	}

	function tokens( s ) {
		var parts = normalize( s ).split( ' ' );
		var out = [];
		for ( var i = 0; i < parts.length; i++ ) {
			var t = parts[ i ];
			if ( ! t || STOP[ t ] ) {
				continue;
			}
			if ( t.length < 2 && ! /^\d$/.test( t ) ) {
				continue;
			}
			t = stem( t );
			if ( out.indexOf( t ) === -1 ) {
				out.push( t );
			}
		}
		return out;
	}

	function distance( a, b, max ) {
		var la = a.length;
		var lb = b.length;
		if ( Math.abs( la - lb ) > max ) {
			return max + 1;
		}
		var prev2 = [];
		var prev = [];
		var j;
		for ( j = 0; j <= lb; j++ ) {
			prev[ j ] = j;
		}
		for ( var i = 1; i <= la; i++ ) {
			var cur = [ i ];
			var rowMin = i;
			for ( j = 1; j <= lb; j++ ) {
				var cost = a.charAt( i - 1 ) === b.charAt( j - 1 ) ? 0 : 1;
				var v = Math.min( prev[ j ] + 1, cur[ j - 1 ] + 1, prev[ j - 1 ] + cost );
				if ( i > 1 && j > 1 && a.charAt( i - 1 ) === b.charAt( j - 2 ) && a.charAt( i - 2 ) === b.charAt( j - 1 ) ) {
					v = Math.min( v, prev2[ j - 2 ] + 1 );
				}
				cur[ j ] = v;
				if ( v < rowMin ) {
					rowMin = v;
				}
			}
			if ( rowMin > max ) {
				return max + 1;
			}
			prev2 = prev;
			prev = cur;
		}
		return prev[ lb ];
	}

	function match( q, f ) {
		if ( q === f ) {
			return 1;
		}
		var lq = q.length;
		var lf = f.length;
		if ( lq >= 2 && lf > lq && f.indexOf( q ) === 0 ) {
			return lq >= 3 ? 0.9 : 0.6;
		}
		if ( lf >= 4 && lq > lf && q.indexOf( f ) === 0 ) {
			return 0.75;
		}
		if ( lq >= 4 ) {
			var max = lq >= 8 ? 2 : 1;
			if ( Math.abs( lq - lf ) <= max ) {
				var d = distance( q, f, max );
				if ( d <= max ) {
					return d === 1 ? 0.72 : 0.5;
				}
			}
			if ( lf > lq && distance( q, f.slice( 0, lq ), 1 ) <= 1 ) {
				return 0.6;
			}
		}
		var p = 0;
		var min = Math.min( lq, lf );
		while ( p < min && q.charAt( p ) === f.charAt( p ) ) {
			p++;
		}
		if ( p >= 5 && p >= 0.6 * min ) {
			return 0.65;
		}
		return 0;
	}

	function score( qTokens, qPhrase, item ) {
		var total = 0;
		var matched = 0;
		var hint = '';
		var hintScore = 0;
		for ( var i = 0; i < qTokens.length; i++ ) {
			var qt = qTokens[ i ];
			var best = 0;
			var bestField = '';
			var bestTok = '';
			for ( var fi = 0; fi < FIELDS.length; fi++ ) {
				var field = FIELDS[ fi ];
				var list = item.f[ field ] || [];
				for ( var k = 0; k < list.length; k++ ) {
					var m = match( qt, list[ k ] );
					if ( m <= 0 ) {
						continue;
					}
					var s = WEIGHTS[ field ] * m;
					if ( s > best ) {
						best = s;
						bestField = field;
						bestTok = list[ k ];
					}
				}
			}
			if ( best <= 0 ) {
				continue;
			}
			matched++;
			var contrib = best * ( WEAK[ qt ] ? 0.35 : 1 );
			total += contrib;
			if ( bestField === 'k' && contrib > hintScore ) {
				for ( var p = 0; p < item.kp.length; p++ ) {
					if ( ( ' ' + item.kp[ p ][ 0 ] + ' ' ).indexOf( ' ' + bestTok + ' ' ) !== -1 ) {
						hint = item.kp[ p ][ 1 ];
						hintScore = contrib;
						break;
					}
				}
			}
		}
		if ( matched === 0 ) {
			return { score: 0, hint: '' };
		}
		total *= Math.pow( matched / qTokens.length, 1.5 );
		if ( qPhrase.length >= 3 ) {
			if ( item.nn === qPhrase ) {
				total += 20;
			} else if ( item.nn.indexOf( qPhrase ) === 0 ) {
				total += 10;
			} else if ( ( ' ' + item.nn ).indexOf( ' ' + qPhrase ) !== -1 ) {
				total += 6;
			}
			for ( var j = 0; j < item.kp.length; j++ ) {
				if ( item.kp[ j ][ 0 ] === qPhrase ) {
					total += item.kp[ j ][ 2 ] ? 14 : 7;
					hint = item.kp[ j ][ 1 ];
					break;
				}
				if ( qTokens.length > 1 && ( ' ' + item.kp[ j ][ 0 ] + ' ' ).indexOf( ' ' + qPhrase + ' ' ) !== -1 ) {
					total += 7;
					hint = item.kp[ j ][ 1 ];
					break;
				}
			}
		}
		total += 0.5 * ( item.b || 0 ) + ( item.pop ? 0.5 : 0 );
		return { score: total, hint: hint };
	}

	function query( q, limit ) {
		var qTokens = tokens( q );
		var phrase = qTokens.join( ' ' );
		var out = [];
		if ( qTokens.length ) {
			for ( var i = 0; i < idx.items.length; i++ ) {
				var it = idx.items[ i ];
				var r = score( qTokens, phrase, it );
				if ( r.score >= THRESHOLD ) {
					out.push( { item: it, score: Math.round( r.score * 100 ) / 100, hint: r.hint } );
				}
			}
			out.sort( function ( a, b ) {
				if ( a.score === b.score ) {
					return a.item.name < b.item.name ? -1 : 1;
				}
				return b.score - a.score;
			} );
		}
		return { tokens: qTokens, results: out.slice( 0, limit || 8 ) };
	}

	function popular( limit ) {
		var out = [];
		for ( var i = 0; i < idx.items.length && out.length < ( limit || 8 ); i++ ) {
			if ( idx.items[ i ].pop ) {
				out.push( { item: idx.items[ i ], score: 0, hint: '' } );
			}
		}
		return out;
	}

	function byId( id ) {
		for ( var i = 0; i < idx.items.length; i++ ) {
			if ( String( idx.items[ i ].id ) === String( id ) || idx.items[ i ].s === id ) {
				return idx.items[ i ];
			}
		}
		return null;
	}

	/* ------------------------------------------------------------ */
	/* Interface : liste de suggestions accessible (combobox ARIA)   */
	/* ------------------------------------------------------------ */

	function esc( s ) {
		return String( s == null ? '' : s ).replace( /[&<>"']/g, function ( c ) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ c ];
		} );
	}

	function icon( key, size ) {
		var icons = cfg.icons || {};
		var inner = icons[ key ] || icons.hammer || '';
		size = size || 20;
		return '<svg class="rn-icon" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + inner + '</svg>';
	}

	/* Met en gras les débuts de mots correspondant à la saisie. */
	function highlight( text, q ) {
		var words = normalize( q ).split( ' ' ).filter( function ( w ) {
			return w.length >= 2 && ! STOP[ w ];
		} );
		if ( ! words.length ) {
			return esc( text );
		}
		var chars = Array.from( text );
		var norm = chars.map( function ( c ) {
			var n = stripAccents( c ).toLowerCase();
			return /^[a-z0-9]$/.test( n ) ? n : ' ';
		} );
		var mark = new Array( chars.length ).fill( false );
		var flat = norm.join( '' );
		words.forEach( function ( w ) {
			var from = 0;
			var pos;
			while ( ( pos = flat.indexOf( w, from ) ) !== -1 ) {
				if ( pos === 0 || flat.charAt( pos - 1 ) === ' ' ) {
					for ( var i = pos; i < pos + w.length; i++ ) {
						mark[ i ] = true;
					}
				}
				from = pos + 1;
			}
		} );
		var html = '';
		var open = false;
		for ( var i = 0; i < chars.length; i++ ) {
			if ( mark[ i ] && ! open ) {
				html += '<mark>';
				open = true;
			} else if ( ! mark[ i ] && open ) {
				html += '</mark>';
				open = false;
			}
			html += esc( chars[ i ] );
		}
		return html + ( open ? '</mark>' : '' );
	}

	function log( q, results, topId, selectedId, source ) {
		if ( ! cfg.rest || ! q || q.length < 2 ) {
			return;
		}
		var body = JSON.stringify( { q: q, results: results, top: topId || 0, selected: selectedId || 0, source: source || '' } );
		try {
			if ( navigator.sendBeacon ) {
				navigator.sendBeacon( cfg.rest + 'search/log', new Blob( [ body ], { type: 'application/json' } ) );
				return;
			}
		} catch ( e ) {}
		if ( root.fetch ) {
			root.fetch( cfg.rest + 'search/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true } );
		}
	}

	var uid = 0;

	function attach( box ) {
		if ( box.__rnSearch ) {
			return box.__rnSearch;
		}
		var input = box.querySelector( '[data-rn-search-input]' ) || box.querySelector( 'input' );
		if ( ! input ) {
			return null;
		}
		var target = box.getAttribute( 'data-rn-target' ) || 'form';
		var source = box.getAttribute( 'data-rn-source' ) || '';
		var listId = 'rn-ac-' + ( ++uid );
		var list = document.createElement( 'ul' );
		list.className = 'rn-ac';
		list.id = listId;
		list.setAttribute( 'role', 'listbox' );
		list.hidden = true;
		( box.querySelector( '[data-rn-search-anchor]' ) || input.parentNode ).appendChild( list );

		input.setAttribute( 'role', 'combobox' );
		input.setAttribute( 'aria-autocomplete', 'list' );
		input.setAttribute( 'aria-expanded', 'false' );
		input.setAttribute( 'aria-controls', listId );
		input.setAttribute( 'autocomplete', 'off' );

		var state = { results: [], active: -1, q: '', logged: '' };
		var timer = null;
		var idleTimer = null;

		function close() {
			list.hidden = true;
			input.setAttribute( 'aria-expanded', 'false' );
			input.removeAttribute( 'aria-activedescendant' );
			state.active = -1;
		}

		function render() {
			var q = input.value;
			var html = '';
			var res = state.results;
			if ( ! q.trim() ) {
				html += '<li class="rn-ac-head" role="presentation">Travaux les plus demandés</li>';
			}
			res.forEach( function ( r, i ) {
				var meta = r.item.cat || '';
				if ( r.hint && normalize( r.hint ) !== normalize( r.item.name ) ) {
					meta += ( meta ? ' · ' : '' ) + 'correspond à « ' + esc( r.hint ) + ' »';
				}
				html += '<li role="option" id="' + listId + '-' + i + '" class="rn-ac-item' + ( i === state.active ? ' is-active' : '' ) + '" aria-selected="' + ( i === state.active ? 'true' : 'false' ) + '" data-i="' + i + '">' +
					'<span class="rn-ac-ico">' + icon( r.item.icon, 20 ) + '</span>' +
					'<span class="rn-ac-txt"><span class="rn-ac-name">' + highlight( r.item.name, q ) + '</span>' +
					( meta ? '<span class="rn-ac-meta">' + meta + '</span>' : '' ) + '</span></li>';
			} );
			if ( q.trim().length >= 2 && ! res.length ) {
				html += '<li class="rn-ac-empty" role="presentation"><strong>Aucun type de travaux ne correspond.</strong> ' +
					'<a href="' + esc( formUrl( { q: q } ) ) + '">Décrire mon projet quand même</a></li>';
			}
			if ( cfg.catalogUrl ) {
				html += '<li class="rn-ac-foot" role="presentation"><a href="' + esc( cfg.catalogUrl ) + '">Voir tous les travaux</a></li>';
			}
			list.innerHTML = html;
			list.hidden = false;
			input.setAttribute( 'aria-expanded', 'true' );
			if ( state.active >= 0 ) {
				input.setAttribute( 'aria-activedescendant', listId + '-' + state.active );
			} else {
				input.removeAttribute( 'aria-activedescendant' );
			}
		}

		function update() {
			var q = input.value;
			state.q = q;
			state.active = -1;
			state.results = q.trim() ? query( q, 7 ).results : popular( 7 );
			render();
			clearTimeout( idleTimer );
			if ( q.trim().length >= 3 && ! state.results.length ) {
				idleTimer = setTimeout( function () {
					if ( state.logged !== q ) {
						state.logged = q;
						log( q, 0, 0, 0, source );
					}
				}, 1500 );
			}
		}

		function formUrl( params ) {
			var url = cfg.formUrl || '/';
			var qs = [];
			var npaInput = box.querySelector( '[data-rn-npa]' );
			if ( npaInput && npaInput.value.trim() ) {
				params.npa = npaInput.value.trim();
			}
			Object.keys( params ).forEach( function ( k ) {
				qs.push( encodeURIComponent( k ) + '=' + encodeURIComponent( params[ k ] ) );
			} );
			return url + ( url.indexOf( '?' ) === -1 ? '?' : '&' ) + qs.join( '&' );
		}

		function choose( r ) {
			var q = input.value;
			if ( q.trim() ) {
				state.logged = q;
				log( q, state.results.length, state.results.length ? state.results[ 0 ].item.id : 0, r.item.id, source );
			}
			close();
			if ( target === 'select' ) {
				input.value = r.item.name;
				box.dispatchEvent( new CustomEvent( 'rn:select', { detail: r.item, bubbles: true } ) );
				return;
			}
			root.location.href = target === 'page' ? r.item.url : formUrl( { travail: r.item.s } );
		}

		input.addEventListener( 'input', function () {
			clearTimeout( timer );
			timer = setTimeout( update, 40 );
		} );
		input.addEventListener( 'focus', update );
		input.addEventListener( 'keydown', function ( e ) {
			var n = state.results.length;
			if ( e.key === 'ArrowDown' ) {
				e.preventDefault();
				if ( list.hidden ) {
					update();
				}
				state.active = n ? ( state.active + 1 ) % n : -1;
				render();
			} else if ( e.key === 'ArrowUp' ) {
				e.preventDefault();
				state.active = n ? ( state.active - 1 + n ) % n : -1;
				render();
			} else if ( e.key === 'Enter' ) {
				e.preventDefault();
				submit();
			} else if ( e.key === 'Escape' ) {
				close();
			}
		} );
		list.addEventListener( 'mousedown', function ( e ) {
			var li = e.target.closest( '.rn-ac-item' );
			if ( li ) {
				e.preventDefault();
				choose( state.results[ +li.getAttribute( 'data-i' ) ] );
			}
		} );
		document.addEventListener( 'click', function ( e ) {
			if ( ! box.contains( e.target ) ) {
				close();
			}
		} );

		function submit() {
			var q = input.value.trim();
			if ( state.active >= 0 && state.results[ state.active ] ) {
				choose( state.results[ state.active ] );
				return;
			}
			if ( q ) {
				var r = query( q, 7 ).results;
				state.results = r;
				if ( r.length ) {
					choose( r[ 0 ] );
					return;
				}
				log( q, 0, 0, 0, source );
				if ( target === 'select' ) {
					render();
					return;
				}
				root.location.href = formUrl( { q: q } );
				return;
			}
			if ( target !== 'select' ) {
				root.location.href = formUrl( {} );
			}
		}

		var btn = box.querySelector( '[data-rn-search-submit]' );
		if ( btn ) {
			btn.addEventListener( 'click', function ( e ) {
				e.preventDefault();
				submit();
			} );
		}
		var form = input.form;
		if ( form && box.contains( form ) ) {
			form.addEventListener( 'submit', function ( e ) {
				e.preventDefault();
				submit();
			} );
		}

		var api = { update: update, close: close, input: input };
		box.__rnSearch = api;
		return api;
	}

	function init() {
		var boxes = document.querySelectorAll( '[data-rn-search]' );
		for ( var i = 0; i < boxes.length; i++ ) {
			attach( boxes[ i ] );
		}
	}

	root.Reno360Search = {
		normalize: normalize,
		stem: stem,
		tokens: tokens,
		distance: distance,
		match: match,
		score: score,
		query: query,
		popular: popular,
		byId: byId,
		highlight: highlight,
		icon: icon,
		esc: esc,
		log: log,
		attach: attach,
		setIndex: function ( index ) {
			idx = index;
			STOP = toSet( idx.stop || [] );
			WEAK = toSet( idx.weak || [] );
		},
	};

	if ( root.document ) {
		if ( document.readyState === 'loading' ) {
			document.addEventListener( 'DOMContentLoaded', init );
		} else {
			init();
		}
	}
}( typeof window !== 'undefined' ? window : globalThis ) );
