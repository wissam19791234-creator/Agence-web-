// Titres « display » (Anton, interligne serré) : une ligne par <span class="dl">.
// Les capitales accentuées dépassent de 0,25 em et le Ç descend de 0,3 em :
// seules les lignes concernées reçoivent un espace supplémentaire au-dessus.
const ACCENT = /[àâäéèêëîïôöùûüÿ]/i;
const CEDILLA = /ç/i;

export function displayLines(html) {
  const lines = html.split(/<br\s*\/?>/i).map((l) => l.trim()).filter(Boolean);
  return lines.map((line, i) => {
    const cls = i === 0 ? '' : CEDILLA.test(lines[i - 1]) ? ' dl--c' : ACCENT.test(line.replace(/<[^>]+>/g, '')) ? ' dl--a' : '';
    return `<span class="dl${cls}">${line}</span>`;
  }).join('');
}

/** Applique displayLines() à chaque titre .display d'un document HTML qui contient des <br>. */
export function splitDisplayTitles(html) {
  return html.replace(/<(h[1-3]|p)(\s[^>]*class="[^"]*\bdisplay\b[^"]*"[^>]*)>([\s\S]*?)<\/\1>/g, (all, tag, attrs, inner) =>
    (/<br\s*\/?>/i.test(inner) ? `<${tag}${attrs}>${displayLines(inner)}</${tag}>` : all));
}

/**
 * Petits écrans : réduit la taille d'un titre .display dès qu'une de ses lignes dépasse
 * la largeur disponible (sinon la ligne se replierait et les accents chevaucheraient).
 */
export function fitDisplayTitles() {
  document.documentElement.classList.add('dl-fit');
  const run = () => document.querySelectorAll('.display').forEach((el) => {
    const lines = el.querySelectorAll(':scope > .dl');
    const box = el.parentElement;
    if (!lines.length || !box) return;
    el.style.fontSize = '';
    const cs = getComputedStyle(box);
    const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const widest = Math.max(...[...lines].map((l) => l.scrollWidth));
    if (widest > avail) el.style.fontSize = `${Math.floor(parseFloat(getComputedStyle(el).fontSize) * (avail / widest) * 0.98)}px`;
  });
  let raf = 0;
  const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(run); };
  schedule();
  document.fonts?.ready.then(schedule);
  window.addEventListener('resize', schedule);
}
