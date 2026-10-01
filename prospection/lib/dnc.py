"""Liste do_not_contact + journal des contacts : on ne recontacte jamais une personne qui refuse."""
import csv
import re
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

from lib.sources import norm

ROOT = Path(__file__).resolve().parent.parent
DNC_FILE = ROOT / "do_not_contact.csv"
LOG_FILE = ROOT / "results" / "contact_log.csv"
DNC_FIELDS = ["type", "value", "reason", "date"]


def _key(kind, value):
    v = str(value or "").strip().lower()
    if not v:
        return ""
    if kind == "email":
        return v
    if kind in ("phone", "whatsapp"):
        d = re.sub(r"\D", "", v)
        return d[-9:]  # compare sans indicatif ni 0
    if kind in ("domain", "website"):
        host = urlparse(v if "://" in v else "http://" + v).netloc
        return host.removeprefix("www.")
    if kind in ("instagram", "tiktok", "facebook", "linkedin"):
        return v.rstrip("/").rsplit("/", 1)[-1].lstrip("@")
    return norm(v)


def guess_type(value):
    v = value.strip()
    if "@" in v and "/" not in v and not v.startswith("@"):
        return "email"
    if re.fullmatch(r"[+\d][\d\s.()-]{7,}", v):
        return "phone"
    for k in ("instagram", "tiktok", "facebook", "linkedin"):
        if k in v:
            return k
    if v.startswith("@"):
        return "instagram"
    if "." in v and " " not in v:
        return "domain"
    return "name"


class DoNotContact:
    def __init__(self):
        self.keys = set()
        if not DNC_FILE.exists():
            DNC_FILE.write_text(",".join(DNC_FIELDS) + "\n", encoding="utf-8")
        with DNC_FILE.open(encoding="utf-8") as f:
            for row in csv.DictReader(f):
                if row.get("value"):
                    self.keys.add((self._bucket(row["type"]), _key(row["type"], row["value"])))

    @staticmethod
    def _bucket(kind):
        return {"whatsapp": "phone", "website": "domain"}.get(kind, kind)

    def add(self, value, kind=None, reason="STOP"):
        kind = kind or guess_type(value)
        k = (self._bucket(kind), _key(kind, value))
        if k in self.keys:
            return False
        self.keys.add(k)
        with DNC_FILE.open("a", encoding="utf-8", newline="") as f:
            csv.writer(f).writerow([kind, value, reason, datetime.now().strftime("%Y-%m-%d")])
        return True

    def hit(self, b):
        checks = [("email", b.get("email")), ("phone", b.get("phone")), ("phone", b.get("whatsapp")),
                  ("domain", b.get("website")), ("instagram", b.get("instagram")), ("tiktok", b.get("tiktok")),
                  ("facebook", b.get("facebook")), ("name", f'{b.get("name")} {b.get("city")}'),
                  ("name", b.get("name"))]
        return any((self._bucket(k), _key(k, v)) in self.keys for k, v in checks if v)


class ContactLog:
    """Garde la trace de chaque email envoyé : jamais deux envois automatiques à la même adresse."""

    def __init__(self):
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        self.emails = set()
        if LOG_FILE.exists():
            with LOG_FILE.open(encoding="utf-8") as f:
                self.emails = {r["value"].lower() for r in csv.DictReader(f) if r["channel"] == "email"}

    def contacted(self, b):
        return bool(b.get("email")) and b["email"].lower() in self.emails

    def add(self, channel, value, name):
        new = not LOG_FILE.exists()
        with LOG_FILE.open("a", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            if new:
                w.writerow(["date", "channel", "value", "name"])
            w.writerow([datetime.now().isoformat(timespec="seconds"), channel, value, name])
        if channel == "email":
            self.emails.add(value.lower())
