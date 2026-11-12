/**
 * VP-5724 helpers — Tile Colors (Bold | Pastel) on Create Order.
 *
 * NOT a spec. Adds what the page objects lack for this ticket: the setting's DB
 * value (`merchant_theme_pos_style`, the oracle), opening / saving the POS card,
 * and ONE-frame colour reads of the Create Order tiles (categories with their
 * count line, services, staff) plus the selected / added states.
 */

import { browser } from '@wdio/globals';
import { Timeouts } from '../../../configs/constants/timeouts.js';
import { gql } from '../../../src/api/index.js';
import type { TileColors } from '../../../src/constants/testids.settings-accessibility.js';
import {
  PaletteCss,
  PINNED_TILE_HEX,
  PINNED_TILE_LABELS,
} from '../../../src/constants/testids.vp-palette.js';
import { goToSettings, returnToHome } from '../../../src/flows/index.js';
import { step } from '../../../src/helpers/steps.js';
import { switchToMain } from '../../../src/helpers/window.js';
import { accessibilitySettingsPage, homePage, settingsPage } from '../../../src/pages/index.js';
import { toHex } from '../../../src/utils/color.js';

export const SAVED_TOAST_RE = /Tile colors setting updated successfully|Cập nhật màu ô thành công/i;

/* ------------------------------------------------------------------------- *
 * DB oracle
 * ------------------------------------------------------------------------- */

export interface ThemePosStyle {
  font_size?: string;
  tile_colors?: string;
  [field: string]: unknown;
}

const THEME_POS_STYLE_QUERY = `query vp5724ThemePosStyle {
  sysSettingList(where: { key: { eq: "merchant_theme_pos_style" } }) { value }
}`;

/** The stored `merchant_theme_pos_style` object; `{}` when the row is missing. */
export async function savedThemePosStyle(): Promise<ThemePosStyle> {
  await switchToMain();
  const data = await gql().query<{ sysSettingList: { value: string | null }[] }>(THEME_POS_STYLE_QUERY, {
    operationName: 'vp5724ThemePosStyle',
  });
  const raw = data.sysSettingList[0]?.value ?? '';
  try {
    const parsed: unknown = JSON.parse(raw);
    // Seen JSON-in-JSON after a sync round-trip on other sys settings: unwrap once.
    const obj: unknown = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
    return obj && typeof obj === 'object' ? (obj as ThemePosStyle) : {};
  } catch {
    return {};
  }
}

/** The stored Tile Colors, with the app's own fallback (no row / no field → Bold). */
export async function savedTileColors(): Promise<TileColors> {
  return (await savedThemePosStyle()).tile_colors === 'pastel' ? 'pastel' : 'bold';
}

/** Poll the DB until it holds `want`; returns the last read. */
export async function waitSavedTileColors(
  want: TileColors,
  timeout: number = Timeouts.MEDIUM,
): Promise<TileColors> {
  let last = await savedTileColors();
  try {
    await browser.waitUntil(
      async () => {
        last = await savedTileColors();
        return last === want;
      },
      { timeout, interval: 500 },
    );
  } catch {
    // Timed out: the caller asserts on the last read.
  }
  return last;
}

/* ------------------------------------------------------------------------- *
 * POS card
 * ------------------------------------------------------------------------- */

/** Settings → Accessibility, scrolled to the Tile Colors card. */
export async function openTileColorsCard(): Promise<void> {
  await goToSettings();
  await settingsPage.openSection('ACCESSIBILITY');
  await accessibilitySettingsPage.waitForReady(Timeouts.MEDIUM);
  if (!(await accessibilitySettingsPage.isTileColorsCardShown())) {
    throw new Error(
      'Settings › Accessibility shows no Tile Colors card — build older than VP-5724 (1.1.120)?',
    );
  }
}

/** Save `value` from the POS and wait until the DB holds it. Leaves the app on Settings. */
export async function setTileColors(value: TileColors): Promise<void> {
  await step(`Tile Colors → ${value}`, async () => {
    await openTileColorsCard();
    await accessibilitySettingsPage.applyTileColors(value);
    const saved = await waitSavedTileColors(value);
    if (saved !== value) throw new Error(`Tile Colors: saved ${value} but the DB reads ${saved}.`);
  });
}

/* ------------------------------------------------------------------------- *
 * Create Order colour reads
 * ------------------------------------------------------------------------- */

/** One coloured tile as rendered. Colours are upper-case `#RRGGBB`. */
export interface PaintedTile {
  name: string;
  background: string;
  /** Computed `color` of the name element. */
  nameText: string;
  /** Computed `color` of the last line (count on a category, price on a service). */
  lastLineText: string;
}

export interface CategoryTile extends PaintedTile {
  /** Quick Pay / Gift Card — rendered from constants (a real category may share the name). */
  pinned: boolean;
}

/** Pinned = pinned label AND the pinned constant colour (merchant 14 has a real "Gift Card" category). */
function isPinnedTile(name: string, identityColor: string): boolean {
  const hex = toHex(identityColor);
  return (
    ((PINNED_TILE_LABELS.quickPay as readonly string[]).includes(name) && hex === PINNED_TILE_HEX.quickPay) ||
    ((PINNED_TILE_LABELS.giftCard as readonly string[]).includes(name) && hex === PINNED_TILE_HEX.giftCard)
  );
}

export interface StaffTile {
  name: string;
  nameText: string;
  /** Fill of the coloured band the name sits on. */
  background: string;
}

export interface CreateOrderTiles {
  categories: CategoryTile[];
  services: PaintedTile[];
  staff: StaffTile[];
}

/** Back to Create Order (a fresh mount reads the setting) and read every mounted tile in one frame. */
export async function readCreateOrderTiles({ navigate = true } = {}): Promise<CreateOrderTiles> {
  await switchToMain();
  if (navigate) await returnToHome();
  await homePage.waitForReady();
  await browser.waitUntil(
    async () =>
      browser.execute(
        (a: string, b: string) =>
          document.querySelectorAll(a).length + document.querySelectorAll(b).length > 0,
        PaletteCss.serviceTiles,
        PaletteCss.serviceTilesFallback,
      ),
    { timeout: Timeouts.MEDIUM, interval: 250, timeoutMsg: 'Create Order rendered no service tile' },
  );

  const raw = await browser.execute(
    (css: {
      serviceTiles: string;
      serviceTilesFallback: string;
      categoryTiles: string;
      staffTiles: string;
      staffTilesFallback: string;
    }) => {
      const color = (el: Element | null): string => (el ? window.getComputedStyle(el).color : '');
      const bg = (el: Element): string => window.getComputedStyle(el).backgroundColor;
      const textOf = (el: Element | null): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
      /** The first ancestor-or-self with a painted background. */
      const paintedBg = (el: Element | null): string => {
        for (let e = el; e; e = e.parentElement) {
          const b = window.getComputedStyle(e).backgroundColor;
          if (b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') return b;
        }
        return '';
      };

      const categories = Array.from(document.querySelectorAll(css.categoryTiles))
        .filter((tile) => tile.querySelector('h3') !== null)
        .map((tile) => {
          const h3 = tile.querySelector('h3');
          return {
            name: textOf(h3),
            background: bg(tile),
            nameText: color(h3),
            lastLineText: color(tile.lastElementChild),
            // The colour the tile is drawn from (`--identity-color`, inline): pinned tiles carry
            // their constant colour; their count line exists but is hidden, so it tells nothing.
            identityColor: (tile as HTMLElement).style.getPropertyValue('--identity-color').trim(),
          };
        });

      let serviceEls = Array.from(document.querySelectorAll(css.serviceTiles));
      if (serviceEls.length === 0)
        serviceEls = Array.from(document.querySelectorAll(css.serviceTilesFallback));
      const services = serviceEls.map((tile) => {
        const name = tile.firstElementChild?.firstElementChild ?? tile.firstElementChild;
        return {
          name: textOf(name),
          background: bg(tile),
          nameText: color(name),
          lastLineText: color(tile.lastElementChild),
        };
      });

      let staffEls = Array.from(document.querySelectorAll(css.staffTiles));
      if (staffEls.length === 0) staffEls = Array.from(document.querySelectorAll(css.staffTilesFallback));
      const staff = staffEls
        .map((tile) => tile.querySelector('span'))
        .filter((span): span is HTMLSpanElement => span !== null)
        .map((span) => ({ name: textOf(span), nameText: color(span), background: paintedBg(span) }));

      return { categories, services, staff };
    },
    {
      serviceTiles: PaletteCss.serviceTiles,
      serviceTilesFallback: PaletteCss.serviceTilesFallback,
      categoryTiles: PaletteCss.categoryTiles,
      staffTiles: PaletteCss.staffTiles,
      staffTilesFallback: PaletteCss.staffTilesFallback,
    },
  );

  const hex = <T extends PaintedTile | StaffTile>(t: T): T => {
    const out = { ...t, background: toHex(t.background), nameText: toHex(t.nameText) };
    if ('lastLineText' in out) out.lastLineText = toHex(out.lastLineText);
    return out;
  };
  return {
    categories: raw.categories.map(({ identityColor, ...c }) =>
      hex({ ...c, pinned: isPinnedTile(c.name, identityColor) }),
    ),
    services: raw.services.map((s) => hex(s)),
    staff: raw.staff.map((s) => hex(s)),
  };
}

/** Which pinned tile a category tile is (by label), or null for a real category. */
export function pinnedKind(tile: CategoryTile): keyof typeof PINNED_TILE_HEX | null {
  if (!tile.pinned) return null;
  if ((PINNED_TILE_LABELS.quickPay as readonly string[]).includes(tile.name)) return 'quickPay';
  if ((PINNED_TILE_LABELS.giftCard as readonly string[]).includes(tile.name)) return 'giftCard';
  return null;
}

/** The selected staff tile and the added service tile, as rendered (CC-05). */
export interface SelectionState {
  /** Staff tiles whose name is white — only the selected one paints it so. */
  selectedStaff: StaffTile[];
  /** `::after` top border width of every service tile (4px on an added service). */
  serviceAfterBorders: string[];
}

export async function readSelectionState(): Promise<SelectionState> {
  // Read in place: navigating could drop the draft whose selection is being read.
  const tiles = await readCreateOrderTiles({ navigate: false });
  const serviceAfterBorders = await browser.execute(
    (a: string, b: string) => {
      let els = Array.from(document.querySelectorAll(a));
      if (els.length === 0) els = Array.from(document.querySelectorAll(b));
      return els.map((el) => window.getComputedStyle(el, '::after').borderTopWidth);
    },
    PaletteCss.serviceTiles,
    PaletteCss.serviceTilesFallback,
  );
  return {
    selectedStaff: tiles.staff.filter((s) => s.nameText === '#FFFFFF'),
    serviceAfterBorders,
  };
}

/** Back to the till from wherever a case left the app. */
export async function backToTill(): Promise<void> {
  await switchToMain().catch(() => undefined);
  await returnToHome();
}
