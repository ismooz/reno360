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

	/* ---------- En-tête : panneau « Travaux » et menu mobile ---------- */

	function initHeader( header ) {
		var megaBtn = $( '[data-rn-mega-toggle]', header );
		var mega = $( '[data-rn-mega]', header );
		var mnavBtn = $( '[data-rn-mnav-toggle]', header );
		var mnav = $( '[data-rn-mnav]', header );
		var menuLabel = mnavBtn ? mnavBtn.textContent : '';

		function setMega( open ) {
			if ( ! mega ) {
				return;
			}
			mega.hidden = ! open;
			megaBtn.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
		}
		function setMnav( open ) {
			if ( ! mnav ) {
				return;
			}
			mnav.hidden = ! open;
			mnavBtn.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
			mnavBtn.textContent = open ? ( mnavBtn.getAttribute( 'data-label-open' ) || 'Fermer' ) : menuLabel;
		}
		if ( megaBtn ) {
			megaBtn.addEventListener( 'click', function () {
				setMega( mega.hidden );
			} );
		}
		if ( mnavBtn ) {
			mnavBtn.addEventListener( 'click', function () {
				setMnav( mnav.hidden );
			} );
		}
		document.addEventListener( 'click', function ( e ) {
			if ( mega && ! mega.hidden && ! mega.contains( e.target ) && ! megaBtn.contains( e.target ) ) {
				setMega( false );
			}
		} );
		document.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'Escape' && mega && ! mega.hidden ) {
				setMega( false );
				megaBtn.focus();
			}
		} );
		$$( 'a', header ).forEach( function ( a ) {
			a.addEventListener( 'click', function () {
				setMega( false );
				setMnav( false );
			} );
		} );
	}

	/* ---------- Catalogue intégré (accueil) ---------- */

	function initBrowser( wrap ) {
		var input = $( '[data-rn-browser-input]', wrap );
		var tabs = $$( '[data-rn-browser-tab]', wrap );
		var items = $$( '[data-rn-browser-item]', wrap );
		var title = $( '[data-rn-browser-title]', wrap );
		var count = $( '[data-rn-browser-count]', wrap );
		var empty = $( '[data-rn-browser-empty]', wrap );
		var free = $( '[data-rn-browser-free]', wrap );
		var current = tabs.length ? tabs[ 0 ].getAttribute( 'data-rn-browser-tab' ) : '';
		var logTimer = null;

		function plural( n ) {
			return n + ' type' + ( n > 1 ? 's' : '' );
		}
		function label( it, searching ) {
			var el = $( '.rn-browser__item-cat', it );
			el.textContent = searching ? el.getAttribute( 'data-cat-name' ) : 'Demander un devis';
		}
		function showCategory() {
			var n = 0;
			items.forEach( function ( it ) {
				var on = it.getAttribute( 'data-cat' ) === current;
				it.hidden = ! on;
				it.style.order = '';
				label( it, false );
				n += on ? 1 : 0;
			} );
			tabs.forEach( function ( t ) {
				var on = t.getAttribute( 'data-rn-browser-tab' ) === current;
				t.setAttribute( 'aria-selected', on ? 'true' : 'false' );
				if ( on ) {
					title.textContent = t.getAttribute( 'data-name' );
				}
			} );
			count.textContent = plural( n );
			empty.hidden = true;
		}
		function showSearch( q ) {
			var res = S.query( q, 60 ).results;
			var rank = {};
			res.forEach( function ( r, i ) {
				rank[ r.item.id ] = i;
			} );
			items.forEach( function ( it ) {
				var id = it.getAttribute( 'data-rn-browser-item' );
				var on = Object.prototype.hasOwnProperty.call( rank, id );
				it.hidden = ! on;
				it.style.order = on ? rank[ id ] : '';
				label( it, true );
			} );
			tabs.forEach( function ( t ) {
				t.setAttribute( 'aria-selected', 'false' );
			} );
			title.textContent = 'Résultats pour « ' + q + ' »';
			count.textContent = plural( res.length );
			empty.hidden = res.length > 0;
			if ( free ) {
				free.setAttribute( 'data-q', q );
			}
			clearTimeout( logTimer );
			logTimer = setTimeout( function () {
				S.log( q, res.length, res.length ? res[ 0 ].item.id : 0, 0, 'catalogue-accueil' );
			}, 1500 );
		}
		function apply() {
			var q = input.value.trim();
			if ( q.length > 1 && S ) {
				S.ensureIndex().then( function () {
					showSearch( q );
				} );
			} else {
				showCategory();
			}
		}
		tabs.forEach( function ( t ) {
			t.addEventListener( 'click', function () {
				current = t.getAttribute( 'data-rn-browser-tab' );
				input.value = '';
				showCategory();
			} );
		} );
		if ( input ) {
			input.addEventListener( 'input', apply );
		}
		showCategory();
	}

	/* ---------- Simulateur de subventions ---------- */

	function initSimulator( wrap ) {
		var picked = {};
		var pending = $( '[data-rn-sim-pending]', wrap );
		var result = $( '[data-rn-sim-result]', wrap );
		var cta = $( '[data-rn-sim-cta]', wrap );
		var names = { canton: 'le canton', type: 'le type de travaux', year: 'l’année de construction' };
		var hasCanton = !! $( '[data-rn-sim-opt="canton"]', wrap );

		function refresh() {
			var keys = hasCanton ? [ 'canton', 'type', 'year' ] : [ 'type', 'year' ];
			var missing = keys.filter( function ( k ) {
				return ! picked[ k ];
			} );
			if ( missing.length ) {
				var list = missing.map( function ( k ) {
					return names[ k ];
				} );
				var txt = list.length > 1 ? list.slice( 0, -1 ).join( ', ' ) + ' et ' + list[ list.length - 1 ] : list[ 0 ];
				pending.textContent = 'Indiquez ' + txt + ' pour obtenir une orientation.';
				pending.hidden = false;
				result.hidden = true;
				return;
			}
			var where = picked.canton ? ' ' + picked.canton.getAttribute( 'data-where' ) : '';
			var type = picked.type;
			var slug = type.getAttribute( 'data-slug' );
			var t = 'Projet potentiellement subventionnable';
			var body = 'Des aides (Programme Bâtiments, canton ou commune) peuvent s’appliquer aux travaux « ' + type.getAttribute( 'data-name' ) + ' »' + where + '. Un conseiller confirme l’éligibilité et prépare le dossier avec vous.';
			if ( /audit/.test( slug ) ) {
				t = 'Une première étape recommandée';
				body = 'Le CECB® est souvent demandé pour accéder aux aides' + where + '. Votre conseiller vous oriente vers un expert certifié.';
			} else if ( picked.year.getAttribute( 'data-value' ) === 'new' && /isolation/.test( slug ) ) {
				t = 'Éligibilité à confirmer';
				body = 'Pour un bâtiment récent, les aides à l’isolation sont souvent plus limitées' + where + '. Un conseiller vérifie votre situation.';
			}
			$( '[data-rn-sim-title]', wrap ).textContent = t;
			$( '[data-rn-sim-body]', wrap ).textContent = body;
			cta.setAttribute( 'data-rn-quote', type.getAttribute( 'data-value' ) );
			pending.hidden = true;
			result.hidden = false;
		}
		$$( '[data-rn-sim-opt]', wrap ).forEach( function ( b ) {
			b.addEventListener( 'click', function () {
				var k = b.getAttribute( 'data-rn-sim-opt' );
				$$( '[data-rn-sim-opt="' + k + '"]', wrap ).forEach( function ( o ) {
					o.setAttribute( 'aria-pressed', o === b ? 'true' : 'false' );
				} );
				picked[ k ] = b;
				refresh();
			} );
		} );
	}

	/* ---------- Demande rapide (fenêtre en 3 étapes) ---------- */

	function initQuoteModal( root ) {
		var form = $( '[data-rn-qm-form]', root );
		var listEl = $( '[data-rn-qm-list]', root );
		var listLabel = $( '[data-rn-qm-list-label]', root );
		var search = $( '[data-rn-qm-search]', root );
		var freeBox = $( '[data-rn-qm-free]', root );
		var nextBtn = $( '[data-rn-qm-next]', root );
		var backBtn = $( '[data-rn-qm-back]', root );
		var note = $( '[data-rn-qm-note]', root );
		var errBox = $( '[data-rn-qm-error]', root );
		var fileInput = $( '[data-rn-qm-files]', root );
		var popular = [];
		try {
			popular = JSON.parse( root.getAttribute( 'data-popular' ) || '[]' );
		} catch ( e ) {}
		var requirePhone = root.getAttribute( 'data-require-phone' ) === '1';
		var maxFiles = parseInt( root.getAttribute( 'data-max-files' ), 10 ) || 10;
		var titles = [ 'Quels travaux ?', 'Votre projet', 'Vos coordonnées', 'Demande envoyée' ];
		var nextLabels = [ 'Continuer', 'Continuer', 'Envoyer ma demande', 'Terminer' ];
		var stepToField = { activity: 1, property_type: 2, start_wish: 2, description: 2, photos: 2 };
		var step = 1;
		var svcName = '';
		var opener = null;
		var sending = false;

		function field( name ) {
			return form.elements[ name ];
		}
		function setErr( name, text ) {
			var el = $( '[data-rn-qm-err="' + name + '"]', root );
			if ( el ) {
				el.textContent = text || '';
				el.hidden = ! text;
			}
			var input = field( name );
			if ( input && input.setAttribute ) {
				if ( text ) {
					input.setAttribute( 'aria-invalid', 'true' );
				} else {
					input.removeAttribute( 'aria-invalid' );
				}
			}
		}
		function canGo() {
			if ( step === 1 ) {
				return !! ( field( 'activity_id' ).value || field( 'q' ).value );
			}
			if ( step === 2 ) {
				return !! ( field( 'property_type' ).value && field( 'start_wish' ).value );
			}
			if ( step === 3 ) {
				var phone = field( 'phone' ).value.replace( /\D/g, '' );
				return !! ( field( 'first_name' ).value.trim() && field( 'last_name' ).value.trim() &&
					/^\S+@\S+\.\S+$/.test( field( 'email' ).value.trim() ) &&
					/^[1-9]\d{3}$/.test( field( 'npa' ).value.trim() ) &&
					( ! requirePhone || phone.length >= 9 ) && ( ! field( 'phone' ).value || phone.length >= 9 ) &&
					field( 'consent' ).checked );
			}
			return true;
		}
		function refreshNext() {
			nextBtn.setAttribute( 'aria-disabled', canGo() ? 'false' : 'true' );
		}
		function show( n ) {
			step = n;
			$$( '[data-rn-qm-step]', root ).forEach( function ( s ) {
				s.hidden = +s.getAttribute( 'data-rn-qm-step' ) !== n;
			} );
			$$( '.rn-qm__bars span', root ).forEach( function ( b, i ) {
				b.classList.toggle( 'is-on', n >= i + 1 );
			} );
			$( '[data-rn-qm-label]', root ).textContent = n < 4 ? 'Étape ' + n + ' sur 3' : 'Confirmation';
			var title = $( '[data-rn-qm-title]', root );
			title.textContent = titles[ n - 1 ];
			nextBtn.textContent = nextLabels[ n - 1 ];
			backBtn.hidden = n === 1 || n === 4;
			note.hidden = ! backBtn.hidden;
			$$( '[data-rn-qm-svc]', root ).forEach( function ( el ) {
				el.textContent = svcName;
			} );
			errBox.hidden = true;
			refreshNext();
			title.focus();
		}
		function renderList() {
			var q = search.value.trim();
			var items = [];
			if ( q.length > 1 ) {
				items = S.query( q, 12 ).results.map( function ( r ) {
					return r.item;
				} );
				listLabel.textContent = items.length + ' résultat' + ( items.length > 1 ? 's' : '' );
			} else {
				items = popular.map( function ( id ) {
					return S.byId( id );
				} ).filter( Boolean );
				listLabel.textContent = 'Les plus demandés';
			}
			var current = field( 'activity_id' ).value;
			listEl.innerHTML = items.map( function ( it ) {
				return '<button type="button" class="rn-qm__svc-btn" data-id="' + it.id + '" aria-pressed="' + ( String( it.id ) === current ? 'true' : 'false' ) + '"><strong>' + S.esc( it.name ) + '</strong><small>' + S.esc( it.cat || '' ) + '</small></button>';
			} ).join( '' );
			freeBox.hidden = ! ( q.length > 1 && ! items.length );
			$( '[data-rn-qm-free-q]', root ).textContent = q;
		}
		function pick( id ) {
			var it = S.byId( id );
			if ( ! it ) {
				return false;
			}
			field( 'activity_id' ).value = it.id;
			field( 'q' ).value = '';
			svcName = it.name;
			return true;
		}
		function reset() {
			form.reset();
			[ 'activity_id', 'q', 'property_type', 'start_wish' ].forEach( function ( k ) {
				field( k ).value = '';
			} );
			$$( '[data-rn-qm-opt]', root ).forEach( function ( o ) {
				o.setAttribute( 'aria-pressed', 'false' );
			} );
			$( '[data-rn-qm-files-label]', root ).textContent = 'Ajouter des photos ou plans (facultatif)';
			svcName = '';
		}
		function open( opts ) {
			opts = opts || {};
			opener = document.activeElement;
			if ( step === 4 ) {
				reset();
			}
			root.hidden = false;
			document.documentElement.classList.add( 'rn-qm-open' );
			if ( opts.npa && /^\d{4}$/.test( opts.npa ) ) {
				field( 'npa' ).value = opts.npa;
			}
			S.ensureIndex().then( function () {
				if ( opts.id && pick( opts.id ) ) {
					show( 2 );
					return;
				}
				search.value = opts.q || '';
				renderList();
				show( 1 );
				if ( ! field( 'activity_id' ).value ) {
					search.focus();
				}
			} );
		}
		function close() {
			root.hidden = true;
			document.documentElement.classList.remove( 'rn-qm-open' );
			if ( step === 4 ) {
				reset();
				step = 1;
			}
			if ( opener && opener.focus ) {
				opener.focus();
			}
		}
		function submit() {
			if ( sending ) {
				return;
			}
			sending = true;
			nextBtn.classList.add( 'is-loading' );
			var fd = new FormData( form );
			try {
				var a = JSON.parse( window.sessionStorage.getItem( 'rn_attr' ) || '{}' );
				Object.keys( a ).forEach( function ( k ) {
					fd.append( k, a[ k ] );
				} );
			} catch ( e ) {}
			post( 'requests', fd ).then( function ( res ) {
				sending = false;
				nextBtn.classList.remove( 'is-loading' );
				var fields = ( res.data.data && res.data.data.fields ) || {};
				[ 'first_name', 'last_name', 'email', 'phone', 'npa', 'city', 'consent', 'description' ].forEach( function ( k ) {
					setErr( k, fields[ k ] || '' );
				} );
				if ( ! res.ok ) {
					var first = Object.keys( fields )[ 0 ];
					if ( first && stepToField[ first ] ) {
						show( stepToField[ first ] );
					}
					errBox.textContent = res.data.message || 'Une erreur est survenue. Merci de réessayer.';
					errBox.hidden = false;
					return;
				}
				$( '[data-rn-qm-name]', root ).textContent = field( 'first_name' ).value.trim();
				$( '[data-rn-qm-email]', root ).textContent = field( 'email' ).value.trim();
				var recap = [ field( 'property_type' ).value, field( 'start_wish' ).value, ( field( 'npa' ).value + ' ' + field( 'city' ).value ).trim() ].filter( Boolean );
				$( '[data-rn-qm-recap]', root ).textContent = recap.join( ' · ' );
				if ( res.data.portal_url ) {
					$( '[data-rn-qm-portal]', root ).href = res.data.portal_url;
				}
				show( 4 );
				if ( window.dataLayer ) {
					window.dataLayer.push( { event: 'reno360_request', reno360_ref: res.data.ref, reno360_activity: svcName, reno360_mode: 'quick' } );
				}
			} ).catch( function () {
				sending = false;
				nextBtn.classList.remove( 'is-loading' );
				errBox.textContent = 'Connexion impossible. Vérifiez votre connexion internet et réessayez.';
				errBox.hidden = false;
			} );
		}

		listEl.addEventListener( 'click', function ( e ) {
			var b = e.target.closest( '[data-id]' );
			if ( b && pick( b.getAttribute( 'data-id' ) ) ) {
				show( 2 );
			}
		} );
		search.addEventListener( 'input', function () {
			S.ensureIndex().then( renderList );
		} );
		search.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'Enter' ) {
				e.preventDefault();
				var first = $( '[data-id]', listEl );
				if ( first && search.value.trim().length > 1 ) {
					first.click();
				}
			}
		} );
		$( '[data-rn-qm-free-btn]', root ).addEventListener( 'click', function () {
			field( 'activity_id' ).value = '';
			field( 'q' ).value = search.value.trim();
			svcName = search.value.trim();
			show( 2 );
		} );
		$$( '[data-rn-qm-opt]', root ).forEach( function ( b ) {
			b.addEventListener( 'click', function () {
				var k = b.getAttribute( 'data-rn-qm-opt' );
				$$( '[data-rn-qm-opt="' + k + '"]', root ).forEach( function ( o ) {
					o.setAttribute( 'aria-pressed', o === b ? 'true' : 'false' );
				} );
				field( k ).value = b.getAttribute( 'data-value' );
				refreshNext();
			} );
		} );
		$$( '[data-rn-qm-goto]', root ).forEach( function ( b ) {
			b.addEventListener( 'click', function () {
				search.value = '';
				renderList();
				show( +b.getAttribute( 'data-rn-qm-goto' ) );
			} );
		} );
		fileInput.addEventListener( 'change', function () {
			var n = fileInput.files.length;
			var lbl = $( '[data-rn-qm-files-label]', root );
			if ( n > maxFiles ) {
				fileInput.value = '';
				lbl.textContent = 'Maximum ' + maxFiles + ' fichiers. Choisissez à nouveau.';
				return;
			}
			lbl.textContent = n ? n + ' fichier' + ( n > 1 ? 's' : '' ) + ' ajouté' + ( n > 1 ? 's' : '' ) : 'Ajouter des photos ou plans (facultatif)';
		} );
		form.addEventListener( 'input', function ( e ) {
			if ( e.target.name ) {
				setErr( e.target.name, '' );
			}
			if ( e.target.name === 'npa' ) {
				e.target.value = e.target.value.replace( /\D/g, '' ).slice( 0, 4 );
			}
			refreshNext();
		} );
		form.addEventListener( 'change', refreshNext );
		form.addEventListener( 'submit', function ( e ) {
			e.preventDefault();
		} );
		nextBtn.addEventListener( 'click', function () {
			if ( step === 4 ) {
				close();
				return;
			}
			if ( ! canGo() ) {
				if ( step === 3 ) {
					var f = field( 'email' ).value.trim();
					if ( f && ! /^\S+@\S+\.\S+$/.test( f ) ) {
						setErr( 'email', 'Indiquez une adresse e-mail valide.' );
					}
					if ( field( 'npa' ).value && ! /^[1-9]\d{3}$/.test( field( 'npa' ).value ) ) {
						setErr( 'npa', 'Indiquez un NPA suisse à 4 chiffres.' );
					}
				}
				return;
			}
			if ( step === 3 ) {
				submit();
				return;
			}
			show( step + 1 );
		} );
		backBtn.addEventListener( 'click', function () {
			if ( step > 1 ) {
				if ( step === 2 ) {
					renderList();
				}
				show( step - 1 );
			}
		} );
		$$( '[data-rn-qm-close]', root ).forEach( function ( b ) {
			b.addEventListener( 'click', close );
		} );
		root.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'Escape' ) {
				close();
			}
			if ( e.key === 'Tab' ) {
				var focusables = $$( 'button:not([hidden]), input:not([type="hidden"]), textarea, a[href]', root ).filter( function ( el ) {
					return el.offsetParent !== null;
				} );
				if ( ! focusables.length ) {
					return;
				}
				var firstEl = focusables[ 0 ];
				var lastEl = focusables[ focusables.length - 1 ];
				if ( e.shiftKey && document.activeElement === firstEl ) {
					e.preventDefault();
					lastEl.focus();
				} else if ( ! e.shiftKey && document.activeElement === lastEl ) {
					e.preventDefault();
					firstEl.focus();
				}
			}
		} );

		window.Reno360Quote = { open: open, close: close };

		// Tous les liens « Demander un devis » ouvrent la fenêtre (sans JavaScript : formulaire complet).
		document.addEventListener( 'click', function ( e ) {
			var a = e.target.closest( '[data-rn-quote]' );
			if ( ! a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey ) {
				return;
			}
			// Sur la page du formulaire complet, les liens y mènent directement.
			if ( $( '[data-rn-wizard]' ) ) {
				return;
			}
			var id = a.getAttribute( 'data-rn-quote' ) || '';
			var def = id ? null : $( '[data-rn-quote-default]' );
			e.preventDefault();
			open( { id: id || ( def ? def.getAttribute( 'data-rn-quote-default' ) : '' ), q: a.getAttribute( 'data-q' ) || '' } );
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
		$$( '[data-rn-header]' ).forEach( initHeader );
		if ( S ) {
			$$( '[data-rn-browser]' ).forEach( initBrowser );
			var qm = $( '[data-rn-qm]' );
			if ( qm ) {
				initQuoteModal( qm );
			}
		}
		$$( '[data-rn-sim]' ).forEach( initSimulator );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', boot );
	} else {
		boot();
	}
}() );
