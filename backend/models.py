from pydantic import BaseModel, Field
from typing import Literal


class NewGameRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    character_class: Literal["aventurier", "voleur", "marchand"]


class ChoiceRequest(BaseModel):
    player_id: str
    choice_id: int = Field(..., ge=1, le=3)


class ChoiceOut(BaseModel):
    id: int
    text: str


class StatsOut(BaseModel):
    reputation: int
    argent: int
    influence: int
    turn: int
    name: str
    character_class: str


class GameStateOut(BaseModel):
    player_id: str
    story_text: str
    choices: list[ChoiceOut]
    stats: StatsOut


class TurnOut(BaseModel):
    story_text: str
    choices: list[ChoiceOut]
    stats: StatsOut
    turn: int
