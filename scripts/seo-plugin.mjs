// Plugin Vite : URL canonique et données structurées (JSON-LD) à partir de src/config.js
// et de la FAQ présente dans la page.
import { CONFIG } from '../src/config.js';

const strip = (h) => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export function buildJsonLd(html) {
  const c = CONFIG.company;
  const url = c.siteUrl.replace(/\/$/, '');
  const faq = [...html.matchAll(/<details class="faq-item"><summary><span>([\s\S]*?)<\/span>[\s\S]*?<div class="faq-a"><p>([\s\S]*?)<\/p><\/div>/g)]
    .map(([, q, a]) => ({ '@type': 'Question', name: strip(q), acceptedAnswer: { '@type': 'Answer', text: strip(a) } }));
  const offers = CONFIG.pricing.plans.map((p) => ({ '@type': 'Offer', name: p.name, price: String(p.price), priceCurrency: 'EUR' }));
  const graph = [
    { '@type': 'Organization', '@id': `${url}/#org`, name: CONFIG.brand, url, logo: `${url}/og.png`, email: c.email },
    { '@type': 'SoftwareApplication', name: CONFIG.brand, applicationCategory: 'BusinessApplication', operatingSystem: 'Web', description: CONFIG.tagline, offers },
    { '@type': 'WebSite', '@id': `${url}/#site`, url, name: CONFIG.brand, inLanguage: 'fr-FR' },
  ];
  if (faq.length) graph.push({ '@type': 'FAQPage', mainEntity: faq });
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`;
}

export function seoPlugin() {
  return {
    name: 'scalify-seo',
    transformIndexHtml(html) {
      return html
        .replaceAll('%SITE_URL%', CONFIG.company.siteUrl.replace(/\/$/, ''))
        .replace('<!--JSONLD-->', buildJsonLd(html));
    },
  };
}
