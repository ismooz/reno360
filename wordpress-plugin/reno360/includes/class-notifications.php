<?php
/**
 * E-mails : modèles modifiables, variables et mise en page HTML.
 *
 * @package Reno360
 */

namespace Reno360;

defined( 'ABSPATH' ) || exit;

class Notifications {

	/** @var array|null Expéditeur temporaire pour un envoi. */
	private static $from = null;

	public static function init() {
		add_filter( 'wp_mail_from', array( __CLASS__, 'filter_from' ), 20 );
		add_filter( 'wp_mail_from_name', array( __CLASS__, 'filter_from_name' ), 20 );
	}

	public static function filter_from( $email ) {
		return ( self::$from && ! empty( self::$from['email'] ) ) ? self::$from['email'] : $email;
	}

	public static function filter_from_name( $name ) {
		return ( self::$from && ! empty( self::$from['name'] ) ) ? self::$from['name'] : $name;
	}

	/**
	 * Modèles par défaut.
	 *
	 * @return array
	 */
	public static function defaults() {
		return array(
			'client_confirmation' => array(
				'label'   => 'Client — confirmation de la demande',
				'to'      => 'client',
				'subject' => 'Votre demande {ref} a bien été reçue',
				'body'    => "Bonjour {prenom},\n\nMerci pour votre demande « {travaux} » à {lieu}. Elle porte le numéro {ref}.\n\nUn conseiller {societe} la vérifie et vous contacte sous {delai_reponse} h ouvrées. Il sélectionnera ensuite jusqu’à {max_artisans} artisans vérifiés de votre région.\n\nVous pouvez suivre l’avancement et comparer les devis dans votre espace personnel.",
				'cta'     => array( 'Suivre ma demande', '{lien_espace}' ),
			),
			'admin_new_request'   => array(
				'label'   => 'Équipe — nouvelle demande',
				'to'      => 'admin',
				'subject' => 'Nouvelle demande {ref} — {travaux} à {lieu}',
				'body'    => "Nouvelle demande reçue.\n\nClient : {client}\nE-mail : {email}\nTéléphone : {telephone}\nTravaux : {travaux}\nLieu : {lieu}\nBudget : {budget}\nDébut souhaité : {debut}\n\n{details}\n\nDescription :\n{description}",
				'cta'     => array( 'Ouvrir la demande', '{lien_admin}' ),
			),
			'artisan_lead'        => array(
				'label'   => 'Artisan — nouvelle demande de devis',
				'to'      => 'artisan',
				'subject' => 'Demande de devis {ref} — {travaux} à {lieu}',
				'body'    => "Bonjour,\n\n{societe} vous propose une demande vérifiée qui correspond à vos métiers :\n\nTravaux : {travaux}\nLieu : {lieu}\nBudget : {budget}\nDébut souhaité : {debut}\n\n{details}\n\nDescription du client :\n{description}\n\nConsultez la demande complète (photos et coordonnées) et déposez votre devis en ligne, ou indiquez que vous n’êtes pas disponible.",
				'cta'     => array( 'Voir la demande et répondre', '{lien_artisan}' ),
			),
			'artisan_reminder'    => array(
				'label'   => 'Artisan — rappel devis attendu',
				'to'      => 'artisan',
				'subject' => 'Rappel : devis attendu pour la demande {ref}',
				'body'    => "Bonjour,\n\nLe client attend encore votre devis pour « {travaux} » à {lieu} (demande {ref}).\n\nSi vous n’êtes pas disponible, merci de nous l’indiquer en un clic pour que nous puissions proposer un autre artisan.",
				'cta'     => array( 'Répondre maintenant', '{lien_artisan}' ),
			),
			'artisan_won'         => array(
				'label'   => 'Artisan — devis accepté',
				'to'      => 'artisan',
				'subject' => 'Bonne nouvelle : votre devis pour {ref} est accepté',
				'body'    => "Bonjour,\n\nLe client {client} a accepté votre devis de {montant} pour « {travaux} » à {lieu}.\n\nCoordonnées du client :\n{client}\n{telephone}\n{email}\n{adresse}\n\nMerci de le contacter rapidement pour organiser le chantier.",
				'cta'     => array( 'Voir la demande', '{lien_artisan}' ),
			),
			'artisan_lost'        => array(
				'label'   => 'Artisan — devis non retenu',
				'to'      => 'artisan',
				'subject' => 'Demande {ref} : votre devis n’a pas été retenu',
				'body'    => "Bonjour,\n\nLe client a choisi une autre offre pour « {travaux} » à {lieu} (demande {ref}). Merci pour votre réactivité, nous vous proposerons d’autres demandes prochainement.",
				'cta'     => array(),
			),
			'client_status'       => array(
				'label'   => 'Client — changement de statut',
				'to'      => 'client',
				'subject' => 'Votre demande {ref} : {statut}',
				'body'    => "Bonjour {prenom},\n\nVotre demande « {travaux} » avance : {statut_detail}\n\nRetrouvez tous les détails dans votre espace personnel.",
				'cta'     => array( 'Voir ma demande', '{lien_espace}' ),
			),
			'client_new_quote'    => array(
				'label'   => 'Client — nouveau devis disponible',
				'to'      => 'client',
				'subject' => 'Nouveau devis disponible pour votre demande {ref}',
				'body'    => "Bonjour {prenom},\n\n{entreprise} vous a transmis son devis pour « {travaux} ».\n\nComparez les offres côte à côte dans votre espace personnel. Votre conseiller reste à disposition pour vous aider à choisir.",
				'cta'     => array( 'Comparer les devis', '{lien_espace}' ),
			),
			'client_choose'       => array(
				'label'   => 'Client — rappel pour choisir un devis',
				'to'      => 'client',
				'subject' => 'Avez-vous pu comparer vos devis ?',
				'body'    => "Bonjour {prenom},\n\nVos devis pour « {travaux} » sont disponibles depuis quelques jours. Avez-vous besoin d’aide pour faire votre choix ? Répondez simplement à cet e-mail, nous vous aidons volontiers.",
				'cta'     => array( 'Comparer les devis', '{lien_espace}' ),
			),
			'client_review'       => array(
				'label'   => 'Client — demande d’avis',
				'to'      => 'client',
				'subject' => 'Votre avis compte pour nous',
				'body'    => "Bonjour {prenom},\n\nVotre chantier « {travaux} » est terminé. Nous espérons que tout s’est bien passé !\n\nVotre avis aide d’autres propriétaires à se lancer et nous permet de suivre la qualité de nos partenaires. Cela prend une minute.",
				'cta'     => array( 'Laisser un avis', '{lien_avis}' ),
			),
			'client_login'        => array(
				'label'   => 'Client — lien de connexion à l’espace',
				'to'      => 'client',
				'subject' => 'Votre lien d’accès à votre espace {societe}',
				'body'    => "Bonjour,\n\nVoici votre lien personnel pour accéder à vos demandes. Il est valable 7 jours.\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez simplement cet e-mail.",
				'cta'     => array( 'Accéder à mon espace', '{lien_espace}' ),
			),
			'client_message'      => array(
				'label'   => 'Client — nouveau message du conseiller',
				'to'      => 'client',
				'subject' => 'Nouveau message concernant votre demande {ref}',
				'body'    => "Bonjour {prenom},\n\n{message}",
				'cta'     => array( 'Répondre dans mon espace', '{lien_espace}' ),
			),
			'admin_message'       => array(
				'label'   => 'Équipe — message d’un client',
				'to'      => 'admin',
				'subject' => 'Message du client — {ref} ({client})',
				'body'    => "{client} a écrit au sujet de la demande {ref} :\n\n{message}",
				'cta'     => array( 'Ouvrir la demande', '{lien_admin}' ),
			),
			'admin_quote'         => array(
				'label'   => 'Équipe — devis déposé par un artisan',
				'to'      => 'admin',
				'subject' => 'Devis reçu — {ref} ({entreprise}, {montant})',
				'body'    => "{entreprise} a déposé son devis pour la demande {ref} ({travaux} à {lieu}) : {montant}.",
				'cta'     => array( 'Ouvrir la demande', '{lien_admin}' ),
			),
			'admin_accepted'      => array(
				'label'   => 'Équipe — devis accepté par le client',
				'to'      => 'admin',
				'subject' => 'Devis accepté — {ref} ({entreprise}, {montant})',
				'body'    => "{client} a accepté le devis de {entreprise} ({montant}) pour « {travaux} ».",
				'cta'     => array( 'Ouvrir la demande', '{lien_admin}' ),
			),
			'admin_decline'       => array(
				'label'   => 'Équipe — artisan indisponible',
				'to'      => 'admin',
				'subject' => 'Artisan indisponible — {ref} ({entreprise})',
				'body'    => "{entreprise} ne peut pas faire d’offre pour la demande {ref}.\n\nMotif : {message}\n\nPensez à proposer un autre artisan.",
				'cta'     => array( 'Ouvrir la demande', '{lien_admin}' ),
			),
			'admin_unhandled'     => array(
				'label'   => 'Équipe — demande non traitée',
				'to'      => 'admin',
				'subject' => 'Demande non traitée depuis {heures} h — {ref}',
				'body'    => "La demande {ref} ({travaux} à {lieu}) attend toujours une prise en charge.",
				'cta'     => array( 'Traiter la demande', '{lien_admin}' ),
			),
			'partner_ack'         => array(
				'label'   => 'Artisan — candidature reçue',
				'to'      => 'artisan',
				'subject' => 'Votre demande de partenariat {societe}',
				'body'    => "Bonjour,\n\nMerci pour l’intérêt que vous portez à {societe}. Nous vérifions votre dossier (registre du commerce, assurance RC Pro, références) et revenons vers vous rapidement.",
				'cta'     => array(),
			),
			'partner_welcome'     => array(
				'label'   => 'Artisan — candidature validée',
				'to'      => 'artisan',
				'subject' => 'Bienvenue parmi les partenaires {societe}',
				'body'    => "Bonjour,\n\nVotre entreprise {entreprise} est désormais partenaire de {societe}. Vous recevrez par e-mail les demandes vérifiées correspondant à vos métiers et à votre zone, avec un lien pour déposer vos devis en ligne.",
				'cta'     => array(),
			),
			'admin_partner'       => array(
				'label'   => 'Équipe — nouvelle candidature artisan',
				'to'      => 'admin',
				'subject' => 'Nouvelle candidature artisan — {entreprise}',
				'body'    => "{entreprise} souhaite devenir partenaire.\n\nContact : {contact}\nE-mail : {email_artisan}\nTéléphone : {telephone_artisan}\nMétiers : {metiers}",
				'cta'     => array( 'Examiner la candidature', '{lien_admin_artisan}' ),
			),
			'admin_docs'          => array(
				'label'   => 'Équipe — documents d’artisan à renouveler',
				'to'      => 'admin',
				'subject' => 'Documents à renouveler — {entreprise}',
				'body'    => "L’attestation RC Pro de {entreprise} expire le {echeance}. Pensez à demander le nouveau document.",
				'cta'     => array( 'Voir l’artisan', '{lien_admin_artisan}' ),
			),
			'custom'              => array(
				'label'   => 'E-mail libre au client (depuis une demande)',
				'to'      => 'client',
				'subject' => '{sujet}',
				'body'    => "Bonjour {prenom},\n\n{message}",
				'cta'     => array( 'Voir ma demande', '{lien_espace}' ),
			),
		);
	}

	/**
	 * Modèle (personnalisations des réglages incluses).
	 *
	 * @param string $key Clé.
	 * @return array|null
	 */
	public static function template( $key ) {
		$defaults = self::defaults();
		if ( ! isset( $defaults[ $key ] ) ) {
			return null;
		}
		$t      = $defaults[ $key ];
		$custom = (array) Settings::get( 'emails', array() );
		if ( isset( $custom[ $key ] ) && is_array( $custom[ $key ] ) ) {
			foreach ( array( 'subject', 'body' ) as $k ) {
				if ( isset( $custom[ $key ][ $k ] ) && '' !== trim( $custom[ $key ][ $k ] ) ) {
					$t[ $k ] = $custom[ $key ][ $k ];
				}
			}
			$t['enabled'] = ! isset( $custom[ $key ]['enabled'] ) || (bool) $custom[ $key ]['enabled'];
		} else {
			$t['enabled'] = true;
		}
		return $t;
	}

	public static function placeholders() {
		return array(
			'{ref}', '{prenom}', '{nom}', '{client}', '{email}', '{telephone}', '{adresse}', '{travaux}', '{lieu}', '{budget}', '{debut}', '{details}', '{description}',
			'{statut}', '{statut_detail}', '{entreprise}', '{montant}', '{lien_espace}', '{lien_artisan}', '{lien_admin}', '{lien_avis}', '{message}',
			'{societe}', '{telephone_societe}', '{email_societe}', '{max_artisans}', '{delai_reponse}',
		);
	}

	/* ------------------------------------------------------------------ */
	/* Variables                                                          */
	/* ------------------------------------------------------------------ */

	public static function base_vars() {
		return array(
			'societe'           => Settings::get( 'company', 'Reno360' ),
			'telephone_societe' => Settings::get( 'phone', '' ),
			'email_societe'     => Settings::get( 'public_email', '' ),
			'max_artisans'      => (string) (int) Settings::get( 'max_artisans', 3 ),
			'delai_reponse'     => (string) (int) Settings::get( 'sla_hours', 24 ),
			'lien_avis'         => Settings::get( 'review_url', '' ) ? Settings::get( 'review_url' ) : home_url( '/' ),
		);
	}

	/**
	 * Variables d'une demande.
	 *
	 * @param array $r Demande.
	 * @return array
	 */
	public static function request_vars( array $r ) {
		$details = array();
		foreach ( (array) $r['answers'] as $ans ) {
			if ( ! empty( $ans['label'] ) && '' !== (string) $ans['value'] ) {
				$details[] = $ans['label'] . ' : ' . ( is_array( $ans['value'] ) ? implode( ', ', $ans['value'] ) : $ans['value'] );
			}
		}
		foreach ( array( 'property_type' => 'Type de bien', 'client_type' => 'Statut du client' ) as $k => $label ) {
			if ( ! empty( $r[ $k ] ) ) {
				$details[] = $label . ' : ' . $r[ $k ];
			}
		}
		$statuses = Util::statuses();
		$detail   = array(
			'qualifiee' => 'un conseiller a vérifié votre demande.',
			'envoyee'   => 'nous avons sélectionné des artisans vérifiés de votre région. Ils vont vous contacter pour préparer leur devis.',
			'devis'     => 'vos devis sont disponibles. Comparez-les dans votre espace.',
			'acceptee'  => 'vous avez accepté un devis. L’artisan va vous contacter pour organiser le chantier.',
			'travaux'   => 'les travaux ont commencé.',
			'terminee'  => 'les travaux sont terminés. Merci pour votre confiance !',
			'perdue'    => 'votre demande a été clôturée.',
		);
		return array_merge(
			self::base_vars(),
			array(
				'ref'           => $r['ref'],
				'prenom'        => $r['first_name'],
				'nom'           => $r['last_name'],
				'client'        => $r['name'],
				'email'         => $r['email'],
				'telephone'     => $r['phone'],
				'adresse'       => trim( $r['address'] . ', ' . $r['place'], ', ' ),
				'travaux'       => $r['activity_name'] ? $r['activity_name'] : 'Travaux',
				'lieu'          => $r['place'],
				'budget'        => $r['budget'] ? $r['budget'] : 'non précisé',
				'debut'         => $r['start_wish'] ? $r['start_wish'] : 'non précisé',
				'details'       => implode( "\n", $details ),
				'description'   => (string) $r['description'],
				'statut'        => isset( $statuses[ $r['status'] ] ) ? $statuses[ $r['status'] ]['client'] : $r['status'],
				'statut_detail' => isset( $detail[ $r['status'] ] ) ? $detail[ $r['status'] ] : '',
				'lien_espace'   => $r['email'] ? Portal::link( $r['email'], $r['ref'] ) : Settings::page_url( 'portal' ),
				'lien_admin'    => Util::admin_url( 'reno360-requests', array( 'view' => $r['id'] ) ),
			)
		);
	}

	public static function quote_vars( array $q ) {
		$r    = Requests::get( $q['request_id'] );
		$vars = $r ? self::request_vars( $r ) : self::base_vars();
		return array_merge(
			$vars,
			array(
				'entreprise'   => $q['company'],
				'montant'      => Util::chf( $q['amount'] ),
				'lien_artisan' => Quotes::artisan_link( $q ),
			)
		);
	}

	public static function artisan_vars( array $a ) {
		return array_merge(
			self::base_vars(),
			array(
				'entreprise'         => $a['company'],
				'contact'            => $a['contact_name'],
				'email_artisan'      => $a['email'],
				'telephone_artisan'  => $a['phone'],
				'metiers'            => implode( ', ', $a['trade_names'] ),
				'echeance'           => $a['rc_expiry'] ? Util::date( $a['rc_expiry'] ) : '',
				'lien_admin_artisan' => Util::admin_url( 'reno360-artisans', array( 'edit' => $a['id'] ) ),
			)
		);
	}

	/* ------------------------------------------------------------------ */
	/* Envoi                                                              */
	/* ------------------------------------------------------------------ */

	public static function render( $text, array $vars ) {
		$map = array();
		foreach ( $vars as $k => $v ) {
			$map[ '{' . $k . '}' ] = (string) $v;
		}
		return strtr( (string) $text, $map );
	}

	/**
	 * Envoie un e-mail d'après un modèle.
	 *
	 * @param string|string[] $to         Destinataire(s).
	 * @param string          $key        Modèle.
	 * @param array           $vars       Variables.
	 * @param array           $opts       request_id (journal), reply_to.
	 * @return bool
	 */
	public static function send( $to, $key, array $vars, array $opts = array() ) {
		$t = self::template( $key );
		if ( ! $t || empty( $t['enabled'] ) ) {
			return false;
		}
		$to = array_filter( (array) $to, 'is_email' );
		if ( ! $to ) {
			return false;
		}
		$subject = wp_strip_all_tags( self::render( $t['subject'], $vars ) );
		$body    = self::render( $t['body'], $vars );
		$cta     = array();
		if ( ! empty( $t['cta'][0] ) ) {
			$url = self::render( $t['cta'][1], $vars );
			if ( $url && filter_var( $url, FILTER_VALIDATE_URL ) ) {
				$cta = array( $t['cta'][0], $url );
			}
		}
		$html    = self::layout( $subject, $body, $cta );
		$headers = array( 'Content-Type: text/html; charset=UTF-8' );
		$reply   = ! empty( $opts['reply_to'] ) ? $opts['reply_to'] : Settings::get( 'public_email', '' );
		if ( $reply && is_email( $reply ) ) {
			$headers[] = 'Reply-To: ' . $reply;
		}
		self::$from = array(
			'email' => is_email( Settings::get( 'from_email', '' ) ) ? Settings::get( 'from_email' ) : '',
			'name'  => Settings::get( 'from_name', '' ),
		);
		$sent       = wp_mail( $to, $subject, $html, $headers );
		self::$from = null;

		if ( ! empty( $opts['request_id'] ) ) {
			Events::add(
				$opts['request_id'],
				'email',
				( $sent ? 'E-mail envoyé' : 'Échec d’envoi de l’e-mail' ) . ' à ' . implode( ', ', $to ) . ' : « ' . $subject . ' »',
				array(
					'author_type' => is_user_logged_in() ? 'admin' : 'system',
					'meta'        => array( 'template' => $key ),
				)
			);
		}
		return $sent;
	}

	/**
	 * Mise en page HTML compatible avec les clients de messagerie.
	 *
	 * @param string $title Titre (sujet).
	 * @param string $body  Texte (retours à la ligne conservés).
	 * @param array  $cta   [libellé, url].
	 * @return string
	 */
	public static function layout( $title, $body, array $cta = array() ) {
		$color   = sanitize_hex_color( Settings::get( 'primary_color', '#187A3E' ) ) ?: '#187A3E';
		$company = esc_html( Settings::get( 'company', 'Reno360' ) );
		$logo    = esc_url( Settings::logo_url() );
		$content = wpautop( make_clickable( esc_html( $body ) ) );
		$button  = '';
		if ( $cta ) {
			$button = '<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 8px"><tr><td style="border-radius:10px;background:' . esc_attr( $color ) . '"><a href="' . esc_url( $cta[1] ) . '" style="display:inline-block;padding:14px 24px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;font-family:Arial,Helvetica,sans-serif">' . esc_html( $cta[0] ) . '</a></td></tr></table>';
		}
		$footer = array_filter(
			array(
				$company,
				esc_html( Settings::get( 'address', '' ) ),
				esc_html( Settings::get( 'phone', '' ) ),
				esc_html( Settings::get( 'public_email', '' ) ),
			)
		);
		return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>' . esc_html( $title ) . '</title></head>'
			. '<body style="margin:0;padding:0;background:#F4F6F2;font-family:Arial,Helvetica,sans-serif;color:#0F1D15">'
			. '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F4F6F2"><tr><td align="center" style="padding:28px 12px">'
			. '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px">'
			. '<tr><td style="padding:0 4px 18px"><img src="' . $logo . '" alt="' . $company . '" height="40" style="height:40px;width:auto;display:block"></td></tr>'
			. '<tr><td style="background:#ffffff;border-radius:16px;padding:32px 30px;font-size:16px;line-height:1.55;color:#0F1D15">'
			. '<h1 style="font-size:20px;line-height:1.3;margin:0 0 18px;color:#0F1D15">' . esc_html( $title ) . '</h1>'
			. $content . $button
			. '</td></tr>'
			. '<tr><td style="padding:18px 4px;font-size:13px;line-height:1.5;color:#5E6D63">' . implode( ' · ', $footer ) . '</td></tr>'
			. '</table></td></tr></table></body></html>';
	}

	/* ------------------------------------------------------------------ */
	/* Raccourcis                                                         */
	/* ------------------------------------------------------------------ */

	public static function client_confirmation( array $r ) {
		return self::send( $r['email'], 'client_confirmation', self::request_vars( $r ), array( 'request_id' => $r['id'] ) );
	}

	public static function admin_new_request( array $r ) {
		return self::send( Settings::notify_emails(), 'admin_new_request', self::request_vars( $r ), array( 'reply_to' => $r['email'] ) );
	}

	public static function client_status( $r ) {
		if ( ! $r || ! $r['email'] ) {
			return false;
		}
		return self::send( $r['email'], 'client_status', self::request_vars( $r ), array( 'request_id' => $r['id'] ) );
	}

	public static function artisan_lead( $q ) {
		if ( ! $q || empty( $q['artisan']['email'] ) ) {
			return false;
		}
		return self::send( $q['artisan']['email'], 'artisan_lead', self::quote_vars( $q ), array( 'request_id' => $q['request_id'] ) );
	}

	public static function artisan_reminder( $q ) {
		if ( ! $q || empty( $q['artisan']['email'] ) ) {
			return false;
		}
		return self::send( $q['artisan']['email'], 'artisan_reminder', self::quote_vars( $q ), array( 'request_id' => $q['request_id'] ) );
	}

	public static function artisan_won( $q ) {
		if ( ! $q || empty( $q['artisan']['email'] ) ) {
			return false;
		}
		return self::send( $q['artisan']['email'], 'artisan_won', self::quote_vars( $q ), array( 'request_id' => $q['request_id'] ) );
	}

	public static function artisan_lost( $q ) {
		if ( ! $q || empty( $q['artisan']['email'] ) ) {
			return false;
		}
		return self::send( $q['artisan']['email'], 'artisan_lost', self::quote_vars( $q ), array( 'request_id' => $q['request_id'] ) );
	}

	public static function client_new_quote( $q ) {
		$r = Requests::get( $q['request_id'] );
		if ( ! $r || ! $r['email'] ) {
			return false;
		}
		return self::send( $r['email'], 'client_new_quote', self::quote_vars( $q ), array( 'request_id' => $r['id'] ) );
	}

	public static function admin_quote( $q ) {
		return self::send( Settings::notify_emails(), 'admin_quote', self::quote_vars( $q ) );
	}

	public static function admin_accepted( $q ) {
		return self::send( Settings::notify_emails(), 'admin_accepted', self::quote_vars( $q ) );
	}

	public static function admin_decline( $q, $reason ) {
		$vars            = self::quote_vars( $q );
		$vars['message'] = $reason ? $reason : 'non précisé';
		return self::send( Settings::notify_emails(), 'admin_decline', $vars );
	}

	public static function client_message( array $r, $message ) {
		$vars            = self::request_vars( $r );
		$vars['message'] = $message;
		return self::send( $r['email'], 'client_message', $vars, array( 'request_id' => $r['id'] ) );
	}

	public static function admin_message( array $r, $message ) {
		$vars            = self::request_vars( $r );
		$vars['message'] = $message;
		return self::send( Settings::notify_emails(), 'admin_message', $vars, array( 'reply_to' => $r['email'] ) );
	}

	public static function custom( array $r, $subject, $message ) {
		$vars            = self::request_vars( $r );
		$vars['sujet']   = $subject;
		$vars['message'] = $message;
		return self::send( $r['email'], 'custom', $vars, array( 'request_id' => $r['id'] ) );
	}

	public static function client_login( $email, $link ) {
		$vars                = self::base_vars();
		$vars['lien_espace'] = $link;
		return self::send( $email, 'client_login', $vars );
	}

	public static function partner_ack( array $a ) {
		return self::send( $a['email'], 'partner_ack', self::artisan_vars( $a ) );
	}

	public static function partner_welcome( array $a ) {
		return self::send( $a['email'], 'partner_welcome', self::artisan_vars( $a ) );
	}

	public static function admin_partner( array $a ) {
		return self::send( Settings::notify_emails(), 'admin_partner', self::artisan_vars( $a ), array( 'reply_to' => $a['email'] ) );
	}

	public static function admin_docs( array $a ) {
		return self::send( Settings::notify_emails(), 'admin_docs', self::artisan_vars( $a ) );
	}
}
