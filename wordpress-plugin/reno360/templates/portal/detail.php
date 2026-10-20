<?php
/**
 * Espace client : suivi d'une demande, comparatif des devis, messages et documents.
 *
 * Variables : $email, $requests, $r, $quotes, $messages, $files, $csrf.
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

$rn_portal  = Settings::page_url( 'portal' );
$rn_owner   = $r['owner_id'] ? get_userdata( $r['owner_id'] ) : null;
$rn_advisor = $rn_owner ? $rn_owner->display_name : 'Votre conseiller';
$rn_company = Settings::get( 'company' );
$rn_phone   = Settings::get( 'phone' );
$rn_tags    = Quotes::tags( $quotes );
$rn_can_choose = in_array( $r['status'], array( 'envoyee', 'devis' ), true );
$rn_accepted   = null;
foreach ( $quotes as $rn_q ) {
	if ( 'accepte' === $rn_q['status'] ) {
		$rn_accepted = $rn_q;
	}
}
$rn_next = array(
	'nouvelle'  => Settings::fill( 'Votre demande est en cours de vérification. Un conseiller vous contacte sous {sla_hours} h ouvrées.' ),
	'qualifiee' => 'Votre conseiller sélectionne les artisans les plus adaptés à votre projet.',
	'envoyee'   => 'Les artisans sélectionnés vont vous contacter pour préparer leur devis (avec une visite si nécessaire).',
	'devis'     => 'Prochaine étape : comparez les devis ci-dessous et choisissez votre artisan.',
	'acceptee'  => $rn_accepted ? 'Vous avez choisi ' . $rn_accepted['company'] . '. L’artisan vous contacte pour planifier les travaux.' : 'Vous avez accepté un devis.',
	'travaux'   => 'Les travaux sont en cours. Une question ? Écrivez-nous ci-dessous.',
	'terminee'  => 'Les travaux sont terminés. Merci pour votre confiance !',
	'perdue'    => 'Cette demande est clôturée.',
);
$rn_q_files = array();
foreach ( $quotes as $rn_q ) {
	$rn_q_files[ $rn_q['id'] ] = Files::query( array( 'quote_id' => $rn_q['id'] ) );
}
?>
<div class="rn-portal" data-rn-portal data-csrf="<?php echo esc_attr( $csrf ); ?>" data-ref="<?php echo esc_attr( $r['ref'] ); ?>">
	<div class="rn-portal__bar">
		<div class="rn-container rn-portal__bar-inner">
			<strong>Mon espace</strong>
			<span class="rn-muted rn-small"><?php echo esc_html( $email ); ?></span>
			<span class="rn-portal__bar-actions">
				<a class="rn-btn rn-btn--primary rn-btn--sm" href="<?php echo esc_url( Settings::page_url( 'form' ) ); ?>"><?php echo Frontend::icon( 'plus', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>Nouvelle demande</a>
				<a class="rn-btn rn-btn--ghost rn-btn--sm" href="<?php echo esc_url( add_query_arg( 'rn_logout', 1, $rn_portal ) ); ?>">Se déconnecter</a>
			</span>
		</div>
	</div>

	<div class="rn-container rn-portal__grid">
		<aside class="rn-portal__aside">
			<nav class="rn-panel rn-panel--flush" aria-label="Mes demandes">
				<span class="rn-overline">Mes demandes</span>
				<?php foreach ( $requests as $rn_item ) : ?>
					<a class="rn-req-link<?php echo $rn_item['id'] === $r['id'] ? ' is-current' : ''; ?>" href="<?php echo esc_url( add_query_arg( 'demande', $rn_item['ref'], $rn_portal ) ); ?>"<?php echo $rn_item['id'] === $r['id'] ? ' aria-current="page"' : ''; ?>>
						<strong><?php echo esc_html( $rn_item['activity_name'] ); ?></strong>
						<span class="rn-small rn-muted"><?php echo esc_html( $rn_item['ref'] . ' · ' . Util::date( $rn_item['created_at'] ) ); ?></span>
						<?php echo Util::status_badge( $rn_item['status'] ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
					</a>
				<?php endforeach; ?>
			</nav>
			<div class="rn-panel">
				<div class="rn-advisor"><span class="rn-avatar"><?php echo esc_html( Util::initials( $rn_advisor ) ); ?></span><span><strong><?php echo esc_html( $rn_advisor ); ?></strong><small class="rn-muted"><?php echo esc_html( 'Conseiller ' . $rn_company ); ?></small></span></div>
				<p class="rn-small">Une question sur un devis ou un délai ? Nous sommes là pour vous aider.</p>
				<div class="rn-btn-row">
					<?php if ( $rn_phone ) : ?>
						<a class="rn-btn rn-btn--ghost rn-btn--sm" href="tel:<?php echo esc_attr( preg_replace( '/[^\d+]/', '', $rn_phone ) ); ?>"><?php echo Frontend::icon( 'phone', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>Appeler</a>
					<?php endif; ?>
					<a class="rn-btn rn-btn--ghost rn-btn--sm" href="#rn-messages"><?php echo Frontend::icon( 'message', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>Écrire</a>
				</div>
			</div>
		</aside>

		<div class="rn-portal__main">
			<header class="rn-portal__head">
				<div>
					<h1 class="rn-h2"><?php echo esc_html( $r['activity_name'] ); ?></h1>
					<p class="rn-muted"><?php echo esc_html( implode( ' · ', array_filter( array( $r['ref'], $r['place'], $r['property_type'], 'envoyée le ' . Util::date( $r['created_at'], 'j F Y' ) ) ) ) ); ?></p>
				</div>
				<?php echo Util::status_badge( $r['status'] ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			</header>

			<?php if ( 'perdue' !== $r['status'] ) : ?>
				<section class="rn-panel rn-tracker-box" aria-label="Avancement de la demande">
					<ol class="rn-tracker">
						<?php foreach ( Requests::client_steps( $r ) as $rn_s ) : ?>
							<li class="<?php echo $rn_s['done'] ? 'is-done' : ( $rn_s['current'] ? 'is-current' : '' ); ?>"<?php echo $rn_s['current'] ? ' aria-current="step"' : ''; ?>>
								<span class="rn-tracker__dot"><?php echo $rn_s['done'] ? Frontend::icon( 'check', 14 ) : ''; // phpcs:ignore WordPress.Security.EscapeOutput ?></span>
								<span class="rn-tracker__label"><?php echo esc_html( $rn_s['label'] ); ?></span>
							</li>
						<?php endforeach; ?>
					</ol>
				</section>
			<?php endif; ?>

			<div class="rn-next-banner"><?php echo Frontend::icon( 'info', 22 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><span><?php echo esc_html( $rn_next[ $r['status'] ] ); ?></span>
				<?php if ( 'terminee' === $r['status'] && Settings::get( 'review_url' ) ) : ?>
					<a class="rn-btn rn-btn--white rn-btn--sm" href="<?php echo esc_url( Settings::get( 'review_url' ) ); ?>" target="_blank" rel="noopener">Laisser un avis</a>
				<?php endif; ?>
			</div>
			<div class="rn-alert" role="status" data-rn-portal-msg hidden></div>

			<?php if ( $quotes ) : ?>
				<section aria-labelledby="rn-quotes-title">
					<div class="rn-section__head rn-section__head--compact">
						<h2 id="rn-quotes-title" class="rn-h3"><?php echo esc_html( count( $quotes ) > 1 ? 'Comparez vos devis' : 'Votre devis' ); ?></h2>
						<span class="rn-muted rn-small">Montants TTC</span>
					</div>
					<div class="rn-grid rn-grid--quotes">
						<?php foreach ( $quotes as $rn_q ) : ?>
							<?php $rn_artisan = $rn_q['artisan']; ?>
							<article class="rn-quote<?php echo 'accepte' === $rn_q['status'] ? ' is-accepted' : ''; ?><?php echo 'refuse' === $rn_q['status'] ? ' is-refused' : ''; ?><?php echo isset( $rn_tags[ $rn_q['id'] ] ) && in_array( 'Prix le plus bas', $rn_tags[ $rn_q['id'] ], true ) ? ' is-highlight' : ''; ?>">
								<div class="rn-quote__tags">
									<?php foreach ( isset( $rn_tags[ $rn_q['id'] ] ) ? $rn_tags[ $rn_q['id'] ] : array() as $rn_tag ) : ?>
										<span class="rn-tag"><?php echo esc_html( $rn_tag ); ?></span>
									<?php endforeach; ?>
									<?php if ( 'accepte' === $rn_q['status'] ) : ?>
										<span class="rn-tag rn-tag--solid">Devis choisi</span>
									<?php elseif ( 'refuse' === $rn_q['status'] ) : ?>
										<span class="rn-tag rn-tag--muted">Non retenu</span>
									<?php endif; ?>
								</div>
								<div class="rn-quote__company">
									<span class="rn-avatar rn-avatar--square"><?php echo esc_html( Util::initials( $rn_q['company'] ) ); ?></span>
									<span><strong><?php echo esc_html( $rn_q['company'] ); ?></strong>
										<small class="rn-muted"><?php echo esc_html( implode( ' · ', array_filter( array( $rn_artisan && $rn_artisan['rating'] ? '★ ' . number_format( (float) $rn_artisan['rating'], 1, ',', '' ) : '', $rn_artisan ? $rn_artisan['city'] : '', 'Partenaire vérifié' ) ) ) ); ?></small>
									</span>
								</div>
								<div class="rn-quote__price"><?php echo esc_html( Util::chf( $rn_q['amount'] ) ); ?></div>
								<dl class="rn-dl">
									<?php if ( $rn_q['start_date'] ) : ?>
										<div><dt>Début possible</dt><dd><?php echo esc_html( Util::date( $rn_q['start_date'], 'j F Y' ) ); ?></dd></div>
									<?php endif; ?>
									<?php if ( $rn_q['duration'] ) : ?>
										<div><dt>Durée des travaux</dt><dd><?php echo esc_html( $rn_q['duration'] ); ?></dd></div>
									<?php endif; ?>
									<?php if ( $rn_q['valid_until'] ) : ?>
										<div><dt>Offre valable jusqu’au</dt><dd><?php echo esc_html( Util::date( $rn_q['valid_until'] ) ); ?></dd></div>
									<?php endif; ?>
								</dl>
								<?php if ( $rn_q['includes'] || $rn_q['excludes'] ) : ?>
									<ul class="rn-quote__list">
										<?php foreach ( array_filter( array_map( 'trim', explode( "\n", (string) $rn_q['includes'] ) ) ) as $rn_line ) : ?>
											<li class="is-in"><?php echo Frontend::icon( 'check', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo esc_html( $rn_line ); ?></li>
										<?php endforeach; ?>
										<?php foreach ( array_filter( array_map( 'trim', explode( "\n", (string) $rn_q['excludes'] ) ) ) as $rn_line ) : ?>
											<li class="is-out"><?php echo Frontend::icon( 'minus', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><?php echo esc_html( $rn_line ); ?></li>
										<?php endforeach; ?>
									</ul>
								<?php endif; ?>
								<div class="rn-quote__actions">
									<?php if ( $rn_can_choose && 'recu' === $rn_q['status'] ) : ?>
										<button type="button" class="rn-btn rn-btn--primary rn-btn--block" data-rn-accept="<?php echo (int) $rn_q['id']; ?>" data-company="<?php echo esc_attr( $rn_q['company'] ); ?>" data-amount="<?php echo esc_attr( Util::chf( $rn_q['amount'] ) ); ?>">Choisir ce devis</button>
									<?php endif; ?>
									<?php foreach ( $rn_q_files[ $rn_q['id'] ] as $rn_f ) : ?>
										<a class="rn-btn rn-btn--ghost rn-btn--sm" href="<?php echo esc_url( Files::url( $rn_f['id'] ) ); ?>" target="_blank" rel="noopener"><?php echo Frontend::icon( 'download', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>Devis PDF</a>
									<?php endforeach; ?>
								</div>
							</article>
						<?php endforeach; ?>
					</div>
				</section>
			<?php endif; ?>

			<div class="rn-portal__cols">
				<section id="rn-messages" class="rn-panel rn-portal__messages" aria-labelledby="rn-msg-title">
					<h2 id="rn-msg-title" class="rn-h3">Messages</h2>
					<div class="rn-thread">
						<?php if ( ! $messages ) : ?>
							<p class="rn-muted rn-small">Aucun message pour l’instant. Écrivez-nous si vous avez une question.</p>
						<?php endif; ?>
						<?php foreach ( $messages as $rn_m ) : ?>
							<?php $rn_mine = 'client' === $rn_m['author_type']; ?>
							<div class="rn-msg<?php echo $rn_mine ? ' is-mine' : ''; ?>">
								<span class="rn-avatar rn-avatar--sm"><?php echo esc_html( Util::initials( $rn_mine ? $r['name'] : ( $rn_m['author_name'] ? $rn_m['author_name'] : $rn_company ) ) ); ?></span>
								<div class="rn-msg__bubble">
									<span class="rn-msg__meta"><strong><?php echo esc_html( $rn_mine ? 'Vous' : ( $rn_m['author_name'] ? $rn_m['author_name'] : $rn_company ) ); ?></strong> · <?php echo esc_html( Util::datetime( $rn_m['created_at'] ) ); ?></span>
									<?php echo wp_kses_post( wpautop( esc_html( $rn_m['content'] ) ) ); ?>
								</div>
							</div>
						<?php endforeach; ?>
					</div>
					<?php if ( 'perdue' !== $r['status'] ) : ?>
						<form class="rn-composer" data-rn-portal-message>
							<label class="screen-reader-text" for="rn-message-text">Votre message</label>
							<textarea id="rn-message-text" class="rn-input" name="message" rows="3" placeholder="Écrire un message…"></textarea>
							<div class="rn-composer__row">
								<label class="rn-btn rn-btn--ghost rn-btn--sm rn-file-btn"><?php echo Frontend::icon( 'paperclip', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><span data-rn-file-label>Joindre</span><input type="file" name="files[]" multiple accept="image/*,.heic,.heif,application/pdf"></label>
								<button type="submit" class="rn-btn rn-btn--primary rn-btn--sm"><?php echo Frontend::icon( 'send', 16 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>Envoyer</button>
							</div>
						</form>
					<?php endif; ?>
				</section>

				<section class="rn-panel rn-portal__docs" aria-labelledby="rn-docs-title">
					<h2 id="rn-docs-title" class="rn-h3">Documents</h2>
					<?php
					$rn_images = array_filter( $files, array( Files::class, 'is_image' ) );
					$rn_others = array_filter(
						$files,
						static function ( $f ) {
							return ! Files::is_image( $f );
						}
					);
					?>
					<?php if ( $rn_images ) : ?>
						<div class="rn-doc-thumbs">
							<?php foreach ( $rn_images as $rn_f ) : ?>
								<a href="<?php echo esc_url( Files::url( $rn_f['id'] ) ); ?>" target="_blank" rel="noopener"><img src="<?php echo esc_url( Files::url( $rn_f['id'] ) ); ?>" alt="<?php echo esc_attr( $rn_f['name'] ); ?>" loading="lazy"></a>
							<?php endforeach; ?>
						</div>
					<?php endif; ?>
					<ul class="rn-doc-list">
						<?php foreach ( $rn_others as $rn_f ) : ?>
							<li><a href="<?php echo esc_url( Files::url( $rn_f['id'] ) ); ?>" target="_blank" rel="noopener"><?php echo Frontend::icon( 'file', 18 ); // phpcs:ignore WordPress.Security.EscapeOutput ?><span><?php echo esc_html( $rn_f['name'] ); ?></span><small><?php echo esc_html( Files::size_label( $rn_f['size'] ) ); ?></small></a></li>
						<?php endforeach; ?>
						<?php if ( ! $files ) : ?>
							<li class="rn-muted rn-small">Aucun document.</li>
						<?php endif; ?>
					</ul>
					<h3 class="rn-overline rn-mt">Ma demande</h3>
					<dl class="rn-dl rn-dl--compact">
						<?php foreach ( $r['answers'] as $rn_ans ) : ?>
							<div><dt><?php echo esc_html( $rn_ans['label'] ); ?></dt><dd><?php echo esc_html( is_array( $rn_ans['value'] ) ? implode( ', ', $rn_ans['value'] ) : $rn_ans['value'] ); ?></dd></div>
						<?php endforeach; ?>
						<?php if ( $r['start_wish'] ) : ?>
							<div><dt>Début souhaité</dt><dd><?php echo esc_html( $r['start_wish'] ); ?></dd></div>
						<?php endif; ?>
						<?php if ( $r['budget'] ) : ?>
							<div><dt>Budget</dt><dd><?php echo esc_html( $r['budget'] ); ?></dd></div>
						<?php endif; ?>
					</dl>
					<?php if ( $r['description'] ) : ?>
						<blockquote class="rn-quote-text"><?php echo esc_html( $r['description'] ); ?></blockquote>
					<?php endif; ?>
				</section>
			</div>
		</div>
	</div>
</div>
