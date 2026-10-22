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
# Historical constraints checked against official sources in DATA_SOURCES.md.
# These bounds catch impossible peaks without pretending to verify all 500 careers.
career_bounds = {39: (2023, None), 481: (None, 2021), 478: (None, 2003)}
for p in players:
    assert p["name"].strip(), f"Empty name: {p['id']}"
    assert p["role"] in {"POR", "DIF", "CEN", "ATT"}, p["name"]
    assert p["difficulty"] in {"facile", "media", "difficile"}, p["name"]
    assert p["nationality"].strip(), p["name"]
    assert re.fullmatch(r"\d{4}-\d{4}", p["peak"]), (p["name"], p["peak"])
    start, end = map(int, p["peak"].split("-"))
    assert 1980 <= start <= end <= 2026, (p["name"], p["peak"])
    debut, retirement = career_bounds.get(p["id"], (None, None))
    assert debut is None or start >= debut, f"Peak before senior debut: {p['name']}"
    assert retirement is None or end <= retirement, f"Peak after retirement: {p['name']}"
    assert isinstance(p["clubs"], list), p["name"]
    assert all(isinstance(c, str) and c.strip() for c in p["clubs"]), p["name"]
    assert len(p["clubs"]) == len(set(c.casefold().strip() for c in p["clubs"])), p["name"]
    if p.get("clubsVerified"):
        verified += 1
        assert p["clubs"], f"Club data marked present but empty: {p['name']}"
print(f"PASS: {len(players)} unique players; {verified} legacy compilation flags; "
      f"{sum(bool(p['clubs']) for p in players)} nonempty club lists. "
      "This does not certify historical completeness; see DATA_SOURCES.md.")
