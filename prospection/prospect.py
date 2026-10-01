#!/usr/bin/env python3
"""Prospection semi-automatique de commerces locaux.

Trouve des commerces, analyse leur présence en ligne, calcule un score et prépare
emails / DM. Les DM réseaux sociaux s'envoient à la main depuis le fichier HTML.

Exemples :
  python prospect.py --country France --city Paris --sector "clinique esthétique" --limit 20 --mode both --send-email false
  python prospect.py --test --city Lyon --sector boulangerie
  python prospect.py --batch --country France --limit 30
"""
import argparse
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import config  # noqa: E402
from lib import analyze, mailer, messages, output, scoring, sources  # noqa: E402
from lib.dnc import ContactLog, DoNotContact  # noqa: E402
from lib.net import Net  # noqa: E402

FRENCH = {"France", "Belgique", "Belgium", "Suisse", "Switzerland", "Luxembourg", "Maroc", "Morocco", "Canada"}
STATE = output.RESULTS / "batch_state.json"


def parse_args():
    a = argparse.ArgumentParser(description="Prospection semi-automatique de commerces locaux")
    a.add_argument("--country", default="France")
    a.add_argument("--city")
    a.add_argument("--sector")
    a.add_argument("--limit", type=int, default=20, help="prospects à trouver (conseillé : 20, 30 ou 50)")
    a.add_argument("--mode", choices=["email_only", "social_only", "both"], default="both")
    a.add_argument("--send-email", choices=["true", "false"], default="false")
    a.add_argument("--lang", choices=["fr", "en"])
    a.add_argument("--min-score", type=int, default=config.MIN_SCORE)
    a.add_argument("--test", action="store_true", help=f"mode test : {config.TEST_LIMIT} prospects max, aucun envoi")
    a.add_argument("--batch", action="store_true", help="lots : toutes les villes × secteurs de config.py (reprise auto)")
    a.add_argument("--no-web-search", action="store_true", help="n'utilise pas la recherche web publique")
    a.add_argument("--js", action="store_true", help="rend les sites JavaScript avec Playwright (plus lent)")
    a.add_argument("--include-contacted", action="store_true", help="garde les prospects déjà emailés")
    a.add_argument("--stop", metavar="VALEUR", help="ajoute un email / téléphone / @compte / domaine à do_not_contact")
    a.add_argument("--sync-stop", action="store_true", help="lit la boîte mail et ajoute les réponses STOP")
    return a.parse_args()


def merge(cands):
    out = {}
    for b in cands:
        k = sources.norm(b["name"])
        if k in out:
            for f, v in b.items():
                if v and not out[k].get(f):
                    out[k][f] = v
        else:
            out[k] = b
    return list(out.values())


def enrich(b, net, ws, render):
    # Un « site » qui est en fait une page réseau social va dans le bon champ.
    kind = sources.classify_url(b["website"]) if b["website"] else ""
    if kind in ("instagram", "tiktok", "facebook", "linkedin"):
        b[kind] = b[kind] or b["website"]
        b["website"] = ""
    if ws.enabled and not b["website"]:
        sources.web_enrich(ws, b)
    a = analyze.analyze_site(net, b["website"], render)
    b["site_status"], b["site_reasons"] = a["site_status"], a["site_reasons"]
    b["email"] = b["email"] or (a["emails"][0] if a["emails"] else "")
    b["phone"] = b["phone"] or (a["phones"][0] if a["phones"] else "")
    b["whatsapp"] = b["whatsapp"] or a["whatsapp"]
    for k, v in a["socials"].items():
        b[k] = b[k] or v
    return b


def reachable(b, mode):
    social = b["instagram"] or b["tiktok"] or b["facebook"] or b["linkedin"]
    if mode == "email_only":
        return bool(b["email"])
    if mode == "social_only":
        return bool(social)
    return bool(b["email"] or social or b["phone"] or b["whatsapp"])


def run_one(country, city, sector, limit, args, ctx):
    net, ws, dnc, log, seen = ctx["net"], ctx["ws"], ctx["dnc"], ctx["log"], ctx["seen"]
    lang = args.lang or ("fr" if country in FRENCH else "en")
    print(f"\n▶ {sector} · {city} ({country}) — objectif {limit} prospect(s)")

    cands = sources.places_search(net, country, city, sector, max(limit * 3, 20), lang)
    print(f"  Google Places : {len(cands)}" if cands else "  Google Places : pas de clé, OpenStreetMap utilisé")
    if not cands:
        cands = sources.osm_search(net, country, city, sector, limit)
        print(f"  OpenStreetMap : {len(cands)} commerce(s)")
    if ws.enabled and len(cands) < limit * 2:
        extra = sources.web_discover(ws, country, city, sector, limit)
        print(f"  Recherche web : {len(extra)} résultat(s)")
        cands += extra
    cands = [b for b in merge(cands) if b["id"] not in seen]
    # Sans site d'abord : ce sont les meilleurs prospects, et les plus rapides à analyser.
    cands.sort(key=lambda b: bool(b["website"]))

    kept, done, workers = [], 0, (1 if ctx["render"] else config.SITE_WORKERS)
    step = workers * 2
    with ThreadPoolExecutor(workers) as pool:
        for i in range(0, len(cands), step):
            chunk = list(pool.map(lambda b: enrich(b, net, ws, ctx["render"]), cands[i:i + step]))
            for b in chunk:
                done += 1
                seen.add(b["id"])
                hit = dnc.hit(b)
                b["score"], b["why"], problem = scoring.score(b, hit)
                b["problem"], b["problem_label"] = problem, scoring.PROBLEMS[problem]
                if hit or b["score"] < args.min_score or not reachable(b, args.mode):
                    continue
                if log.contacted(b) and not args.include_contacted:
                    continue
                b.update(messages.build(b, lang, problem))
                kept.append(b)
            print(f"  … {done}/{len(cands)} analysé(s), {len(kept)} prospect(s) retenu(s)")
            if len(kept) >= limit:
                break
    kept.sort(key=lambda b: -b["score"])
    return kept[:limit]


def main():
    args = parse_args()
    dnc = DoNotContact()
    if args.stop:
        print("Ajouté à do_not_contact.csv" if dnc.add(args.stop) else "Déjà présent dans do_not_contact.csv")
        return
    if args.sync_stop:
        mailer.sync_stop(dnc)
        return

    limit = min(args.limit, config.TEST_LIMIT) if args.test else args.limit
    if not args.test and not args.batch and limit not in config.REAL_LIMITS:
        print(f"(info) limite {limit} : en mode réel, 20, 30 ou 50 sont conseillés.")
    net = Net()
    ctx = {"net": net, "ws": sources.WebSearch(net, enabled=not args.no_web_search), "dnc": dnc,
           "log": ContactLog(), "seen": set(), "render": analyze.playwright_renderer() if args.js else None}
    if args.js and not ctx["render"]:
        print("(info) Playwright non installé : rendu JavaScript désactivé.")

    stamp = datetime.now().strftime("%Y-%m-%d_%H%M")
    results = []
    try:
        if args.batch:
            state = json.loads(STATE.read_text()) if STATE.exists() else {"done": [], "seen": []}
            ctx["seen"] = set(state["seen"])
            countries = [args.country] if args.country else list(config.ZONES)
            for country in countries:
                for city in ([args.city] if args.city else config.ZONES.get(country, [])):
                    for sector in ([args.sector] if args.sector else config.SECTORS):
                        key = f"{country}|{city}|{sector}"
                        if key in state["done"]:
                            continue
                        results += run_one(country, city, sector, limit, args, ctx)
                        state["done"].append(key)
                        state["seen"] = sorted(ctx["seen"])
                        STATE.parent.mkdir(exist_ok=True)
                        STATE.write_text(json.dumps(state))
                        output.save(results, stamp)  # sauvegarde après chaque lot : rien n'est perdu
            if not results:
                print("Aucun nouveau lot (déjà traités). Supprimez results/batch_state.json pour tout recommencer.")
        else:
            if not args.city or not args.sector:
                sys.exit("--city et --sector sont obligatoires (ou utilisez --batch).")
            results = run_one(args.country, args.city, args.sector, limit, args, ctx)
    except KeyboardInterrupt:
        print("\nInterrompu : sauvegarde de ce qui a été trouvé.")
    finally:
        if ctx["render"]:
            ctx["render"].close()

    paths = output.save(results, stamp)
    print(f"\n✓ {len(results)} prospect(s) (score ≥ {args.min_score})")
    for p in paths:
        print(f"  {p}")
    if args.send_email == "true":
        if args.test:
            print("Mode test : aucun email envoyé.")
        else:
            mailer.send_all(results, ctx["log"], dnc)


if __name__ == "__main__":
    main()
