/*!
 * Reno360 — formulaire de demande de devis en 5 étapes.
 */
( function () {
	'use strict';

	var cfg = window.RENO360 || {};
	var fcfg = window.RENO360_FORM || {};
	var S = window.Reno360Search;
	var DRAFT_KEY = 'rn_request_draft_v1';

	function $( sel, ctx ) {
		return ( ctx || document ).querySelector( sel );
	}
	function $$( sel, ctx ) {
		return Array.prototype.slice.call( ( ctx || document ).querySelectorAll( sel ) );
	}
	function esc( s ) {
		return S.esc( s );
	}

	function init( root ) {
		var form = $( '[data-rn-wizard-form]', root );
		if ( ! form ) {
			return;
		}
		var steps = $$( '.rn-wstep', form );
		var total = steps.length;
		var state = { step: 1, activity: null, free: '', files: [], answers: {} };
		var params = new URLSearchParams( window.location.search );

		var grid = $( '[data-rn-grid]', form );
		var allBox = $( '[data-rn-all]', form );
		var qBox = $( '[data-rn-questions]', form );
		var summary = $( '[data-rn-summary]', root );
		var errBox = $( '[data-rn-error]', form );
		var searchBox = $( '.rn-wsearch', form );
		var searchInput = $( '[data-rn-search-input]', searchBox );
		var freeBox = $( '[data-rn-free]', form );

		/* ---------- Étape 1 : choix des travaux ---------- */

		function tile( item ) {
			var sel = state.activity && String( state.activity.id ) === String( item.id );
			return '<button type="button" class="rn-choice' + ( sel ? ' is-selected' : '' ) + '" aria-pressed="' + ( sel ? 'true' : 'false' ) + '" data-id="' + esc( item.id ) + '">' +
				S.icon( item.icon, 28 ) + '<span>' + esc( item.name ) + '</span></button>';
		}

		function renderGrid() {
			var items = S.popular( 12 ).map( function ( r ) {
				return r.item;
			} );
			if ( state.activity && ! items.some( function ( i ) {
				return String( i.id ) === String( state.activity.id );
			} ) ) {
				items.unshift( state.activity );
			}
			grid.innerHTML = items.map( tile ).join( '' );
		}

		function renderAll() {
			var groups = {};
			var order = [];
			( cfg.index.items || [] ).forEach( function ( it ) {
				var c = it.cat || 'Autres';
				if ( ! groups[ c ] ) {
					groups[ c ] = [];
					order.push( c );
				}
				groups[ c ].push( it );
			} );
			allBox.innerHTML = order.map( function ( c ) {
				return '<div class="rn-all-acts__group"><strong>' + esc( c ) + '</strong><div class="rn-all-acts__list">' +
					groups[ c ].map( function ( it ) {
						var sel = state.activity && String( state.activity.id ) === String( it.id );
						return '<button type="button" class="rn-chip' + ( sel ? ' is-selected' : '' ) + '" data-id="' + esc( it.id ) + '" aria-pressed="' + ( sel ? 'true' : 'false' ) + '">' + esc( it.name ) + '</button>';
					} ).join( '' ) + '</div></div>';
			} ).join( '' );
		}

		function selectActivity( item, advance ) {
			state.activity = item;
			state.free = '';
			form.elements.activity_id.value = item ? item.id : '';
			form.elements.q.value = '';
			freeBox.hidden = true;
			renderGrid();
			if ( ! allBox.hidden ) {
				renderAll();
			}
			renderQuestions();
			setError( 'activity', '' );
			updateSummary();
			save();
			if ( advance ) {
				go( 2 );
			}
		}

		root.addEventListener( 'click', function ( e ) {
			var b = e.target.closest( '[data-id]' );
			if ( b && form.contains( b ) && ( b.classList.contains( 'rn-choice' ) || b.classList.contains( 'rn-chip' ) ) ) {
				var item = S.byId( b.getAttribute( 'data-id' ) );
				if ( item ) {
					selectActivity( item, true );
				}
			}
		} );

		$( '[data-rn-show-all]', form ).addEventListener( 'click', function () {
			allBox.hidden = ! allBox.hidden;
			this.setAttribute( 'aria-expanded', allBox.hidden ? 'false' : 'true' );
			if ( ! allBox.hidden ) {
				renderAll();
			}
		} );

		if ( searchBox ) {
			S.attach( searchBox );
			searchBox.addEventListener( 'rn:select', function ( e ) {
				selectActivity( e.detail, true );
			} );
			searchInput.addEventListener( 'input', function () {
				var v = searchInput.value.trim();
				var res = v.length >= 3 ? S.query( v, 3 ).results : [];
				freeBox.hidden = ! ( v.length >= 3 && ! res.length );
				$( '[data-rn-free-text]', freeBox ).textContent = v;
			} );
		}
		$( '[data-rn-use-free]', form ).addEventListener( 'click', function () {
			state.activity = null;
			state.free = searchInput.value.trim();
			form.elements.activity_id.value = '';
			form.elements.q.value = state.free;
			renderGrid();
			renderQuestions();
			updateSummary();
			go( 2 );
		} );

		/* ---------- Étape 2 : questions spécifiques ---------- */

		function questionsFor() {
			if ( state.activity && fcfg.questions && fcfg.questions[ state.activity.id ] && fcfg.questions[ state.activity.id ].length ) {
				return fcfg.questions[ state.activity.id ];
			}
			return fcfg.defaults || [];
		}

		function renderQuestions() {
			var qs = questionsFor();
			$( '[data-rn-act-name]', form ).textContent = state.activity ? state.activity.name : ( state.free || 'travaux' );
			qBox.innerHTML = qs.map( function ( q, i ) {
				var name = 'qa_' + i;
				var prev = state.answers[ q.label ];
				var html = '<fieldset class="rn-opts rn-mb" data-label="' + esc( q.label ) + '" data-type="' + esc( q.type ) + '">' +
					'<legend class="rn-label">' + esc( q.label ) + ( q.type === 'multiple' ? ' <span class="rn-help-inline">(plusieurs choix possibles)</span>' : '' ) + '</legend>';
				if ( q.type === 'text' ) {
					html += '<input class="rn-input" type="text" name="' + name + '" value="' + esc( prev || '' ) + '">';
				} else {
					html += '<div class="rn-pills">' + q.options.map( function ( o ) {
						var checked = q.type === 'multiple' ? ( Array.isArray( prev ) && prev.indexOf( o ) !== -1 ) : prev === o;
						return '<label class="rn-pill-opt"><input type="' + ( q.type === 'multiple' ? 'checkbox' : 'radio' ) + '" name="' + name + '" value="' + esc( o ) + '"' + ( checked ? ' checked' : '' ) + '><span>' + esc( o ) + '</span></label>';
					} ).join( '' ) + '</div>';
				}
				return html + '</fieldset>';
			} ).join( '' );
		}

		function collectAnswers() {
			var out = [];
			state.answers = {};
			$$( 'fieldset[data-label]', qBox ).forEach( function ( fs ) {
				var label = fs.getAttribute( 'data-label' );
				var type = fs.getAttribute( 'data-type' );
				var value;
				if ( type === 'text' ) {
					value = ( $( 'input', fs ).value || '' ).trim();
				} else if ( type === 'multiple' ) {
					value = $$( 'input:checked', fs ).map( function ( i ) {
						return i.value;
					} );
				} else {
					var c = $( 'input:checked', fs );
					value = c ? c.value : '';
				}
				state.answers[ label ] = value;
				if ( value && ( ! Array.isArray( value ) || value.length ) ) {
					out.push( { label: label, value: value } );
				}
			} );
			form.elements.answers.value = JSON.stringify( out );
			return out;
		}
		qBox.addEventListener( 'change', function () {
			collectAnswers();
			updateSummary();
			save();
		} );

		/* ---------- Étape 3 : fichiers ---------- */

		var fileInput = $( '[data-rn-files]', form );
		var thumbs = $( '[data-rn-thumbs]', form );
		var drop = $( '[data-rn-drop]', form );

		function addFiles( list ) {
			var max = fcfg.maxFiles || 10;
			var maxBytes = ( fcfg.maxFileMb || 10 ) * 1024 * 1024;
			var errors = [];
			Array.prototype.forEach.call( list, function ( f ) {
				if ( state.files.length >= max ) {
					errors.push( 'Maximum ' + max + ' fichiers.' );
					return;
				}
				if ( f.size > maxBytes ) {
					errors.push( '« ' + f.name + ' » dépasse ' + fcfg.maxFileMb + ' Mo.' );
					return;
				}
				if ( ! /^image\//.test( f.type ) && f.type !== 'application/pdf' && ! /\.(heic|heif|pdf)$/i.test( f.name ) ) {
					errors.push( '« ' + f.name + ' » : format non accepté.' );
					return;
				}
				state.files.push( f );
			} );
			setError( 'photos', errors.length ? errors.filter( function ( v, i, a ) {
				return a.indexOf( v ) === i;
			} ).join( ' ' ) : '' );
			renderThumbs();
			updateSummary();
		}

		function renderThumbs() {
			thumbs.innerHTML = '';
			state.files.forEach( function ( f, i ) {
				var li = document.createElement( 'li' );
				li.className = 'rn-thumb';
				if ( /^image\/(jpe?g|png|gif|webp)$/.test( f.type ) && window.URL ) {
					var img = document.createElement( 'img' );
					img.alt = '';
					img.src = URL.createObjectURL( f );
					img.onload = function () {
						URL.revokeObjectURL( img.src );
					};
					li.appendChild( img );
				} else {
					li.insertAdjacentHTML( 'beforeend', '<span class="rn-thumb__file">' + S.icon( 'file', 28 ) + '</span>' );
				}
				li.insertAdjacentHTML( 'beforeend', '<span class="rn-thumb__name">' + esc( f.name ) + '</span><button type="button" class="rn-thumb__del" aria-label="Retirer ' + esc( f.name ) + '" data-del="' + i + '">' + S.icon( 'x', 16 ) + '</button>' );
				thumbs.appendChild( li );
			} );
		}

		fileInput.addEventListener( 'change', function () {
			addFiles( fileInput.files );
			fileInput.value = '';
		} );
		thumbs.addEventListener( 'click', function ( e ) {
			var b = e.target.closest( '[data-del]' );
			if ( b ) {
				state.files.splice( +b.getAttribute( 'data-del' ), 1 );
				renderThumbs();
				updateSummary();
			}
		} );
		[ 'dragenter', 'dragover' ].forEach( function ( ev ) {
			drop.addEventListener( ev, function ( e ) {
				e.preventDefault();
				drop.classList.add( 'is-over' );
			} );
		} );
		[ 'dragleave', 'drop' ].forEach( function ( ev ) {
			drop.addEventListener( ev, function ( e ) {
				e.preventDefault();
				drop.classList.remove( 'is-over' );
			} );
		} );
		drop.addEventListener( 'drop', function ( e ) {
			if ( e.dataTransfer && e.dataTransfer.files ) {
				addFiles( e.dataTransfer.files );
			}
		} );

		/* ---------- Navigation et validation ---------- */

		var stepFields = { activity: 1, photos: 3, description: 3, npa: 4, city: 4, first_name: 5, last_name: 5, email: 5, phone: 5, consent: 5 };

		function setError( field, msg ) {
			var el = $( '[data-rn-err="' + field + '"]', form );
			var input = form.elements[ field ];
			if ( el ) {
				el.textContent = msg || '';
				el.hidden = ! msg;
				if ( ! el.id ) {
					el.id = 'rn-err-' + field;
				}
			}
			if ( input && input.setAttribute ) {
				if ( msg ) {
					input.setAttribute( 'aria-invalid', 'true' );
					input.setAttribute( 'aria-describedby', 'rn-err-' + field );
				} else {
					input.removeAttribute( 'aria-invalid' );
				}
			}
		}

		function val( name ) {
			var el = form.elements[ name ];
			if ( ! el ) {
				return '';
			}
			if ( el.length && el[ 0 ] && el[ 0 ].type === 'radio' ) {
				var c = $( 'input[name="' + name + '"]:checked', form );
				return c ? c.value : '';
			}
			return ( el.value || '' ).trim();
		}

		function validate( step ) {
			var ok = true;
			function fail( f, m ) {
				setError( f, m );
				if ( ok ) {
					var el = form.elements[ f ];
					if ( el && el.focus ) {
						el.focus();
					}
				}
				ok = false;
			}
			if ( step === 1 ) {
				setError( 'activity', '' );
				if ( ! state.activity && ! state.free ) {
					fail( 'activity', 'Choisissez un type de travaux ou décrivez-le dans le champ de recherche.' );
				}
			}
			if ( step === 3 ) {
				setError( 'description', '' );
				if ( val( 'description' ).length < ( fcfg.minDescription || 15 ) ) {
					fail( 'description', 'Décrivez votre projet en quelques mots (au moins ' + ( fcfg.minDescription || 15 ) + ' caractères).' );
				}
			}
			if ( step === 4 ) {
				[ 'npa', 'city' ].forEach( function ( f ) {
					setError( f, '' );
				} );
				if ( ! /^[1-9]\d{3}$/.test( val( 'npa' ) ) ) {
					fail( 'npa', 'Indiquez un NPA suisse à 4 chiffres.' );
				}
				if ( ! val( 'city' ) ) {
					fail( 'city', 'Indiquez la localité.' );
				}
			}
			if ( step === 5 ) {
				[ 'first_name', 'last_name', 'email', 'phone', 'consent' ].forEach( function ( f ) {
					setError( f, '' );
				} );
				if ( ! val( 'first_name' ) ) {
					fail( 'first_name', 'Indiquez votre prénom.' );
				}
				if ( ! val( 'last_name' ) ) {
					fail( 'last_name', 'Indiquez votre nom.' );
				}
				if ( ! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test( val( 'email' ) ) ) {
					fail( 'email', 'Indiquez une adresse e-mail valide.' );
				}
				var digits = val( 'phone' ).replace( /\D/g, '' );
				if ( ( fcfg.requirePhone || val( 'phone' ) ) && digits.length < 9 ) {
					fail( 'phone', 'Indiquez un numéro de téléphone valide.' );
				}
				if ( ! form.elements.consent.checked ) {
					fail( 'consent', 'Merci d’accepter les conditions pour envoyer votre demande.' );
				}
			}
			return ok;
		}

		function go( n, skipValidation ) {
			n = Math.max( 1, Math.min( total, n ) );
			if ( ! skipValidation && n > state.step ) {
				for ( var s = state.step; s < n; s++ ) {
					if ( ! validate( s ) ) {
						show( s );
						return;
					}
				}
			}
			show( n );
		}

		function show( n ) {
			state.step = n;
			steps.forEach( function ( fs ) {
				fs.hidden = +fs.getAttribute( 'data-step' ) !== n;
			} );
			$( '[data-rn-step-count]', form ).textContent = 'Étape ' + n + ' sur ' + total;
			$( '[data-rn-progress]', root ).style.width = ( n / total * 100 ) + '%';
			$$( '[data-rn-goto]', root ).forEach( function ( b ) {
				var k = +b.getAttribute( 'data-rn-goto' );
				b.parentNode.className = k < n ? 'is-done' : ( k === n ? 'is-current' : '' );
				if ( k === n ) {
					b.setAttribute( 'aria-current', 'step' );
				} else {
					b.removeAttribute( 'aria-current' );
				}
			} );
			$( '[data-rn-back]', form ).hidden = n === 1;
			$( '[data-rn-next]', form ).hidden = n === total;
			$( '[data-rn-submit]', form ).hidden = n !== total;
			$( '[data-rn-free-note]', form ).hidden = n !== 1;
			errBox.hidden = true;
			if ( n === 2 ) {
				collectAnswers();
			}
			var top = root.getBoundingClientRect().top + window.pageYOffset - 90;
			if ( window.pageYOffset > top ) {
				window.scrollTo( { top: top, behavior: 'smooth' } );
			}
			var legend = $( '.rn-wstep[data-step="' + n + '"] legend', form );
			if ( legend ) {
				legend.setAttribute( 'tabindex', '-1' );
				legend.focus( { preventScroll: true } );
			}
			save();
		}

		$( '[data-rn-next]', form ).addEventListener( 'click', function () {
			go( state.step + 1 );
		} );
		$( '[data-rn-back]', form ).addEventListener( 'click', function () {
			go( state.step - 1, true );
		} );
		$$( '[data-rn-goto]', root ).forEach( function ( b ) {
			b.addEventListener( 'click', function () {
				go( +b.getAttribute( 'data-rn-goto' ) );
			} );
		} );

		/* ---------- Résumé ---------- */

		function updateSummary() {
			var rows = [];
			rows.push( [ 'Travaux', state.activity ? state.activity.name : ( state.free ? 'Autre : ' + state.free : '—' ) ] );
			var answers = collectAnswers();
			if ( answers.length ) {
				var a = answers[ 0 ];
				rows.push( [ 'Projet', Array.isArray( a.value ) ? a.value.join( ', ' ) : a.value ] );
			}
			if ( state.files.length ) {
				rows.push( [ 'Fichiers', state.files.length + ( state.files.length > 1 ? ' fichiers' : ' fichier' ) ] );
			}
			if ( val( 'npa' ) || val( 'city' ) ) {
				rows.push( [ 'Lieu', ( val( 'npa' ) + ' ' + val( 'city' ) ).trim() ] );
			}
			if ( val( 'start_wish' ) ) {
				rows.push( [ 'Début', val( 'start_wish' ) ] );
			}
			if ( val( 'budget' ) ) {
				rows.push( [ 'Budget', val( 'budget' ) ] );
			}
			summary.innerHTML = rows.map( function ( r ) {
				return '<div><dt>' + esc( r[ 0 ] ) + '</dt><dd>' + esc( r[ 1 ] ) + '</dd></div>';
			} ).join( '' );
		}
		form.addEventListener( 'change', function () {
			updateSummary();
			save();
		} );
		form.addEventListener( 'input', function ( e ) {
			if ( e.target && e.target.name && e.target.name !== 'answers' ) {
				setError( e.target.name, '' );
			}
		} );

		/* ---------- Brouillon (sans les fichiers) ---------- */

		var draftFields = [ 'description', 'npa', 'city', 'address', 'property_type', 'client_type', 'start_wish', 'budget', 'preferred_date', 'first_name', 'last_name', 'email', 'phone', 'contact_pref', 'contact_time' ];

		function save() {
			try {
				var data = { t: Date.now(), step: state.step, activity: state.activity ? state.activity.id : 0, free: state.free, answers: state.answers, f: {} };
				draftFields.forEach( function ( f ) {
					data.f[ f ] = val( f );
				} );
				window.localStorage.setItem( DRAFT_KEY, JSON.stringify( data ) );
			} catch ( e ) {}
		}

		function setVal( name, v ) {
			var el = form.elements[ name ];
			if ( ! el || v == null || v === '' ) {
				return;
			}
			if ( el.length && el[ 0 ] && el[ 0 ].type === 'radio' ) {
				$$( 'input[name="' + name + '"]', form ).forEach( function ( r ) {
					r.checked = r.value === v;
				} );
			} else {
				el.value = v;
			}
		}

		function restore() {
			var raw = null;
			try {
				raw = window.localStorage.getItem( DRAFT_KEY );
			} catch ( e ) {}
			if ( ! raw ) {
				return false;
			}
			var d;
			try {
				d = JSON.parse( raw );
			} catch ( e ) {
				return false;
			}
			if ( ! d || Date.now() - d.t > 7 * 864e5 ) {
				return false;
			}
			var hasContent = d.activity || d.free || ( d.f && ( d.f.description || d.f.email ) );
			if ( ! hasContent ) {
				return false;
			}
			if ( d.activity ) {
				state.activity = S.byId( d.activity );
			}
			state.free = d.free || '';
			state.answers = d.answers || {};
			Object.keys( d.f || {} ).forEach( function ( k ) {
				setVal( k, d.f[ k ] );
			} );
			form.elements.activity_id.value = state.activity ? state.activity.id : '';
			form.elements.q.value = state.free;
			$( '[data-rn-draft]', form ).hidden = false;
			return d.step || 1;
		}

		$( '[data-rn-clear-draft]', form ).addEventListener( 'click', function () {
			try {
				window.localStorage.removeItem( DRAFT_KEY );
			} catch ( e ) {}
			window.location.href = window.location.pathname;
		} );

		/* ---------- Envoi ---------- */

		form.addEventListener( 'submit', function ( e ) {
			e.preventDefault();
			for ( var s = 1; s <= total; s++ ) {
				if ( ! validate( s ) ) {
					show( s );
					validate( s );
					return;
				}
			}
			collectAnswers();
			var fd = new FormData( form );
			fd.delete( 'photos[]' );
			state.files.forEach( function ( f ) {
				fd.append( 'photos[]', f, f.name );
			} );
			var attr = attribution();
			Object.keys( attr ).forEach( function ( k ) {
				fd.append( k, attr[ k ] );
			} );
			var btn = $( '[data-rn-submit]', form );
			btn.disabled = true;
			btn.classList.add( 'is-loading' );
			errBox.hidden = true;

			fetch( cfg.rest + 'requests', { method: 'POST', body: fd, credentials: 'same-origin' } )
				.then( function ( r ) {
					return r.json().then( function ( j ) {
						return { ok: r.ok, data: j };
					} );
				} )
				.then( function ( res ) {
					btn.disabled = false;
					btn.classList.remove( 'is-loading' );
					if ( ! res.ok || ! res.data.ok ) {
						var d = res.data || {};
						var fields = ( d.data && d.data.fields ) || {};
						var first = 0;
						Object.keys( fields ).forEach( function ( f ) {
							setError( f, fields[ f ] );
							var st = stepFields[ f ] || ( f.indexOf( 'q_' ) === 0 ? 2 : 0 );
							if ( st && ( ! first || st < first ) ) {
								first = st;
							}
						} );
						if ( first ) {
							show( first );
						}
						errBox.textContent = d.message || 'Une erreur est survenue. Merci de réessayer.';
						errBox.hidden = false;
						return;
					}
					try {
						window.localStorage.removeItem( DRAFT_KEY );
					} catch ( err ) {}
					form.hidden = true;
					var done = $( '[data-rn-done]', root );
					$( '[data-rn-done-message]', done ).textContent = res.data.message || '';
					$( '[data-rn-done-ref]', done ).textContent = res.data.ref ? 'Numéro de demande : ' + res.data.ref : '';
					if ( res.data.portal_url ) {
						$( '[data-rn-done-portal]', done ).href = res.data.portal_url;
					}
					done.hidden = false;
					done.focus();
					window.scrollTo( { top: root.getBoundingClientRect().top + window.pageYOffset - 100, behavior: 'smooth' } );
					if ( window.dataLayer ) {
						window.dataLayer.push( { event: 'reno360_request', reno360_ref: res.data.ref, reno360_activity: state.activity ? state.activity.name : 'autre' } );
					}
				} )
				.catch( function () {
					btn.disabled = false;
					btn.classList.remove( 'is-loading' );
					errBox.textContent = 'Connexion impossible. Vérifiez votre connexion internet et réessayez.';
					errBox.hidden = false;
				} );
		} );

		function attribution() {
			var out = {};
			try {
				var a = JSON.parse( window.sessionStorage.getItem( 'rn_attr' ) || '{}' );
				Object.keys( a ).forEach( function ( k ) {
					out[ k ] = a[ k ];
				} );
			} catch ( e ) {}
			return out;
		}

		/* ---------- Initialisation ---------- */

		var start = 1;
		var preset = params.get( 'travail' );
		var restoredStep = preset ? false : restore();
		if ( preset ) {
			var item = S.byId( preset );
			if ( item ) {
				state.activity = item;
				form.elements.activity_id.value = item.id;
				start = 2;
			}
		}
		if ( params.get( 'npa' ) && /^\d{4}$/.test( params.get( 'npa' ) ) ) {
			form.elements.npa.value = params.get( 'npa' );
		}
		if ( params.get( 'annee' ) && ! form.elements.description.value ) {
			form.elements.description.value = 'Année de construction : ' + params.get( 'annee' ) + '. ';
		}
		if ( ! preset && params.get( 'q' ) ) {
			searchInput.value = params.get( 'q' );
			var res = S.query( params.get( 'q' ), 5 ).results;
			if ( res.length && res[ 0 ].score >= 15 && ( res.length === 1 || res[ 0 ].score > res[ 1 ].score * 1.4 ) ) {
				state.activity = res[ 0 ].item;
				form.elements.activity_id.value = state.activity.id;
				start = 2;
			} else if ( ! res.length ) {
				freeBox.hidden = false;
				$( '[data-rn-free-text]', freeBox ).textContent = params.get( 'q' );
			}
		}
		renderGrid();
		renderQuestions();
		updateSummary();
		show( restoredStep && ! preset ? Math.min( restoredStep, state.activity || state.free ? total : 1 ) : start );
		if ( ! preset && params.get( 'q' ) && start === 1 ) {
			S.attach( searchBox ).update();
		}
	}

	function boot() {
		$$( '[data-rn-wizard]' ).forEach( init );
	}
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', boot );
	} else {
		boot();
	}
}() );
