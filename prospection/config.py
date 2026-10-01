"""Réglages de la prospection. Modifiez ce fichier, pas le code."""

# ───────── Expéditeur (apparaît dans les emails) ─────────
SENDER_NAME = "Sidi"
SENDER_COMPANY = "Scalify"
# Adresse de contact affichée dans le User-Agent : les sites et OpenStreetMap
# demandent de pouvoir joindre l'auteur des requêtes.
CONTACT_EMAIL = "scalifyfr@gmail.com"

# ───────── Offre de lancement (15 premiers clients) ─────────
FOUNDER_SEATS = 15                       # nombre de places fondateurs
FOUNDER_DISCOUNT = "-30 % pendant 12 mois"  # à adapter : c'est ce qui est promis dans les messages
PRICE_LINE_FR = "à partir de 49 € par mois (hors frais de mise en place), sans engagement"
PRICE_LINE_EN = "from €49 a month (plus a one-off setup fee), no commitment"
FOUNDER_URL = ""                         # lien de réservation sur votre site (ajouté aux messages s'il est rempli)
# Les places restantes sont calculées depuis results/crm.csv (python crm.py client <email>).
# Quand il n'en reste plus, l'offre disparaît automatiquement des messages.

# ───────── Automatisation quotidienne (auto.py) ─────────
DAILY_EMAIL_CAP = 40        # emails max par jour, relances comprises (au-delà : risque de spam)
DAILY_NEW_PROSPECTS = 60    # nouveaux prospects cherchés chaque jour
FOLLOWUP_DAYS = (4, 10)     # relance 1 à J+4, relance 2 à J+10, puis plus rien

# ───────── Filtres ─────────
MIN_SCORE = 65          # prospects gardés à partir de ce score (baissez à ~50 sans Google Places)
TEST_LIMIT = 5          # --test : 5 prospects maximum, aucun envoi
REAL_LIMITS = (20, 30, 50)  # limites conseillées en mode réel

# ───────── Politesse réseau (ne pas descendre en dessous) ─────────
REQUEST_DELAY = 1.5     # secondes entre deux requêtes vers un même site
SEARCH_DELAY = 5.0      # secondes entre deux recherches web publiques
SEARCH_MAX_PER_RUN = 150  # recherches web max par exécution
SITE_WORKERS = 4        # sites analysés en parallèle (domaines différents)
CACHE_DAYS = 7          # réutilise les réponses déjà téléchargées

# ───────── Envoi d'emails ─────────
MAX_EMAILS_PER_RUN = 30         # plafond par exécution
EMAIL_DELAY = (60, 150)         # pause aléatoire entre deux envois (secondes)
SMTP_HOST, SMTP_PORT = "smtp.gmail.com", 465
IMAP_HOST = "imap.gmail.com"    # pour --sync-stop (lecture des réponses STOP)

# ───────── Scoring ─────────
# Secteurs à fort budget (+20). Comparaison sans accents ni majuscules, par inclusion.
HIGH_BUDGET_SECTORS = [
    "clinique esthetique", "medecine esthetique", "aesthetic clinic", "dentiste", "dental", "orthodont",
    "chirurg", "spa", "institut", "beaute", "beauty", "hotel", "restaurant gastronomique", "traiteur",
    "agence immobiliere", "real estate", "car detailing", "detailing", "location de voiture", "car rental",
    "garage", "carrosserie", "avocat", "notaire", "architecte", "cuisiniste", "piscine", "joaill", "jewel",
    "salle de sport", "gym", "fitness", "coach", "photograph", "mariage", "wedding", "yacht", "concession",
]

# Villes / quartiers / codes postaux premium (+15), cherchés dans l'adresse.
PREMIUM_AREAS = {
    "Paris": ["75001", "75004", "75006", "75007", "75008", "75016", "75017", "Neuilly", "Saint-Germain", "Marais"],
    "Lyon": ["69002", "69006", "Presqu'île", "Brotteaux"],
    "Marseille": ["13007", "13008"],
    "Nice": ["Cimiez", "Mont Boron", "Carré d'Or"],
    "Bordeaux": ["Chartrons", "33000"],
    "Cannes": ["Croisette", "Californie"],
    "Saint-Tropez": ["83990"],
    "Sydney": ["Bondi", "Double Bay", "Mosman", "Surry Hills", "Paddington", "Vaucluse"],
    "Dubai": ["Downtown", "Jumeirah", "Dubai Marina", "Palm", "DIFC", "Business Bay"],
}
# Villes entièrement premium (toute adresse compte).
PREMIUM_CITIES = ["Neuilly-sur-Seine", "Saint-Tropez", "Monaco", "Courchevel", "Megève", "Cannes"]

REVIEWS_ACTIVE = 30     # avis Google à partir desquels la présence est « active »
PHOTOS_PREMIUM = 5      # photos Google à partir desquelles l'image est « premium »

# ───────── Lots (mode --batch) ─────────
ZONES = {
    "France": [
        "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Montpellier", "Strasbourg", "Bordeaux",
        "Lille", "Rennes", "Reims", "Toulon", "Saint-Étienne", "Le Havre", "Grenoble", "Dijon", "Angers",
        "Nîmes", "Villeurbanne", "Clermont-Ferrand", "Le Mans", "Aix-en-Provence", "Brest", "Tours", "Amiens",
        "Limoges", "Annecy", "Perpignan", "Metz", "Besançon", "Orléans", "Rouen", "Mulhouse", "Caen", "Nancy",
        "Avignon", "Cannes", "Antibes", "La Rochelle", "Pau", "Bayonne", "Biarritz", "Ajaccio", "Neuilly-sur-Seine",
    ],
    "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Gold Coast"],
    "UAE": ["Dubai", "Abu Dhabi"],
}
SECTORS = [
    "restaurant", "boulangerie", "coiffeur", "barbier", "institut de beauté", "clinique esthétique",
    "garage", "car detailing", "fleuriste", "salle de sport", "location de voiture", "artisan plombier",
]

# ───────── Correspondance secteur → étiquettes OpenStreetMap ─────────
# Clés sans accents, en minuscules. Un secteur inconnu est cherché par nom.
SECTOR_OSM_TAGS = {
    "restaurant": ['["amenity"="restaurant"]'],
    "pizzeria": ['["amenity"~"restaurant|fast_food"]["cuisine"~"pizza"]'],
    "cafe": ['["amenity"="cafe"]'],
    "bar": ['["amenity"~"bar|pub"]'],
    "boulangerie": ['["shop"="bakery"]'],
    "patisserie": ['["shop"="pastry"]', '["shop"="bakery"]'],
    "boucherie": ['["shop"="butcher"]'],
    "traiteur": ['["shop"="deli"]', '["craft"="caterer"]'],
    "fleuriste": ['["shop"="florist"]'],
    "coiffeur": ['["shop"="hairdresser"]'],
    "barbier": ['["shop"="hairdresser"]["hairdresser"~"barber"]', '["shop"="hairdresser"]["name"~"barb",i]'],
    "institut de beaute": ['["shop"="beauty"]'],
    "estheticienne": ['["shop"="beauty"]'],
    "onglerie": ['["shop"="beauty"]["beauty"~"nails"]'],
    "clinique esthetique": ['["shop"="beauty"]', '["amenity"="clinic"]["name"~"esth|laser|aesthetic",i]',
                            '["healthcare"]["name"~"esth|laser|aesthetic",i]'],
    "aesthetic clinic": ['["shop"="beauty"]', '["amenity"="clinic"]["name"~"aesthetic|cosmetic|laser",i]'],
    "spa": ['["leisure"="spa"]', '["shop"="massage"]'],
    "tatouage": ['["shop"="tattoo"]'],
    "opticien": ['["shop"="optician"]'],
    "dentiste": ['["amenity"="dentist"]'],
    "garage": ['["shop"="car_repair"]'],
    "carrosserie": ['["shop"="car_repair"]["service:vehicle:body_repair"="yes"]', '["craft"="car_painter"]'],
    "car detailing": ['["amenity"="car_wash"]', '["shop"="car_repair"]["name"~"detail|clean|polish",i]'],
    "location de voiture": ['["amenity"="car_rental"]'],
    "car rental": ['["amenity"="car_rental"]'],
    "salle de sport": ['["leisure"="fitness_centre"]'],
    "gym": ['["leisure"="fitness_centre"]'],
    "hotel": ['["tourism"="hotel"]'],
    "agence immobiliere": ['["office"="estate_agent"]'],
    "artisan plombier": ['["craft"="plumber"]'],
    "plombier": ['["craft"="plumber"]'],
    "electricien": ['["craft"="electrician"]'],
    "menuisier": ['["craft"="carpenter"]'],
    "photographe": ['["craft"="photographer"]', '["shop"="photo"]'],
    "auto-ecole": ['["amenity"="driving_school"]'],
    "veterinaire": ['["amenity"="veterinary"]'],
    "pressing": ['["shop"="dry_cleaning"]', '["shop"="laundry"]'],
}

# Pays → code région (Google Places) et indicatif téléphonique (liens WhatsApp).
COUNTRIES = {
    "France": ("FR", "33"), "Belgique": ("BE", "32"), "Belgium": ("BE", "32"), "Suisse": ("CH", "41"),
    "Switzerland": ("CH", "41"), "Luxembourg": ("LU", "352"), "Canada": ("CA", "1"), "Maroc": ("MA", "212"),
    "Morocco": ("MA", "212"), "Australia": ("AU", "61"), "Australie": ("AU", "61"), "UAE": ("AE", "971"),
    "Emirats arabes unis": ("AE", "971"), "United Kingdom": ("GB", "44"), "UK": ("GB", "44"),
    "United States": ("US", "1"), "USA": ("US", "1"),
}

# Domaines qui ne sont pas des sites officiels (annuaires, plateformes, réseaux).
DIRECTORY_DOMAINS = [
    "pagesjaunes.fr", "tripadvisor", "yelp.", "thefork", "lafourchette", "planity.com", "treatwell", "booksy",
    "doctolib", "google.", "goo.gl", "maps.app", "societe.com", "pappers", "infogreffe", "verif.com",
    "annuaire", "justacote", "mappy", "foursquare", "facebook.com", "instagram.com", "tiktok.com",
    "linkedin.com", "twitter.com", "x.com", "youtube.com", "pinterest.", "ubereats", "deliveroo", "just-eat",
    "wikipedia", "petitfute", "118712", "hoodspot", "cylex", "kompass", "manageo", "linktr.ee", "solocal",
    "waze.com", "apple.com", "bing.com", "duckduckgo", "trustpilot", "yellowpages", "truelocal", "hotfrog",
    "zomato", "booking.com", "expedia", "airbnb", "fresha.com", "groupon", "leboncoin", "indeed", "glassdoor",
]
SOCIAL_ONLY_DOMAINS = ["facebook.com", "instagram.com", "tiktok.com", "linktr.ee", "linkin.bio", "beacons.ai",
                       "sites.google.com", "business.site", "wa.me", "linkedin.com"]
