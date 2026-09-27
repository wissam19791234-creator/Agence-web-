# Ordra — Landing page Dashboard IA

Landing page de vente pour un dashboard IA : dark premium, maquette 3D du produit, storytelling au scroll, démo interactive, noyau IA en WebGL.

**Stack :** Vite · JavaScript (modules ES) · GSAP + ScrollTrigger · Lenis (smooth scroll) · Three.js (chargé à la demande).

```bash
npm install
npm run dev        # développement : http://localhost:5173
npm run build      # production : dist/
npm run preview    # prévisualiser le build
node scripts/build-artifact.mjs   # version « un seul fichier » : dist-artifact/ordra.html
```

## Personnaliser

| Quoi | Où |
| --- | --- |
| Nom de la marque, lien des CTA, URL de la vidéo, prix | `src/config.js` |
| Logo (monogramme SVG) | `logoMark()` dans `src/modules/dashboard.js` + favicon dans `index.html` |
| Textes, FAQ, fonctionnalités des offres | `index.html` |
| Couleurs, typographies, rayons, espacements | tokens `:root` dans `src/styles/base.css` |
| Données affichées dans la maquette du dashboard | `src/modules/dashboard.js` |
| Données et réponses de la démo interactive | `src/modules/demo.js` |

### Vidéo
Renseignez `videoUrl` dans `src/config.js` (fichier `.mp4`/`.webm`, lien YouTube ou Vimeo). Tant qu'elle est vide, le lecteur joue un **film intégré de 60 s** façon bande-annonce de lancement (`src/modules/film.js`) :

| Temps | Chapitre | Ce qu'on voit |
| --- | --- | --- |
| 0–5 s | Le chaos | « Lundi. 08:57. », avalanche de notifications, compteur de non-lus, caméra qui tremble, « Trop d'outils. Trop d'onglets. » |
| 5–15 s | Le dashboard | Ligne de lumière → logo, le dashboard arrive en 3D, zooms caméra sur les KPI, le graphique puis l'insight IA |
| 15–30 s | Les fonctions | Montage rapide de 6 modules (Analytics, Alertes, Clients, Rapports, Assistant, Performance) |
| 30–45 s | L'automatisation | Workflow qui se construit, curseur qui active l'automatisation, notifications en cascade, semaine en accéléré |
| 45–55 s | Les résultats | Avant / après en volet, typographie cinétique, courbe de croissance |
| 55–60 s | À vous | Logo, promesse, bouton « Commencer maintenant », prix d'appel |

La bande-son (120 BPM, synchronisée sur les coupes) est **générée dans le navigateur** (`src/modules/sound.js`) : aucun fichier audio, bouton pour couper le son. Ce film sert aussi de storyboard précis pour tourner la vraie vidéo.

### Couleurs
- `--signal` (bleu glace) : données, graphiques, états actifs.
- `--ai` (ambre) : tout ce que fait l'IA (insights, recommandations, alertes).
- Changer ces deux tokens suffit à recolorer tout le site, maquettes comprises.

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
