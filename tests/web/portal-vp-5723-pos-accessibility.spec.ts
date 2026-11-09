import { browser, expect } from '@wdio/globals';
import { loadEnv } from '../../configs/env/loadEnv.js';
import {
  portalPosAccessibilityCard as card,
  type PosAccessibilityValues,
} from '../../src/pages/web/PortalPosAccessibilityCard.js';
import { logStep } from '../../src/helpers/steps.js';
import { settle } from '../../src/helpers/wait.js';
import { Tag, title } from '../../src/types/testTags.js';
import {
  ensureMonitor,
  findPos,
  installPageMonitor,
  isWrite,
  pageLog,
  POS_CDP_LIST,
  type PosCdp,
  waitForPosSettings,
  type PageLog,
} from './vp-5723.helpers.js';

/**
 * VP-5723 — Portal Store Settings › Configuration groups Customer display,
 * Default POS screen and Font size into one "POS Accessibility" card
 * (fastboy-portal#980).
 *
 * Test cases: docs/qc/volt-qc/vp-tickets/VP-5723-portal-pos-accessibility-card-test-cases.md
 *
 * WRITES merchant-global settings (@exclusive): the four values are captured in
 * `before()` and put back by TC-VP5723-15, and again by `after()` if a test died
 * half-way.
 *
 * TC-13 / TC-14 also read the Volt POS that runs on this machine over CDP — the
 * first one on `POS_CDP_CANDIDATES` / `VP5723_POS_CDP` (comma lists; default
 * `http://<DRIVER_HOST>:<REMOTE_DEBUG_PORT>`) signed in to PORTAL_MERCHANT_ID. With
 * no such POS they are skipped (PENDING); the Portal cases still run.
 *
 * GUI runner: Portal specs run once per store picked in the Staging apps bar, attached
 * to the Portal window the run gate opened (dashboard/server/runner.mjs).
 *
 * Runs in Edge on the signed-in `.portal-profile/`: `npm run portal:vp-5723`.
 */
const env = loadEnv();
const TAGS = [Tag.REGRESSION, Tag.EXCLUSIVE, Tag.WRITE] as const;
/** Portal edits + waiting for the POS to pull them (up to 60 s) + POS reads. */
const POS_TEST_TIMEOUT = 240_000;

let original: PosAccessibilityValues;
let restored = false;
let pos: PosCdp | null = null;
/** Page logs of earlier page loads (the monitor restarts on every load). */
const pastLogs: PageLog[] = [];

/** Re-open the tab (a fresh load), keeping what the monitor saw on the old page. */
async function reopen(): Promise<void> {
  pastLogs.push(await pageLog());
  await openCard();
}

/** Open the Configuration tab and (re)arm the page monitor. */
async function openCard(): Promise<void> {
  await card.open();
  await ensureMonitor();
}

const other = <T extends string>(current: string, a: T, b: T): T => (current === a ? b : a);

describe('Portal — VP-5723 POS Accessibility card', () => {
  before(async () => {
    await installPageMonitor();
    // The GUI runner attaches to a smaller Portal window: maximise it so toasts
    // and the floating save bar sit where they do in a normal run.
    await browser.maximizeWindow().catch(() => undefined);
    await openCard();
    original = await card.values();
    await logStep(`[VP-5723] store ${env.PORTAL_MERCHANT_ID}, original values: ${JSON.stringify(original)}`);
    const found = await findPos(env.PORTAL_MERCHANT_ID);
    pos = found?.pos ?? null;
    await logStep(
      `[VP-5723] POS over CDP (${POS_CDP_LIST.join(', ')}): ` +
        (found
          ? `${found.base} ${found.url} merchant ${found.merchant || '?'}`
          : 'none for this store — TC-13/14 skip'),
    );
  });

  after(async function () {
    // The restore makes up to four saves; never let the default hook timeout cut it short.
    this.timeout(POS_TEST_TIMEOUT);
    if (original && !restored) {
      try {
        await openCard();
        await card.apply(original);
      } catch (e) {
        console.error(`[VP-5723] RESTORE FAILED — set back by hand: ${JSON.stringify(original)}`, e);
      }
    }
    if (pos) {
      try {
        await pos.eval(`(location.href = '/', 1)`);
      } catch {
        /* POS left on Settings — harmless */
      }
      pos.close();
    }
  });

  it(title('TC-VP5723-01: POS Accessibility card sits right under Privacy policy', ...TAGS), async () => {
    const layout = await card.layout();
    const at = layout.cardTitles.indexOf('POS Accessibility');

    expect(at).toBeGreaterThan(0);
    expect(layout.cardTitles[at - 1]).toBe('Privacy policy');
    expect(layout.description).toBe('Display settings for every POS terminal of this merchant.');
  });

  it(
    title(
      'TC-VP5723-02: items in order Customer display → Default POS screen → (Tile colors) → Font size',
      ...TAGS,
    ),
    async () => {
      const layout = await card.layout();

      expect(layout.items.filter((i) => i !== 'Tile colors')).toEqual([
        'Customer display',
        'Default POS screen',
        'Font size',
      ]);
      if (layout.items.includes('Tile colors')) {
        expect(layout.items.indexOf('Tile colors')).toBe(2);
      }
      for (const description of layout.itemDescriptions) expect(description.length).toBeGreaterThan(0);
    },
  );

  it(
    title(
      'TC-VP5723-03: no stand-alone Customer display / Font size card; each control exists once, inside the card',
      ...TAGS,
    ),
    async () => {
      const layout = await card.layout();

      expect(Object.values(layout.controlCounts)).toEqual([1, 1, 1, 1]);
      expect(layout.controlsInCard).toBe(true);
      expect(layout.cardTitles).not.toContain('Customer display');
      expect(layout.cardTitles).not.toContain('Font size');
    },
  );

  it(
    title('TC-VP5723-04: Tile colors absent until VP-5724 ships (else Bold / Pastel)', ...TAGS),
    async () => {
      const layout = await card.layout();
      if (!layout.items.includes('Tile colors')) {
        expect(layout.items).not.toContain('Tile colors');
        return;
      }
      const text = await browser.execute(() => document.body.innerText);
      expect(text).toContain('Bold');
      expect(text).toContain('Pastel');
    },
  );

  it(
    title(
      'TC-VP5723-05: Show points balance / Show rewards match the stored values (survive reload)',
      ...TAGS,
    ),
    async () => {
      const before = { showPoint: await card.isOn('showPoint'), showReward: await card.isOn('showReward') };
      await reopen();
      const after = { showPoint: await card.isOn('showPoint'), showReward: await card.isOn('showReward') };

      expect(after).toEqual(before);
      expect(before).toEqual({ showPoint: original.showPoint, showReward: original.showReward });
    },
  );

  it(
    title(
      'TC-VP5723-06: flipping Show points balance saves at once (toast, no save bar), Show rewards untouched',
      ...TAGS,
    ),
    async () => {
      const now = await card.toggle('showPoint'); // waits for "Customer display updated"

      expect(now).toBe(!original.showPoint);
      expect(await card.isUnsavedBarShown()).toBe(false);
      expect(await card.isOn('showReward')).toBe(original.showReward);
    },
  );

  it(title('TC-VP5723-07: flip Show rewards too → both new values survive reload', ...TAGS), async () => {
    await card.toggle('showReward');
    await reopen();

    expect(await card.isOn('showPoint')).toBe(!original.showPoint);
    expect(await card.isOn('showReward')).toBe(!original.showReward);
  });

  it(
    title(
      'TC-VP5723-08: Default POS screen offers Pending Orders (Default) and Home, exactly one chosen',
      ...TAGS,
    ),
    async () => {
      const options = await card.options('defaultScreen');
      await logStep(`[VP-5723] Default POS screen options: ${options.map((o) => o.value).join(', ')}`);
      const values = options.map((o) => o.value);

      expect(values).toContain('pending_orders');
      expect(values).toContain('home');
      expect(options.find((o) => o.value === 'pending_orders')?.text).toContain('Default');
      expect(options.filter((o) => o.checked)).toHaveLength(1);
    },
  );

  it(
    title('TC-VP5723-09: floating save bar — Discard sends nothing, Save persists, can switch back', ...TAGS),
    async () => {
      const start = original.defaultScreen;
      const next = other(start, 'pending_orders', 'home');

      // Choose → bar; Discard → back, no write request.
      await card.choose('defaultScreen', next);
      expect(await card.unsavedBarText()).toContain('1 unsaved change');
      const writesBefore = (await pageLog()).xhr.filter(isWrite).length;
      await card.clickBar('Discard');
      await settle(1_500);
      expect(await card.selected('defaultScreen')).toBe(start);
      expect(await card.isUnsavedBarShown()).toBe(false);
      expect((await pageLog()).xhr.filter(isWrite).length).toBe(writesBefore);

      // Choose → Save → toast → reload keeps it.
      await card.setDefaultScreen(next);
      await reopen();
      expect(await card.selected('defaultScreen')).toBe(next);

      // And back again.
      await card.setDefaultScreen(start);
      await reopen();
      expect(await card.selected('defaultScreen')).toBe(start);
    },
  );

  it(title('TC-VP5723-10: Font size offers Small / Medium / Large, one chosen', ...TAGS), async () => {
    const options = await card.options('fontSize');

    expect(options.map((o) => o.value)).toEqual(['small', 'medium', 'large']);
    expect(options.map((o) => o.label)).toEqual(['Small', 'Medium', 'Large']);
    expect(options.filter((o) => o.checked)).toHaveLength(1);
  });

  it(
    title('TC-VP5723-11: changing Font size saves at once (toast) and survives reload', ...TAGS),
    async () => {
      const next = other(original.fontSize, 'large', 'medium');
      await card.setFontSize(next); // waits for "Font size updated"

      expect(await card.isUnsavedBarShown()).toBe(false);
      await reopen();
      expect(await card.selected('fontSize')).toBe(next);
    },
  );

  it(
    title('TC-VP5723-12: no console errors and no 4xx/5xx API calls on the Configuration tab', ...TAGS),
    async () => {
      await reopen();
      await settle(2_000);
      const logs = [...pastLogs, await pageLog()];
      const errors = logs.flatMap((l) => l.errors);
      const failed = logs.flatMap((l) => l.xhr).filter((x) => x.status >= 400 || x.status === 0);
      await logStep(
        `[VP-5723] XHR seen: ${String(logs.flatMap((l) => l.xhr).length)}, writes: ${String(logs.flatMap((l) => l.xhr).filter(isWrite).length)}`,
      );

      expect(errors).toEqual([]);
      expect(failed).toEqual([]);
    },
  );

  it(
    title(
      'TC-VP5723-13: Portal changes reach the running POS (Show points, Default screen, Font size)',
      ...TAGS,
    ),
    async function () {
      this.timeout(POS_TEST_TIMEOUT);
      if (!pos) this.skip();
      const posCdp = pos;
      const want = {
        showPoint: false,
        showReward: original.showReward,
        defaultScreen: 'home',
        fontSize: other(original.fontSize, 'large', 'small'),
      };
      await card.apply(want);

      const seen = await waitForPosSettings(
        posCdp,
        (s) =>
          s.showPoint === want.showPoint &&
          s.showReward === want.showReward &&
          s.defaultScreen === want.defaultScreen &&
          s.fontSize === want.fontSize,
      );
      expect(seen).toEqual(want);
      // The staff window applies the font size live (VP-4809: <html data-font-size>).
      await browser.waitUntil(async () => (await posCdp.htmlFontSize()) === want.fontSize, {
        timeout: 15_000,
        timeoutMsg: `POS <html data-font-size> never became ${want.fontSize}`,
      });
    },
  );

  it(
    title('TC-VP5723-14: POS › Setting › Accessibility still shows separate cards', ...TAGS),
    async function () {
      this.timeout(POS_TEST_TIMEOUT);
      if (!pos) this.skip();
      const posCdp = pos;
      await posCdp.openAccessibility(env.STAFF_PASSCODE);
      const cards = await posCdp.accessibilityCards(['Font Size', 'Customer Display', 'Default Screen']);
      await logStep(`[VP-5723] POS Accessibility cards: ${JSON.stringify(cards)}`);

      for (const c of cards) expect(c.card).toBeGreaterThanOrEqual(0);
      expect(new Set(cards.map((c) => c.card)).size).toBe(3);
      expect(await posCdp.bodyText()).not.toContain('POS Accessibility');
    },
  );

  it(
    title('TC-VP5723-15: settings are restored to their values from before the run', ...TAGS),
    async function () {
      this.timeout(POS_TEST_TIMEOUT);
      await openCard();
      await card.apply(original);
      await reopen();

      expect(await card.values()).toEqual(original);
      restored = true;
      if (pos) {
        const seen = await waitForPosSettings(
          pos,
          (s) =>
            s.showPoint === original.showPoint &&
            s.showReward === original.showReward &&
            s.defaultScreen === original.defaultScreen &&
            s.fontSize === original.fontSize,
        );
        expect(seen).toEqual(original);
      }
    },
  );
});
