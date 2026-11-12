/**
 * Setting › General › Themes (POS Builder theme packs, build 1.1.117).
 *
 * Linear: initiative "Nails Theme" — Volt Summer = MAC USA POS Theme (P-VP-909),
 * Volt Spring = GoPOS Theme (P-VP-713), Volt Winter = Zota POS Theme (P-VP-883).
 * PO rule Q2: the theme is chosen on the POS only, per device; Classic is the default.
 *
 * Functional checks only (layout/visual QA is done on a full-size screen):
 * the page lists the allowed packs, picking one applies at once without a Save,
 * the "In Use" badge follows, the choice survives a reload, and the customer
 * display follows the staff window. Ends on the pack the run asked for (THEME).
 */
import { browser, expect } from '@wdio/globals';
import { Timeouts } from '../../../configs/constants/timeouts.js';
import { goToSettings, returnToHome } from '../../../src/flows/index.js';
import { settingsPage, themesSettingsPage } from '../../../src/pages/index.js';
import {
  activeThemePack,
  requestedThemePack,
  THEME_PACKS,
  themeLabel,
  type ThemePack,
} from '../../../src/support/theme.js';
import { ensureLoggedIn } from '../../../src/flows/index.js';
import { Tag, title } from '../../../src/types/testTags.js';
import { withCustomerWindow } from '../../../src/helpers/window.js';

async function openThemes(): Promise<void> {
  await goToSettings();
  await settingsPage.openSection('THEMES');
  await themesSettingsPage.waitForReady(Timeouts.MEDIUM);
}

describe('Settings — Themes', () => {
  const original: ThemePack = requestedThemePack() ?? 'volt';

  before(async () => {
    await openThemes();
  });

  after(async () => {
    await openThemes().catch(() => undefined);
    if ((await activeThemePack()) !== original) await themesSettingsPage.select(original);
    await returnToHome();
  });

  it(title('THEME-01 lists Classic, Summer, Spring and Winter in that order', Tag.REGRESSION), async () => {
    expect(await themesSettingsPage.listedPacks()).toEqual([...THEME_PACKS]);
    expect(await themesSettingsPage.listedTitles()).toEqual(THEME_PACKS.map(themeLabel));
  });

  it(
    title('THEME-02 the checked radio and "In Use" badge match the theme being rendered', Tag.REGRESSION),
    async () => {
      const active = await activeThemePack();
      expect(await themesSettingsPage.checkedPack()).toBe(active);
      expect(await themesSettingsPage.inUseCardTitle()).toBe(themeLabel(active));
    },
  );

  for (const pack of ['volt-summer', 'volt-spring', 'volt-winter', 'volt'] as const) {
    it(
      title(
        `THEME-03 picking ${themeLabel(pack)} applies at once and moves "In Use"`,
        Tag.REGRESSION,
        Tag.WRITE,
      ),
      async () => {
        await themesSettingsPage.select(pack);
        expect(await activeThemePack()).toBe(pack);
        expect(await themesSettingsPage.checkedPack()).toBe(pack);
        expect(await themesSettingsPage.inUseCardTitle()).toBe(themeLabel(pack));
        // Stored per device, per merchant — PO decision Q2.
        const stored = await browser.execute(() => {
          const m = localStorage.getItem('pos-builder.theme-pack-merchant');
          return m ? localStorage.getItem(`pos-builder.theme-pack:${m}`) : null;
        });
        expect(stored).toBe(pack);
      },
    );
  }

  it(title('THEME-04 the chosen theme survives an app reload', Tag.REGRESSION, Tag.WRITE), async () => {
    await themesSettingsPage.select('volt-winter');
    await browser.refresh();
    await ensureLoggedIn();
    expect(await activeThemePack()).toBe('volt-winter');
    await openThemes();
    expect(await themesSettingsPage.checkedPack()).toBe('volt-winter');
  });

  it(
    title('THEME-05 the customer display follows the staff window theme', Tag.REGRESSION, Tag.WRITE),
    async () => {
      await themesSettingsPage.select('volt-summer');
      const customerPack = await withCustomerWindow(async () =>
        browser
          .waitUntil(
            async () =>
              (await browser.execute(() => document.documentElement.getAttribute('data-theme-pack'))) ===
              'volt-summer',
            { timeout: Timeouts.MEDIUM, timeoutMsg: 'customer display never took the Summer pack' },
          )
          .then(() => 'volt-summer')
          .catch(async () => browser.execute(() => document.documentElement.getAttribute('data-theme-pack'))),
      );
      expect(customerPack).toBe('volt-summer');
    },
  );
});
