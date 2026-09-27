// Paramètres : profil, workspace, sources de données (état vide), notifications, équipe,
// abonnement, zone sensible.
import { api } from '../../shared/api.js';
import { CONFIG } from '../../config.js';
import { icon } from '../../shared/icons.js';
import { href } from '../../shared/paths.js';
import { esc, wait } from '../../shared/ui.js';
import { pageHead, empty } from '../widgets.js';

const TABS = [['profile', 'Profil', 'users'], ['sources', 'Sources de données', 'database'], ['notifications', 'Notifications', 'bell'], ['team', 'Équipe', 'users'], ['billing', 'Abonnement', 'doc'], ['danger', 'Zone sensible', 'alert']];

export async function render(el, app) {
  const [s, sources] = await Promise.all([api.session(), api.sources()]);
  el.innerHTML = `
    ${pageHead({ title: 'Paramètres', sub: 'Workspace « Maison Demo »' })}
    <div class="settings">
      <nav class="stabs" aria-label="Sections des paramètres">${TABS.map(([id, l, ic]) => `<a href="#${id}" data-tab="${id}">${icon(ic, 15)}${l}</a>`).join('')}</nav>
      <div class="spanes">
        <section class="card spane" id="profile">
          <h2>Profil</h2>
          <form class="sform" data-profile>
            <div class="field"><label for="p-name">Nom</label><input id="p-name" class="input" name="name" value="${esc(s.user.name)}" /></div>
            <div class="field"><label for="p-email">Email</label><input id="p-email" class="input" name="email" type="email" value="${esc(s.user.email)}" /></div>
            <button class="btn btn--primary btn--sm" type="submit">Enregistrer</button>
          </form>
        </section>

        <section class="card spane" id="sources">
          <h2>Sources de données</h2>
          ${sources.some((x) => x.id !== 'demo')
            ? `<ul class="srcs">${sources.map((x) => `<li>${icon('database', 15)}<b>${esc(x.name)}</b><span class="pill ${x.status === 'connected' ? 'pill--good' : 'pill--warn'}">${x.status === 'connected' ? 'Connectée' : 'En attente'}</span></li>`).join('')}</ul>`
            : empty({ ic: 'database', title: 'Aucune source réelle connectée.', text: 'Connectez votre première source pour débloquer les insights IA sur vos propres données. En attendant, ce workspace utilise des données de démonstration.', action: '<button type="button" class="btn btn--primary" data-connect>Connecter des données</button>' })}
          <div class="connectors" data-connectors hidden>
            <p class="w-sub">Choisissez une source. Les connecteurs marqués « Bientôt » arrivent : nous vous prévenons dès leur ouverture.</p>
            <ul>${CONFIG.integrations.map((i) => `<li><button type="button" class="conn" data-conn="${esc(i.name)}"><span class="integ-logo">${esc(i.name.split(/\s/).map((w) => w[0]).join('').slice(0, 2))}</span><b>${esc(i.name)}</b><span class="pill">${i.status === 'available' ? 'Disponible' : 'Bientôt'}</span></button></li>`).join('')}</ul>
          </div>
        </section>

        <section class="card spane" id="notifications">
          <h2>Notifications</h2>
          <ul class="prefs">
            ${[['Briefing du matin', 'Chaque jour à 8 h, par email.', true], ['Anomalies détectées', 'Dès que l’IA repère un écart inhabituel.', true], ['Objectifs', 'Quand un objectif est atteint ou en retard.', true], ['Rapport hebdomadaire', 'Chaque lundi.', false]]
              .map(([t, d, on]) => `<li><div><b>${t}</b><small>${d}</small></div><button type="button" class="switch" role="switch" aria-checked="${on}" data-pref aria-label="${t}"></button></li>`).join('')}
          </ul>
        </section>

        <section class="card spane" id="team">
          <h2>Équipe</h2>
          <ul class="members"><li><span class="avatar avatar--sm">${esc(s.user.initials || 'VO')}</span><div><b>${esc(s.user.name)}</b><small>${esc(s.user.email)}</small></div><span class="pill">Propriétaire</span></li></ul>
          <form class="invite" data-invite novalidate>
            <label class="sr-only" for="inv">Email à inviter</label>
            <input id="inv" class="input" type="email" name="email" placeholder="collegue@entreprise.fr" required />
            <select class="select" name="role" aria-label="Rôle"><option>Lecteur</option><option>Éditeur</option><option>Admin</option></select>
            <button class="btn btn--secondary" type="submit">Inviter</button>
          </form>
          <p class="field-err" data-inv-err hidden>${icon('alert', 13)} Adresse email invalide.</p>
        </section>

        <section class="card spane" id="billing">
          <h2>Abonnement</h2>
          <div class="plan-now"><div><small>Offre actuelle</small><b>Free · workspace de démonstration</b></div><a class="btn btn--primary btn--sm" href="${href('/pricing/')}">Voir les offres</a></div>
        </section>

        <section class="card spane spane--danger" id="danger">
          <h2>Zone sensible</h2>
          <div class="danger-row"><div><b>Réinitialiser la démonstration</b><small>Efface vos objectifs, automatisations et préférences de ce navigateur.</small></div><button type="button" class="btn btn--secondary btn--sm" data-reset>Réinitialiser</button></div>
          <div class="danger-row"><div><b>Exporter toutes les données</b><small>Archive CSV de tous vos indicateurs.</small></div><button type="button" class="btn btn--secondary btn--sm" data-export-all>Exporter</button></div>
        </section>
      </div>
    </div>`;

  const tabs = [...el.querySelectorAll('[data-tab]')];
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) tabs.forEach((t) => t.toggleAttribute('aria-current', t.dataset.tab === e.target.id));
  }), { rootMargin: '-30% 0px -60% 0px' });
  el.querySelectorAll('.spane').forEach((p) => io.observe(p));
  tabs.forEach((t) => t.addEventListener('click', (e) => { e.preventDefault(); el.querySelector(`#${t.dataset.tab}`).scrollIntoView({ behavior: 'smooth', block: 'start' }); }));

  el.querySelector('[data-profile]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const b = e.target.querySelector('button');
    b.classList.add('is-loading');
    await api.saveOnboarding({ name: e.target.elements.name.value, email: e.target.elements.email.value, goals: s.goals });
    b.classList.remove('is-loading');
    app.toast('Profil enregistré.', { tone: 'success' });
  });
  el.querySelector('[data-connect]')?.addEventListener('click', (e) => { e.currentTarget.closest('.empty').hidden = true; el.querySelector('[data-connectors]').hidden = false; });
  el.addEventListener('click', async (e) => {
    const c = e.target.closest('[data-conn]');
    if (c) { app.toast(`${c.dataset.conn} : nous vous prévenons dès l’ouverture du connecteur.`, { tone: 'success' }); c.querySelector('.pill').textContent = 'Demandé'; }
    const p = e.target.closest('[data-pref]');
    if (p) { const on = p.getAttribute('aria-checked') !== 'true'; p.setAttribute('aria-checked', String(on)); app.toast(on ? 'Notification activée.' : 'Notification désactivée.'); }
    if (e.target.closest('[data-reset]')) {
      app.openModal(`<h2 class="modal-t">Réinitialiser la démonstration ?</h2><p class="modal-s">Vos objectifs, automatisations et préférences locales seront effacés. Cette action est définitive.</p><div class="modal-a"><button type="button" class="btn btn--ghost" data-modal-close>Annuler</button><button type="button" class="btn btn--danger" data-confirm>Réinitialiser</button></div>`, {
        label: 'Confirmation',
        onMount: (box) => box.querySelector('[data-confirm]').addEventListener('click', () => { api.reset(); app.closeModal(); app.toast('Démonstration réinitialisée.', { tone: 'success' }); app.go('overview'); }),
      });
    }
    if (e.target.closest('[data-export-all]')) {
      const b = e.target.closest('[data-export-all]');
      b.classList.add('is-loading');
      await wait(800);
      b.classList.remove('is-loading');
      app.toast('Export prêt : utilisez « Exporter CSV » dans Analyses pour chaque indicateur.', { tone: 'success' });
    }
  });
  el.querySelector('[data-invite]').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const err = el.querySelector('[data-inv-err]');
    if (!f.elements.email.checkValidity() || !f.elements.email.value) { f.elements.email.setAttribute('aria-invalid', 'true'); err.hidden = false; return; }
    f.elements.email.removeAttribute('aria-invalid');
    err.hidden = true;
    const b = f.querySelector('button');
    b.classList.add('is-loading');
    await wait(600);
    b.classList.remove('is-loading');
    el.querySelector('.members').insertAdjacentHTML('beforeend', `<li><span class="avatar avatar--sm">${esc(f.elements.email.value.slice(0, 2).toUpperCase())}</span><div><b>${esc(f.elements.email.value)}</b><small>Invitation envoyée</small></div><span class="pill">${esc(f.elements.role.value)}</span></li>`);
    app.toast('Invitation envoyée.', { tone: 'success' });
    f.reset();
  });
  return { destroy: () => io.disconnect() };
}
