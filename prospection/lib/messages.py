"""Emails et DM à partir de modèles fixes (pas d'IA)."""
import re
from urllib.parse import quote

import config

OPEN_FR = {
    "none": "je n’ai pas trouvé de site web associé à votre fiche.",
    "maps_only": "je n’ai trouvé que votre fiche Google, sans site web.",
    "social_only": "je n’ai trouvé que votre page {social}, sans site web.",
    "broken": "votre site ne s’affichait pas correctement quand j’ai essayé de l’ouvrir.",
    "outdated": "votre site semble un peu ancien ({reason}).",
    "basic": "je me suis dit que votre présence en ligne pourrait vous prendre moins de temps.",
    "modern": "je me suis dit que votre présence en ligne pourrait vous prendre moins de temps.",
}
OPEN_EN = {
    "none": "I couldn’t find a website linked to your listing.",
    "maps_only": "I only found your Google listing, with no website.",
    "social_only": "I only found your {social} page, with no website.",
    "broken": "your website didn’t load properly when I tried to open it.",
    "outdated": "your website looks a little dated ({reason}).",
    "basic": "I thought your online presence could take up less of your time.",
    "modern": "I thought your online presence could take up less of your time.",
}

EMAIL_FR = """Bonjour,

Je suis tombé sur {name} en cherchant des commerces à {city}, et {opening}

Je lance {company}, un abonnement qui gère toute la présence en ligne des commerces :
- un site professionnel, en ligne en 7 jours
- votre fiche Google tenue à jour
- une réponse à chaque avis
- des posts réguliers sur vos réseaux
- un assistant IA qui répond à vos clients 24 h/24

Vous validez en un clic, on s’occupe du reste. C’est {price}.

Je peux vous montrer à quoi ressemblerait votre espace en 10 minutes, par téléphone ou en visio. Ça vous dit ?

Bonne journée,
{sender} · {company}

Si vous ne souhaitez pas être recontacté, répondez simplement STOP."""

EMAIL_EN = """Hello,

I came across {name} while looking at local businesses in {city}, and {opening}

I’m launching {company}, a subscription that runs a local business’s whole online presence:
- a professional website, live in 7 days
- your Google listing kept up to date
- a reply to every review
- regular posts on your social media
- an AI assistant that answers your customers 24/7

You approve in one click, we handle the rest. It’s {price}.

I can show you what your space would look like in 10 minutes, by phone or video call. Interested?

Have a great day,
{sender} · {company}

If you’d rather not hear from me again, just reply STOP."""

DM_FR = """Bonjour ! Je suis tombé sur {name} et {opening}

Je lance {company} : on gère votre site, votre fiche Google, vos avis et vos posts, et une IA répond à vos clients 24 h/24. Vous validez en un clic. C’est {price}.

Je peux vous montrer votre espace en 10 minutes si ça vous intéresse ?"""

DM_EN = """Hi! I came across {name} and {opening}

I’m launching {company}: we run your website, Google listing, reviews and posts, and an AI answers your customers 24/7. You approve in one click. It’s {price}.

Happy to show you your space in 10 minutes if you’re interested?"""

FOLLOWUP_FR = [
    """Bonjour,

Je reviens vers vous au sujet de {company} pour {name}.

En bref : site, fiche Google, avis, réseaux et un assistant IA qui répond à vos clients, tout est géré pour vous. C’est {price}.

Une démo de 10 minutes pour voir votre espace ? Répondez « oui » avec le moment qui vous arrange.

Bonne journée,
{sender}
{founder}
Si vous ne souhaitez pas être recontacté, répondez simplement STOP.""",
    """Bonjour,

Dernier message de ma part. Si un jour vous voulez qu’on gère votre présence en ligne pour {name}, répondez simplement à cet email.

Bonne continuation,
{sender}
{founder}
Vous ne recevrez plus de relance. Répondez STOP pour être retiré de ma liste.""",
]
FOLLOWUP_EN = [
    """Hello,

Following up about {company} for {name}.

In short: website, Google listing, reviews, social media and an AI assistant answering your customers, all handled for you. It’s {price}.

A 10-minute demo to see your space? Just reply “yes” with a time that suits you.

Have a great day,
{sender}
{founder}
If you’d rather not hear from me again, just reply STOP.""",
    """Hello,

Last message from me. If you ever want us to run your online presence for {name}, just reply to this email.

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
    body = tpl.format(name=row["name"], sender=config.SENDER_NAME, founder=founder_line(lang),
                      company=config.SENDER_COMPANY, price=_price(lang))
    subject = row["subject"] if row["subject"].lower().startswith("re:") else "Re: " + row["subject"]
    return subject, body


SUBJECT = {"fr": "{name} : votre présence en ligne, gérée pour vous", "en": "{name}: your online presence, handled for you"}


def _price(lang):
    return config.PRICE_LINE_FR if lang == "fr" else config.PRICE_LINE_EN
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
    fields = {"opening": opening, "sender": config.SENDER_NAME, "company": config.SENDER_COMPANY,
              "price": _price(lang), "name": b["name"], "city": b.get("city", "")}
    body = (EMAIL_FR if lang == "fr" else EMAIL_EN).format(**fields)
    dm = (DM_FR if lang == "fr" else DM_EN).format(**fields)
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
