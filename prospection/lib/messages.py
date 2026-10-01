"""Emails et DM à partir de modèles fixes (pas d'IA)."""
import re
from urllib.parse import quote

import config

OPEN_FR = {
    "none": "je n’ai pas trouvé de site web clair associé à votre fiche.",
    "maps_only": "je n’ai trouvé que votre fiche Google, sans site web clair associé.",
    "social_only": "je n’ai trouvé que votre page {social}, sans site web clair.",
    "broken": "votre site ne s’affichait pas correctement quand j’ai essayé de l’ouvrir.",
    "outdated": "votre site semble un peu ancien ({reason}).",
    "basic": "je n’ai pas trouvé de site web clair associé à votre fiche.",
}
OPEN_EN = {
    "none": "I couldn’t find a clear website linked to your listing.",
    "maps_only": "I only found your Google listing, with no clear website attached.",
    "social_only": "I only found your {social} page, with no clear website.",
    "broken": "your website didn’t load properly when I tried to open it.",
    "outdated": "your website looks a little dated ({reason}).",
    "basic": "I couldn’t find a clear website linked to your listing.",
}

EMAIL_FR = """Bonjour,

Je suis tombé sur votre établissement en cherchant des entreprises locales, et {opening}

Un site simple pourrait aider vos clients à trouver rapidement les informations importantes : vos services, vos horaires, vos photos, votre adresse, un bouton pour vous appeler, un itinéraire Google Maps et un formulaire de contact.

L’objectif n’est pas de créer quelque chose de compliqué, mais une page professionnelle qui répond aux questions des clients avant même qu’ils vous appellent ou se déplacent.

Je peux vous préparer gratuitement une première maquette pour vous montrer à quoi cela pourrait ressembler pour votre activité.

Bonne journée,
{sender}

Si vous ne souhaitez pas être recontacté, répondez simplement STOP."""

EMAIL_EN = """Hello,

I came across your business while looking for local companies, and {opening}

A simple website could help your customers quickly find the key information: your services, opening hours, photos, address, a call button, Google Maps directions and a contact form.

The goal isn’t to build something complicated, but a professional page that answers customers’ questions before they even call or visit.

I can prepare a first mock-up for free to show you what it could look like for your business.

Have a great day,
{sender}

If you’d rather not hear from me again, just reply STOP."""

DM_FR = """Bonjour, je suis tombé sur votre activité et {opening}

Je crée des sites simples pour les commerces, avec les infos utiles pour les clients : services, horaires, photos, adresse, bouton d’appel et contact rapide.

Ça donne une image plus professionnelle et ça évite aux clients de chercher les informations partout. Je peux vous envoyer une petite idée de maquette gratuite si ça vous intéresse."""

DM_EN = """Hi, I came across your business and {opening}

I build simple websites for local businesses, with the info customers need: services, opening hours, photos, address, a call button and quick contact.

It looks more professional and saves customers from searching everywhere. I can send you a quick free mock-up idea if you’re interested."""

FOLLOWUP_FR = [
    """Bonjour,

Je me permets de revenir vers vous au sujet de mon message pour {name}.

Je peux vous préparer une maquette de votre page (services, horaires, photos, bouton d’appel) pour que vous jugiez sur pièce. Il suffit de répondre « oui ».

Bonne journée,
{sender}
{founder}
Si vous ne souhaitez pas être recontacté, répondez simplement STOP.""",
    """Bonjour,

Dernier message de ma part. Si un site simple pour {name} vous intéresse un jour, répondez simplement à cet email et je vous envoie la maquette.

Bonne continuation,
{sender}
{founder}
Vous ne recevrez plus de relance. Répondez STOP pour être retiré de ma liste.""",
]
FOLLOWUP_EN = [
    """Hello,

Just following up on my message about {name}.

I can prepare a mock-up of your page (services, opening hours, photos, call button) so you can see it for yourself. Just reply “yes”.

Have a great day,
{sender}
{founder}
If you’d rather not hear from me again, just reply STOP.""",
    """Hello,

Last message from me. If a simple website for {name} ever interests you, just reply to this email and I’ll send the mock-up.

All the best,
{sender}
{founder}
You won’t get any more follow-ups. Reply STOP to be removed from my list.""",
]

_SEATS = {}


def seats_left():
    if "n" not in _SEATS:
        from lib.crm import CRM
        _SEATS["n"] = CRM().seats_left()
    return _SEATS["n"]


def founder_line(lang):
    """Offre de lancement, tant qu'il reste des places (sinon chaîne vide)."""
    if seats_left() <= 0:
        return ""
    link = f" {config.FOUNDER_URL}" if config.FOUNDER_URL else ""
    if lang == "fr":
        return (f"\nP.S. Pour l’ouverture de {config.SENDER_COMPANY}, les {config.FOUNDER_SEATS} premiers commerces "
                f"ont {config.FOUNDER_DISCOUNT}. Il reste {seats_left()} place(s).{link}\n")
    return (f"\nP.S. For the launch of {config.SENDER_COMPANY}, the first {config.FOUNDER_SEATS} businesses get "
            f"{config.FOUNDER_DISCOUNT}. {seats_left()} spot(s) left.{link}\n")


def followup(row, step):
    lang = "fr" if row.get("lang", "fr") == "fr" else "en"
    tpl = (FOLLOWUP_FR if lang == "fr" else FOLLOWUP_EN)[step]
    body = tpl.format(name=row["name"], sender=config.SENDER_NAME, founder=founder_line(lang))
    subject = row["subject"] if row["subject"].lower().startswith("re:") else "Re: " + row["subject"]
    return subject, body


SUBJECT = {"fr": "Une page web pour {name} ?", "en": "A website for {name}?"}
MOBILE_PREFIX = {"33": ("6", "7"), "32": ("4",), "41": ("7",), "352": ("6",), "212": ("6", "7"), "61": ("4",),
                 "971": ("5",), "44": ("7",), "1": tuple("23456789")}


def _opening(b, lang, problem):
    table = OPEN_FR if lang == "fr" else OPEN_EN
    social = "Instagram" if b["instagram"] else "TikTok" if b["tiktok"] else "Facebook"
    reason = ", ".join(b.get("site_reasons", [])[:2]) or ("non sécurisé" if lang == "fr" else "not secure")
    return table.get(problem, table["none"]).format(social=social, reason=reason)


def whatsapp_number(b):
    """Numéro WhatsApp au format international : explicite, ou mobile détecté."""
    raw = b.get("whatsapp") or b.get("phone") or ""
    digits = re.sub(r"\D", "", raw)
    if not digits:
        return ""
    cc = config.COUNTRIES.get(b["country"], ("", ""))[1]
    if digits.startswith("00"):
        digits = digits[2:]
    elif digits.startswith("0") and cc:
        digits = cc + digits[1:]
    if b.get("whatsapp"):
        return digits
    for code, prefixes in MOBILE_PREFIX.items():
        if digits.startswith(code) and digits[len(code):].startswith(prefixes):
            return digits
    return ""


def build(b, lang, problem):
    lang = "fr" if lang == "fr" else "en"
    opening = _opening(b, lang, problem)
    subject = SUBJECT[lang].format(name=b["name"])
    body = (EMAIL_FR if lang == "fr" else EMAIL_EN).format(opening=opening, sender=config.SENDER_NAME)
    dm = (DM_FR if lang == "fr" else DM_EN).format(opening=opening)
    offer = founder_line(lang)
    if offer:
        stop = "\n\nSi vous ne souhaitez" if lang == "fr" else "\n\nIf you’d rather"
        body = body.replace(stop, "\n" + offer.rstrip("\n") + stop, 1)
        dm += "\n\n" + offer.strip().removeprefix("P.S. ")
    wa = whatsapp_number(b)
    m = {
        "email_subject": subject,
        "email_body": body,
        "mailto": f"mailto:{b['email']}?subject={quote(subject)}&body={quote(body)}" if b["email"] else "",
        "dm_instagram": dm if b["instagram"] else "",
        "dm_tiktok": dm if b["tiktok"] else "",
        "dm": dm,
        "whatsapp_number": wa,
        "whatsapp_link": f"https://wa.me/{wa}?text={quote(dm)}" if wa else "",
    }
    if b["email"]:
        action = "Envoyer l’email (bouton mailto)" if lang == "fr" else "Send the email (mailto button)"
    elif wa:
        action = "Message WhatsApp (lien prérempli)" if lang == "fr" else "WhatsApp message (prefilled link)"
    elif b["instagram"]:
        action = "DM Instagram : ouvrir le profil et coller le message" if lang == "fr" else "Instagram DM: open the profile and paste the message"
    elif b["tiktok"]:
        action = "DM TikTok : ouvrir le profil et coller le message" if lang == "fr" else "TikTok DM: open the profile and paste the message"
    elif b["phone"]:
        action = "Appeler" if lang == "fr" else "Call"
    else:
        action = "Passer sur place ou trouver un contact" if lang == "fr" else "Visit or find a contact"
    m["action"] = action
    return m
