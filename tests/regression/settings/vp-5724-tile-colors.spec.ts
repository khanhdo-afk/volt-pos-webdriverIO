/**
 * VP-5724 — Tile Colors (Bold | Pastel): how Create Order paints its category and
 * service tiles, one value for the whole store (`merchant_theme_pos_style.tile_colors`).
 * PRs volt-pos#3425, volt-pos-api#1651, fastboy-portal#1020 (POS >= 1.1.120).
 *
 * docs/qc/volt-qc/vp-tickets/VP-5724-tile-colors-bold-pastel-test-cases.md (TC-VP5724-01..23)
 *
 *   npm run test:spec -- tests/regression/settings/vp-5724-tile-colors.spec.ts
 *
 * ## Oracles
 *
 * - The setting: GraphQL `sysSettingList` row `merchant_theme_pos_style` (font_size kept on every save).
 * - The colours: `categoryList.colorHex` mapped through the app's own tables
 *   (`CATEGORY_PASTEL_BY_BOLD` / `CATEGORY_BOLD_BY_PASTEL`, copied in testids.vp-palette.ts),
 *   and the Bold read of the SAME tile for the service tiles (no service → category link on screen).
 *
 * ## Writes
 *
 * Store-wide setting → `@exclusive`. `after` puts Bold (the merchant default) back,
 * not a snapshot, so a run cut short mid-case cannot leave Pastel as the "original".
 * TC-13 opens one draft order and deletes it. Portal cases (TC-16..18) drive the
 * Portal in Edge (`.portal-profile/`) and SKIP when its session expired
 * (`npm run portal:auth`); `PortalStore.restore()` puts every touched Portal value back.
 *
 * TC-06, 15, 19, 20, 21, 23 (🧱) and TC-22 (📄 Android) are manual — no `it()`.
 */

import { expect } from '@wdio/globals';
import { Timeouts } from '../../../configs/constants/timeouts.js';
import { assertWritesAllowed } from '../../../configs/env/loadEnv.js';
import { TILE_COLORS_SUBLABELS } from '../../../src/constants/testids.settings-accessibility.js';
import {
  boldTileHex,
  INK_HEX,
  pastelTileHex,
  PINNED_TILE_HEX,
  STAFF_PALETTE_HEX,
} from '../../../src/constants/testids.vp-palette.js';
import { accessibilitySettingsPage, homePage } from '../../../src/pages/index.js';
import { skipUnlessBuild } from '../../../src/support/appVersion.js';
import { PortalStore } from '../../../src/support/portal/portalStore.js';
import { Tag, title } from '../../../src/types/testTags.js';
import { contrastRatio, WHITE_HEX } from '../../../src/utils/color.js';
import { homeCategories } from '../home/vp-4039.helpers.js';
import { clearToasts, waitToast } from './vp-5685.helpers.js';
import {
  backToTill,
  type CategoryTile,
  type CreateOrderTiles,
  openTileColorsCard,
  pinnedKind,
  readCreateOrderTiles,
  readSelectionState,
  SAVED_TOAST_RE,
  savedThemePosStyle,
  savedTileColors,
  setTileColors,
  waitSavedTileColors,
} from './vp-5724.helpers.js';

const TICKET = 'VP-5724';
/** First dev build cut after volt-pos#3425 merged (11/11 02:24 UTC). */
const MIN_BUILD = '1.1.120';
/** WCAG AA for normal text. */
const MIN_CONTRAST = 4.5;

const realCategories = (t: CreateOrderTiles): CategoryTile[] => t.categories.filter((c) => !c.pinned);

/** Name → tile, first one wins (names can repeat; the comparisons go by position too). */
const byName = <T extends { name: string }>(tiles: T[]): Map<string, T> => {
  const m = new Map<string, T>();
  for (const t of tiles) if (!m.has(t.name)) m.set(t.name, t);
  return m;
};

describe('VP-5724 — Tile Colors (Bold | Pastel) on Create Order', function () {
  this.timeout(Timeouts.MOCHA_TEST * 3);

  /** Bold read taken by TC-07, reused by TC-08 / 12 / 14. */
  let boldTiles: CreateOrderTiles | null = null;

  before(async function () {
    assertWritesAllowed('change the merchant Tile Colors setting');
    await skipUnlessBuild(this, MIN_BUILD, TICKET);
  });

  afterEach(async () => {
    await homePage.discardDraftIfAny().catch(() => undefined);
    await backToTill().catch(() => undefined);
  });

  after(async () => {
    if ((await savedTileColors().catch(() => null)) !== 'bold') {
      await setTileColors('bold').catch(() => undefined);
    }
    await backToTill().catch(() => undefined);
  });

  /** Bold now, read once per run. */
  async function boldRead(): Promise<CreateOrderTiles> {
    if (!boldTiles) {
      await setTileColors('bold');
      boldTiles = await readCreateOrderTiles();
    }
    return boldTiles;
  }

  describe('1. Tile Colors card on POS', () => {
    it(
      title(
        'TC-VP5724-01: the Tile Colors card sits right under Default Screen, two options with previews',
        Tag.REGRESSION,
      ),
      async () => {
        await openTileColorsCard();
        expect(await accessibilitySettingsPage.isTileColorsAfterDefaultScreen()).toBe(true);
        expect(await accessibilitySettingsPage.hasTileColorsOptions()).toBe(true);
        for (const value of ['bold', 'pastel'] as const) {
          const text = await accessibilitySettingsPage.tileColorsOptionText(value);
          expect(TILE_COLORS_SUBLABELS[value].some((label) => text.includes(label))).toBe(true);
        }
      },
    );

    it(
      title('TC-VP5724-02: Bold is the default, badged "Default", Save locked', Tag.REGRESSION, Tag.WRITE),
      async () => {
        await setTileColors('bold');
        await backToTill();
        await openTileColorsCard();
        expect(await accessibilitySettingsPage.selectedTileColors()).toBe('bold');
        expect(await accessibilitySettingsPage.hasTileColorsDefaultBadge()).toBe(true);
        expect(await accessibilitySettingsPage.isTileColorsSaveEnabled()).toBe(false);
      },
    );

    it(
      title(
        'TC-VP5724-03: changing the choice unlocks Save, choosing the saved value back locks it',
        Tag.REGRESSION,
      ),
      async () => {
        await openTileColorsCard();
        const saved = (await accessibilitySettingsPage.selectedTileColors()) ?? 'bold';
        const other = saved === 'bold' ? 'pastel' : 'bold';
        await accessibilitySettingsPage.chooseTileColors(other);
        expect(await accessibilitySettingsPage.isTileColorsSaveEnabled()).toBe(true);
        await accessibilitySettingsPage.chooseTileColors(saved);
        expect(await accessibilitySettingsPage.isTileColorsSaveEnabled()).toBe(false);
        expect(await savedTileColors()).toBe(saved);
      },
    );

    it(
      title(
        'TC-VP5724-04: Save Pastel → toast, Save locks, DB pastel, font_size kept',
        Tag.REGRESSION,
        Tag.CRITICAL,
        Tag.WRITE,
      ),
      async () => {
        await setTileColors('bold');
        const fontBefore = (await savedThemePosStyle()).font_size;
        await clearToasts();
        await accessibilitySettingsPage.chooseTileColors('pastel');
        expect(await accessibilitySettingsPage.saveTileColors()).toBe(true);
        expect(await waitToast(SAVED_TOAST_RE)).not.toBe('');
        expect(await accessibilitySettingsPage.isTileColorsSaveEnabled()).toBe(false);
        expect(await waitSavedTileColors('pastel')).toBe('pastel');
        expect((await savedThemePosStyle()).font_size).toBe(fontBefore);
      },
    );

    it(
      title(
        'TC-VP5724-05: Save Bold → toast, DB bold, font_size kept',
        Tag.REGRESSION,
        Tag.CRITICAL,
        Tag.WRITE,
      ),
      async () => {
        await setTileColors('pastel');
        const fontBefore = (await savedThemePosStyle()).font_size;
        await clearToasts();
        await accessibilitySettingsPage.chooseTileColors('bold');
        expect(await accessibilitySettingsPage.saveTileColors()).toBe(true);
        expect(await waitToast(SAVED_TOAST_RE)).not.toBe('');
        expect(await waitSavedTileColors('bold')).toBe('bold');
        expect((await savedThemePosStyle()).font_size).toBe(fontBefore);
      },
    );
  });

  describe('2. Create Order tile colours', () => {
    it(
      title(
        'TC-VP5724-07: Bold — category and service tiles bold, white text',
        Tag.REGRESSION,
        Tag.CRITICAL,
        Tag.WRITE,
      ),
      async () => {
        boldTiles = null;
        const tiles = await boldRead();
        const stored = new Map<string, string>();
        for (const c of await homeCategories()) {
          if (c.name && c.colorHex && !stored.has(c.name)) stored.set(c.name, c.colorHex);
        }
        const cats = realCategories(tiles);
        expect(cats.length).toBeGreaterThan(0);
        for (const c of cats) {
          expect({ tile: c.name, nameText: c.nameText }).toEqual({ tile: c.name, nameText: WHITE_HEX });
          const colorHex = stored.get(c.name);
          if (colorHex) {
            expect({ tile: c.name, fill: c.background }).toEqual({
              tile: c.name,
              fill: boldTileHex(colorHex),
            });
          }
        }
        expect(tiles.services.length).toBeGreaterThan(0);
        for (const s of tiles.services) {
          expect({ tile: s.name, name: s.nameText, price: s.lastLineText }).toEqual({
            tile: s.name,
            name: WHITE_HEX,
            price: WHITE_HEX,
          });
          // Bold never paints a service in a staff (pastel) colour.
          expect({ tile: s.name, pastelFill: STAFF_PALETTE_HEX.includes(s.background) }).toEqual({
            tile: s.name,
            pastelFill: false,
          });
        }
      },
    );

    it(
      title(
        'TC-VP5724-08: Pastel — category and service tiles take their staff partner, ink text',
        Tag.REGRESSION,
        Tag.CRITICAL,
        Tag.WRITE,
      ),
      async () => {
        const bold = await boldRead();
        await setTileColors('pastel');
        const pastel = await readCreateOrderTiles();
        const boldCats = byName(realCategories(bold));
        for (const c of realCategories(pastel)) {
          expect({ tile: c.name, name: c.nameText, count: c.lastLineText }).toEqual({
            tile: c.name,
            name: INK_HEX,
            count: INK_HEX,
          });
          const before = boldCats.get(c.name);
          const want = before ? pastelTileHex(before.background) : null;
          if (want) expect({ tile: c.name, fill: c.background }).toEqual({ tile: c.name, fill: want });
        }
        const boldSvc = bold.services;
        pastel.services.forEach((s, i) => {
          expect({ tile: s.name, name: s.nameText, price: s.lastLineText }).toEqual({
            tile: s.name,
            name: INK_HEX,
            price: INK_HEX,
          });
          // Same position, same service (the grid order does not depend on the style).
          const before = boldSvc[i];
          if (before && before.name === s.name) {
            const want = pastelTileHex(before.background);
            if (want) expect({ tile: s.name, fill: s.background }).toEqual({ tile: s.name, fill: want });
          }
        });
      },
    );

    it(
      title(
        'TC-VP5724-09: Pastel — Quick Pay and Gift Card keep their colour, text turns ink',
        Tag.REGRESSION,
        Tag.WRITE,
      ),
      async () => {
        await setTileColors('pastel');
        const tiles = await readCreateOrderTiles();
        const pinned = tiles.categories.filter((c) => pinnedKind(c) !== null);
        expect(pinned.length).toBe(2);
        for (const c of pinned) {
          const kind = pinnedKind(c) as keyof typeof PINNED_TILE_HEX;
          expect({ tile: c.name, fill: c.background, text: c.nameText }).toEqual({
            tile: c.name,
            fill: PINNED_TILE_HEX[kind],
            text: INK_HEX,
          });
        }
      },
    );

    it(
      title(
        'TC-VP5724-10: Pastel — every category / service fill is a staff palette colour',
        Tag.REGRESSION,
        Tag.WRITE,
      ),
      async () => {
        await setTileColors('pastel');
        const tiles = await readCreateOrderTiles();
        const off = [...realCategories(tiles), ...tiles.services]
          .filter((t) => !STAFF_PALETTE_HEX.includes(t.background))
          .map((t) => `${t.name}=${t.background}`);
        expect(off).toEqual([]);
      },
    );

    it(
      title(
        'TC-VP5724-11: Pastel — ink text reads on every pastel tile (contrast >= 4.5)',
        Tag.REGRESSION,
        Tag.WRITE,
      ),
      async () => {
        await setTileColors('pastel');
        const tiles = await readCreateOrderTiles();
        const low = [...realCategories(tiles), ...tiles.services]
          .map((t) => ({ name: t.name, ratio: contrastRatio(t.nameText, t.background) }))
          .filter((t) => t.ratio < MIN_CONTRAST)
          .map((t) => `${t.name}=${t.ratio.toFixed(2)}`);
        expect(low).toEqual([]);
      },
    );

    it(
      title('TC-VP5724-12: staff tiles look the same in Bold and Pastel', Tag.REGRESSION, Tag.WRITE),
      async () => {
        const bold = await boldRead();
        await setTileColors('pastel');
        const pastel = await readCreateOrderTiles();
        const boldStaff = byName(bold.staff);
        let compared = 0;
        for (const s of pastel.staff) {
          const before = boldStaff.get(s.name);
          if (!before) continue;
          compared++;
          expect({ staff: s.name, text: s.nameText, fill: s.background }).toEqual({
            staff: s.name,
            text: before.nameText,
            fill: before.background,
          });
        }
        expect(compared).toBeGreaterThan(0);
      },
    );

    it(
      title(
        'TC-VP5724-13: Pastel — selected staff dark band + white name, added service outlined',
        Tag.REGRESSION,
        Tag.WRITE,
      ),
      async () => {
        await setTileColors('pastel');
        await backToTill();
        await homePage.discardDraftIfAny();
        await homePage.selectFirstStaff();
        await homePage.addFirstService();
        const state = await readSelectionState();
        expect(state.selectedStaff.length).toBe(1);
        const band = state.selectedStaff[0]?.background ?? '';
        expect(contrastRatio(WHITE_HEX, band)).toBeGreaterThanOrEqual(MIN_CONTRAST);
        expect(state.serviceAfterBorders).toContain('4px');
        await homePage.deleteOrder();
      },
    );

    it(
      title(
        'TC-VP5724-14: back to Bold shows exactly the old colours, stored colours untouched',
        Tag.REGRESSION,
        Tag.CRITICAL,
        Tag.WRITE,
      ),
      async () => {
        const bold = await boldRead();
        const storedBefore = (await homeCategories()).map((c) => `${c.id}=${c.colorHex}`).sort();
        await setTileColors('pastel');
        await readCreateOrderTiles();
        await setTileColors('bold');
        const again = await readCreateOrderTiles();
        const paint = (t: CreateOrderTiles): string[] => [
          ...t.categories.map((c) => `cat ${c.name} ${c.background} ${c.nameText}`),
          ...t.services.map((s) => `svc ${s.name} ${s.background} ${s.nameText}`),
        ];
        expect(paint(again)).toEqual(paint(bold));
        expect((await homeCategories()).map((c) => `${c.id}=${c.colorHex}`).sort()).toEqual(storedBefore);
      },
    );
  });

  describe('3. Portal ↔ POS', () => {
    const portal = new PortalStore();

    before(async function () {
      // .portal-profile signed out → npm run portal:auth (the user scans the QR).
      if (!(await portal.available())) this.skip();
    });

    after(async () => {
      await portal.restore();
      await backToTill().catch(() => undefined);
    });

    it(
      title(
        'TC-VP5724-16: Portal saves Pastel → POS reads it without reopening, Create Order goes Pastel',
        Tag.REGRESSION,
        Tag.CRITICAL,
        Tag.EXCLUSIVE,
        Tag.WRITE,
      ),
      async () => {
        await setTileColors('bold');
        await backToTill();
        // ensure() waits until the POS DB reads the value BEFORE it reloads the webview.
        await portal.ensure({ tileColors: 'pastel' });
        expect(await savedTileColors()).toBe('pastel');
        const tiles = await readCreateOrderTiles();
        const cats = realCategories(tiles);
        expect(cats.length).toBeGreaterThan(0);
        for (const c of cats) {
          expect({
            tile: c.name,
            pastel: STAFF_PALETTE_HEX.includes(c.background),
            text: c.nameText,
          }).toEqual({
            tile: c.name,
            pastel: true,
            text: INK_HEX,
          });
        }
      },
    );

    it(
      title(
        'TC-VP5724-17: POS saves Bold → the Portal shows Bold',
        Tag.REGRESSION,
        Tag.CRITICAL,
        Tag.EXCLUSIVE,
        Tag.WRITE,
      ),
      async () => {
        await portal.ensure({ tileColors: 'pastel' });
        await setTileColors('bold');
        await portal.waitPortalShows({ tileColors: 'bold' });
        expect((await portal.read(['tileColors'], true)).tileColors).toBe('bold');
      },
    );

    it(
      title(
        'TC-VP5724-18: Portal Font size save keeps tile_colors (no "invalid field" rejection)',
        Tag.REGRESSION,
        Tag.EXCLUSIVE,
        Tag.WRITE,
      ),
      async () => {
        await portal.ensure({ tileColors: 'pastel' });
        const fontBefore = String((await portal.read(['fontSize'], true)).fontSize ?? 'small');
        const other = fontBefore === 'small' ? 'medium' : 'small';
        // ensure() throws when the Portal refuses the save or POS never reads the new size.
        await portal.ensure({ fontSize: other });
        const style = await savedThemePosStyle();
        expect({ font: style.font_size, tiles: style.tile_colors }).toEqual({ font: other, tiles: 'pastel' });
        await portal.ensure({ fontSize: fontBefore });
      },
    );
  });
});
