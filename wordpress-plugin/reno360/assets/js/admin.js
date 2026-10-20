/*!
 * Reno360 — interactions du back-office.
 */
( function () {
	'use strict';

	var cfg = window.RENO360_ADMIN || {};

	function $( sel, ctx ) {
		return ( ctx || document ).querySelector( sel );
	}
	function $$( sel, ctx ) {
		return Array.prototype.slice.call( ( ctx || document ).querySelectorAll( sel ) );
	}
	function esc( s ) {
		return String( s == null ? '' : s ).replace( /[&<>"']/g, function ( c ) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ c ];
		} );
	}
	function norm( s ) {
		return String( s || '' ).normalize( 'NFD' ).replace( /[̀-ͯ]/g, '' ).toLowerCase().replace( /[^a-z0-9]+/g, ' ' ).trim();
	}
	function api( path, opts ) {
		opts = opts || {};
		opts.headers = Object.assign( { 'X-WP-Nonce': cfg.nonce }, opts.headers || {} );
		opts.credentials = 'same-origin';
		return fetch( cfg.rest + path, opts ).then( function ( r ) {
			return r.json().then( function ( j ) {
				return { ok: r.ok, data: j };
			} );
		} );
	}

	/* ---------- Confirmations ---------- */

	document.addEventListener( 'click', function ( e ) {
		var el = e.target.closest( '[data-rn-confirm]' );
		if ( el && ! window.confirm( el.getAttribute( 'data-rn-confirm' ) ) ) {
			e.preventDefault();
			e.stopPropagation();
		}
	}, true );

	$$( '[data-rn-bulk]' ).forEach( function ( btn ) {
		btn.addEventListener( 'click', function ( e ) {
			var form = btn.form;
			var op = form.elements.bulk_action ? form.elements.bulk_action.value : '';
			var n = $$( 'input[name="ids[]"]:checked', form ).length;
			if ( ! op || ! n ) {
				e.preventDefault();
				window.alert( 'Sélectionnez au moins un élément et une action.' );
				return;
			}
			if ( op === 'delete' && ! window.confirm( 'Supprimer définitivement ' + n + ' élément(s) ?' ) ) {
				e.preventDefault();
			}
		} );
	} );

	/* ---------- Copier ---------- */

	$$( '[data-rn-copy]' ).forEach( function ( b ) {
		b.addEventListener( 'click', function () {
			var text = b.getAttribute( 'data-rn-copy' );
			var done = function () {
				var old = b.textContent;
				b.textContent = 'Copié !';
				setTimeout( function () {
					b.textContent = old;
				}, 1500 );
			};
			if ( navigator.clipboard ) {
				navigator.clipboard.writeText( text ).then( done );
			} else {
				window.prompt( 'Copiez :', text );
			}
		} );
	} );

	/* ---------- Kanban ---------- */

	var board = $( '[data-rn-kanban]' );
	if ( board ) {
		var dragged = null;
		var dragging = false;
		board.addEventListener( 'dragstart', function ( e ) {
			var card = e.target.closest( '.rn-kcard' );
			if ( ! card ) {
				return;
			}
			dragged = card;
			dragging = true;
			card.classList.add( 'is-dragging' );
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData( 'text/plain', card.getAttribute( 'data-id' ) );
		} );
		board.addEventListener( 'dragend', function () {
			if ( dragged ) {
				dragged.classList.remove( 'is-dragging' );
			}
			$$( '.rn-kcol.is-over', board ).forEach( function ( c ) {
				c.classList.remove( 'is-over' );
			} );
			setTimeout( function () {
				dragging = false;
			}, 50 );
		} );
		board.addEventListener( 'click', function ( e ) {
			if ( dragging && e.target.closest( '.rn-kcard' ) ) {
				e.preventDefault();
			}
		} );
		$$( '.rn-kcol', board ).forEach( function ( col ) {
			col.addEventListener( 'dragover', function ( e ) {
				if ( dragged ) {
					e.preventDefault();
					col.classList.add( 'is-over' );
				}
			} );
			col.addEventListener( 'dragleave', function ( e ) {
				if ( ! col.contains( e.relatedTarget ) ) {
					col.classList.remove( 'is-over' );
				}
			} );
			col.addEventListener( 'drop', function ( e ) {
				e.preventDefault();
				col.classList.remove( 'is-over' );
				if ( ! dragged ) {
					return;
				}
				var from = dragged.closest( '.rn-kcol' );
				var status = col.getAttribute( 'data-status' );
				if ( from === col ) {
					return;
				}
				var card = dragged;
				var list = $( '[data-rn-drop]', col );
				list.insertBefore( card, list.firstChild );
				updateCount( from, -1 );
				updateCount( col, 1 );
				card.classList.add( 'is-saving' );
				var fd = new FormData();
				fd.append( 'id', card.getAttribute( 'data-id' ) );
				fd.append( 'status', status );
				api( 'admin/status', { method: 'POST', body: fd } ).then( function ( res ) {
					card.classList.remove( 'is-saving' );
					if ( ! res.ok ) {
						$( '[data-rn-drop]', from ).insertBefore( card, $( '[data-rn-drop]', from ).firstChild );
						updateCount( from, 1 );
						updateCount( col, -1 );
						window.alert( ( res.data && res.data.message ) || 'Le statut n’a pas pu être modifié.' );
					} else {
						card.classList.add( 'is-saved' );
						setTimeout( function () {
							card.classList.remove( 'is-saved' );
						}, 1200 );
					}
				} ).catch( function () {
					card.classList.remove( 'is-saving' );
					window.alert( 'Connexion impossible.' );
				} );
			} );
		} );
		function updateCount( col, delta ) {
			var el = $( '[data-rn-count]', col );
			if ( el ) {
				el.textContent = Math.max( 0, parseInt( el.textContent, 10 ) + delta );
			}
		}
	}

	/* ---------- Éditeur de mots-clés ---------- */

	var kwEditor = $( '[data-rn-kw-editor]' );
	if ( kwEditor ) {
		var raw = $( '[data-rn-kw-raw]' );
		var chips = $( '[data-rn-kw-chips]', kwEditor );
		var input = $( '[data-rn-kw-input]', kwEditor );
		var count = $( '[data-rn-kw-count]' );
		var list = raw.value.split( /\n/ ).map( function ( s ) {
			return s.trim();
		} ).filter( Boolean );
		raw.hidden = true;

		var render = function () {
			chips.innerHTML = list.map( function ( k, i ) {
				return '<span class="rn-kw rn-kw--edit">' + esc( k ) + '<button type="button" data-i="' + i + '" aria-label="Retirer ' + esc( k ) + '">×</button></span>';
			} ).join( '' );
			raw.value = list.join( '\n' );
			if ( count ) {
				count.textContent = list.length;
			}
		};
		var add = function ( text ) {
			text.split( /[,;\n|]+/ ).forEach( function ( t ) {
				t = t.trim().toLowerCase().replace( /\s+/g, ' ' );
				if ( ! t ) {
					return;
				}
				var n = norm( t );
				if ( list.some( function ( k ) {
					return norm( k ) === n;
				} ) ) {
					return;
				}
				list.push( t );
			} );
			render();
		};
		input.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'Enter' || e.key === ',' || e.key === ';' ) {
				e.preventDefault();
				add( input.value );
				input.value = '';
			} else if ( e.key === 'Backspace' && ! input.value && list.length ) {
				list.pop();
				render();
			}
		} );
		input.addEventListener( 'blur', function () {
			if ( input.value.trim() ) {
				add( input.value );
				input.value = '';
			}
		} );
		input.addEventListener( 'paste', function ( e ) {
			var text = ( e.clipboardData || window.clipboardData ).getData( 'text' );
			if ( /[,;\n|]/.test( text ) ) {
				e.preventDefault();
				add( text );
			}
		} );
		chips.addEventListener( 'click', function ( e ) {
			var b = e.target.closest( 'button[data-i]' );
			if ( b ) {
				list.splice( +b.getAttribute( 'data-i' ), 1 );
				render();
			}
		} );
		kwEditor.addEventListener( 'click', function ( e ) {
			if ( e.target === kwEditor || e.target === chips ) {
				input.focus();
			}
		} );
		$$( '[data-rn-kw-add]' ).forEach( function ( b ) {
			b.addEventListener( 'click', function () {
				add( b.getAttribute( 'data-rn-kw-add' ) );
				b.disabled = true;
				b.classList.add( 'is-added' );
			} );
		} );
		var sort = $( '[data-rn-kw-sort]' );
		if ( sort ) {
			sort.addEventListener( 'click', function () {
				list.sort( function ( a, b ) {
					return norm( a ) < norm( b ) ? -1 : 1;
				} );
				render();
			} );
		}
		var form = kwEditor.closest( 'form' );
		if ( form ) {
			form.addEventListener( 'submit', function () {
				if ( input.value.trim() ) {
					add( input.value );
				}
			} );
		}
		render();
	}

	/* ---------- Répéteurs (questions, prix, FAQ) ---------- */

	$$( '[data-rn-repeater]' ).forEach( function ( rep ) {
		var rows = $( '[data-rn-rows]', rep );
		var tpl = $( 'template[data-rn-template]', rep );
		var counter = Date.now();
		$( '[data-rn-add]', rep ).addEventListener( 'click', function () {
			var html = tpl.innerHTML.replace( /__i__/g, 'n' + ( counter++ ) );
			rows.insertAdjacentHTML( 'beforeend', html );
			var first = rows.lastElementChild && $( 'input, textarea', rows.lastElementChild );
			if ( first ) {
				first.focus();
			}
		} );
		rows.addEventListener( 'click', function ( e ) {
			var row = e.target.closest( '[data-rn-row]' );
			if ( ! row ) {
				return;
			}
			if ( e.target.closest( '[data-rn-remove]' ) ) {
				row.remove();
			} else if ( e.target.closest( '[data-rn-up]' ) && row.previousElementSibling ) {
				rows.insertBefore( row, row.previousElementSibling );
			} else if ( e.target.closest( '[data-rn-down]' ) && row.nextElementSibling ) {
				rows.insertBefore( row.nextElementSibling, row );
			}
		} );
	} );

	/* ---------- Médiathèque ---------- */

	$$( '[data-rn-media]' ).forEach( function ( box ) {
		var idInput = $( '[data-rn-media-id]', box );
		var preview = $( '[data-rn-media-preview]', box );
		var frame = null;
		$( '[data-rn-media-pick]', box ).addEventListener( 'click', function () {
			if ( ! window.wp || ! wp.media ) {
				return;
			}
			if ( ! frame ) {
				frame = wp.media( { title: 'Choisir une image', button: { text: 'Utiliser cette image' }, library: { type: 'image' }, multiple: false } );
				frame.on( 'select', function () {
					var a = frame.state().get( 'selection' ).first().toJSON();
					idInput.value = a.id;
					var url = ( a.sizes && a.sizes.medium ) ? a.sizes.medium.url : a.url;
					preview.innerHTML = '<img src="' + esc( url ) + '" alt="">';
				} );
			}
			frame.open();
		} );
		$( '[data-rn-media-clear]', box ).addEventListener( 'click', function () {
			idInput.value = 0;
			preview.innerHTML = '<span class="rn-muted">Image par défaut</span>';
		} );
	} );

	/* ---------- Testeur de recherche ---------- */

	$$( '[data-rn-tester]' ).forEach( function ( box ) {
		var input = $( '[data-rn-tester-input]', box );
		var out = $( '[data-rn-tester-results]', box );
		var timer = null;
		var seq = 0;
		input.addEventListener( 'input', function () {
			clearTimeout( timer );
			timer = setTimeout( function () {
				var q = input.value.trim();
				var my = ++seq;
				if ( ! q ) {
					out.innerHTML = '';
					return;
				}
				api( 'admin/search-test?q=' + encodeURIComponent( q ), { method: 'GET' } ).then( function ( res ) {
					if ( my !== seq ) {
						return;
					}
					var items = ( res.data && res.data.results ) || [];
					var toks = ( res.data && res.data.tokens ) || [];
					if ( ! items.length ) {
						out.innerHTML = '<li class="rn-tester__empty">Aucun résultat' + ( toks.length ? ' pour : <code>' + esc( toks.join( ' ' ) ) + '</code>' : ' (que des mots vides)' ) + '. Ajoutez un mot-clé au bon type de travaux.</li>';
						return;
					}
					out.innerHTML = items.map( function ( r ) {
						return '<li><a href="admin.php?page=reno360-activities&edit=' + r.id + '"><strong>' + esc( r.name ) + '</strong></a><span class="rn-tester__score">' + r.score + '</span>' +
							'<small>' + esc( r.cat || '' ) + ( r.hint ? ' · via « ' + esc( r.hint ) + ' »' : '' ) + '</small></li>';
					} ).join( '' ) + '<li class="rn-tester__tokens">Mots analysés : <code>' + esc( toks.join( ' ' ) ) + '</code></li>';
				} );
			}, 180 );
		} );
	} );

	/* ---------- Composeur d'activité (fiche demande) ---------- */

	var composer = $( '[data-rn-composer]' );
	if ( composer ) {
		var textarea = $( 'textarea[name="content"]', composer );
		var hint = $( '[data-rn-hint]', composer );
		var placeholders = JSON.parse( textarea.getAttribute( 'data-rn-placeholders' ) || '{}' );
		var hints = {
			note: 'Visible uniquement par votre équipe.',
			message: 'Visible dans l’espace du client, qui est prévenu par e-mail.',
			email: 'Envoyé au client avec la mise en page de vos e-mails.',
			call: 'Enregistré dans l’historique (interne).',
		};
		var sync = function () {
			var c = $( 'input[name="type"]:checked', composer );
			var type = c ? c.value : 'note';
			$$( '[data-rn-for]', composer ).forEach( function ( el ) {
				el.hidden = el.getAttribute( 'data-rn-for' ) !== type;
			} );
			textarea.placeholder = placeholders[ type ] || '';
			hint.textContent = hints[ type ] || '';
		};
		composer.addEventListener( 'change', sync );
		sync();
		$$( '[data-rn-tab-open]' ).forEach( function ( a ) {
			a.addEventListener( 'click', function () {
				var r = $( 'input[name="type"][value="' + a.getAttribute( 'data-rn-tab-open' ) + '"]', composer );
				if ( r ) {
					r.checked = true;
					sync();
					setTimeout( function () {
						textarea.focus();
					}, 50 );
				}
			} );
		} );
	}

	/* ---------- Filtre des métiers (fiche artisan) ---------- */

	var tradeFilter = $( '[data-rn-trade-filter]' );
	if ( tradeFilter ) {
		var tradeBox = $( '[data-rn-trades]' );
		var tradeCount = $( '[data-rn-trade-count]' );
		tradeFilter.addEventListener( 'input', function () {
			var q = norm( tradeFilter.value );
			$$( '[data-rn-trade]', tradeBox ).forEach( function ( l ) {
				l.hidden = q && norm( l.getAttribute( 'data-rn-trade' ) ).indexOf( q ) === -1;
			} );
			$$( 'fieldset', tradeBox ).forEach( function ( f ) {
				f.hidden = ! $$( '[data-rn-trade]:not([hidden])', f ).length;
			} );
		} );
		tradeBox.addEventListener( 'change', function () {
			if ( tradeCount ) {
				tradeCount.textContent = $$( 'input:checked', tradeBox ).length;
			}
		} );
	}
}() );
