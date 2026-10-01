"""Sources de commerces : Google Places API (si clé), OpenStreetMap (gratuit), recherche web publique limitée."""
import json
import os
import re
import unicodedata
from urllib.parse import parse_qs, quote_plus, unquote, urlparse

from bs4 import BeautifulSoup

import config
from lib.net import Blocked


def norm(s):
    s = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", s.lower()).strip()


def maps_link(name, address, city):
    """Lien public Google Maps (simple URL de recherche, aucune extraction de données)."""
    return "https://www.google.com/maps/search/?api=1&query=" + quote_plus(" ".join(x for x in (name, address, city) if x))


def blank(name, country, city, sector, source):
    return {"id": "", "name": name, "country": country, "city": city, "sector": sector, "address": "",
            "postcode": "", "website": "", "email": "", "phone": "", "whatsapp": "", "instagram": "",
            "tiktok": "", "facebook": "", "linkedin": "", "maps_url": "", "rating": None, "reviews": 0,
            "photos": 0, "status": "OPERATIONAL", "opening_hours": "", "source": source}


# ───────────────────────── 1. Google Places API (officielle) ─────────────────────────
PLACES_URL = "https://places.googleapis.com/v1/places:searchText"
PLACES_FIELDS = ",".join("places." + f for f in (
    "id", "displayName", "formattedAddress", "addressComponents", "websiteUri", "nationalPhoneNumber",
    "internationalPhoneNumber", "googleMapsUri", "rating", "userRatingCount", "businessStatus", "photos",
)) + ",nextPageToken"


def places_search(net, country, city, sector, limit, lang):
    key = os.environ.get("GOOGLE_PLACES_API_KEY")
    if not key:
        return []
    region = config.COUNTRIES.get(country, ("", ""))[0]
    out, token = [], None
    while len(out) < limit:
        body = {"textQuery": f"{sector} {city} {country}", "languageCode": lang, "pageSize": 20}
        if region:
            body["regionCode"] = region
        if token:
            body["pageToken"] = token
        try:
            r = net.post(PLACES_URL, json_body=body, delay=0.3,
                         headers={"X-Goog-Api-Key": key, "X-Goog-FieldMask": PLACES_FIELDS})
        except Blocked as e:
            print(f"  ! Google Places limité ({e}) : quota atteint ?")
            break
        if r["status"] != 200:
            print(f"  ! Google Places : réponse {r['status']} ({r['text'][:160]})")
            break
        data = json.loads(r["text"])
        for p in data.get("places", []):
            b = blank(p.get("displayName", {}).get("text", ""), country, city, sector, "google_places")
            b["id"] = "gp:" + p["id"]
            b["address"] = p.get("formattedAddress", "")
            for c in p.get("addressComponents", []):
                if "postal_code" in c.get("types", []):
                    b["postcode"] = c.get("longText", "")
            b["website"] = p.get("websiteUri", "")
            b["phone"] = p.get("internationalPhoneNumber") or p.get("nationalPhoneNumber", "")
            b["maps_url"] = p.get("googleMapsUri", "")
            b["rating"] = p.get("rating")
            b["reviews"] = p.get("userRatingCount", 0)
            b["photos"] = len(p.get("photos", []))
            b["status"] = p.get("businessStatus", "OPERATIONAL")
            out.append(b)
        token = data.get("nextPageToken")
        if not token:
            break
    return out[:limit]


# ───────────────────────── 2. OpenStreetMap (gratuit, toute la France) ─────────────────────────
NOMINATIM = "https://nominatim.openstreetmap.org/search"
OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]


def _area(net, city, country):
    q = f"{city}, {country}"
    try:
        r = net.get(f"{NOMINATIM}?q={quote_plus(q)}&format=json&limit=1", delay=1.1)
    except Blocked as e:
        print(f"  ! Nominatim limité ({e})")
        return None
    if r["status"] != 200:
        return None
    res = json.loads(r["text"] or "[]")
    if not res:
        return None
    hit = res[0]
    if hit.get("osm_type") == "relation":
        return f"area(id:{3600000000 + int(hit['osm_id'])})->.a;", "(area.a)"
    s, n, w, e = hit["boundingbox"]
    return "", f"({s},{w},{n},{e})"


def osm_search(net, country, city, sector, limit):
    area = _area(net, city, country)
    if not area:
        print(f"  ! OpenStreetMap : ville introuvable ({city}, {country})")
        return []
    head, scope = area
    selectors = config.SECTOR_OSM_TAGS.get(norm(sector))
    if not selectors:  # secteur inconnu : recherche par nom parmi les commerces
        word = re.escape(norm(sector).split()[0])
        selectors = [f'["{k}"]["name"~"{word}",i]' for k in ("shop", "amenity", "craft", "office", "leisure")]
    parts = "".join(f"nwr{sel}{scope};" for sel in selectors)
    query = f"[out:json][timeout:120];{head}({parts});out center tags {max(limit * 6, 200)};"
    data = None
    for url in OVERPASS:
        try:
            r = net.post(url, data={"data": query}, delay=2)
        except Blocked as e:
            print(f"  ! Overpass limité ({e}), on essaie le serveur suivant")
            continue
        if r["status"] == 200:
            data = json.loads(r["text"])
            break
    if not data:
        return []
    out, seen = [], set()
    for el in data.get("elements", []):
        t = el.get("tags", {})
        name = t.get("name")
        if not name or norm(name) in seen:
            continue
        seen.add(norm(name))
        b = blank(name, country, city, sector, "openstreetmap")
        b["id"] = f"osm:{el['type']}/{el['id']}"
        street = " ".join(x for x in (t.get("addr:housenumber"), t.get("addr:street")) if x)
        b["postcode"] = t.get("addr:postcode", "")
        b["address"] = ", ".join(x for x in (street, " ".join(x for x in (b["postcode"], t.get("addr:city", city)) if x)) if x)
        b["website"] = t.get("website") or t.get("contact:website") or t.get("url") or ""
        b["email"] = t.get("email") or t.get("contact:email") or ""
        b["phone"] = t.get("phone") or t.get("contact:phone") or t.get("contact:mobile") or ""
        b["whatsapp"] = t.get("contact:whatsapp", "")
        b["instagram"] = _social(t.get("contact:instagram"), "instagram.com")
        b["facebook"] = _social(t.get("contact:facebook"), "facebook.com")
        b["tiktok"] = _social(t.get("contact:tiktok"), "tiktok.com")
        b["linkedin"] = t.get("contact:linkedin", "")
        b["opening_hours"] = t.get("opening_hours", "")
        if any(k.startswith(("disused:", "was:")) for k in t) or t.get("opening_hours") == "closed":
            b["status"] = "CLOSED_PERMANENTLY"
        b["maps_url"] = maps_link(name, b["address"], city)
        out.append(b)
    return out


def _social(v, domain):
    if not v:
        return ""
    if v.startswith("http"):
        return v
    return f"https://www.{domain}/{v.lstrip('@')}"


# ───────────────────────── 3. Recherche web publique (limitée) ─────────────────────────
class WebSearch:
    """Recherche publique DuckDuckGo (version HTML), lente et plafonnée.

    S'arrête définitivement pour l'exécution si le moteur limite l'accès : aucun contournement.
    """
    URL = "https://html.duckduckgo.com/html/"

    def __init__(self, net, enabled=True):
        self.net, self.enabled, self.count = net, enabled, 0

    def search(self, query):
        if not self.enabled or self.count >= config.SEARCH_MAX_PER_RUN:
            return []
        self.count += 1
        try:
            r = self.net.post(self.URL, data={"q": query, "kl": ""}, delay=config.SEARCH_DELAY)
        except Blocked as e:
            print(f"  ! Recherche web limitée ({e}) : arrêt de la recherche web pour cette exécution.")
            self.enabled = False
            return []
        if r["status"] != 200 or "anomaly" in r["text"][:5000].lower():
            print("  ! Recherche web : accès refusé par le moteur, arrêt pour cette exécution.")
            self.enabled = False
            return []
        soup = BeautifulSoup(r["text"], "html.parser")
        results = []
        for a in soup.select("a.result__a"):
            href = a.get("href", "")
            if "uddg=" in href:
                href = unquote(parse_qs(urlparse(href).query).get("uddg", [""])[0])
            if href.startswith("http"):
                results.append({"url": href, "title": a.get_text(" ", strip=True)})
        return results


def classify_url(url):
    host = urlparse(url).netloc.lower().removeprefix("www.")
    for k in ("instagram", "tiktok", "facebook", "linkedin"):
        if f"{k}.com" in host:
            return k
    if any(d in host for d in config.DIRECTORY_DOMAINS):
        return "directory"
    return "website"


def _clean_title(title):
    title = re.split(r"\s[|•·–—-]\s|\s\(@|\s@", title)[0]
    return re.sub(r"\s*(on|sur) (Instagram|TikTok|Facebook).*$", "", title, flags=re.I).strip(" -|")


def web_discover(ws, country, city, sector, limit):
    """Découverte par recherche web : "{secteur} {ville}" + variantes Instagram / TikTok / contact / Google Maps."""
    found = {}
    for q in (f"{sector} {city}", f"{sector} {city} Instagram", f"{sector} {city} TikTok",
              f"{sector} {city} contact", f"{sector} {city} Google Maps"):
        for res in ws.search(q):
            kind = classify_url(res["url"])
            if kind == "directory":
                continue
            path = urlparse(res["url"]).path.strip("/")
            if kind in ("instagram", "tiktok") and (not path or "/" in path.strip("@") or path in ("explore", "p", "reel")):
                continue
            name = _clean_title(res["title"])
            if not name or len(name) > 70:
                continue
            k = norm(name)
            b = found.setdefault(k, blank(name, country, city, sector, "web_search"))
            b["id"] = b["id"] or "web:" + k
            if kind == "website" and not b["website"]:
                b["website"] = res["url"]
            elif kind in ("instagram", "tiktok", "facebook", "linkedin") and not b[kind]:
                b[kind] = res["url"]
        if len(found) >= limit * 2:
            break
    for b in found.values():
        b["maps_url"] = maps_link(b["name"], "", city)
    return list(found.values())


def web_enrich(ws, b):
    """Une recherche par commerce pour trouver site officiel et réseaux manquants."""
    if b["website"] and b["instagram"]:
        return
    tokens = [t for t in re.findall(r"[a-z0-9]{3,}", norm(b["name"])) if t not in ("the", "les", "des", "chez")]
    for res in ws.search(f'"{b["name"]}" {b["city"]}'):
        kind = classify_url(res["url"])
        hay = norm(res["url"] + " " + res["title"])
        if not tokens or not any(t in hay for t in tokens):
            continue
        if kind == "website" and not b["website"] and any(t in urlparse(res["url"]).netloc for t in tokens):
            b["website"] = res["url"]
        elif kind in ("instagram", "tiktok", "facebook", "linkedin") and not b[kind]:
            b[kind] = res["url"]
