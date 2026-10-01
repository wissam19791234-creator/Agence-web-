"""Envoi SMTP (Gmail par défaut), relances dans le même fil, lecture des réponses par IMAP."""
import email
import imaplib
import os
import random
import re
import smtplib
import ssl
import time
from datetime import datetime, timedelta
from email.message import EmailMessage
from email.utils import formataddr, make_msgid, parseaddr

import config
from lib import messages

STOP_WORDS = ("STOP", "DESINSCRI", "DÉSINSCRI", "UNSUBSCRIBE", "DESABONN", "DÉSABONN", "NE PLUS ME CONTACTER",
              "PAS INTERESSE", "PAS INTÉRESSÉ", "NOT INTERESTED", "REMOVE ME")


def credentials():
    user, pwd = os.environ.get("EMAIL_USER"), os.environ.get("EMAIL_PASSWORD")
    return (user, pwd) if user and pwd else None


class Mailer:
    """Une connexion SMTP pour toute l'exécution, avec pause entre deux envois."""

    def __init__(self):
        self.user, pwd = credentials()
        self.s = smtplib.SMTP_SSL(config.SMTP_HOST, config.SMTP_PORT, context=ssl.create_default_context())
        self.s.login(self.user, pwd)
        self.sent = 0

    def send(self, to, subject, body, reply_to_id=None):
        if self.sent:
            time.sleep(random.uniform(*config.EMAIL_DELAY))
        msg = EmailMessage()
        msg["From"] = formataddr((config.SENDER_NAME, self.user))
        msg["To"] = to
        msg["Subject"] = subject
        msg["Message-ID"] = make_msgid(domain=self.user.split("@")[-1])
        msg["List-Unsubscribe"] = f"<mailto:{self.user}?subject=STOP>"
        if reply_to_id:
            msg["In-Reply-To"] = msg["References"] = reply_to_id
        msg.set_content(body)
        self.s.send_message(msg)
        self.sent += 1
        return msg["Message-ID"]

    def close(self):
        try:
            self.s.quit()
        except smtplib.SMTPException:
            pass


def confirm(n, what):
    print(f"\n{n} {what} (pause {config.EMAIL_DELAY[0]}-{config.EMAIL_DELAY[1]} s entre deux envois).")
    return input("Confirmer l’envoi ? Tapez OUI : ").strip().upper() == "OUI"


def send_all(prospects, log, dnc, crm, ask=True, cap=None, mailer=None):
    """Premier email aux prospects qui ont une adresse, jamais deux fois à la même."""
    if not credentials():
        print("! EMAIL_USER / EMAIL_PASSWORD absents : aucun envoi (utilisez les boutons mailto du fichier HTML).")
        return 0
    cap = config.MAX_EMAILS_PER_RUN if cap is None else cap
    todo = [p for p in prospects if p["email"] and not log.contacted(p) and not crm.get(p["email"]) and not dnc.hit(p)]
    todo = todo[:cap]
    if not todo:
        print("Aucun nouvel email à envoyer.")
        return 0
    if ask and not confirm(len(todo), "email(s) prêts"):
        print("Envoi annulé.")
        return 0
    own = mailer is None
    mailer = mailer or Mailer()
    sent = 0
    try:
        for p in todo:
            try:
                mid = mailer.send(p["email"], p["email_subject"], p["email_body"])
            except smtplib.SMTPException as e:
                print(f"  ✗ {p['email']} : {e}")
                continue
            log.add("email", p["email"], p["name"])
            crm.add_contact(p, mid, "fr" if "Bonjour" in p["email_body"][:20] else "en")
            sent += 1
            print(f"  ✓ {sent}/{len(todo)} {p['name']} <{p['email']}>")
    finally:
        if own:
            mailer.close()
    return sent


def send_followups(crm, dnc, cap, mailer):
    """Relances J+4 et J+10 dans le même fil ; jamais après une réponse ou un STOP."""
    sent = 0
    for r in crm.due_followups():
        if sent >= cap:
            break
        if dnc.hit({"email": r["email"], "name": r["name"], "city": r["city"]}):
            crm.set_status(r["email"], "stop")
            continue
        step = int(r["step"] or 0)
        subject, body = messages.followup(r, step)
        try:
            mailer.send(r["email"], subject, body, reply_to_id=r["message_id"])
        except smtplib.SMTPException as e:
            print(f"  ✗ relance {r['email']} : {e}")
            continue
        r["step"], r["status"] = str(step + 1), f"relance{step + 1}"
        r["last_sent"] = datetime.now().isoformat(timespec="seconds")
        crm.save()
        sent += 1
        print(f"  ↻ relance {step + 1} → {r['name']} <{r['email']}>")
    return sent


def sync_inbox(dnc, crm, days=30):
    """Lit la boîte de réception :
    - réponse STOP / désinscription → do_not_contact + statut « stop » ;
    - autre réponse d'un prospect → statut « repondu » (les relances s'arrêtent) ;
    - email non distribué → statut « invalide ».
    Renvoie la liste des réponses à traiter à la main.
    """
    creds = credentials()
    if not creds:
        print("! EMAIL_USER / EMAIL_PASSWORD absents : impossible de lire les réponses.")
        return []
    since = (datetime.now() - timedelta(days=days)).strftime("%d-%b-%Y")
    replies, stops = [], 0
    with imaplib.IMAP4_SSL(config.IMAP_HOST) as m:
        m.login(*creds)
        m.select("INBOX", readonly=True)
        _, ids = m.search(None, f'(SINCE "{since}")')
        for i in ids[0].split():
            _, data = m.fetch(i, "(BODY.PEEK[])")
            msg = email.message_from_bytes(data[0][1])
            sender = parseaddr(msg.get("From", ""))[1].lower()
            body = _body(msg)
            if "mailer-daemon" in sender or "postmaster" in sender:
                for addr in re.findall(r"[\w.+-]+@[\w-]+\.[\w.-]+", body):
                    if crm.get(addr) and crm.get(addr)["status"] in ("contacte", "relance1", "relance2"):
                        crm.set_status(addr, "invalide", "email non distribué")
                continue
            row = crm.get(sender)
            head = " ".join(((msg.get("Subject") or "") + " " + _strip_quote(body)).upper().split()[:25])
            if any(w in head for w in STOP_WORDS):
                if dnc.add(sender, "email", "réponse STOP"):
                    stops += 1
                    print(f"  ⛔ STOP : {sender}")
                if row:
                    crm.set_status(sender, "stop")
                continue
            if row and row["status"] in ("contacte", "relance1", "relance2", "termine"):
                crm.set_status(sender, "repondu", datetime.now().strftime("répondu le %d/%m"))
                print(f"  ✉ réponse de {row['name']} <{sender}>")
            if row and row["status"] == "repondu":
                replies.append({"name": row["name"], "email": sender, "subject": msg.get("Subject", ""),
                                "excerpt": _strip_quote(body)[:400]})
    print(f"Boîte mail : {len(replies)} réponse(s) à traiter, {stops} nouveau(x) STOP.")
    return replies


def sync_stop(dnc):
    """Compatibilité : ancienne commande --sync-stop."""
    from lib.crm import CRM
    return sync_inbox(dnc, CRM())


def _strip_quote(text):
    """Garde la réponse, sans le message d'origine cité."""
    out = []
    for line in text.splitlines():
        if line.startswith(">") or re.match(r"^(Le .+ a écrit|On .+ wrote)", line.strip()):
            break
        out.append(line)
    return "\n".join(out).strip()


def _body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                return (part.get_payload(decode=True) or b"").decode(errors="ignore")
        return ""
    return (msg.get_payload(decode=True) or b"").decode(errors="ignore")
