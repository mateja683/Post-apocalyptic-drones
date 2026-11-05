// Added for Atomic Deco, a reskin of Battle Drones (Apache License 2.0).
/**
 * The Field Manual: every unit and building, what it's for and what it beats,
 * in a sheet you can open from the menu or the pause menu. The cards are the
 * same ones the vehicles and models pages show (unit-info.ts), read from the
 * balance tables, so the manual never drifts from the game.
 */
import { UNITS } from "../sim/balance";
import type { BuildingKind, UnitKind } from "../sim/types";
import { BUILDING_GROUPS, GROUPS, card, siteCard, siteName, type SiteKind } from "../unit-info";
import { openSheet } from "./career";

type Tab = "units" | "buildings";

const icon = (k: string): string => `./assets/icons/${k}.webp`;
const isUnit = (k: string): k is UnitKind => k in UNITS;

/** A building or objective card with its portrait added (siteCard() leaves it out). */
function siteCardWithPortrait(k: SiteKind): string {
  return siteCard(k).replace('<div class="head">', `<div class="head"><img src="${icon(k)}" alt="" loading="lazy" />`);
}

function tabHtml(tab: Tab): string {
  const groups = tab === "units" ? GROUPS : BUILDING_GROUPS;
  const kinds = groups.flatMap((g) => g.kinds as string[]);
  const name = (k: string) => (isUnit(k) ? UNITS[k].name : siteName(k as SiteKind));
  const jump = kinds.map((k) => `<a class="mn-chip" href="#${k}"><img src="${icon(k)}" alt="" />${name(k)}</a>`).join("");
  const body = groups
    .map(
      (g) =>
        `<h3 class="mn-group">${g.title}</h3>${(g.kinds as string[])
          .map((k) => (isUnit(k) ? card(k) : siteCardWithPortrait(k as SiteKind)))
          .join("")}`
    )
    .join("");
  return `<nav class="mn-jump">${jump}</nav>${body}`;
}

/**
 * Open the Field Manual over `host`, on the tab that holds `focus` (a unit or
 * building kind) and scrolled to its card, or on the Units tab.
 */
export function openManual(host: HTMLElement, focus?: UnitKind | BuildingKind): void {
  const wrap = openSheet(
    host,
    "manual",
    `<div class="mn-top">
       <h2>📖 Field Manual</h2>
       <button class="round sheet-close" aria-label="Close">✕</button>
     </div>
     <p class="sh-sub">What every unit and building is for, what it beats and what beats it. Tap a name to jump to it.</p>
     <div class="seg mn-tabs">
       <button data-tab="units">Units</button>
       <button data-tab="buildings">Buildings</button>
     </div>
     <div class="mn-body"></div>`
  );
  const sheet = wrap.querySelector<HTMLElement>(".sheet")!;
  const body = wrap.querySelector<HTMLElement>(".mn-body")!;
  let tab: Tab = "units";
  const show = (t: Tab) => {
    tab = t;
    body.innerHTML = tabHtml(t);
    wrap.querySelectorAll<HTMLButtonElement>(".mn-tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === t));
  };
  const goTo = (k: string) => {
    const want: Tab = isUnit(k) ? "units" : "buildings";
    if (want !== tab) show(want);
    const el = body.querySelector<HTMLElement>(`article[id="${k}"]`);
    if (!el) return;
    const header = wrap.querySelector<HTMLElement>(".mn-top")!.offsetHeight;
    const top = sheet.scrollTop + el.getBoundingClientRect().top - sheet.getBoundingClientRect().top - header - 8;
    sheet.scrollTo({ top, behavior: "smooth" });
    el.classList.remove("mn-flash");
    void el.offsetWidth; // restart the highlight
    el.classList.add("mn-flash");
  };
  wrap.querySelectorAll<HTMLButtonElement>(".mn-tabs button").forEach((b) =>
    b.addEventListener("click", () => {
      show(b.dataset.tab as Tab);
      sheet.scrollTo({ top: 0 });
    })
  );
  // the cards link to each other by #kind: jump inside the sheet, never navigate the page
  body.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    goTo(a.getAttribute("href")!.slice(1));
  });
  show(focus && !isUnit(focus) ? "buildings" : "units");
  if (focus) requestAnimationFrame(() => goTo(focus));
}

