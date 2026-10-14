# Maison EL Events : site vitrine et espace professionnel (démo)

Proposition Scalify pour Maison EL Events (Orléans) : site public, CRM de démonstration et parcours guidé.
Toutes les données sont fictives et restent dans le navigateur (localStorage pour les données, IndexedDB pour les photos).

## Direction artistique

« Luxe discret » : nuit océane (#070F17), or champagne (#C59B5F, modifiable dans les paramètres) et albâtre (#FAF8F5).
Titres en Cormorant Garamond, texte en Inter, sur-titres en petites capitales précédés d'un filet doré, boutons pilule dorés.

Animations (GSAP + ScrollTrigger, défilement doux Lenis, carrousel Swiper) :
ouverture épinglée en trois temps au défilement, apparitions en fondu, parallaxe des photos, compteurs de tarifs,
cartes de prestations à onglets avec fiche détail, carrousel d'événements, simulateur de budget animé.
Tout est désactivé quand le système demande de réduire les animations.

## Visuels

Ordre de priorité pour chaque emplacement (cover, coin-maries, svc-deco-tables, svc-buffets, menu-sucre, menu-sale, menu-mocktail, gal-arche, evt-…) :

1. photo importée dans l'espace pro (Photos et galerie) ;
2. visuel de `src/assets/demo/<emplacement>.webp`, affiché avec la mention « Visuel de démonstration ».

Les visuels actuels ont été générés pour la démonstration (Figma, génération d'images) : ils ne représentent pas des réalisations
de Maison EL Events et doivent être remplacés par ses vraies photos avant toute mise en ligne.
Les scènes 3D de `scripts/render3d` restent disponibles pour produire des visuels hors ligne.

## Horaires et FAQ

Aucun horaire public n'a été trouvé pour Maison EL Events : le site affiche « À confirmer » tant que les champs
« Horaires et infos pratiques » des paramètres sont vides. La FAQ (page `#faq` et bloc de l'accueil) ne reprend que les informations
communiquées ; elle se modifie dans Paramètres, et ses variables (`{deco}`, `{coin}`, `{menu-sucre}`…) suivent le catalogue.

## Lancer

```bash
npm install
npm run dev        # développement
npm run build      # vérification TypeScript + build en un seul fichier (dist/index.html)
npm run artifact   # build + fragment pour l'aperçu hébergé (artifact/index.html)
```

## Structure

| Dossier | Contenu |
|---|---|
| `src/lib` | Modèle de données (`types.ts`), données d'exemple (`seed.ts`), calculs de devis et simulateur (`calc.ts`), opérations métier (`actions.ts`), stockage (`store.tsx`), photos (`images.tsx`), routes (`router.ts`) |
| `src/site` | Pages publiques : accueil, prestations, menu, galerie, tarifs et simulateur, FAQ et infos pratiques, demande de devis en 5 étapes, présentation privée, mentions légales |
| `src/pro` | Espace professionnel : tableau de bord, prospects, pipeline (7 colonnes), devis, calendrier, catalogue, tâches, rentabilité, photos, paramètres |
| `src/components` | Composants partagés : interface, graphiques, visuels et fonds plein cadre, parcours guidé |
| `scripts/render3d` | Scènes 3D des visuels de démonstration et script de rendu |

## Règles de la démonstration

- Tarifs communiqués : décoration de table 7,50 € par personne, mignardises 1 € la pièce, cocktails et mocktails 4 € la pièce, coin mariés 60 €. Installation et déplacement sur devis.
- Les devis enregistrent le prix unitaire au moment de leur création : modifier le catalogue ne change pas les anciens devis.
- Aucun envoi réel (e-mail, SMS, paiement, réservation). Les statuts « envoyé », « accepté » et « réservation confirmée » sont des simulations.
- Coordonnées, mentions légales et avis réels sont à compléter par l'entreprise.

## À connecter pour la production

Hébergement et nom de domaine, prérendu des pages pour le référencement, base de données et authentification (par exemple Supabase),
stockage des photos, envoi des demandes et des devis par e-mail, impression et PDF, paiement d'acompte, synchronisation d'agenda.
