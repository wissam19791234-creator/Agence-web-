# Scalify — le centre de commande intelligent

Site marketing + application SaaS : Scalify surveille les données d’une entreprise, détecte les problèmes et les opportunités, et indique quoi faire.

```bash
npm install
npm run dev        # http://localhost:5173  (site + application)
npm run build      # production : dist/  (à servir à la racine du domaine)
npm run preview
npm run film       # régénère la vidéo de démo (30 s) dans public/media/
node scripts/build-artifact.mjs   # aperçu en fichiers HTML autonomes : dist-artifact/
```

**Stack :** Vite (multi-pages), JavaScript natif en modules, CSS à tokens, SVG pour les graphiques. Three.js n’est chargé que pour le noyau IA 3D, sur ordinateur uniquement. Aucune dépendance d’interface lourde.

## Architecture

| URL | Fichier | Rôle |
| --- | --- | --- |
| `/` | `index.html` + `src/landing/` | Landing : hero, démo produit interactive, Copilot, insights, fonctionnalités, cas d’usage, intégrations, sécurité, tarifs, FAQ |
| `/product/` `/features/` `/pricing/` `/security/` `/resources/` | `*/index.html` + `src/pages/main.js` | Pages secondaires |
| `/signup/` | `src/onboarding/main.js` | Onboarding en 5 étapes + premiers insights (« aha moment ») |
| `/login/` | `src/onboarding/login.js` | Connexion, lien magique |
| `/app/…` | `app/index.html` + `src/app/` | Application : `overview`, `analytics`, `ai`, `insights`, `automations`, `reports`, `goals`, `settings` |

Au build, `app/index.html` est copié dans chaque `app/<route>/` : les liens profonds fonctionnent sur un hébergement statique sans réécriture d’URL.

```
src/
  config.js            marque, offres, intégrations, preuves sociales, formulaires
  shared/
    api.js             ← POINT DE BRANCHEMENT DU BACKEND (mêmes signatures, mêmes retours)
    demo-data.js       données de démonstration (fictives, calibrées et cohérentes)
    copilot.js         moteur de réponses du Copilot (format : analyse, explication, données, recommandations, actions)
    copilot-ui.js      interface du Copilot (landing + application)
    charts.js          courbe + réticule + info-bulle, sparklines, barres, jauge
    ui.js              toasts avec annulation, menus, squelettes, raccourcis
    brand.js icons.js paths.js core3d.js
  app/                 coquille (routeur, palette ⌘K, notifications, Copilot global, briefing) + vues
  landing/ site/ pages/ onboarding/
  styles/              tokens.css (design system), site.css, product.css, app.css, auth.css
  partials/            en-tête, pied de page, <head> communs (injectés au build)
  film/                montage de la vidéo de démo (rendu par npm run film)
```

### Brancher un vrai backend
Toute l’interface passe par `src/shared/api.js`. Remplacez le corps de chaque fonction par un appel à votre API (`metrics`, `insights`, `askCopilot`, `automations`, `goals`, `reports`, `sources`…) en conservant la forme des données : aucune vue n’a à changer. `askCopilot` doit renvoyer `{ title, analysis, explanation, data: [[libellé, valeur]], recos: [], actions: [] }`.

## Design system

- **Direction :** sombre, précis, minimal. Un seul accent citron (`--accent: #c6f432`) réservé aux actions et aux données clés ; le violet (`--ai`) signale l’IA. Grain très léger, bordures fines, ombres réalistes, verre discret uniquement sur les éléments flottants.
- **Typographie :** Geist (texte et titres), Geist Mono (données, libellés).
- **Logo :** monogramme « S » en paliers (croissance) + point (IA), dans `src/shared/brand.js`.
- **Statuts :** bon / attention / critique toujours accompagnés d’une icône et d’un libellé.

## Expérience produit (application)

- Barre latérale, sélecteur de workspace, fil d’Ariane, recherche globale **⌘K** (pages, indicateurs, actions, question à l’IA).
- **Demander à l’IA (⌘J)** depuis toutes les pages, avec le contexte de la page. Sélectionner un chiffre à l’écran → « Expliquer ceci ». Menu « … » de chaque widget : Expliquer, Pourquoi ?, Que faire ?, Tendance, Rapport.
- **Vue d’ensemble :** widgets personnalisables (afficher / masquer) et réorganisables par glisser-déposer, disposition enregistrée.
- **Briefing du jour** automatique à la première visite du jour : 3 changements, 2 opportunités, 1 point d’attention.
- Analyses (filtres, comparaison, vues enregistrées, tableau, export CSV), Insights (filtres, ignorer avec annulation), Automatisations (constructeur QUAND / ALORS / ET, modèles), Rapports (génération, aperçu, export PDF, partage, planification), Objectifs (objectif suggéré par l’IA, plan d’action), Paramètres (sources de données avec état vide, notifications, équipe, zone sensible).
- États soignés partout : squelettes de chargement, états vides, erreurs avec « Réessayer », confirmations, toasts avec **Annuler**.
- Raccourcis : `G` puis `O/A/C/I/U/R/G/S`, `B` (briefing), `?` (aide).

## À faire avant la mise en ligne

- **Données :** l’application affiche un workspace de démonstration clairement signalé. Branchez `api.js` sur votre backend.
- **Preuves sociales :** `testimonials` et `logos` sont vides dans `src/config.js`, donc la page affiche le programme « Premières équipes ». Ne les remplissez qu’avec des retours réels et autorisés. Validez aussi l’avantage « Tarif fondateur » affiché dans ce bloc.
- **Intégrations :** toutes sont en `status: 'soon'`. Passez à `'available'` uniquement les connecteurs réellement opérationnels.
- **Sécurité :** les pratiques décrites (chiffrement, accès par rôle, journal d’activité) doivent correspondre à votre infrastructure. Aucune certification n’est revendiquée ; n’en ajoutez que si elle est obtenue.
- **Tarifs :** Free 0 €, Pro 490 €, Business 990 € HT/mois, −20 % en annuel (`src/config.js`).
- **Formulaires :** les inscriptions sont envoyées par FormSubmit à **scalifyfr@gmail.com** (`formEndpoint`). Au premier envoi, confirmez l’email d’activation de FormSubmit. La connexion et le lien magique sont à brancher sur votre authentification (`src/onboarding/login.js`).
- **Domaine :** remplacez `https://www.votre-domaine.fr` dans `src/config.js`, `public/robots.txt` et `public/sitemap.xml`. Les pages légales (`public/*.html`) sont des modèles à faire valider.

## Vidéo de démonstration

`npm run film` capture le montage (`src/film/film.js`) image par image à 60 i/s, mixe une bande-son synthétisée avec des sons d’interface CC0 (`uisfx`), et encode MP4 1080p, MP4 mobile, WebM et affiche. Version courte de 30 s avec accroche chiffrée ; `npm run film -- --full` pour la version longue.

## Performance et accessibilité

- Pages marketing ≈ 30 à 40 Ko de JS compressé ; Three.js (noyau IA) chargé à l’approche, jamais sur mobile ni sur les petites configurations.
- `prefers-reduced-motion` respecté (animations, compteurs, défilement).
- Navigation clavier complète, focus visibles, ARIA sur les onglets, menus, interrupteurs et modales (piège de focus, Échap).
- Mobile d’abord : barre latérale en tiroir, CTA collant sur les pages marketing, aucun défilement horizontal.
