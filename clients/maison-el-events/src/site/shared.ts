import type { ArtKind, GalleryItem, ServiceKey } from '../lib/types';

export const SERVICE_ART: Record<ServiceKey, ArtKind> = {
  'deco-tables': 'table', mariage: 'canape', buffets: 'buffet', location: 'salon', traiteur: 'mignardise', mignardises: 'verrine', mocktails: 'mocktail',
};

/** Clé de la photo d'un élément de galerie (une par élément). */
export const galKey = (g: GalleryItem) => g.imageKey || `gal-${g.id}`;
