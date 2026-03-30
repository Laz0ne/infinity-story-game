import uuid
from fastapi import APIRouter, HTTPException

from backend.database import (
    create_player,
    get_player,
    update_player_stats,
    add_history,
    get_recent_situations,
    get_last_choices,
)
from backend.engine.narrative import get_first_situation, generate_situation
from backend.models import (
    NewGameRequest,
    ChoiceRequest,
    ChoiceOut,
    StatsOut,
    GameStateOut,
    TurnOut,
)

router = APIRouter(prefix="/api/game", tags=["game"])

# Stockage en mémoire de la situation courante pour chaque joueur
# { player_id: { situation_id, choices: [{id, text, reputation_delta, argent_delta, influence_delta}] } }
_current_situations: dict[str, dict] = {}


def _to_stats_out(player: dict) -> StatsOut:
    return StatsOut(
        reputation=player["reputation"],
        argent=player["argent"],
        influence=player["influence"],
        turn=player["turn"],
        name=player["name"],
        character_class=player["character_class"],
    )


@router.post("/new", response_model=GameStateOut)
def new_game(body: NewGameRequest) -> GameStateOut:
    player_id = str(uuid.uuid4())
    create_player(player_id, body.name, body.character_class)
    player = get_player(player_id)

    situation = get_first_situation(player)
    _current_situations[player_id] = situation

    return GameStateOut(
        player_id=player_id,
        story_text=situation["story_text"],
        choices=[ChoiceOut(id=c["id"], text=c["text"]) for c in situation["choices"]],
        stats=_to_stats_out(player),
    )


@router.post("/choice", response_model=TurnOut)
def make_choice(body: ChoiceRequest) -> TurnOut:
    player = get_player(body.player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Joueur introuvable.")

    current = _current_situations.get(body.player_id)
    if not current:
        raise HTTPException(
            status_code=400,
            detail="Aucune situation active. Démarrez une nouvelle partie.",
        )

    choices = current["choices"]
    selected = next((c for c in choices if c["id"] == body.choice_id), None)
    if not selected:
        raise HTTPException(status_code=400, detail="Choix invalide.")

    # Enregistrer le choix dans l'historique
    add_history(
        player_id=body.player_id,
        turn_number=player["turn"],
        situation_id=current["situation_id"],
        choice_id=selected["id"],
        story_text=current["story_text"],
        choice_text=selected["text"],
        reputation_change=selected["reputation_delta"],
        argent_change=selected["argent_delta"],
        influence_change=selected["influence_delta"],
    )

    # Mettre à jour les stats
    updated_player = update_player_stats(
        player_id=body.player_id,
        reputation_delta=selected["reputation_delta"],
        argent_delta=selected["argent_delta"],
        influence_delta=selected["influence_delta"],
    )

    # Générer la prochaine situation
    recent_ids = get_recent_situations(body.player_id)
    recent_choices = get_last_choices(body.player_id)

    next_situation = generate_situation(updated_player, recent_ids, recent_choices)
    _current_situations[body.player_id] = next_situation

    return TurnOut(
        story_text=next_situation["story_text"],
        choices=[ChoiceOut(id=c["id"], text=c["text"]) for c in next_situation["choices"]],
        stats=_to_stats_out(updated_player),
        turn=updated_player["turn"],
    )


@router.get("/stats/{player_id}", response_model=StatsOut)
def get_stats(player_id: str) -> StatsOut:
    player = get_player(player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Joueur introuvable.")
    return _to_stats_out(player)
