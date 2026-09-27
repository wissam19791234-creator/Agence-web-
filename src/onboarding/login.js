// Connexion (démonstration) : validation, état de chargement, erreur, lien magique.
import '../styles/tokens.css';
import '../styles/auth.css';

import { icon } from '../shared/icons.js';
import { href, rewriteLinks } from '../shared/paths.js';
import { wait } from '../shared/ui.js';

rewriteLinks();
const f = document.querySelector('[data-login]');
const err = f.querySelector('[data-err]');
const fail = (msg, field) => {
  err.innerHTML = `${icon('alert', 13)} ${msg}`;
  err.hidden = false;
  field?.setAttribute('aria-invalid', 'true');
  field?.focus();
};
f.addEventListener('input', (e) => { e.target.removeAttribute('aria-invalid'); err.hidden = true; });
f.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { email, password } = f.elements;
  if (!email.value || !email.checkValidity()) return fail(email.value ? 'Cette adresse email ne semble pas valide.' : 'Indiquez votre email.', email);
  if (password.value.length < 6) return fail('Email ou mot de passe incorrect.', password);
  const b = f.querySelector('[type="submit"]');
  b.classList.add('is-loading');
  await wait(700);
  location.href = href('/app/');
});
document.querySelector('[data-magic]').addEventListener('click', async (e) => {
  e.preventDefault();
  const { email } = f.elements;
  if (!email.value || !email.checkValidity()) return fail('Indiquez votre email pour recevoir le lien.', email);
  e.currentTarget.textContent = 'Envoi…';
  await wait(700); // À brancher : POST /auth/magic-link sur votre backend
  f.hidden = true;
  document.querySelector('[data-magic-done]').hidden = false;
});
