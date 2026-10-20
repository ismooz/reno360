# Reno360 pour WordPress

Extension WordPress qui fait tourner tout reno360.ch : le site public de demandes de devis et le back-office qui gère les demandes, les artisans et les devis. Elle s'installe comme n'importe quelle extension et fonctionne avec Divi 5.

## Installation

1. WordPress → **Extensions → Ajouter → Téléverser une extension** → choisir `reno360.zip` → **Installer** puis **Activer**.
2. L'activation crée automatiquement :
   - les tables de données (demandes, artisans, devis, historique, tâches, fichiers, journal de recherche) ;
   - les **60 types de travaux** répartis en 13 catégories, avec 1 555 mots-clés et les questions du formulaire ;
   - 6 pages : Accueil Reno360, Tous les travaux, Demande de devis, Mon espace (client), Espace artisan et Devenir partenaire.
3. **Reno360 → Réglages → Général** : nom, e-mail public, téléphone (laissez vide pour n'afficher aucun numéro), adresse, logo, couleur et e-mails qui reçoivent les alertes.
4. **Réglages → Pages et intégration Divi** : bouton « Définir Accueil Reno360 comme page d'accueil ».
5. Installez une extension SMTP (WP Mail SMTP, FluentSMTP…) avec le serveur d'envoi de votre hébergeur (Infomaniak : `mail.infomaniak.com`, port 587). Faites ensuite un essai avec **Réglages → Notifications → Envoyer un e-mail de test**.
6. Recommandé : ajoutez une tâche planifiée côté serveur qui appelle `https://votre-site.ch/wp-cron.php` toutes les 15 minutes. C'est ce qui déclenche les relances automatiques quand le site a peu de visites.

Configuration requise : WordPress 6.2 ou plus, PHP 7.4 ou plus, MySQL/MariaDB.

## Avec Divi 5

- Les pages créées utilisent le gabarit **« Reno360 — pleine largeur »**, qui garde l'en-tête et le pied de page de Divi.
- Pour composer une page dans le Visual Builder, ajoutez un module **Code** (ou Texte) et collez-y un shortcode.
- Les pages publiques des types de travaux (`/travaux/salle-de-bain/`…) sont mises en page automatiquement. Pour en composer une avec Divi, décochez « Mise en page automatique » dans la fiche du travail.
- Le style de l'extension est isolé (préfixe `.rn-app`) et reprend la couleur choisie dans les réglages. Vous pouvez aussi désactiver la typographie Reno360 pour garder celle de votre thème.

| Shortcode | Contenu |
|---|---|
| `[reno360_home]` | Page d'accueil complète |
| `[reno360_search]` | Recherche « Quels travaux ? » + NPA, avec suggestions |
| `[reno360_trust]` | Bandeau des engagements |
| `[reno360_featured]` | Travaux en vedette (grandes cartes) |
| `[reno360_categories]` | Tous les corps de métier |
| `[reno360_how_it_works]` | « Comment ça marche » en 3 étapes |
| `[reno360_why]` | Pourquoi Reno360 |
| `[reno360_energy]` | Bloc rénovation énergétique |
| `[reno360_partner_cta]` | Appel aux artisans |
| `[reno360_faq]` | Questions fréquentes (+ données structurées Google) |
| `[reno360_cta]` | Bandeau d'appel à l'action |
| `[reno360_activities]` | Catalogue filtrable de tous les travaux |
| `[reno360_request_form]` | Formulaire de demande en 5 étapes |
| `[reno360_client_portal]` | Espace client (connexion par lien e-mail) |
| `[reno360_artisan]` | Page où l'artisan dépose son devis (lien sécurisé) |
| `[reno360_partner_form]` | Candidature artisan |

Pour modifier un gabarit HTML sans toucher à l'extension, copiez le fichier voulu de `reno360/templates/` dans `votre-theme-enfant/reno360/`.

## Travaux et mots-clés : ajouter, modifier, supprimer

Menu **Reno360 → Travaux et mots-clés**.

- **Ajout rapide** : un nom, une catégorie, quelques mots-clés. Le travail est en ligne immédiatement.
- **Fiche complète** : nom, adresse de la page, catégorie, description, icône, image, **mots-clés** (étiquettes ; Entrée ou virgule pour ajouter, croix pour retirer, coller une liste entière), questions posées au client, prix indicatifs, FAQ, texte de la page, ordre, mise en avant et priorité dans la recherche.
- **Actions groupées** : activer, désactiver, changer de catégorie ou supprimer plusieurs travaux à la fois.
- **Catégories** : création, renommage, ordre d'affichage, suppression.
- **Import / export CSV** (séparateur `;`, ouvrable dans Excel) : `slug;nom;categorie;mots_cles;description;icone;populaire;vedette;actif;ordre`. Les mots-clés sont séparés par `|`.

Chaque modification est prise en compte tout de suite par la recherche du site.

## Recherche par mots-clés

Le même moteur tourne dans le navigateur (suggestions instantanées) et sur le serveur :

- ignore les accents, les majuscules, les pluriels et les mots vides (« je veux refaire ma… ») ;
- tolère les fautes de frappe (« carelage », « plombié », « toit qui fui ») ;
- reconnaît les débuts de mots (« sdb », « isol », « pomp ») et les familles de mots (plombier → plomberie) ;
- donne plus de poids au nom du travail, puis aux mots-clés, à la catégorie et à la description ;
- comprend les termes suisses (boiler, galetas, carnotzet, lino…).

**Reno360 → Recherches** liste ce que tapent les visiteurs, et surtout les recherches **sans résultat**. Un clic suffit pour en faire un mot-clé du bon travail. Un testeur montre le classement et le score de n'importe quelle requête.

Contrôle qualité : `tests/search-queries.txt` contient 526 requêtes réalistes avec le résultat attendu. Elles passent toutes à 100 %, avec des résultats identiques en PHP et en JavaScript.

```bash
php tests/search-test.php /chemin/vers/wordpress   # moteur PHP
node tests/search-parity.cjs                       # moteur JS + comparaison avec PHP
```

## Back-office

- **Vue d'ensemble** : indicateurs (nouvelles demandes, délai de 1re réponse, taux de signature, montant signé), demandes par semaine, entonnoir de conversion, tâches du jour, provenance, cantons.
- **Demandes** : liste filtrable ou **Kanban** par glisser-déposer. La fiche d'une demande regroupe les étapes, le client, le projet, les photos, les notes internes, les messages au client, les appels et e-mails, l'historique complet, les artisans suggérés (métier + zone + note + charge), les devis et les tâches. Export CSV et saisie manuelle (demande reçue par téléphone) sont aussi disponibles.
- **Artisans** : candidatures à valider, métiers, cantons et NPA couverts, documents (RC Pro), statistiques.
- **Devis** : tous les devis reçus, leur montant et leur statut.
- **Clients** : regroupement par e-mail, envoi du lien d'accès, effacement des données (nLPD).
- **Réglages** : formulaire, textes des e-mails, automatisations (relances artisan, rappel au client, demande d'avis, alerte demande non traitée, échéance des documents, suppression des anciennes demandes), FAQ, conservation des données.

Rôle **Conseiller Reno360** : accès au back-office Reno360, sans droits d'administration sur le reste du site.

## Parcours

1. Le client cherche un travail et remplit le formulaire (photos comprises). Il reçoit un e-mail de confirmation avec le lien vers son espace.
2. Vous qualifiez la demande et proposez des artisans. Chaque artisan reçoit un lien personnel pour déposer son devis (PDF), sans compte ni mot de passe.
3. Le client compare les devis dans son espace, pose ses questions et accepte celui qu'il choisit. L'artisan retenu, les autres et vous êtes prévenus automatiquement.

## Sécurité et données

- Fichiers dans un dossier privé (`uploads/reno360-private`), servis par des liens signés et temporaires.
- Accès client et artisan par liens signés (HMAC) qui expirent.
- Anti-spam sans captcha : champ piège, délai minimum de remplissage et limite d'envois par adresse IP (l'IP n'est jamais enregistrée).
- Journal de recherche anonyme, conservé 180 jours (réglable).
- Suppression des données à la désinstallation seulement si vous l'avez demandé dans les réglages.

## Développement

```
reno360/
  reno360.php            point d'entrée
  includes/              modèle, REST, recherche, notifications, automatisations
  includes/admin/        back-office
  templates/             HTML public (surchargeable par le thème)
  assets/                CSS, JS, polices locales, images
  data/activities.json   catalogue initial des travaux
tests/                   jeux de requêtes et scripts de contrôle de la recherche
```

Pour reconstruire le paquet : `cd wordpress-plugin && zip -r reno360.zip reno360 -x '*.DS_Store'`.
