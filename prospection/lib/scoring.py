"""Score sur 100 avec des règles simples (voir config.py)."""
import config
from lib.messages import whatsapp_number
from lib.sources import norm

PROBLEMS = {
    "none": "Aucun site officiel trouvé",
    "maps_only": "Seulement une fiche Google",
    "social_only": "Seulement des réseaux sociaux, pas de vrai site",
    "broken": "Site cassé ou injoignable",
    "outdated": "Site ancien ou non sécurisé",
    "basic": "Site présent mais basique",
    "modern": "Site moderne déjà en place",
}


def site_problem(b):
    s = b["site_status"]
    if s == "none" and any(b[k] for k in ("instagram", "facebook", "tiktok")):
        return "social_only"
    if s == "none" and b["source"] == "google_places":
        return "maps_only"
    return s


def score(b, dnc_hit):
    pts, why = 0, []
    problem = site_problem(b)
    if problem in ("none", "maps_only", "social_only", "broken", "outdated"):
        pts += 30
        why.append(f"+30 {PROBLEMS[problem].lower()}")
    if any(norm(s) in norm(b["sector"]) or norm(b["sector"]) in norm(s) for s in config.HIGH_BUDGET_SECTORS):
        pts += 20
        why.append("+20 secteur à fort budget")
    areas = config.PREMIUM_AREAS.get(b["city"], [])
    place = norm(f'{b["address"]} {b["postcode"]}')
    if b["city"] in config.PREMIUM_CITIES or any(norm(a) in place for a in areas):
        pts += 15
        why.append("+15 zone premium")
    socials = sum(bool(b[k]) for k in ("instagram", "tiktok", "facebook"))
    if (b.get("reviews") or 0) >= config.REVIEWS_ACTIVE:
        pts += 10
        why.append(f"+10 présence active ({b['reviews']} avis)")
    elif b.get("opening_hours") and socials >= 2:
        pts += 10
        why.append("+10 présence active (horaires + réseaux)")
    if (b.get("photos") or 0) >= config.PHOTOS_PREMIUM:
        pts += 10
        why.append("+10 belles photos")
    if b["email"] or whatsapp_number(b):
        pts += 5
        why.append("+5 email/WhatsApp disponible")
    if b["instagram"] or b["tiktok"]:
        pts += 5
        why.append("+5 Instagram/TikTok")
    if problem == "modern":
        pts -= 50
        why.append("-50 site moderne déjà présent")
    if str(b.get("status", "")).startswith("CLOSED"):
        pts -= 40
        why.append("-40 fermé ou inactif")
    if dnc_hit:
        pts -= 100
        why.append("-100 do_not_contact")
    return max(-100, min(100, pts)), why, problem
