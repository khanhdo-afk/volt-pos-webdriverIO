import { browser } from '@wdio/globals';
import { Timeouts } from '../../../configs/constants/timeouts.js';
import { Routes } from '../../constants/routes.js';
import { locator, type Locator } from '../../helpers/selectors.js';
import { logStep } from '../../helpers/steps.js';
import { settle } from '../../helpers/wait.js';
import { activeThemePack, themeLabel, type ThemePack } from '../../support/theme.js';
import { BasePage } from '../BasePage.js';

/** One theme card's radio. Ids read off the live page, build 1.1.117. */
export const themeRadio = (pack: ThemePack): Locator =>
  locator(
    `theme radio ${pack}`,
    `theme-pack-${pack}`,
    `#theme-pack-${pack}`,
    `button[role="radio"][value="${pack}"]`,
  );

const ThemesIds = {
  group: locator('themes radiogroup', 'themes-radiogroup', '[role="radiogroup"]'),
};

/**
 * `/settings/themes` — "Choose how this device looks. Only the themes your
 * store allows are listed." A Radix radiogroup of theme cards; picking one
 * applies at once (no Save) and is stored per device — see `support/theme.ts`.
 */
export class ThemesSettingsPage extends BasePage {
  readonly name = 'Themes settings';

  readonly route: string = Routes.SETTINGS_THEMES;

  protected readonly readyAnchor: Locator = themeRadio('volt');

  /** Packs listed on the page, in order. */
  async listedPacks(): Promise<ThemePack[]> {
    return browser.execute(() =>
      Array.from(document.querySelectorAll('[role="radiogroup"] button[role="radio"]')).map(
        (b) => b.getAttribute('value') ?? '',
      ),
    ) as Promise<ThemePack[]>;
  }

  /** Card titles, in order (e.g. "Volt POS (Classic)"). */
  async listedTitles(): Promise<string[]> {
    return browser.execute(() =>
      Array.from(document.querySelectorAll('[role="radiogroup"] button[role="radio"]')).map(
        (b) => b.getAttribute('aria-label') ?? '',
      ),
    );
  }

  /** Pack whose radio is checked on the page. */
  async checkedPack(): Promise<ThemePack | null> {
    return browser.execute(
      () =>
        document
          .querySelector('[role="radiogroup"] button[role="radio"][aria-checked="true"]')
          ?.getAttribute('value') ?? null,
    ) as Promise<ThemePack | null>;
  }

  /** Text of the "In Use" badge's card, or '' when none shows one. */
  async inUseCardTitle(): Promise<string> {
    return browser.execute(() => {
      const cards = Array.from(document.querySelectorAll('[role="radiogroup"] > *'));
      const card = cards.find((c) => /\bIn Use\b/.test((c as HTMLElement).innerText));
      return card?.querySelector('button[role="radio"]')?.getAttribute('aria-label') ?? '';
    });
  }

  /** Pick a theme and wait until the app renders it. */
  async select(pack: ThemePack): Promise<this> {
    await logStep(`Themes: pick ${themeLabel(pack)}`);
    await this.click(themeRadio(pack));
    await browser.waitUntil(async () => (await activeThemePack()) === pack, {
      timeout: Timeouts.MEDIUM,
      timeoutMsg: `Picking ${themeLabel(pack)} did not switch <html data-theme-pack>`,
    });
    await settle(Timeouts.ANIMATION);
    return this;
  }

  /** Is the radiogroup on screen? */
  async isShown(): Promise<boolean> {
    return this.isVisible(ThemesIds.group, Timeouts.MEDIUM);
  }
}

export default new ThemesSettingsPage();
