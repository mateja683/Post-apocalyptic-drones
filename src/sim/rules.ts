// Modified for Atomic Deco, a reskin of Battle Drones (Apache License 2.0).
import { COMBAT, ECONOMY, UNITS } from "./balance";
import type { Strategy } from "./ai/commander";
import type { BuildingKind, Faction, Unit, UnitKind, World } from "./types";

/**
 * Match rules and the mutators that change them. `World.rules` is absent
 * (or identity) in a classic match; every hook below reads through
 * `rulesOf(w)`, so a world without rules plays exactly as before.
 *
 * Mutators are picked on the menu (or by the Daily Op) and apply to BOTH
 * sides: the AI obeys them through the same blockers and multipliers.
 */

export type MutatorId =
  | "blitz"
  | "goldrush"
  | "glass"
  | "rapidfab"
  | "airwar"
  | "infantrywar"
  | "airborne"
  | "veterans"
  | "clearskies"
  | "nomads"
  | "robotlove"
  | "armada";

export interface Rules {
  /** Scrap each side starts with. */
  startScrap: number;
  /**
   * Multiplier on harvested scrap and HQ trickle, on top of
   * `FactionState.incomeMult` (which the AI rewrites every tick).
   */
  incomeMult: number;
  /** Build progress per tick: 2 = units and buildings take half the time. */
  buildSpeed: number;
  /** Multiplier on every weapon's damage. */
  dmgMult: number;
  bannedUnits: UnitKind[];
  bannedBuildings: BuildingKind[];
  /** No fog of war for either side. */
  fogOff: boolean;
  /** Veterancy rank that produced combat units start at. */
  startRank: number;
  /** Units each side starts with beside its HQ, on top of the classic harvester and Tin Soldiers. */
  startUnits: UnitKind[];
  /** The mutators these rules came from, in canonical order (display, career). */
  mutators: MutatorId[];
  /** Ops: bans for one side only (e.g. "air only" for the player), on top of the shared ones. */
  sideBans?: Partial<Record<Faction, { units?: UnitKind[]; buildings?: BuildingKind[] }>>;
  /** Ops: per-side income multiplier on top of `incomeMult` (0 = a frozen economy). */
  sideIncome?: Partial<Record<Faction, number>>;
  /** What a ban no mutator explains says ("Disabled in this op"); default "Disabled: match rules". */
  banLabel?: string;
  /**
   * Ops: no commander calldowns for either side — for an op whose puzzle is
   * a fixed strike group or a fixed budget (a free Drop Pod would break it).
   */
  noCalldowns?: boolean;
  /** The map's HQ trickle, scrap/s (default ECONOMY.hqTrickle). */
  hqTrickle?: number;
  /** The map hands a side with no Skyliner a free one (lifeline.ts). */
  lifeline?: boolean;
  /**
   * The map has islands only a Skyliner can reach: buildings, production and
   * Drop Pods stay on land joined to the side's HQ (world.ts onHomeLand).
   */
  islands?: boolean;
  /**
   * Nomads: each side starts with an anchored Colossus where its HQ would
   * stand, and no HQ. Anchored Colossi also build Prospectors (goliath.ts
   * trainableAt); every building is an outpost of one.
   */
  nomads?: boolean;
  /** Robot Love: two enemy Colossi within GOLIATH.love.range fall in love and the match is a draw (goliath.ts tickLove). */
  robotLove?: boolean;
  /**
   * Colossus Armada: each side starts with GOLIATH.armada.count Colossi in
   * the air, each carried by two Skyliners, and nothing else: no HQ, no
   * Prospector, no squad, no opener (goliath.ts armadaStart). As under Nomads,
   * anchored Colossi also build Prospectors and every building is an outpost.
   */
  armada?: boolean;
  /**
   * Island maps: the tile at the centre of each side's starting HQ, so home
   * land is still known once the HQ has fallen (or, under Nomads, was never
   * built) and the side plays on round a Colossus (world.ts onHomeLand).
   */
  homeTiles?: Partial<Record<Faction, [number, number]>>;
}

export const DEFAULT_RULES: Readonly<Rules> = Object.freeze({
  startScrap: ECONOMY.startingScrap,
  incomeMult: 1,
  buildSpeed: 1,
  dmgMult: 1,
  bannedUnits: [],
  bannedBuildings: [],
  fogOff: false,
  startRank: 0,
  startUnits: [],
  mutators: []
});

export interface MutatorDef {
  id: MutatorId;
  name: string;
  icon: string;
  /** One line for the menu sheet. */
  desc: string;
  apply(r: Rules): void;
  bansUnits?: UnitKind[];
  bansBuildings?: BuildingKind[];
  /** Mutators that make no sense together with this one. */
  conflicts?: MutatorId[];
}

/** Ground combat units: the tanks, the robot infantry squads and the Colossus. */
export const GROUND_COMBAT: UnitKind[] = ["stinger", "flak-crawler", "mortar", "mastodon", "lancer", "trooper", "rocket-squad", "sniper", "goliath"];

/**
 * What "no ground combat" bans (Air War, Sky Pirates): GROUND_COMBAT, and the
 * Skyliner — the starting Tin Soldiers is kept to guard home, and a dropship
 * would fly it into the fight.
 */
export const NO_GROUND_COMBAT: UnitKind[] = [...GROUND_COMBAT, "condor"];

/** Robot infantry: the squads a Robot Foundry builds. */
export const INFANTRY_SQUADS: UnitKind[] = ["trooper", "rocket-squad", "sniper"];

/**
 * What Infantry War bans: every combat vehicle and combat aircraft. Prospectors,
 * Skylarks, Tinkers and the Skyliner stay (none of them fights).
 */
export const NO_VEHICLES: UnitKind[] = [
  ...GROUND_COMBAT.filter((k) => !INFANTRY_SQUADS.includes(k)),
  "wasp",
  "raptor",
  "hornet"
];

export const MUTATORS: Record<MutatorId, MutatorDef> = {
  blitz: {
    id: "blitz",
    name: "Blitz",
    icon: "⚡",
    desc: "Both sides start with 3,000 scrap",
    apply: (r) => (r.startScrap = 3000)
  },
  goldrush: {
    id: "goldrush",
    name: "Gold Rush",
    icon: "💰",
    desc: "Harvesting and HQ income ×1.5",
    apply: (r) => (r.incomeMult *= 1.5)
  },
  glass: {
    id: "glass",
    name: "Glass Cannons",
    icon: "💥",
    desc: "Every weapon deals double damage",
    apply: (r) => (r.dmgMult *= 2)
  },
  rapidfab: {
    id: "rapidfab",
    name: "Rapid Fab",
    icon: "🔧",
    desc: "Units and buildings build in half the time",
    apply: (r) => (r.buildSpeed *= 2)
  },
  airwar: {
    id: "airwar",
    name: "Air War",
    icon: "✈️",
    // Sky Batteries go too: measured, aircraft-only armies never crack a SAM line (every
    // AI-vs-AI Air War drew at 25:00); turrets and the HQ gun still shoot back.
    // Infantry and their Robot Foundry are ground combat too (the starting squad stays home,
    // so no Skyliner either: NO_GROUND_COMBAT)
    desc: "No ground combat units, Skyliners, Motor Works, Robot Foundries or Sky Batteries: dogfights decide it",
    bansUnits: NO_GROUND_COMBAT,
    // (and no Colossus, which Nomads, Robot Love and Colossus Armada are about)
    conflicts: ["infantrywar", "airborne", "nomads", "robotlove", "armada"],
    bansBuildings: ["fab-plant", "assembly-bay", "sam-site"],
    apply: (r) => {
      r.bannedUnits.push(...NO_GROUND_COMBAT);
      r.bannedBuildings.push("fab-plant", "assembly-bay", "sam-site");
    }
  },
  infantrywar: {
    id: "infantrywar",
    name: "Infantry War",
    icon: "🤖",
    // the Aerodrome stays for Skyliners, Skylarks and Tinkers; Pillboxes and Sky Batteries stay too
    // (Bazooka Squads crack them, and Sky Batteries are the answer to Skyliner drops)
    desc: "Robot infantry only: no combat vehicles, combat aircraft or Motor Works",
    bansUnits: NO_VEHICLES,
    bansBuildings: ["fab-plant"],
    conflicts: ["airwar", "nomads", "robotlove", "armada"],
    apply: (r) => {
      r.bannedUnits.push(...NO_VEHICLES);
      r.bannedBuildings.push("fab-plant");
    }
  },
  airborne: {
    id: "airborne",
    name: "Airborne",
    icon: "🪂",
    // the classic start already has the Tin Soldiers: this adds the other two and a ride
    desc: "Both sides start with a Skyliner dropship and one of each infantry squad",
    // (Colossus Armada starts with nothing but its Colossi and their Skyliners)
    conflicts: ["airwar", "armada"],
    apply: (r) => {
      for (const k of ["condor", "rocket-squad", "sniper"] as const) if (!r.startUnits.includes(k)) r.startUnits.push(k);
    }
  },
  veterans: {
    id: "veterans",
    name: "Veterans",
    icon: "🎖️",
    desc: "Combat units roll out at rank 1 (+15% damage)",
    apply: (r) => (r.startRank = Math.max(r.startRank, 1))
  },
  clearskies: {
    id: "clearskies",
    name: "Clear Skies",
    icon: "☀️",
    desc: "No fog of war: both sides see everything",
    apply: (r) => (r.fogOff = true)
  },
  nomads: {
    id: "nomads",
    name: "Nomads",
    icon: "🦿",
    // the base walks: anchored, it takes scrap, builds Prospectors and squads, and buildings go up round it
    desc: "Each side starts with a Colossus instead of a base",
    conflicts: ["airwar", "infantrywar", "armada"],
    apply: (r) => (r.nomads = true)
  },
  robotlove: {
    id: "robotlove",
    name: "Robot Love",
    icon: "💘",
    desc: "Two enemy Colossi that meet fall in love, and the battle ends in a draw",
    conflicts: ["airwar", "infantrywar"],
    apply: (r) => (r.robotLove = true)
  },
  armada: {
    id: "armada",
    name: "Colossus Armada",
    icon: "🚁",
    // no base at all: anchored, the Colossi build Prospectors and squads, and buildings go up round them
    desc: "Each side starts with four Colossi in the air, two Skyliners carrying each, and nothing else",
    // (Air War and Infantry War ban the Colossus; Nomads and Airborne start a side some other way)
    conflicts: ["airwar", "infantrywar", "airborne", "nomads"],
    apply: (r) => (r.armada = true)
  }
};

/** Canonical display order. */
export const MUTATOR_IDS = Object.keys(MUTATORS) as MutatorId[];

export const isMutatorId = (s: unknown): s is MutatorId => typeof s === "string" && s in MUTATORS;

/** Do these mutators all work together? */
export function mutatorsCompatible(ids: readonly MutatorId[]): boolean {
  for (const a of ids) for (const b of ids) if (a !== b && MUTATORS[a].conflicts?.includes(b)) return false;
  return true;
}

/**
 * The picker's toggle: `id` off if it is on, else on — switching off any
 * mutator it can't run with (Air War and the infantry ones). Canonical order.
 */
export function toggleMutator(on: readonly MutatorId[], id: MutatorId): MutatorId[] {
  const keep = on.includes(id) ? on.filter((m) => m !== id) : [...on.filter((m) => mutatorsCompatible([id, m])), id];
  return MUTATOR_IDS.filter((m) => keep.includes(m));
}

/**
 * Rules for a set of mutators (deduplicated, unknown ids ignored; of two that
 * conflict, the first in canonical order wins and the other is left out).
 */
export function makeRules(ids: readonly MutatorId[]): Rules {
  const r: Rules = { ...DEFAULT_RULES, bannedUnits: [], bannedBuildings: [], startUnits: [], mutators: [] };
  for (const id of MUTATOR_IDS)
    if (ids.includes(id) && !r.mutators.some((m) => MUTATORS[m].conflicts?.includes(id))) {
      MUTATORS[id].apply(r);
      r.mutators.push(id);
    }
  return r;
}

/** Install a match's mutators (createMapWorld calls this before the first tick). */
export function applyMutators(w: World, ids: readonly MutatorId[]): void {
  const r = makeRules(ids.filter(isMutatorId));
  if (r.mutators.length === 0) return;
  w.rules = r;
  for (const f of Object.values(w.factions)) f.scrap = r.startScrap;
}

export const rulesOf = (w: World): Readonly<Rules> => w.rules ?? DEFAULT_RULES;

/** Nomads and Colossus Armada: no HQ is ever built, and a side's Colossi are its base. */
export const goliathBase = (w: World): boolean => !!(rulesOf(w).nomads || rulesOf(w).armada);

/** True when any mutator is active (career: no map stars). */
export const isMutated = (w: World): boolean => rulesOf(w).mutators.length > 0;

/** Total income multiplier for a faction: AI handicap × mutators (× an op's per-side factor). */
export const incomeOf = (w: World, f: Faction): number => {
  const r = rulesOf(w);
  return w.factions[f].incomeMult * r.incomeMult * (r.sideIncome?.[f] ?? 1);
};

/**
 * Why a kind is disabled by this match's rules (null = allowed): a mutator
 * for both sides, or (with `faction`) an op's ban on that side alone.
 */
export function bannedBy(w: World, kind: UnitKind | BuildingKind, faction?: Faction): string | null {
  const r = rulesOf(w);
  const isUnit = kind in UNITS;
  const inList = (units?: readonly UnitKind[], buildings?: readonly BuildingKind[]) =>
    isUnit ? !!units?.includes(kind as UnitKind) : !!buildings?.includes(kind as BuildingKind);
  const side = faction ? r.sideBans?.[faction] : undefined;
  if (!inList(r.bannedUnits, r.bannedBuildings) && !inList(side?.units, side?.buildings)) return null;
  const by = r.mutators.find((id) => inList(MUTATORS[id].bansUnits, MUTATORS[id].bansBuildings));
  return by ? `Disabled: ${MUTATORS[by].name}` : r.banLabel ?? "Disabled: match rules";
}

/** Veterans mutator: a freshly built combat unit starts ranked (with the XP to match). */
export function applySpawnRank(w: World, u: Unit): void {
  const rank = Math.min(COMBAT.rankXp.length, rulesOf(w).startRank);
  if (rank <= 0 || UNITS[u.kind].dps <= 0 || u.rank >= rank) return;
  u.rank = rank;
  u.xp = Math.max(u.xp, COMBAT.rankXp[rank - 1]! * UNITS[u.kind].cost);
}

/**
 * Is robot infantry this side's whole army? No Motor Works and no combat
 * aircraft, but a Robot Foundry (Infantry War, or an op's bans to match):
 * the AI then builds Bays where its plan says Motor Works (ai/commander.ts).
 */
export function infantryArmy(w: World, f: Faction): boolean {
  return bannedBy(w, "fab-plant", f) !== null && bannedBy(w, "wasp", f) !== null && bannedBy(w, "assembly-bay", f) === null;
}

/**
 * Can an AI personality play its plan under these rules? (An air-only
 * commander needs an Aerodrome and aircraft to build there; a tank plan needs
 * the Motor Works; a ground-raid plan needs it too, or under Infantry War an
 * Robot Foundry to field its early army instead. Measured: Ironclad, playing
 * Infantry War from Bays, won 20% of 100 AI-vs-AI games; Rush 40%.)
 */
export function strategyFits(s: Strategy, r: Readonly<Rules>): boolean {
  if (s.airOnly && (r.bannedBuildings.includes("airpad") || r.bannedUnits.includes("wasp"))) return false;
  if (s.heavy && r.bannedBuildings.includes("fab-plant")) return false;
  if (s.groundRaids && r.bannedBuildings.includes("fab-plant") && r.bannedBuildings.includes("assembly-bay")) return false;
  return true;
}
