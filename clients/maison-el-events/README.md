# Maison EL Events : site vitrine et espace professionnel (démo)

Proposition Scalify pour Maison EL Events (Orléans) : site public, CRM de démonstration et parcours guidé.
Toutes les données sont fictives et restent dans le navigateur (localStorage pour les données, IndexedDB pour les photos).

## Direction artistique

Atelier éditorial sombre : toile noire, typographie Tinos (équivalent de Times New Roman) pour les grands titres, Inter pour le texte, un seul accent corail (#EB516D) par écran, boutons pilule au trait, filets gris, aucune ombre.

## Photos

- Photos de démonstration : déposer `src/assets/demo/<emplacement>.jpg` (cover, coin-maries, svc-deco-tables, svc-buffets, svc-traiteur, menu-sucre, menu-sale, menu-mocktail, gal-<id>…). Elles s'affichent avec la mention « Photo de démonstration ».
- `node scripts/fetch-demo-photos.mjs` récupère et compresse les photos générées pour la démo (accès réseau au domaine des images requis).
- Les photos importées dans l'espace pro passent devant les photos de démonstration.

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
| `src/site` | Pages publiques : accueil, prestations, menu, galerie, tarifs et simulateur, demande de devis en 5 étapes, présentation privée, mentions légales |
| `src/pro` | Espace professionnel : tableau de bord, prospects, pipeline (7 colonnes), devis, calendrier, catalogue, tâches, rentabilité, photos, paramètres |
| `src/components` | Composants partagés : interface, graphiques, visuels temporaires, parcours guidé |

## Règles de la démonstration

- Tarifs communiqués : décoration de table 7,50 € par personne, mignardises 1 € la pièce, cocktails et mocktails 4 € la pièce, coin mariés 60 €. Installation et déplacement sur devis.
- Les devis enregistrent le prix unitaire au moment de leur création : modifier le catalogue ne change pas les anciens devis.
- Aucun envoi réel (e-mail, SMS, paiement, réservation). Les statuts « envoyé », « accepté » et « réservation confirmée » sont des simulations.
- Coordonnées, mentions légales et avis réels sont à compléter par l'entreprise.

## À connecter pour la production

Hébergement et nom de domaine, prérendu des pages pour le référencement, base de données et authentification (par exemple Supabase),
stockage des photos, envoi des demandes et des devis par e-mail, impression et PDF, paiement d'acompte, synchronisation d'agenda.
