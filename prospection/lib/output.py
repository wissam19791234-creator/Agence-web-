"""Fichiers de sortie : CSV, JSON et page HTML de cartes prospects."""
import csv
import html
import json
from datetime import datetime
from pathlib import Path

from lib.sources import norm

RESULTS = Path(__file__).resolve().parent.parent / "results"
CSV_FIELDS = ["score", "name", "country", "city", "sector", "address", "problem", "why", "website", "site_status",
              "email", "phone", "whatsapp_number", "maps_url", "instagram", "tiktok", "facebook", "linkedin",
              "rating", "reviews", "email_subject", "email_body", "mailto", "dm", "whatsapp_link", "action", "source", "id"]


def save(prospects, stamp=None):
    RESULTS.mkdir(exist_ok=True)
    stamp = stamp or datetime.now().strftime("%Y-%m-%d_%H%M")
    csv_path, json_path = RESULTS / f"prospects_{stamp}.csv", RESULTS / f"prospects_{stamp}.json"
    html_path = RESULTS / f"messages_{stamp}.html"
    with csv_path.open("w", encoding="utf-8-sig", newline="") as f:  # utf-8-sig : s'ouvre bien dans Excel
        w = csv.DictWriter(f, fieldnames=CSV_FIELDS, extrasaction="ignore")
        w.writeheader()
        for p in prospects:
            w.writerow({**p, "why": " | ".join(p["why"])})
    json_path.write_text(json.dumps(prospects, ensure_ascii=False, indent=2), encoding="utf-8")
    html_path.write_text(render_html(prospects, stamp), encoding="utf-8")
    return csv_path, json_path, html_path


def _e(v):
    return html.escape(str(v or ""))


def _link(url, label=None):
    if not url:
        return "<span class=muted>—</span>"
    return f'<a href="{_e(url)}" target="_blank" rel="noopener">{_e(label or url)}</a>'


def _copy(text, label):
    if not text:
        return ""
    return f'<button class="btn" data-copy="{_e(text)}">{_e(label)}</button>'


def card(p):
    rows = [
        ("Pays", _e(p["country"])), ("Ville", _e(p["city"])), ("Secteur", _e(p["sector"])),
        ("Pourquoi intéressant", "<br>".join(_e(w) for w in p["why"])),
        ("Problème détecté", _e(p["problem_label"]) + (f' <small class=muted>({_e(", ".join(p["site_reasons"]))})</small>' if p.get("site_reasons") else "")),
        ("Site web trouvé", _link(p["website"])),
        ("Email", _link(f"mailto:{p['email']}", p["email"]) if p["email"] else "<span class=muted>—</span>"),
        ("Téléphone", _link(f"tel:{p['phone']}", p["phone"]) if p["phone"] else "<span class=muted>—</span>"),
        ("WhatsApp", _link(p["whatsapp_link"], "+" + p["whatsapp_number"]) if p["whatsapp_link"] else "<span class=muted>—</span>"),
        ("Google Maps", _link(p["maps_url"], "Ouvrir la fiche")),
        ("Instagram", _link(p["instagram"])), ("TikTok", _link(p["tiktok"])),
        ("LinkedIn", _link(p["linkedin"])), ("Facebook", _link(p["facebook"])),
        ("Sujet email", _e(p["email_subject"])),
    ]
    dl = "".join(f"<dt>{k}</dt><dd>{v}</dd>" for k, v in rows)
    mailto = f'<a class="btn primary" href="{_e(p["mailto"])}">Ouvrir l’email prêt ✉</a>' if p["mailto"] else ""
    level = "hot" if p["score"] >= 80 else "warm"
    stop_line = f'email,{p["email"]},STOP' if p["email"] else f'name,"{p["name"]} {p["city"]}",STOP'
    return f"""<article class="card" data-search="{_e(norm(p['name'] + ' ' + p['city'] + ' ' + p['sector']))}" data-score="{p['score']}">
  <header><h2>{_e(p['name'])}</h2><span class="score {level}">{p['score']}</span></header>
  <p class="action">➜ {_e(p['action'])}</p>
  <dl>{dl}</dl>
  <h3>Message email</h3><pre>{_e(p['email_body'])}</pre>
  <div class="row">{mailto}{_copy(p['email_body'], 'Copier l’email')}</div>
  <h3>Message DM (Instagram / TikTok / WhatsApp)</h3><pre>{_e(p['dm'])}</pre>
  <div class="row">{_copy(p['dm'], 'Copier le DM')}{_link(p['instagram'], 'Ouvrir Instagram') if p['instagram'] else ''}
    {_link(p['tiktok'], 'Ouvrir TikTok') if p['tiktok'] else ''}{f'<a class="btn" href="{_e(p["whatsapp_link"])}" target="_blank">WhatsApp</a>' if p['whatsapp_link'] else ''}</div>
  <div class="row foot"><label><input type="checkbox" class="done"> Contacté</label>{_copy(stop_line, 'Refus → copier la ligne do_not_contact')}</div>
</article>"""


def render_html(prospects, stamp):
    cards = "\n".join(card(p) for p in prospects) or "<p>Aucun prospect au-dessus du score minimum.</p>"
    return f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prospects {stamp}</title><style>
:root{{--bg:#f6f5f1;--card:#fff;--ink:#111;--muted:#6b6b6b;--line:#111;--hot:#55db9c;--warm:#ffd731;--accent:#5c4ade}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}}
.top{{position:sticky;top:0;z-index:2;display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:14px 16px;background:var(--bg);border-bottom:1px solid var(--line)}}
.top h1{{margin:0 auto 0 0;font-size:20px}}.top input{{padding:9px 14px;border:1px solid var(--line);border-radius:999px;font:inherit;min-width:220px}}
main{{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:16px;padding:16px;max-width:1500px;margin:0 auto}}
@media(max-width:440px){{main{{grid-template-columns:1fr}}}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:18px;display:grid;gap:8px;align-content:start}}
.card.is-done{{opacity:.45}}.card header{{display:flex;justify-content:space-between;gap:10px;align-items:start}}
.card h2{{margin:0;font-size:19px}}.card h3{{margin:8px 0 0;font-size:13px;text-transform:uppercase;letter-spacing:.04em}}
.score{{flex:none;display:grid;place-items:center;width:46px;height:46px;border-radius:50%;border:1px solid var(--line);font-weight:800}}
.score.hot{{background:var(--hot)}}.score.warm{{background:var(--warm)}}
.action{{margin:0;padding:8px 12px;border-radius:12px;background:#ece9ff;font-weight:700}}
dl{{display:grid;grid-template-columns:150px 1fr;gap:4px 10px;margin:0;font-size:14px}}dt{{color:var(--muted);font-weight:600}}dd{{margin:0;overflow-wrap:anywhere}}
pre{{white-space:pre-wrap;margin:0;padding:12px;border-radius:12px;background:#f3f3f0;font-family:inherit;font-size:13.5px;line-height:1.45;max-height:220px;overflow:auto}}
.row{{display:flex;flex-wrap:wrap;gap:8px;align-items:center}}.foot{{margin-top:4px;padding-top:10px;border-top:1px dashed #0003;justify-content:space-between}}
.btn,.row a{{display:inline-flex;align-items:center;padding:8px 13px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--ink);font-family:inherit;font-size:13px;font-weight:600;line-height:1;text-decoration:none;cursor:pointer}}
.btn.primary{{background:var(--ink);color:#fff}}.btn.ok{{background:var(--hot)}}a{{color:var(--accent)}}.muted{{color:var(--muted)}}
</style></head><body>
<div class="top"><h1>{len(prospects)} prospect(s) · {stamp}</h1><input id="q" placeholder="Filtrer (nom, ville, secteur)"><label>Score ≥ <input id="min" type="number" value="0" style="min-width:0;width:80px"></label></div>
<main>{cards}</main>
<script>
document.addEventListener('click',e=>{{const b=e.target.closest('[data-copy]');if(!b)return;navigator.clipboard.writeText(b.dataset.copy).then(()=>{{const t=b.textContent;b.textContent='Copié ✓';b.classList.add('ok');setTimeout(()=>{{b.textContent=t;b.classList.remove('ok')}},1400)}})}});
const key='done-{stamp}';let done={{}};try{{done=JSON.parse(localStorage.getItem(key)||'{{}}')}}catch(e){{}}
document.querySelectorAll('.card').forEach((c,i)=>{{const cb=c.querySelector('.done');cb.checked=!!done[i];c.classList.toggle('is-done',cb.checked);
cb.addEventListener('change',()=>{{done[i]=cb.checked;c.classList.toggle('is-done',cb.checked);try{{localStorage.setItem(key,JSON.stringify(done))}}catch(e){{}}}})}});
function f(){{const q=document.getElementById('q').value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''),m=+document.getElementById('min').value||0;
document.querySelectorAll('.card').forEach(c=>c.style.display=(c.dataset.search.includes(q)&&+c.dataset.score>=m)?'':'none')}}
document.getElementById('q').oninput=f;document.getElementById('min').oninput=f;
</script></body></html>"""
