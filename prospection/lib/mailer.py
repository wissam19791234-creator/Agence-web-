"""Envoi SMTP (Gmail par défaut) et lecture des réponses STOP par IMAP."""
import email
import imaplib
import os
import random
import smtplib
import ssl
import time
from datetime import datetime, timedelta
from email.message import EmailMessage
from email.utils import formataddr, parseaddr

import config


def credentials():
    user, pwd = os.environ.get("EMAIL_USER"), os.environ.get("EMAIL_PASSWORD")
    return (user, pwd) if user and pwd else None


def send_all(prospects, log, dnc):
    creds = credentials()
    if not creds:
        print("! EMAIL_USER / EMAIL_PASSWORD absents : aucun envoi (utilisez les boutons mailto du fichier HTML).")
        return 0
    user, pwd = creds
    todo = [p for p in prospects if p["email"] and not log.contacted(p) and not dnc.hit(p)]
    todo = todo[:config.MAX_EMAILS_PER_RUN]
    if not todo:
        print("Aucun email à envoyer.")
        return 0
    print(f"\n{len(todo)} email(s) prêts (plafond {config.MAX_EMAILS_PER_RUN}/exécution, "
          f"pause {config.EMAIL_DELAY[0]}-{config.EMAIL_DELAY[1]} s entre deux envois).")
    if input("Confirmer l’envoi ? Tapez OUI : ").strip().upper() != "OUI":
        print("Envoi annulé.")
        return 0
    sent = 0
    with smtplib.SMTP_SSL(config.SMTP_HOST, config.SMTP_PORT, context=ssl.create_default_context()) as s:
        s.login(user, pwd)
        for i, p in enumerate(todo):
            msg = EmailMessage()
            msg["From"] = formataddr((config.SENDER_NAME, user))
            msg["To"] = p["email"]
            msg["Subject"] = p["email_subject"]
            msg["List-Unsubscribe"] = f"<mailto:{user}?subject=STOP>"
            msg.set_content(p["email_body"])
            try:
                s.send_message(msg)
            except smtplib.SMTPException as e:
                print(f"  ✗ {p['email']} : {e}")
                continue
            log.add("email", p["email"], p["name"])
            sent += 1
            print(f"  ✓ {sent}/{len(todo)} {p['name']} <{p['email']}>")
            if i < len(todo) - 1:
                time.sleep(random.uniform(*config.EMAIL_DELAY))
    return sent


def sync_stop(dnc, days=60):
    """Ajoute à do_not_contact chaque personne qui a répondu STOP (ou désinscription)."""
    creds = credentials()
    if not creds:
        print("! EMAIL_USER / EMAIL_PASSWORD absents : impossible de lire les réponses.")
        return 0
    since = (datetime.now() - timedelta(days=days)).strftime("%d-%b-%Y")
    added = 0
    with imaplib.IMAP4_SSL(config.IMAP_HOST) as m:
        m.login(*creds)
        m.select("INBOX", readonly=True)
        _, ids = m.search(None, f'(SINCE "{since}")')
        for i in ids[0].split():
            _, data = m.fetch(i, "(RFC822)")
            msg = email.message_from_bytes(data[0][1])
            text = (msg.get("Subject") or "") + " " + _body(msg)
            words = text.upper().replace("\r", " ").split()
            first = " ".join(words[:12])
            if "STOP" in first or "DÉSINSCRI" in first or "UNSUBSCRIBE" in first or "DESABONN" in first:
                sender = parseaddr(msg.get("From", ""))[1]
                if sender and dnc.add(sender, "email", "réponse STOP"):
                    added += 1
                    print(f"  + {sender}")
    print(f"{added} adresse(s) ajoutée(s) à do_not_contact.csv")
    return added


def _body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                return part.get_payload(decode=True).decode(errors="ignore")
        return ""
    return (msg.get_payload(decode=True) or b"").decode(errors="ignore")
