#!/usr/bin/env python3
import json
from pathlib import Path

players = json.loads(Path("players.json").read_text(encoding="utf-8"))
long = []
for player in players:
    start, end = map(int, player["peak"].split("-"))
    if end - start > 8:
        long.append((player["name"], player["peak"]))
print("Long editorial peak windows:", len(long), "of", len(players))
for name, peak in long:
    print(name, peak)
