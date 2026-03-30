import sqlite3
import os
from datetime import datetime

DB_PATH = os.environ.get("DB_PATH", "game.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS players (
                id          TEXT PRIMARY KEY,
                name        TEXT NOT NULL,
                character_class TEXT NOT NULL,
                reputation  INTEGER NOT NULL DEFAULT 0,
                argent      INTEGER NOT NULL DEFAULT 50,
                influence   INTEGER NOT NULL DEFAULT 10,
                turn        INTEGER NOT NULL DEFAULT 0,
                created_at  TEXT NOT NULL,
                last_played TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS history (
                id                INTEGER PRIMARY KEY AUTOINCREMENT,
                player_id         TEXT NOT NULL REFERENCES players(id),
                turn_number       INTEGER NOT NULL,
                situation_id      TEXT NOT NULL,
                choice_id         INTEGER NOT NULL,
                story_text        TEXT NOT NULL,
                choice_text       TEXT NOT NULL,
                reputation_change INTEGER NOT NULL DEFAULT 0,
                argent_change     INTEGER NOT NULL DEFAULT 0,
                influence_change  INTEGER NOT NULL DEFAULT 0,
                created_at        TEXT NOT NULL
            );
            """
        )


def create_player(
    player_id: str,
    name: str,
    character_class: str,
) -> None:
    now = datetime.utcnow().isoformat()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO players
                (id, name, character_class, reputation, argent, influence, turn, created_at, last_played)
            VALUES (?, ?, ?, 0, 50, 10, 0, ?, ?)
            """,
            (player_id, name, character_class, now, now),
        )


def get_player(player_id: str) -> dict | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM players WHERE id = ?", (player_id,)
        ).fetchone()
    return dict(row) if row else None


def update_player_stats(
    player_id: str,
    reputation_delta: int,
    argent_delta: int,
    influence_delta: int,
) -> dict:
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE players SET
                reputation  = MAX(-100, MIN(100, reputation + ?)),
                argent      = MAX(0, argent + ?),
                influence   = MAX(0, MIN(100, influence + ?)),
                turn        = turn + 1,
                last_played = ?
            WHERE id = ?
            """,
            (
                reputation_delta,
                argent_delta,
                influence_delta,
                datetime.utcnow().isoformat(),
                player_id,
            ),
        )
        row = conn.execute(
            "SELECT * FROM players WHERE id = ?", (player_id,)
        ).fetchone()
    return dict(row)


def add_history(
    player_id: str,
    turn_number: int,
    situation_id: str,
    choice_id: int,
    story_text: str,
    choice_text: str,
    reputation_change: int,
    argent_change: int,
    influence_change: int,
) -> None:
    now = datetime.utcnow().isoformat()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO history
                (player_id, turn_number, situation_id, choice_id, story_text,
                 choice_text, reputation_change, argent_change, influence_change, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                player_id,
                turn_number,
                situation_id,
                choice_id,
                story_text,
                choice_text,
                reputation_change,
                argent_change,
                influence_change,
                now,
            ),
        )


def get_recent_situations(player_id: str, limit: int = 6) -> list[str]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT situation_id FROM history
            WHERE player_id = ?
            ORDER BY turn_number DESC
            LIMIT ?
            """,
            (player_id, limit),
        ).fetchall()
    return [row["situation_id"] for row in rows]


def get_last_choices(player_id: str, limit: int = 3) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT choice_text, reputation_change, argent_change, influence_change
            FROM history
            WHERE player_id = ?
            ORDER BY turn_number DESC
            LIMIT ?
            """,
            (player_id, limit),
        ).fetchall()
    return [dict(row) for row in rows]
