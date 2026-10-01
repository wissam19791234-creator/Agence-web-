"""Analyse de la présence en ligne : qualité du site, contacts publics, réseaux."""
import re
from datetime import date
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

import config

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"(?:\+|00)\d{1,3}[\s.-]?\(?\d{1,4}\)?(?:[\s.-]?\d{2,4}){2,4}|\b0[1-9](?:[\s.-]?\d{2}){4}\b")
BAD_EMAIL = ("example.", "sentry", "wixpress", "domain.", "email.com", "@2x", ".png", ".jpg", ".webp", ".gif",
             "votre-", "your-", "noreply", "no-reply", "godaddy", "schema.org")
SOCIAL_RE = {
    "instagram": re.compile(r"https?://(?:www\.)?instagram\.com/[A-Za-z0-9_.]+/?"),
    "tiktok": re.compile(r"https?://(?:www\.)?tiktok\.com/@[A-Za-z0-9_.]+/?"),
    "facebook": re.compile(r"https?://(?:www\.|m\.)?facebook\.com/[A-Za-z0-9_.\-/]+"),
    "linkedin": re.compile(r"https?://(?:[a-z]{2,3}\.)?linkedin\.com/(?:company|in)/[A-Za-z0-9_\-]+/?"),
}
MODERN_HINTS = ("__next", "_next/static", "webflow", "framer", "squarespace", "shopify", "wix.com", "astro",
                "nuxt", "gatsby", "elementor", "data-reactroot", "vite", "tailwind")


def _emails(text, soup):
    found = {a["href"][7:].split("?")[0] for a in soup.select('a[href^="mailto:"]')}
    found |= set(EMAIL_RE.findall(text))
    return sorted({e.strip().lower() for e in found if e and not any(b in e.lower() for b in BAD_EMAIL)})


def _phones(text, soup):
    tel = [a["href"][4:] for a in soup.select('a[href^="tel:"]')]
    return [p.strip() for p in tel + PHONE_RE.findall(soup.get_text(" "))][:5]


def _socials(html):
    return {k: (rx.search(html).group(0) if rx.search(html) else "") for k, rx in SOCIAL_RE.items()}


def _whatsapp(html):
    m = re.search(r"(?:wa\.me/|api\.whatsapp\.com/send\?phone=)(\+?\d{8,15})", html)
    return m.group(1) if m else ""


def analyze_site(net, url, render=None):
    """Classe le site : none | social_only | broken | outdated | basic | modern."""
    res = {"site_status": "none", "site_reasons": [], "emails": [], "phones": [], "whatsapp": "",
           "socials": {}, "final_url": ""}
    if not url:
        return res
    if not url.startswith("http"):
        url = "http://" + url
    host = urlparse(url).netloc.lower()
    if any(d in host for d in config.SOCIAL_ONLY_DOMAINS):
        res["site_status"] = "social_only"
        res["site_reasons"].append("seulement une page réseau social / lien")
        return res
    r = net.get(url, check_robots=True)
    if r.get("robots"):
        res["site_status"] = "basic"
        res["site_reasons"].append("robots.txt interdit l'analyse : site non évalué")
        return res
    if r["status"] != 200 or len(r["text"]) < 200:
        res["site_status"] = "broken"
        res["site_reasons"].append(f"site injoignable ou en erreur ({r['status'] or r.get('error')})")
        return res
    html = r["text"]
    if render and len(BeautifulSoup(html, "html.parser").get_text(strip=True)) < 300:
        html = render(r["url"]) or html  # page construite en JavaScript : rendu avec Playwright
    soup = BeautifulSoup(html, "html.parser")
    res["final_url"] = r["url"]
    res["emails"], res["phones"] = _emails(html, soup), _phones(html, soup)
    res["socials"], res["whatsapp"] = _socials(html), _whatsapp(html)

    # Page contact : une requête de plus pour trouver email / téléphone.
    if not res["emails"]:
        link = next((a["href"] for a in soup.find_all("a", href=True) if "contact" in a["href"].lower()), None)
        if link:
            c = net.get(urljoin(r["url"], link), check_robots=True)
            if c["status"] == 200:
                cs = BeautifulSoup(c["text"], "html.parser")
                res["emails"] = _emails(c["text"], cs)
                res["phones"] = res["phones"] or _phones(c["text"], cs)
                res["whatsapp"] = res["whatsapp"] or _whatsapp(c["text"])

    # Qualité.
    bad, good = [], 0
    if not r["url"].startswith("https://"):
        bad.append("non sécurisé (pas de https)")
    if not soup.find("meta", attrs={"name": re.compile("viewport", re.I)}):
        bad.append("pas adapté au mobile")
    years = [int(y) for y in re.findall(r"(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(20\d{2}|19\d{2})", html, re.I)]
    if years and max(years) <= date.today().year - 5:
        bad.append(f"copyright ancien ({max(years)})")
    if re.search(r"\.swf|<frameset|<marquee|<font ", html, re.I):
        bad.append("technologies obsolètes")
    if r.get("elapsed", 0) > 4:
        bad.append("très lent")
    good += any(h in html.lower() for h in MODERN_HINTS)
    good += bool(soup.find("meta", attrs={"property": "og:image"}))
    good += bool(years and max(years) >= date.today().year - 2)
    res["site_reasons"] = bad
    if len(bad) >= 2 or (bad and "non sécurisé (pas de https)" in bad and not good):
        res["site_status"] = "outdated"
    elif not bad and good >= 2:
        res["site_status"] = "modern"
    else:
        res["site_status"] = "basic"
    return res


def playwright_renderer():
    """Renvoie une fonction de rendu Playwright, ou None si Playwright n'est pas installé."""
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        return None
    state = {}

    def render(url):
        try:
            if "browser" not in state:
                state["pw"] = sync_playwright().start()
                state["browser"] = state["pw"].chromium.launch()
            page = state["browser"].new_page(user_agent=f"ScalifyProspect/1.0 (+mailto:{config.CONTACT_EMAIL})")
            page.goto(url, timeout=20000, wait_until="domcontentloaded")
            page.wait_for_timeout(1500)
            html = page.content()
            page.close()
            return html
        except Exception:
            return None

    def close():
        if "browser" in state:
            state["browser"].close()
            state["pw"].stop()

    render.close = close
    return render
