/*!
 * Reno360 — interactions du site public : catalogue, espace client, espace artisan, candidature.
 */
( function () {
	'use strict';

	var cfg = window.RENO360 || {};
	var S = window.Reno360Search;

	function $( sel, ctx ) {
		return ( ctx || document ).querySelector( sel );
	}
	function $$( sel, ctx ) {
		return Array.prototype.slice.call( ( ctx || document ).querySelectorAll( sel ) );
	}

	/* ---------- Provenance (pour mesurer les sources de demandes) ---------- */

	( function attribution() {
		try {
			var store = window.sessionStorage;
			var attr = JSON.parse( store.getItem( 'rn_attr' ) || '{}' );
			var params = new URLSearchParams( window.location.search );
			[ 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid' ].forEach( function ( k ) {
				if ( params.get( k ) ) {
					attr[ k ] = params.get( k ).slice( 0, 100 );
				}
			} );
			if ( ! attr.landing ) {
				attr.landing = window.location.href.split( '#' )[ 0 ].slice( 0, 250 );
				var ref = document.referrer;
				var host = '';
				try {
					host = ref ? new URL( ref ).hostname : '';
				} catch ( e ) {}
				if ( attr.gclid || /cpc|ads/.test( attr.utm_medium || '' ) ) {
					attr.source = 'Publicité (' + ( attr.utm_source || 'Google' ) + ')';
				} else if ( attr.utm_source ) {
					attr.source = attr.utm_source + ( attr.utm_medium ? ' / ' + attr.utm_medium : '' );
				} else if ( ! host || host === window.location.hostname ) {
					attr.source = 'Accès direct';
				} else if ( /google|bing|duckduckgo|yahoo|ecosia|qwant/.test( host ) ) {
					attr.source = host.replace( /^www\./, '' ) + ' · recherche naturelle';
				} else {
					attr.source = host.replace( /^www\./, '' );
				}
			}
			store.setItem( 'rn_attr', JSON.stringify( attr ) );
		} catch ( e ) {}
	}() );

	/* ---------- Outils ---------- */

	function post( path, body, headers ) {
		var opts = { method: 'POST', body: body, credentials: 'same-origin', headers: headers || {} };
		return fetch( cfg.rest + path, opts ).then( function ( r ) {
			return r.json().catch( function () {
				return {};
			} ).then( function ( j ) {
				return { ok: r.ok && j && j.ok !== false, data: j || {} };
			} );
		} );
	}

	function showMsg( el, text, type ) {
		if ( ! el ) {
			return;
		}
		el.className = 'rn-alert' + ( type ? ' rn-alert--' + type : '' );
		el.textContent = text;
		el.hidden = ! text;
	}

	function fieldErrors( form, fields ) {
		$$( '[data-rn-err]', form ).forEach( function ( el ) {
			el.hidden = true;
			el.textContent = '';
		} );
		Object.keys( fields || {} ).forEach( function ( k ) {
			var el = $( '[data-rn-err="' + k + '"]', form );
			if ( el ) {
				el.textContent = fields[ k ];
				el.hidden = false;
			}
		} );
	}

	function busy( btn, on ) {
		if ( btn ) {
			btn.disabled = on;
			btn.classList.toggle( 'is-loading', on );
		}
	}

	/* ---------- Catalogue ---------- */

	function initCatalog( wrap ) {
		var input = $( '[data-rn-catalog-input]' );
		var status = $( '[data-rn-catalog-status]' );
		var empty = $( '[data-rn-catalog-empty]' );
		var freeLink = $( '[data-rn-catalog-free]' );
		var filters = $$( '[data-rn-filter]' );
		var groups = $$( '[data-rn-group]', wrap );
		var cards = $$( '[data-rn-item]', wrap );
		var current = '';
		var logTimer = null;

		function apply() {
			var q = input ? input.value.trim() : '';
			var matches = null;
			if ( q ) {
				matches = {};
				S.query( q, 60 ).results.forEach( function ( r, i ) {
					matches[ r.item.id ] = { rank: i, hint: r.hint };
				} );
			}
			var visible = 0;
			groups.forEach( function ( g ) {
				var inCat = ! current || g.getAttribute( 'data-rn-group' ) === current;
				var shown = 0;
				$$( '[data-rn-item]', g ).forEach( function ( c ) {
					var id = c.getAttribute( 'data-rn-item' );
					var ok = inCat && ( ! matches || matches[ id ] );
					c.hidden = ! ok;
					var hintEl = $( '[data-rn-hint]', c );
					if ( hintEl ) {
						var h = matches && matches[ id ] && matches[ id ].hint;
						hintEl.textContent = h ? 'Correspond à « ' + h + ' »' : '';
						hintEl.hidden = ! h;
					}
					c.style.order = matches && matches[ id ] ? matches[ id ].rank : '';
					if ( ok ) {
						shown++;
					}
				} );
				g.hidden = ! shown;
				visible += shown;
			} );
			empty.hidden = visible > 0;
			if ( freeLink && q ) {
				freeLink.href = cfg.formUrl + ( cfg.formUrl.indexOf( '?' ) === -1 ? '?' : '&' ) + 'q=' + encodeURIComponent( q );
			}
			status.textContent = q || current ? visible + ( visible > 1 ? ' types de travaux' : ' type de travaux' ) : '';
			clearTimeout( logTimer );
			if ( q.length >= 3 ) {
				logTimer = setTimeout( function () {
					S.log( q, visible, 0, 0, 'catalog' );
				}, 1800 );
			}
		}

		filters.forEach( function ( b ) {
			b.addEventListener( 'click', function () {
				current = b.getAttribute( 'data-rn-filter' );
				filters.forEach( function ( x ) {
					x.classList.toggle( 'is-active', x === b );
					x.setAttribute( 'aria-pressed', x === b ? 'true' : 'false' );
				} );
				apply();
			} );
		} );
		if ( input ) {
			input.addEventListener( 'input', apply );
		}
		cards.forEach( function ( c ) {
			c.addEventListener( 'click', function () {
				var q = input ? input.value.trim() : '';
				if ( q ) {
					S.log( q, $$( '[data-rn-item]:not([hidden])', wrap ).length, 0, +c.getAttribute( 'data-rn-item' ), 'catalog' );
				}
			} );
		} );
		var hash = window.location.hash.replace( '#cat-', '' );
		if ( hash ) {
			var btn = $( '[data-rn-filter="' + hash + '"]' );
			if ( btn ) {
				btn.click();
			}
		}
	}

	/* ---------- Espace client ---------- */

	function initPortalLogin( form ) {
		form.addEventListener( 'submit', function ( e ) {
			e.preventDefault();
			var msg = $( '[data-rn-msg]', form );
			var btn = $( 'button[type=submit]', form );
			var email = form.elements.email.value.trim();
			if ( ! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( email ) ) {
				showMsg( msg, 'Indiquez une adresse e-mail valide.', 'error' );
				return;
			}
			busy( btn, true );
			var fd = new FormData();
			fd.append( 'email', email );
			post( 'portal/login', fd ).then( function ( res ) {
				busy( btn, false );
				showMsg( msg, res.data.message || 'Une erreur est survenue.', res.ok ? 'success' : 'error' );
			} );
		} );
	}

	function initPortal( wrap ) {
		var csrf = wrap.getAttribute( 'data-csrf' );
		var ref = wrap.getAttribute( 'data-ref' );
		var msgBox = $( '[data-rn-portal-msg]', wrap );

		$$( '[data-rn-accept]', wrap ).forEach( function ( b ) {
			b.addEventListener( 'click', function () {
				var ok = window.confirm( 'Confirmez-vous le choix du devis de ' + b.getAttribute( 'data-company' ) + ' (' + b.getAttribute( 'data-amount' ) + ') ?\nLes autres artisans seront informés que leur offre n’a pas été retenue.' );
				if ( ! ok ) {
					return;
				}
				busy( b, true );
				var fd = new FormData();
				fd.append( 'ref', ref );
				fd.append( 'quote', b.getAttribute( 'data-rn-accept' ) );
				post( 'portal/accept', fd, { 'X-RN-Portal': csrf } ).then( function ( res ) {
					busy( b, false );
					showMsg( msgBox, res.data.message || 'Une erreur est survenue.', res.ok ? 'success' : 'error' );
					msgBox.scrollIntoView( { behavior: 'smooth', block: 'center' } );
					if ( res.ok ) {
						setTimeout( function () {
							window.location.reload();
						}, 1800 );
					}
				} );
			} );
		} );

		var form = $( '[data-rn-portal-message]', wrap );
		if ( form ) {
			var fileInput = $( 'input[type=file]', form );
			var label = $( '[data-rn-file-label]', form );
			fileInput.addEventListener( 'change', function () {
				label.textContent = fileInput.files.length ? fileInput.files.length + ' fichier(s)' : 'Joindre';
			} );
			form.addEventListener( 'submit', function ( e ) {
				e.preventDefault();
				var btn = $( 'button[type=submit]', form );
				var fd = new FormData( form );
				fd.append( 'ref', ref );
				if ( ! form.elements.message.value.trim() && ! fileInput.files.length ) {
					form.elements.message.focus();
					return;
				}
				busy( btn, true );
				post( 'portal/message', fd, { 'X-RN-Portal': csrf } ).then( function ( res ) {
					busy( btn, false );
					if ( res.ok ) {
						window.location.hash = 'rn-messages';
						window.location.reload();
					} else {
						showMsg( msgBox, res.data.message || 'Une erreur est survenue.', 'error' );
					}
				} );
			} );
		}
	}

	/* ---------- Espace artisan ---------- */

	function initArtisan( wrap ) {
		var token = wrap.getAttribute( 'data-token' );
		var form = $( '[data-rn-quote-form]', wrap );
		if ( form ) {
			form.addEventListener( 'submit', function ( e ) {
				e.preventDefault();
				var btn = $( 'button[type=submit]', form );
				var msg = $( '[data-rn-msg]', form );
				var fd = new FormData( form );
				fd.append( 'token', token );
				busy( btn, true );
				post( 'artisan/quote', fd ).then( function ( res ) {
					busy( btn, false );
					var fields = res.data.data && res.data.data.fields;
					var text = res.data.message || 'Une erreur est survenue.';
					if ( fields ) {
						text += ' ' + Object.keys( fields ).map( function ( k ) {
							return fields[ k ];
						} ).join( ' ' );
					}
					showMsg( msg, text, res.ok ? 'success' : 'error' );
					if ( res.ok ) {
						setTimeout( function () {
							window.location.reload();
						}, 2000 );
					}
				} );
			} );
		}
		var decline = $( '[data-rn-decline-form]', wrap );
		if ( decline ) {
			decline.addEventListener( 'submit', function ( e ) {
				e.preventDefault();
				var fd = new FormData( decline );
				fd.append( 'token', token );
				var btn = $( 'button[type=submit]', decline );
				busy( btn, true );
				post( 'artisan/decline', fd ).then( function ( res ) {
					busy( btn, false );
					window.alert( res.data.message || 'Une erreur est survenue.' );
					if ( res.ok ) {
						window.location.reload();
					}
				} );
			} );
		}
	}

	/* ---------- Candidature artisan ---------- */

	function initPartner( form ) {
		var filter = $( '[data-rn-trade-filter]', form );
		if ( filter ) {
			filter.addEventListener( 'input', function () {
				var q = S.normalize( filter.value );
				$$( '[data-rn-trade]', form ).forEach( function ( l ) {
					var hay = S.normalize( l.getAttribute( 'data-rn-trade' ) );
					l.hidden = q && hay.indexOf( q ) === -1 && ! l.querySelector( 'input' ).checked;
				} );
				$$( '.rn-trades__group', form ).forEach( function ( g ) {
					g.hidden = ! $$( '[data-rn-trade]:not([hidden])', g ).length;
				} );
			} );
		}
		form.addEventListener( 'submit', function ( e ) {
			e.preventDefault();
			var btn = $( 'button[type=submit]', form );
			var msg = $( '[data-rn-msg]', form );
			busy( btn, true );
			post( 'partners', new FormData( form ) ).then( function ( res ) {
				busy( btn, false );
				fieldErrors( form, res.data.data && res.data.data.fields );
				showMsg( msg, res.data.message || 'Une erreur est survenue.', res.ok ? 'success' : 'error' );
				if ( res.ok ) {
					form.reset();
					$$( '.rn-stack > :not([data-rn-msg])', form ).forEach( function ( el ) {
						if ( el !== msg ) {
							el.hidden = true;
						}
					} );
					msg.scrollIntoView( { behavior: 'smooth', block: 'center' } );
				}
			} );
		} );
	}

	function boot() {
		var catalog = $( '[data-rn-catalog]' );
		if ( catalog && S ) {
			initCatalog( catalog );
		}
		$$( '[data-rn-portal-login]' ).forEach( initPortalLogin );
		$$( '[data-rn-portal]' ).forEach( initPortal );
		$$( '[data-rn-artisan]' ).forEach( initArtisan );
		$$( '[data-rn-partner-form]' ).forEach( initPartner );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', boot );
	} else {
		boot();
	}
}() );
