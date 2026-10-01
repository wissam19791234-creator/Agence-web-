# Prospection semi-automatique

Trouve des commerces dans une ville, regarde s'ils ont un vrai site, récupère les contacts publics, donne un score sur 100 et prépare les emails et les DM.
**Les DM Instagram / TikTok / WhatsApp, c'est vous qui les envoyez** : le fichier HTML vous donne le message à copier et le bouton pour ouvrir le profil.

## Installation (une fois)

```bash
cd prospection
pip install -r requirements.txt
```

Optionnel :
- **Google Places** (meilleures données : avis, photos, commerces fermés) : créez une clé dans la Google Cloud Console, puis `export GOOGLE_PLACES_API_KEY=...`. Il y a un quota gratuit mensuel ; au-delà c'est payant, surveillez la console.
- **Envoi d'emails** : `export EMAIL_USER=vous@gmail.com` et `export EMAIL_PASSWORD=...` (sur Gmail, un « mot de passe d'application », pas votre vrai mot de passe).
- **Sites en JavaScript** : `pip install playwright && playwright install chromium`, puis ajoutez `--js`.

Sans rien de tout ça, le script marche quand même gratuitement avec OpenStreetMap et une recherche web publique limitée.

## Utilisation

```bash
# Test : 5 prospects max, aucun envoi
python prospect.py --test --city Lyon --sector boulangerie

# Réel (limite conseillée : 20, 30 ou 50)
python prospect.py --country France --city Paris --sector "clinique esthétique" --limit 20 --mode both --send-email false
python prospect.py --country Australia --city Sydney --sector "car detailing" --limit 30 --mode both --send-email false
python prospect.py --country UAE --city Dubai --sector "aesthetic clinic" --limit 20 --mode both --send-email false

# Gros lots : toutes les villes × secteurs de config.py (des milliers de commerces).
# Reprend où il s'était arrêté si vous coupez (Ctrl+C).
python prospect.py --batch --country France --limit 30
```

| Option | Rôle |
|---|---|
| `--mode` | `email_only`, `social_only` ou `both` |
| `--send-email true` | envoie les emails (demande de taper OUI, max 30 par exécution, pause entre chaque) |
| `--lang fr/en` | langue des messages (auto selon le pays sinon) |
| `--min-score 50` | seuil du score (65 par défaut ; baissez-le sans Google Places, qui apporte avis et photos) |
| `--no-web-search` | seulement OpenStreetMap / Google Places |

## Résultats (dossier `results/`)

- `prospects_DATE.csv` : s'ouvre dans Excel
- `prospects_DATE.json`
- `messages_DATE.html` : à ouvrir dans le navigateur. Une carte par prospect avec le score, le problème détecté, les contacts, le bouton **email prêt**, les messages à copier, les liens Instagram / TikTok / WhatsApp et l'action recommandée.

## Ne jamais recontacter quelqu'un qui refuse

- `do_not_contact.csv` : tout ce qui est dedans est exclu (score −100).
- Ajouter quelqu'un : `python prospect.py --stop contact@exemple.fr` (marche aussi avec un téléphone, `@compte`, un domaine).
- Récupérer automatiquement les réponses « STOP » de votre boîte mail : `python prospect.py --sync-stop`
- Chaque email envoyé est noté dans `results/contact_log.csv` : le script n'écrit jamais deux fois automatiquement à la même adresse.

## Réglages

Tout est dans `config.py` : votre nom, les villes et secteurs des lots, les quartiers premium, les secteurs à fort budget, les plafonds d'envoi et les délais.

## Règles respectées par le script

- Seulement des sources publiques ou des API officielles. Pas de lecture de Google Maps, d'Instagram ou de TikTok en se faisant passer pour un humain.
- Une requête à la fois par site, avec une pause, et `robots.txt` respecté.
- Si un service bloque ou limite, le script s'arrête pour ce service : il ne contourne rien.
- Aucune connexion automatique à Instagram, TikTok ou LinkedIn.
- Emails : prospection B2B (autorisée en France sans accord préalable si le message concerne l'activité du commerce), expéditeur identifié, « répondez STOP » dans chaque email, en-tête de désinscription, plafond et pauses pour ne pas être classé en spam.
