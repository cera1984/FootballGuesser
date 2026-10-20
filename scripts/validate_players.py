#!/usr/bin/env python3
"""Static checks for FootballGuesser editorial player data."""
import json
import re
from pathlib import Path

players = json.loads(Path("players.json").read_text(encoding="utf-8"))
assert len(players) == 500, f"Expected 500 players, got {len(players)}"
ids = [p["id"] for p in players]
assert len(set(ids)) == len(ids), "Duplicate player IDs"
names = [p["name"].casefold().strip() for p in players]
assert len(set(names)) == len(names), "Duplicate player names"
verified = 0
for p in players:
    assert p["name"].strip(), f"Empty name: {p['id']}"
    assert p["role"] in {"POR", "DIF", "CEN", "ATT"}, p["name"]
    assert p["difficulty"] in {"facile", "media", "difficile"}, p["name"]
    assert p["nationality"].strip(), p["name"]
    assert re.fullmatch(r"\d{4}-\d{4}", p["peak"]), (p["name"], p["peak"])
    start, end = map(int, p["peak"].split("-"))
    assert 1980 <= start <= end <= 2026, (p["name"], p["peak"])
    assert isinstance(p["clubs"], list), p["name"]
    assert len(p["clubs"]) == len(set(c.casefold().strip() for c in p["clubs"])), p["name"]
    if p.get("clubsVerified"):
        verified += 1
        assert p["clubs"], f"Club data marked present but empty: {p['name']}"
print(f"PASS: {len(players)} unique players; {verified} club lists populated; {len(players)-verified} pending.")
