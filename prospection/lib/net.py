"""Client HTTP poli : délai par site, robots.txt, cache disque, aucune ruse anti-bot.

Si un site refuse (403/429/captcha), on s'arrête là pour ce site : on ne contourne rien.
"""
import hashlib
import json
import threading
import time
from pathlib import Path
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import httpx

import config

CACHE_DIR = Path(__file__).resolve().parent.parent / "results" / "cache"
UA = f"ScalifyProspect/1.0 (+mailto:{config.CONTACT_EMAIL})"


class Blocked(Exception):
    """Le service refuse ou limite l'accès : on arrête de l'interroger."""


class Net:
    def __init__(self):
        self.client = httpx.Client(headers={"User-Agent": UA, "Accept-Language": "fr,en;q=0.8"},
                                   timeout=15, follow_redirects=True)
        self._last = {}
        self._robots = {}
        self._lock = threading.Lock()
        CACHE_DIR.mkdir(parents=True, exist_ok=True)

    # ── délai par hôte ──
    def _wait(self, host, delay):
        with self._lock:
            now = time.monotonic()
            wait = self._last.get(host, 0) + delay - now
            self._last[host] = max(now, self._last.get(host, 0) + delay)
        if wait > 0:
            time.sleep(wait)

    # ── robots.txt ──
    def allowed(self, url):
        p = urlparse(url)
        base = f"{p.scheme}://{p.netloc}"
        if base not in self._robots:
            rp = RobotFileParser()
            try:
                r = self.client.get(base + "/robots.txt", timeout=8)
                rp.parse(r.text.splitlines() if r.status_code == 200 else [])
            except httpx.HTTPError:
                rp.parse([])
            self._robots[base] = rp
        return self._robots[base].can_fetch(UA, url)

    # ── cache ──
    def _key(self, method, url, body):
        return CACHE_DIR / (hashlib.sha1(f"{method} {url} {body}".encode()).hexdigest() + ".json")

    def _cached(self, key):
        if key.exists() and time.time() - key.stat().st_mtime < config.CACHE_DAYS * 86400:
            return json.loads(key.read_text(encoding="utf-8"))
        return None

    def request(self, method, url, *, delay=None, data=None, json_body=None, headers=None,
                check_robots=False, cache=True):
        """Renvoie {"status", "url", "text"} ; lève Blocked si le service limite l'accès."""
        body = json.dumps(json_body) if json_body is not None else (data or "")
        key = self._key(method, url, body)
        if cache and (hit := self._cached(key)):
            return hit
        if check_robots and not self.allowed(url):
            return {"status": -1, "url": url, "text": "", "robots": True}
        self._wait(urlparse(url).netloc, config.REQUEST_DELAY if delay is None else delay)
        try:
            r = self.client.request(method, url, data=data, json=json_body, headers=headers)
        except httpx.HTTPError as e:
            return {"status": 0, "url": url, "text": "", "error": type(e).__name__}
        if r.status_code in (403, 429, 503) and not check_robots:
            raise Blocked(f"{urlparse(url).netloc} répond {r.status_code}")
        out = {"status": r.status_code, "url": str(r.url), "text": r.text[:600_000],
               "elapsed": r.elapsed.total_seconds()}
        if cache and r.status_code == 200:
            key.write_text(json.dumps(out), encoding="utf-8")
        return out

    def get(self, url, **kw):
        return self.request("GET", url, **kw)

    def post(self, url, **kw):
        return self.request("POST", url, **kw)
