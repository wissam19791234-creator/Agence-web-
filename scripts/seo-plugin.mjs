// Plugin Vite : injecte l'URL canonique et les données structurées (JSON-LD)
// à partir de src/config.js et de la FAQ présente dans index.html.
import { CONFIG } from '../src/config.js';

const strip = (h) => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export function buildJsonLd(html) {
  const c = CONFIG.company;
  const url = c.siteUrl.replace(/\/$/, '');
  const faq = [...html.matchAll(/<details class="faq-item">\s*<summary><span>([\s\S]*?)<\/span>[\s\S]*?<div class="faq-a"><p>([\s\S]*?)<\/p><\/div>/g)]
    .map(([, q, a]) => ({ '@type': 'Question', name: strip(q), acceptedAnswer: { '@type': 'Answer', text: strip(a) } }));
  const { plans, currency } = CONFIG.pricing;
  const offers = Object.entries(plans).filter(([, v]) => v != null).map(([k, v]) => ({
    '@type': 'Offer', name: k[0].toUpperCase() + k.slice(1), price: String(v), priceCurrency: currency === '€' ? 'EUR' : currency,
  }));
  const graph = [
    { '@type': 'Organization', '@id': `${url}/#org`, name: CONFIG.brand, legalName: c.legalName, url, logo: `${url}/og.png`, email: c.email },
    {
      '@type': 'LocalBusiness', '@id': `${url}/#local`, name: CONFIG.brand, url, email: c.email, telephone: c.phone || undefined,
      image: `${url}/og.png`, openingHours: 'Mo-Fr 09:00-18:00',
      address: { '@type': 'PostalAddress', streetAddress: c.street, postalCode: c.postalCode, addressLocality: c.city, addressCountry: c.country },
    },
    {
      '@type': 'SoftwareApplication', name: CONFIG.brand, applicationCategory: 'BusinessApplication', operatingSystem: 'Web',
      description: 'Dashboard IA qui centralise les données, automatise les tâches et suit les performances de l’entreprise.', offers,
    },
    { '@type': 'WebSite', '@id': `${url}/#site`, url, name: CONFIG.brand, inLanguage: 'fr-FR' },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: `${url}/` }] },
  ];
  if (faq.length) graph.push({ '@type': 'FAQPage', mainEntity: faq });
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}

export function seoPlugin() {
  return {
    name: 'ordra-seo',
    transformIndexHtml(html) {
      return html
        .replaceAll('%SITE_URL%', CONFIG.company.siteUrl.replace(/\/$/, ''))
        .replace('<!--JSONLD-->', buildJsonLd(html));
    },
  };
}
