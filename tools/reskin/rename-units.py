#!/usr/bin/env python3
"""Reskin helper: rename units and buildings in every TypeScript file, in place.

Display names live in src/sim/balance.ts, but they are also written out by
hand all through the game's text (tips, briefings, callouts, help) and the
tests that check that text. This applies one mapping, whole words and
capitalised only, longest first, so code identifiers (`isGoliath`,
`GoliathWeapon`, kind ids like "hornet") are never touched. Re-runnable
after an upstream merge.

Usage: python3 tools/reskin/rename-units.py src tests
"""
import pathlib
import re
import sys

# old -> new, plural and multi-word forms before the singular
RENAMES = [
    ("Flak Crawlers", "Skyguards"), ("Flak Crawler", "Skyguard"), ("Flak", "Skyguard"),
    ("Trooper Squads", "Tin Soldier squads"), ("Trooper Squad", "Tin Soldiers"), ("Troopers", "Tin Soldiers"), ("Trooper", "Tin Soldier"),
    ("Rocket Squads", "Bazooka Squads"), ("Rocket Squad", "Bazooka Squad"),
    ("Sniper Teams", "Longshot Teams"), ("Sniper Team", "Longshot Team"), ("Snipers", "Longshots"), ("Sniper", "Longshot"),
    ("Fab Plants", "Motor Works"), ("Fab Plant", "Motor Works"),
    ("SAM Sites", "Sky Batteries"), ("SAM sites", "Sky Batteries"), ("SAM Site", "Sky Battery"), ("SAM site", "Sky Battery"), ("SAMs", "Sky Batteries"),
    ("Tech Labs", "Atomic Labs"), ("Tech Lab", "Atomic Lab"),
    ("Assembly Bays", "Robot Foundries"), ("Assembly Bay", "Robot Foundry"),
    ("Airpads", "Aerodromes"), ("Airpad", "Aerodrome"),
    ("Turrets", "Pillboxes"), ("Turret", "Pillbox"),
    ("Goliaths", "Colossi"), ("Goliath", "Colossus"),
    ("Harvesters", "Prospectors"), ("Harvester", "Prospector"),
    ("Scouts", "Skylarks"), ("Scout", "Skylark"),
    ("Stingers", "Roadsters"), ("Stinger", "Roadster"),
    ("Mortars", "Bombards"), ("Mortar", "Bombard"),
    ("Mastodons", "Behemoths"), ("Mastodon", "Behemoth"),
    ("Lancers", "Ray Skiffs"), ("Lancer", "Ray Skiff"),
    ("Wasps", "Comets"), ("Wasp", "Comet"),
    ("Raptors", "Jetstreams"), ("Raptor", "Jetstream"),
    ("Hornets", "Thunderheads"), ("Hornet", "Thunderhead"),
    ("Menders", "Tinkers"), ("Mender", "Tinker"),
    ("Condors", "Skyliners"), ("Condor", "Skyliner"),
]

# "Scout" as a verb, kept
PROTECT = ["Scout early", "Scout to find", "Scout it to"]

# a/an after the swap
ARTICLES = [
    (r"\b([Aa]) (Atomic Lab|Aerodrome)", lambda m: f"{m.group(1)}n {m.group(2)}"),
    (r"\b([Aa])n (Robot Foundry|Prospector|Skyguard|Pillbox|Comet|Behemoth|Bombard|Jetstream|Thunderhead|Tinker|Skyliner|Skylark|Roadster|Ray Skiff|Longshot|Bazooka|Tin Soldier|Sky Battery|Motor Works|Colossus)\b",
     lambda m: f"{m.group(1)} {m.group(2)}"),
]

PATTERN = re.compile(r"(?<![A-Za-z0-9_$])(" + "|".join(re.escape(o) for o, _ in RENAMES) + r")(?![A-Za-z0-9_$])")
MAP = dict(RENAMES)


def rename(text: str) -> str:
    keep = {p: f"\0{i}\0" for i, p in enumerate(PROTECT)}
    for p, k in keep.items():
        text = text.replace(p, k)
    text = PATTERN.sub(lambda m: MAP[m.group(1)], text)
    for pat, fn in ARTICLES:
        text = re.sub(pat, fn, text)
    for p, k in keep.items():
        text = text.replace(k, p)
    return text


def main(roots: list[str]) -> None:
    for root in roots:
        for p in sorted(pathlib.Path(root).rglob("*.ts")):
            s = p.read_text(encoding="utf-8")
            t = rename(s)
            if t != s:
                p.write_text(t, encoding="utf-8")
                print("renamed in", p)


if __name__ == "__main__":
    main(sys.argv[1:])
