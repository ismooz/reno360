<?php
/**
 * Espace artisan (lien sécurisé reçu par e-mail) : consulter la demande, déposer son devis.
 *
 * @package Reno360
 */

use Reno360\Files;
use Reno360\Frontend;
use Reno360\Quotes;
use Reno360\Requests;
use Reno360\Settings;
use Reno360\Util;

defined( 'ABSPATH' ) || exit;

$rn_token = isset( $_GET['q'] ) ? sanitize_text_field( wp_unslash( $_GET['q'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
$rn_q     = $rn_token ? Quotes::get_by_token( $rn_token ) : null;
$rn_r     = $rn_q ? Requests::get( $rn_q['request_id'] ) : null;

if ( ! $rn_q || ! $rn_r ) : ?>
	<section class="rn-section rn-section--tight">
		<div class="rn-container rn-narrow">
			<div class="rn-panel rn-login">
				<h1 class="rn-h2">Espace artisan</h1>
				<p class="rn-muted">Ce lien est invalide ou a expiré. Utilisez le lien reçu par e-mail pour chaque demande, ou contactez-nous.</p>
				<?php if ( Settings::get( 'phone' ) ) : ?>
					<p><strong><?php echo esc_html( Settings::get( 'phone' ) ); ?></strong> · <?php echo esc_html( Settings::get( 'public_email' ) ); ?></p>
				<?php endif; ?>
				<p><a class="rn-btn rn-btn--ghost" href="<?php echo esc_url( Settings::page_url( 'partner' ) ); ?>">Devenir partenaire</a></p>
			</div>
		</div>
	</section>
	<?php
	return;
endif;

$rn_share  = (bool) Settings::get( 'share_client_contact' ) || 'accepte' === $rn_q['status'];
$rn_photos = Files::query( array( 'request_id' => $rn_r['id'] ) );
$rn_photos = array_filter(
	$rn_photos,
	static function ( $f ) {
		return in_array( $f['context'], array( 'photo', 'message' ), true );
	}
);
$rn_qfiles = Files::query( array( 'quote_id' => $rn_q['id'] ) );
$rn_open   = in_array( $rn_q['status'], array( 'attendu', 'recu', 'decline' ), true ) && ! in_array( $rn_r['status'], array( 'acceptee', 'travaux', 'terminee', 'perdue' ), true );
?>
<section class="rn-section rn-section--tight">
	<div class="rn-container rn-artisan" data-rn-artisan data-token="<?php echo esc_attr( $rn_q['token'] ); ?>">
		<header class="rn-portal__head">
			<div>
				<span class="rn-eyebrow"><?php echo esc_html( $rn_q['company'] ); ?></span>
				<h1 class="rn-h2"><?php echo esc_html( $rn_r['activity_name'] ); ?> · <?php echo esc_html( $rn_r['place'] ); ?></h1>
				<p class="rn-muted"><?php echo esc_html( 'Demande ' . $rn_r['ref'] . ' · transmise le ' . Util::date( $rn_q['sent_at'], 'j F Y' ) ); ?></p>
			</div>
			<?php echo Util::quote_badge( $rn_q['status'] ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
		</header>

		<div class="rn-artisan__grid">
			<div class="rn-panel">
				<h2 class="rn-h3">La demande</h2>
				<dl class="rn-dl">
					<div><dt>Travaux</dt><dd><?php echo esc_html( $rn_r['activity_name'] ); ?></dd></div>
					<?php foreach ( $rn_r['answers'] as $rn_ans ) : ?>
						<div><dt><?php echo esc_html( $rn_ans['label'] ); ?></dt><dd><?php echo esc_html( is_array( $rn_ans['value'] ) ? implode( ', ', $rn_ans['value'] ) : $rn_ans['value'] ); ?></dd></div>
					<?php endforeach; ?>
					<?php foreach ( array( 'property_type' => 'Type de bien', 'client_type' => 'Client', 'start_wish' => 'Début souhaité', 'budget' => 'Budget' ) as $rn_k => $rn_label ) : ?>
						<?php if ( $rn_r[ $rn_k ] ) : ?>
							<div><dt><?php echo esc_html( $rn_label ); ?></dt><dd><?php echo esc_html( $rn_r[ $rn_k ] ); ?></dd></div>
						<?php endif; ?>
					<?php endforeach; ?>
					<?php if ( $rn_r['preferred_date'] ) : ?>
						<div><dt>Date souhaitée</dt><dd><?php echo esc_html( Util::date( $rn_r['preferred_date'] ) ); ?></dd></div>
					<?php endif; ?>
				</dl>
				<?php if ( $rn_r['description'] ) : ?>
					<blockquote class="rn-quote-text"><?php echo esc_html( $rn_r['description'] ); ?></blockquote>
				<?php endif; ?>
				<?php if ( $rn_photos ) : ?>
					<div class="rn-doc-thumbs">
						<?php foreach ( $rn_photos as $rn_f ) : ?>
							<?php if ( Files::is_image( $rn_f ) ) : ?>
								<a href="<?php echo esc_url( Files::url( $rn_f['id'] ) ); ?>" target="_blank" rel="noopener"><img src="<?php echo esc_url( Files::url( $rn_f['id'] ) ); ?>" alt="<?php echo esc_attr( $rn_f['name'] ); ?>" loading="lazy"></a>
							<?php else : ?>
								<a class="rn-doc-chip" href="<?php echo esc_url( Files::url( $rn_f['id'] ) ); ?>" target="_blank" rel="noopener"><?php echo Frontend::icon( 'file', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo esc_html( $rn_f['name'] ); ?></a>
							<?php endif; ?>
						<?php endforeach; ?>
					</div>
				<?php endif; ?>
				<h3 class="rn-overline rn-mt">Client</h3>
				<?php if ( $rn_share ) : ?>
					<dl class="rn-dl rn-dl--compact">
						<div><dt>Nom</dt><dd><?php echo esc_html( $rn_r['name'] ); ?></dd></div>
						<div><dt>Téléphone</dt><dd><a href="tel:<?php echo esc_attr( preg_replace( '/[^\d+]/', '', $rn_r['phone'] ) ); ?>"><?php echo esc_html( $rn_r['phone'] ); ?></a></dd></div>
						<div><dt>E-mail</dt><dd><a href="mailto:<?php echo esc_attr( $rn_r['email'] ); ?>"><?php echo esc_html( $rn_r['email'] ); ?></a></dd></div>
						<div><dt>Adresse</dt><dd><?php echo esc_html( trim( $rn_r['address'] . ', ' . $rn_r['place'], ', ' ) ); ?></dd></div>
						<?php if ( $rn_r['contact_pref'] || $rn_r['contact_time'] ) : ?>
							<div><dt>Préférence</dt><dd><?php echo esc_html( trim( $rn_r['contact_pref'] . ', ' . $rn_r['contact_time'], ', ' ) ); ?></dd></div>
						<?php endif; ?>
					</dl>
				<?php else : ?>
					<p class="rn-muted rn-small">Les coordonnées du client vous seront communiquées par votre conseiller.</p>
				<?php endif; ?>
			</div>

			<div class="rn-panel">
				<?php if ( 'accepte' === $rn_q['status'] ) : ?>
					<div class="rn-alert rn-alert--success"><strong>Votre devis a été accepté.</strong> Merci de contacter le client pour organiser le chantier.</div>
				<?php elseif ( 'refuse' === $rn_q['status'] ) : ?>
					<div class="rn-alert">Le client a choisi une autre offre pour cette demande. Merci pour votre réponse.</div>
				<?php elseif ( ! $rn_open ) : ?>
					<div class="rn-alert">Cette demande est clôturée.</div>
				<?php else : ?>
					<h2 class="rn-h3"><?php echo 'recu' === $rn_q['status'] ? 'Mettre à jour votre devis' : 'Déposer votre devis'; ?></h2>
					<?php if ( 'decline' === $rn_q['status'] ) : ?>
						<div class="rn-alert rn-alert--warn">Vous avez indiqué ne pas être disponible. Vous pouvez encore déposer un devis si la situation a changé.</div>
					<?php endif; ?>
					<form class="rn-stack" data-rn-quote-form novalidate>
						<div class="rn-grid rn-grid--2">
							<label class="rn-field"><span class="rn-label">Montant TTC (CHF) <span class="rn-req">*</span></span><input class="rn-input" type="text" name="amount" inputmode="decimal" value="<?php echo esc_attr( null !== $rn_q['amount'] ? Util::chf( $rn_q['amount'], false ) : '' ); ?>" placeholder="18'450"></label>
							<label class="rn-field"><span class="rn-label">Début possible</span><input class="rn-input" type="date" name="start_date" value="<?php echo esc_attr( (string) $rn_q['start_date'] ); ?>"></label>
							<label class="rn-field"><span class="rn-label">Durée des travaux</span><input class="rn-input" type="text" name="duration" value="<?php echo esc_attr( $rn_q['duration'] ); ?>" placeholder="8 jours ouvrés"></label>
							<label class="rn-field"><span class="rn-label">Offre valable jusqu’au</span><input class="rn-input" type="date" name="valid_until" value="<?php echo esc_attr( (string) $rn_q['valid_until'] ); ?>"></label>
						</div>
						<label class="rn-field"><span class="rn-label">Compris dans le devis <span class="rn-help-inline">(une ligne par élément)</span></span><textarea class="rn-input" name="includes" rows="3"><?php echo esc_textarea( (string) $rn_q['includes'] ); ?></textarea></label>
						<label class="rn-field"><span class="rn-label">Non compris</span><textarea class="rn-input" name="excludes" rows="2"><?php echo esc_textarea( (string) $rn_q['excludes'] ); ?></textarea></label>
						<label class="rn-field"><span class="rn-label">Devis PDF <?php echo $rn_qfiles ? '' : '<span class="rn-req">*</span>'; // phpcs:ignore WordPress.Security.EscapeOutput ?></span><input class="rn-input" type="file" name="quote_file" accept="application/pdf"></label>
						<?php foreach ( $rn_qfiles as $rn_f ) : ?>
							<a class="rn-doc-chip" href="<?php echo esc_url( Files::url( $rn_f['id'] ) ); ?>" target="_blank" rel="noopener"><?php echo Frontend::icon( 'file', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo esc_html( $rn_f['name'] ); ?></a>
						<?php endforeach; ?>
						<label class="rn-field"><span class="rn-label">Message pour le conseiller</span><textarea class="rn-input" name="notes" rows="2"></textarea></label>
						<div class="rn-alert" role="status" data-rn-msg hidden></div>
						<button type="submit" class="rn-btn rn-btn--primary rn-btn--lg">Envoyer mon devis</button>
					</form>
					<?php if ( 'attendu' === $rn_q['status'] ) : ?>
						<details class="rn-decline">
							<summary>Je ne suis pas disponible pour cette demande</summary>
							<form class="rn-stack" data-rn-decline-form>
								<label class="rn-field"><span class="rn-label">Motif (facultatif)</span><textarea class="rn-input" name="reason" rows="2" placeholder="Planning complet jusqu’en janvier, hors de notre zone…"></textarea></label>
								<button type="submit" class="rn-btn rn-btn--ghost">Confirmer mon indisponibilité</button>
							</form>
						</details>
					<?php endif; ?>
				<?php endif; ?>
			</div>
		</div>
	</div>
</section>
