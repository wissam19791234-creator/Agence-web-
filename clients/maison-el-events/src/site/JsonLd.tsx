import { useEffect } from 'react';
import { useStore } from '../lib/store';

/** Données structurées limitées aux informations vérifiées (nom, ville, réseau social connu). */
export function JsonLd() {
  const { data } = useStore();
  const s = data.settings;
  useEffect(() => {
    const json: Record<string, unknown> = {
      '@context': 'https://schema.org', '@type': 'LocalBusiness', name: s.businessName,
      address: { '@type': 'PostalAddress', addressLocality: s.city, addressCountry: 'FR', ...(s.address ? { streetAddress: s.address } : {}) },
      areaServed: s.city,
      ...(s.phone ? { telephone: s.phone } : {}), ...(s.email ? { email: s.email } : {}),
      ...(s.tiktok ? { sameAs: [`https://www.tiktok.com/@${s.tiktok}`] } : {}),
    };
    let el = document.getElementById('mel-jsonld');
    if (!el) { el = document.createElement('script'); el.id = 'mel-jsonld'; el.setAttribute('type', 'application/ld+json'); document.head.appendChild(el); }
    el.textContent = JSON.stringify(json);
  }, [s.businessName, s.city, s.address, s.phone, s.email, s.tiktok]);
  return null;
}
