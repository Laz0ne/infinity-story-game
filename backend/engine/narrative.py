"""
Moteur narratif : sélection des situations, instanciation des templates,
gestion de la mémoire et de la continuité.
"""

import random
from .templates import SITUATIONS
from .rules import reputation_text, classe_text

# Nombre de situations récentes à éviter (anti-répétition)
HISTORY_WINDOW = 6

# Situations de démarrage garanties (intéressantes pour un nouveau joueur)
STARTER_SITUATIONS = [
    "ville_taverne",
    "foret_bandit",
    "rencontre_voyageur",
    "marche_marchand",
]


def _situation_eligible(situation: dict, player: dict, recent_ids: list[str]) -> bool:
    """Vérifie si une situation est éligible pour ce joueur."""
    sid = situation["id"]

    # Anti-répétition
    if sid in recent_ids:
        return False

    rep = player["reputation"]
    argent = player["argent"]
    influence = player["influence"]
    character_class = player["character_class"]

    # Filtre de réputation
    min_rep = situation.get("min_rep", -100)
    max_rep = situation.get("max_rep", 100)
    if not (min_rep <= rep <= max_rep):
        return False

    # Filtre d'argent
    if argent < situation.get("min_argent", 0):
        return False

    # Filtre d'influence
    if influence < situation.get("min_influence", 0):
        return False

    # Filtre de classe
    allowed_classes = situation.get("classes", [])
    if allowed_classes and character_class not in allowed_classes:
        return False

    return True


def _format_text(text: str, player: dict) -> str:
    """Remplace les variables dans le texte de la situation."""
    return text.format(
        nom=player["name"],
        classe_text=classe_text(player["character_class"]),
        reputation_text=reputation_text(player["reputation"]),
        argent=player["argent"],
        influence=player["influence"],
    )


def _build_continuity_prefix(player: dict, recent_choices: list[dict]) -> str:
    """Génère un préfixe de continuité basé sur les derniers choix du joueur."""
    if not recent_choices:
        return ""

    last = recent_choices[0]
    rep = player["reputation"]
    argent = player["argent"]

    hints = []

    # Mémoire de la réputation
    if rep >= 50:
        hints.append(f"Ta réputation honorable ouvre des portes.")
    elif rep <= -30:
        hints.append(f"Ta réputation infâme rend chaque rencontre périlleuse.")

    # Mémoire financière
    if argent >= 200:
        hints.append(f"Tes {argent} pièces t'assurent une certaine liberté.")
    elif argent <= 10:
        hints.append(f"Tes poches quasi vides t'obligent à rester prudent.")

    # Référence au dernier choix
    choice_text = last.get("choice_text", "")
    if choice_text:
        hints.append(f"Ton dernier acte résonne encore dans ta mémoire : « {choice_text} ».")

    if not hints:
        return ""

    # On prend aléatoirement un ou deux indices pour ne pas surcharger
    selected = random.sample(hints, k=min(len(hints), random.randint(1, 2)))
    return " ".join(selected) + "\n\n"


def pick_situation(player: dict, recent_ids: list[str]) -> dict:
    """
    Choisit aléatoirement une situation éligible parmi toutes les situations disponibles.
    Retourne la situation brute (non formatée).
    """
    eligible = [
        s for s in SITUATIONS if _situation_eligible(s, player, recent_ids)
    ]

    if not eligible:
        # Fallback : toutes les situations sauf les récentes
        eligible = [s for s in SITUATIONS if s["id"] not in recent_ids]

    if not eligible:
        # Dernier recours : toutes les situations
        eligible = list(SITUATIONS)

    return random.choice(eligible)


def generate_situation(
    player: dict,
    recent_ids: list[str],
    recent_choices: list[dict],
    *,
    force_situation_id: str | None = None,
) -> dict:
    """
    Génère une situation complète pour le joueur.

    Retourne :
    {
        "situation_id": str,
        "story_text": str,
        "choices": [{"id": 1, "text": str, "reputation_delta": int, ...}, ...]
    }
    """
    if force_situation_id:
        situation = next(
            (s for s in SITUATIONS if s["id"] == force_situation_id), None
        )
        if situation is None:
            situation = pick_situation(player, recent_ids)
    else:
        situation = pick_situation(player, recent_ids)

    continuity = _build_continuity_prefix(player, recent_choices)
    raw_text = situation["text"]
    story_text = continuity + _format_text(raw_text, player)

    choices = [
        {
            "id": idx + 1,
            "text": c["text"],
            "reputation_delta": c["reputation_delta"],
            "argent_delta": c["argent_delta"],
            "influence_delta": c["influence_delta"],
        }
        for idx, c in enumerate(situation["choices"])
    ]

    return {
        "situation_id": situation["id"],
        "story_text": story_text,
        "choices": choices,
    }


def get_first_situation(player: dict) -> dict:
    """Génère la première situation du jeu (parmi une liste restreinte)."""
    starters = [s for s in SITUATIONS if s["id"] in STARTER_SITUATIONS]
    if not starters:
        starters = list(SITUATIONS)
    situation = random.choice(starters)

    raw_text = situation["text"]
    story_text = _format_text(raw_text, player)

    choices = [
        {
            "id": idx + 1,
            "text": c["text"],
            "reputation_delta": c["reputation_delta"],
            "argent_delta": c["argent_delta"],
            "influence_delta": c["influence_delta"],
        }
        for idx, c in enumerate(situation["choices"])
    ]

    return {
        "situation_id": situation["id"],
        "story_text": story_text,
        "choices": choices,
    }
