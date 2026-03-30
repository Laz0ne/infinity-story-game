"""
Règles de jeu : limites des stats, textes contextuels, et validations.
"""

STAT_LIMITS = {
    "reputation": (-100, 100),
    "argent": (0, 10_000),
    "influence": (0, 100),
}


def reputation_text(reputation: int) -> str:
    """Retourne un descripteur textuel de la réputation."""
    if reputation >= 75:
        return "légendaire"
    if reputation >= 50:
        return "honorable"
    if reputation >= 20:
        return "respectable"
    if reputation >= 0:
        return "neutre"
    if reputation >= -20:
        return "douteuse"
    if reputation >= -50:
        return "mauvaise"
    if reputation >= -75:
        return "infâme"
    return "maudite"


def classe_text(character_class: str) -> str:
    """Retourne le nom lisible de la classe."""
    mapping = {
        "aventurier": "aventurier",
        "voleur": "voleur de l'ombre",
        "marchand": "marchand avisé",
    }
    return mapping.get(character_class, character_class)


def clamp_stat(value: int, stat: str) -> int:
    lo, hi = STAT_LIMITS.get(stat, (-10_000, 10_000))
    return max(lo, min(hi, value))


def apply_choice(
    player: dict,
    reputation_delta: int,
    argent_delta: int,
    influence_delta: int,
) -> dict:
    """Applique les deltas aux stats et retourne les nouvelles valeurs (sans sauvegarder)."""
    return {
        "reputation": clamp_stat(player["reputation"] + reputation_delta, "reputation"),
        "argent": clamp_stat(player["argent"] + argent_delta, "argent"),
        "influence": clamp_stat(player["influence"] + influence_delta, "influence"),
    }
