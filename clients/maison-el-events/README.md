# Maison EL Events : site vitrine et espace professionnel (démo)

Proposition Scalify pour Maison EL Events (Orléans) : site public, CRM de démonstration et parcours guidé.
Toutes les données sont fictives et restent dans le navigateur (localStorage pour les données, IndexedDB pour les photos).

## Direction artistique

Galerie de nuit : toile noire, texte blanc, grands titres en Inter (interlignage 0,78, sans ligatures) soulignés d'un trait court,
habillage et libellés en JetBrains Mono, boutons charbon (#444345) au trait givré (#E2E2E2), rayons 2 / 10 / 20 px, aucune ombre.
La couleur vient des visuels plein cadre (texte posé en bas à gauche) et de deux accents modifiables dans les paramètres :
rose (#EB516D) et or champagne (#D9B46A).

## Visuels

Ordre de priorité pour chaque emplacement (cover, coin-maries, svc-deco-tables, svc-buffets, menu-sucre, menu-sale, menu-mocktail, faq, gal-<id>…) :

1. photo importée dans l'espace pro (Photos et galerie) ;
2. vraie photo déposée dans `src/assets/demo/<emplacement>.jpg`, affichée avec la mention « Photo de démonstration » ;
3. visuel 3D de `src/assets/demo3d/<emplacement>.webp`, affiché avec la mention « Visuel 3D de démonstration ».

Une variante `<emplacement>@m` (portrait) est servie aux écrans étroits.

- `node scripts/render3d/render.cjs` refait les visuels 3D (three.js dans Chromium sans affichage ; `--preview` pour des aperçus rapides dans `.render-preview/`, ou un nom de prise pour n'en refaire qu'une).
- `node scripts/fetch-demo-photos.mjs` récupère et compresse les photos générées pour la démo (accès réseau au domaine des images requis).

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
