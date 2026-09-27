// Copilot IA en pleine page : conversation + panneau de contexte (données lues par l'IA).
import { api } from '../../shared/api.js';
import { mountCopilot } from '../../shared/copilot-ui.js';
import { icon } from '../../shared/icons.js';
import { fmt, trendBadge } from '../../shared/ui.js';
import { pageHead } from '../widgets.js';

export async function render(el) {
  const metrics = await api.metrics('30d');
  el.innerHTML = `
    ${pageHead({ title: 'Copilot IA', sub: 'Posez vos questions en langage naturel. Chaque réponse cite les données utilisées.' })}
    <div class="aip">
      <div class="card aip-chat" id="page-cp"></div>
      <aside class="card aip-ctx">
        <h2>${icon('database', 15)} Ce que l’IA lit</h2>
        <p class="w-sub">Workspace « Maison Demo » · 30 derniers jours</p>
        <ul class="aip-metrics">${metrics.map((m) => `<li><span>${m.label}</span><b class="num">${fmt.by(m.format, m.value)}</b>${trendBadge(m.delta)}</li>`).join('')}</ul>
        <div class="aip-tips">
          <h3>Astuces</h3>
          <ul>
            <li>${icon('search', 13)} Sélectionnez un chiffre n’importe où, puis « Expliquer ceci ».</li>
            <li>${icon('dots', 13)} Menu « … » d’un widget : Pourquoi ? Que faire ?</li>
            <li><kbd>⌘J</kbd> ouvre le Copilot depuis toutes les pages.</li>
          </ul>
        </div>
      </aside>
    </div>`;
  mountCopilot(el.querySelector('#page-cp'), { context: () => ({ page: 'ai' }) });
  return {};
}
