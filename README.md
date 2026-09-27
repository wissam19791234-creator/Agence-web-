# Ordra — Landing page Dashboard IA

Landing page de vente pour un dashboard IA : dark premium, maquette 3D du produit, storytelling au scroll, démo interactive, noyau IA en WebGL.

**Stack :** Vite · JavaScript (modules ES) · GSAP + ScrollTrigger · WebGL (fond « braise ») · Three.js (chargé à la demande). Défilement natif, sans scroll-jacking.

```bash
npm install
npm run dev        # développement : http://localhost:5173
npm run build      # production : dist/
npm run preview    # prévisualiser le build
node scripts/build-artifact.mjs   # version « un seul fichier » : dist-artifact/ordra.html
```

## Design system

Direction « Studio Lime » : fond noir, accent citron vert `#d4ff3a`, violet `#b9a7ff`, titres **Syne** 800 en capitales avec mots surlignés en blocs lime, texte **Inter Tight**, cartes arrondies (24 px) et blocs lime pleins pour les éléments clés (offre Pro, statistique principale, CTA final). Tout est dans `src/styles/lime.css` (chargé en dernier).

## Outils installés dans le projet

- **Skill UI/UX Pro Max** (`.claude/skills/ui-ux-pro-max/`, licence MIT) : base de styles, palettes, typographies et règles UX, utilisable par Claude Code dans ce projet.
- **Serveur MCP 21st.dev** (`.mcp.json`) : lit la clé dans la variable d'environnement `API_KEY_21ST`. Vérifiez avec `claude mcp list`.

## Personnaliser

| Quoi | Où |
| --- | --- |
| Nom de la marque, lien des CTA, URL de la vidéo, prix, formulaires, Google Analytics, coordonnées, avis, études de cas, équipe | `src/config.js` |
| Logo (monogramme SVG) | `logoMark()` dans `src/modules/dashboard.js` + favicon dans `index.html` |
| Textes, FAQ, fonctionnalités des offres | `index.html` |
| Couleurs, typographies, rayons, espacements | tokens `:root` dans `src/styles/base.css` |
| Données affichées dans la maquette du dashboard | `src/modules/dashboard.js` |
| Données et réponses de la démo interactive | `src/modules/demo.js` |

### Vidéo
Le film de 60 s est un **vrai fichier MP4** (`public/media/ordra-film.mp4`, 1080p 60 i/s, + version mobile 540p et affiche JPEG), lu par un lecteur `<video>` natif : aucun calcul d'animation pendant la lecture.

Il est **généré à partir du code** : `npm run film` ouvre `tools/film.html`, capture le montage (`src/modules/film.js`) image par image, mixe la bande-son et encode avec ffmpeg. Modifiez le montage ou les textes, relancez la commande : la vidéo est à jour.

| Temps | Chapitre | Ce qu'on voit |
| --- | --- | --- |
| 0–5 s | Le chaos | « Lundi. 08:57. », avalanche de notifications, compteur de non-lus, cartons plein cadre « Trop d'outils. Trop d'onglets. » |
| 5–15 s | Le dashboard | Ligne de lumière → logo, le dashboard arrive en 3D, zooms caméra sur les KPI, le graphique puis l'insight IA |
| 15–30 s | Les fonctions | Six modules qui se « poussent » à chaque temps de la musique |
| 30–45 s | L'automatisation | Workflow, curseur qui active l'automatisation, notifications en cascade, semaine en accéléré |
| 45–55 s | Les résultats | Avant / après en volet, typographie cinétique, courbe de croissance |
| 55–60 s | À vous | Logo, promesse, bouton, prix d'appel |

**Montage** (d'après les pratiques des vidéos de lancement SaaS) : coupes sur le temps (120 BPM), typographie qui pousse l'interface, whooshes à attaque franche calés sur l'arrivée des mouvements de caméra, rampes de vitesse sur les zooms.

**Son** (`scripts/soundtrack.mjs`) : musique composée (Am–F–C–G), batterie, basse en sidechain, arpège avec delay ping-pong, réverbération, impacts et whooshes de synthèse, et **sons d'interface réels sous licence CC0** (bibliothèque [uisfx](https://github.com/romainsimon/uisfx) : notifications, clics, frappe, validation). Mastering ffmpeg à −14 LUFS (standard des plateformes).

Pour utiliser une autre vidéo (tournage, Higgsfield…), remplacez `videoUrl` dans `src/config.js` (fichier `.mp4`, lien YouTube ou Vimeo).

### Direction artistique
- Tokens (couleurs, polices, rayons) dans `:root` de `src/styles/base.css` ; composants dans `src/styles/lime.css`.
- Hero : titre court, cartes flottantes (chiffres, avis) autour du dashboard 3D, avatars.
- Avatars : illustrations DiceBear « Notionists » (licence CC0), générées par `node scripts/avatars.mjs` dans `src/data/avatars.js`.

## Contenus à remplacer avant mise en ligne

Ces éléments sont des **emplacements** et ne doivent pas être publiés en l'état :

- **Section Résultats** (`#preuves`) : 6 logos clients, 3 statistiques (`+XX %`, `XX h`, `XX %`), 2 témoignages. Tous sont marqués `data-placeholder` dans `index.html`.
- **Prix** (`src/config.js`) : abonnement 89 € / 249 € / sur devis, **frais d'installation** 490 € / 1 490 € / sur devis, remise annuelle de 20 % et installation offerte en annuel (`setupWaivedAnnual`). Le contenu de l'installation (sources connectées, workflows configurés, formation) est détaillé dans le tableau comparatif de `index.html` : à ajuster à votre offre réelle.
- **Calculateur** (`#calculateur`) : l'offre conseillée dépend de la taille d'équipe (≤ 3 Starter, ≤ 15 Pro, au-delà Enterprise), voir `initRoi()` dans `src/modules/extras.js`.
- **Affirmations à valider** par vous : réponses de la FAQ (sécurité, chiffrement, délai de mise en route, intégrations), « Sans engagement sur l'offre mensuelle » dans le CTA final, contenu des offres et du tableau comparatif.
- **Liens du footer** (À propos, Confidentialité, Conditions) : pointent vers le haut de page, à relier à vos vraies pages.

Les chiffres visibles dans les maquettes (128 450 €, 1 284 clients…) sont des données d'illustration de l'interface. La démo interactive l'indique (« Données d'exemple »).

## Structure

```
index.html                 toutes les sections (balisage sémantique, ARIA)
src/config.js              marque, CTA, vidéo, prix
src/main.js                point d'entrée
src/styles/                base (tokens), dashboard (maquette), sections-a/b
src/modules/
  dashboard.js             maquette du dashboard (1280×800, mise à l'échelle nette)
  hero.js                  entrée, rotation 3D souris, transformation au scroll
  cinematic.js             introduction cinématique épinglée
  video.js                 lecteur (vidéo réelle ou animatique)
  problem.js               fragments de données → convergence vers le dashboard
  story.js                 storytelling en 5 étapes qui modifie le dashboard
  features.js              modules interactifs (animations distinctes)
  core.js / core3d.js      noyau IA Three.js (chargé quand la section approche)
  demo.js                  démo : 6 onglets fonctionnels + assistant IA
  sections.js              avant/après, tarifs (+ installation), FAQ, CTA final
  film.js / sound.js       film de 60 s + bande-son Web Audio
  extras.js                bandeau d'outils, manifeste, cas d'usage horizontaux,
                           calculateur, palette ⌘K, rail de progression, cartes inclinables
  chrome.js                navigation, curseur, boutons magnétiques, CTA mobile
```

## Checklist de mise en ligne (intégrée)

| Élément | Où |
| --- | --- |
| Titres et meta descriptions uniques | chaque page HTML |
| Page de remerciement | `public/merci.html` (redirection après envoi si `formEndpoint` est renseigné) |
| robots.txt + sitemap.xml | `public/` (remplacez `votre-domaine.fr`) |
| Avis clients | section Résultats, `testimonials` dans la config |
| CTA collant mobile, CTA visible sans scroller | hero + barre en bas sur mobile |
| Fil d'Ariane | pages légales (+ `BreadcrumbList` en JSON-LD) |
| Confidentialité, mentions légales, conditions | `public/*.html` : **modèles à faire valider par un juriste** |
| Image de partage réseaux sociaux | `public/og.png` (1200×630) + balises Open Graph / Twitter |
| FAQ | section FAQ + `FAQPage` en JSON-LD |
| 404 personnalisée | `public/404.html` |
| Carte + itinéraire | section Contact (lien Google Maps construit depuis l'adresse de la config) |
| Temps de réponse | `company.responseTime` |
| Google Analytics | `gaId` : chargé uniquement après accord (bandeau cookies, RGPD) |
| Liens internes | nav, footer, palette ⌘K, liens entre pages |
| Schema LocalBusiness / Organization / SoftwareApplication | injectés au build par `scripts/seo-plugin.mjs` |
| Études de cas | `caseStudies` dans la config |
| Photos d'équipe | `team` dans la config (photos dans `public/equipe/`) |

**Contenu d'exemple :** avis, équipe, logos, statistiques et études de cas de `src/config.js` sont **fictifs** et marqués « Exemples illustratifs » sur la page tant que `exampleContent: true`. Remplacez-les par vos vrais clients et passez `exampleContent` à `false` avant la mise en ligne : publier de faux avis présentés comme réels est interdit (pratique commerciale trompeuse). Si une liste est vide, la page affiche des emplacements « À compléter ».

## Interactions ajoutées

- **Bandeau d'outils** sous le hero : défile en boucle et accélère quand on scrolle.
- **Manifeste** : le texte s'allume mot à mot au scroll.
- **Pour chaque équipe** : 5 cas d'usage (Direction, Ventes, Finance, Opérations, Service client) qui défilent horizontalement pendant le scroll vertical sur ordinateur, en carrousel au doigt sur mobile.
- **Calculateur** de temps récupéré avec curseurs, offre conseillée et délai d'amortissement de l'installation.
- **Palette ⌘K / Ctrl K** : navigation et actions rapides (lancer le film, essayer l'assistant IA, voir les tarifs en annuel…).
- **Rail de progression** à droite de l'écran (grand écran) et cartes qui s'inclinent sous la souris.
- **Bandeau géant** avant le CTA final, dont le sens et la vitesse suivent le scroll.

## Performance et accessibilité

- Three.js (~130 Ko gzip) n'est téléchargé qu'à l'approche de la section IA ; rendu en pause hors écran, particules réduites sur mobile, repli CSS sans WebGL.
- Aucune image bitmap : maquettes en HTML/SVG, nettes à toutes les résolutions.
- `prefers-reduced-motion` : pas de smooth scroll, pas d'épinglage ni d'animation au scroll, états finaux affichés directement.
- Navigation clavier complète : onglets de la démo (flèches, Début/Fin), slider avant/après (flèches, Maj pour aller plus vite), sélecteur de facturation, accordéons natifs `<details>`, lien d'évitement, focus visibles.
- Mobile : pas d'épinglage lourd, CTA collant en bas d'écran, aucun débordement horizontal.
