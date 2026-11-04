// Modified for Ashfall Command, a reskin of Battle Drones (Apache License 2.0).
/**
 * How each side is named and drawn, for the HUD and the presenters. Engine-
 * free. Team colours follow the side (blue is blue on every screen, MULTIPLAYER.md
 * "Colours"); green and purple join blue and red on a four-player map (sim/sides.ts).
 *
 * Reskin: the four sides are the factions of a faded atomic-age wasteland.
 * The sim still calls them blue / red / green / purple; only names and paint
 * change here, and every colour table in the presenters reads from this file.
 */
import type { Faction } from "../sim/types";

/** A side's name in a sentence ("Directorate takes an Uplink"); every name reads as singular. */
export const SIDE_NAME: Readonly<Record<Faction, string>> = {
  blue: "Harbor League",
  red: "Rust Barony",
  green: "Directorate",
  purple: "Choir"
};

/** A side's full title, for lobbies and menus. */
export const SIDE_TITLE: Readonly<Record<Faction, string>> = {
  blue: "The Harbor League",
  red: "The Rust Barony",
  green: "The Verdigris Directorate",
  purple: "The Choir of the Last Light"
};

/** One line of flavour per faction. */
export const SIDE_MOTTO: Readonly<Record<Faction, string>> = {
  blue: "Rebuilt towns of the drowned coast, defended by citizen militia.",
  red: "Scrap warlords who ride the war machines of a dead army.",
  green: "A sealed bureau of scientists, building tomorrow underground.",
  purple: "Pilgrims of the sleeping warhead, waiting for its second dawn."
};

/** The enamel a side's models are painted in: main panels, shadowed panels, highlights (0xRRGGBB). */
export const SIDE_PAINT: Readonly<Record<Faction, { main: number; dark: number; light: number }>> = {
  blue: { main: 0x3b6fb6, dark: 0x223f6e, light: 0x8db3e0 }, // faded cobalt enamel
  red: { main: 0xb8452e, dark: 0x6b2418, light: 0xe39070 }, // oxblood and rust
  green: { main: 0x3e9c72, dark: 0x1e5a40, light: 0x92d6b4 }, // verdigris patina
  purple: { main: 0x8a5cc0, dark: 0x4b2f74, light: 0xc4a6ea } // violet glass
};

/** A side's bright marker colour: rings, minimap pips, held objectives (0xRRGGBB). */
export const SIDE_HEX: Readonly<Record<Faction, number>> = { blue: 0x5d93d6, red: 0xd8603f, green: 0x56bf8c, purple: 0xa77ade };

/** The same marker colours for canvas / CSS. */
export const SIDE_MARK_CSS: Readonly<Record<Faction, string>> = { blue: "#5d93d6", red: "#d8603f", green: "#56bf8c", purple: "#a77ade" };

/** A side's beam and tracer tint (0xRRGGBB). */
export const SIDE_GLOW: Readonly<Record<Faction, number>> = { blue: 0x9fd2f0, red: 0xff8a5a, green: 0x9cf0c4, purple: 0xd6b0ff };

/** A side's text colour on the HUD's dark panels. */
export const SIDE_CSS: Readonly<Record<Faction, string>> = { blue: "#9cc4ee", red: "#f2a48a", green: "#a0e2c0", purple: "#cfb4f2" };

/** A side's bar colour (Uplink meters). */
export const SIDE_METER_CSS: Readonly<Record<Faction, string>> = { blue: "#7aa8e0", red: "#e08066", green: "#72c89c", purple: "#b394e0" };

/** A side's pale tint for salvage labels. */
export const SIDE_PALE_CSS: Readonly<Record<Faction, string>> = { blue: "#b4d2f0", red: "#f2b4a0", green: "#b8ead0", purple: "#dcc8f4" };

/** A side's portrait of a unit or building (ICONS.md): blue's in assets/icons, the others' in a folder each. */
export const iconUrl = (kind: string, f: Faction): string => `assets/icons/${f === "blue" ? "" : `${f}/`}${kind}.webp`;
