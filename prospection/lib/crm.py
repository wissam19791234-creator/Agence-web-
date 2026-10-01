"""Suivi des prospects contactés (results/crm.csv) : statut, relances, clients fondateurs."""
import csv
from datetime import datetime, timedelta
from pathlib import Path

import config

CRM_FILE = Path(__file__).resolve().parent.parent / "results" / "crm.csv"
FIELDS = ["email", "name", "city", "sector", "lang", "status", "step", "first_sent", "last_sent",
          "message_id", "subject", "notes"]
# Statuts : contacte → relance1 → relance2 → termine ; ou repondu / client / stop / invalide
ACTIVE = ("contacte", "relance1")
LABELS = {"contacte": "Contacté", "relance1": "Relance 1 envoyée", "relance2": "Relance 2 envoyée",
          "termine": "Sans réponse (fini)", "repondu": "A répondu", "client": "Client fondateur",
          "stop": "Refus (STOP)", "invalide": "Adresse invalide"}


class CRM:
    def __init__(self):
        CRM_FILE.parent.mkdir(parents=True, exist_ok=True)
        self.rows = {}
        if CRM_FILE.exists():
            with CRM_FILE.open(encoding="utf-8") as f:
                self.rows = {r["email"].lower(): r for r in csv.DictReader(f)}

    def save(self):
        with CRM_FILE.open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=FIELDS)
            w.writeheader()
            w.writerows(self.rows.values())

    def get(self, email):
        return self.rows.get((email or "").lower())

    def add_contact(self, p, message_id, lang):
        now = datetime.now().isoformat(timespec="seconds")
        self.rows[p["email"].lower()] = {
            "email": p["email"], "name": p["name"], "city": p["city"], "sector": p["sector"], "lang": lang,
            "status": "contacte", "step": "0", "first_sent": now, "last_sent": now, "message_id": message_id,
            "subject": p["email_subject"], "notes": "",
        }
        self.save()

    def set_status(self, email, status, note=""):
        r = self.get(email)
        if not r:
            return False
        r["status"] = status
        if note:
            r["notes"] = (r["notes"] + " | " if r["notes"] else "") + note
        self.save()
        return True

    def due_followups(self, today=None):
        """Lignes à relancer aujourd'hui (relance 1 à J+4, relance 2 à J+10 après le 1er email)."""
        today = today or datetime.now()
        out = []
        for r in self.rows.values():
            if r["status"] not in ACTIVE:
                continue
            step = int(r["step"] or 0)
            if step >= len(config.FOLLOWUP_DAYS):
                continue
            first = datetime.fromisoformat(r["first_sent"])
            if today >= first + timedelta(days=config.FOLLOWUP_DAYS[step]):
                out.append(r)
        return out

    def close_finished(self):
        """Après la dernière relance + 7 jours sans réponse : statut « termine »."""
        limit = timedelta(days=config.FOLLOWUP_DAYS[-1] + 7)
        for r in self.rows.values():
            if r["status"] == "relance2" and datetime.now() >= datetime.fromisoformat(r["first_sent"]) + limit:
                r["status"] = "termine"
        self.save()

    def seats_left(self):
        return max(0, config.FOUNDER_SEATS - sum(r["status"] == "client" for r in self.rows.values()))

    def counts(self):
        c = {k: 0 for k in LABELS}
        for r in self.rows.values():
            c[r["status"]] = c.get(r["status"], 0) + 1
        return c
