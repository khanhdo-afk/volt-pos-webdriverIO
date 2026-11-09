import { browser, $ } from '@wdio/globals';
import { Timeouts } from '../../../configs/constants/timeouts.js';
import { portalSettingsPage } from './PortalSettingsPage.js';

/**
 * Fastboy Portal — Store Settings › Configuration › **POS Accessibility** card
 * (VP-5723, fastboy-portal#980): Customer display, Default POS screen and Font
 * size grouped in one card.
 *
 * DOM read off Portal DEV on 2026-11-09 (the Portal ships no data-testids, but
 * this card exposes stable ids, ARIA labels and `data-slot`s):
 * - card / section titles: `[data-slot="settings-card-section-title"]`
 * - item titles inside a card: `[data-slot="settings-card-step-title"]`
 * - switches: `#customer-display-show-point`, `#customer-display-show-reward`
 * - radio groups: `[role="radiogroup"][aria-label="Default POS screen" | "Font size"]`
 *
 * Customer display and Font size save on change (toast); Default POS screen
 * goes through the floating "N unsaved change · Discard · Save" bar.
 */

const CARD_TITLE = 'POS Accessibility';
const SECTION_TITLE = '[data-slot="settings-card-section-title"]';
const STEP_TITLE = '[data-slot="settings-card-step-title"]';

export const SWITCH_ID = {
  showPoint: 'customer-display-show-point',
  showReward: 'customer-display-show-reward',
} as const;
export type CustomerDisplaySwitch = keyof typeof SWITCH_ID;

const RADIOGROUP = {
  defaultScreen: 'Default POS screen',
  fontSize: 'Font size',
} as const;
export type PosRadioGroup = keyof typeof RADIOGROUP;

export const TOAST = {
  customerDisplay: 'Customer display updated',
  defaultScreen: 'Default POS screen updated',
  fontSize: 'Font size updated',
} as const;

const UNSAVED_BAR = '//*[contains(normalize-space(text()),"unsaved change")]';
const BAR_BUTTON = (label: 'Save' | 'Discard'): string =>
  `//*[contains(normalize-space(text()),"unsaved change")]/ancestor::*[.//button[normalize-space(.)="${label}"]][1]//button[normalize-space(.)="${label}"]`;
const toastXpath = (text: string): string => `//*[normalize-space(text())="${text}"]`;

const radioGroupCss = (group: PosRadioGroup): string =>
  `[role="radiogroup"][aria-label="${RADIOGROUP[group]}"]`;

export interface RadioOption {
  value: string;
  /** First line of the option's visible text (its name). */
  label: string;
  /** Whole visible text of the option (name + badges + description). */
  text: string;
  checked: boolean;
}

export interface CardLayout {
  /** Card titles on the Configuration tab, in DOM order. */
  cardTitles: string[];
  /** The POS Accessibility card's description line. */
  description: string;
  /** Item titles inside the POS Accessibility card, in order. */
  items: string[];
  /** Each item title's sub-line (grey description). */
  itemDescriptions: string[];
  /** How many times each control exists on the whole tab. */
  controlCounts: Record<string, number>;
  /** Whether every control sits inside the POS Accessibility card. */
  controlsInCard: boolean;
}

export interface PosAccessibilityValues {
  showPoint: boolean;
  showReward: boolean;
  defaultScreen: string;
  fontSize: string;
}

export class PortalPosAccessibilityCard {
  readonly name = 'Portal POS Accessibility card';

  /** Store Settings → Configuration, waiting for the POS Accessibility card. */
  async open(): Promise<this> {
    await portalSettingsPage.openConfiguration();
    await $(radioGroupCss('defaultScreen')).waitForDisplayed({
      timeout: Timeouts.LONG,
      timeoutMsg: `${this.name}: no "Default POS screen" radio group on the Configuration tab.`,
    });
    return this;
  }

  /** Read-only snapshot of titles, order and where each control lives. */
  async layout(): Promise<CardLayout> {
    return browser.execute(
      (cardTitle: string, sectionSel: string, stepSel: string, controls: string[]) => {
        const titles = Array.from(document.querySelectorAll(sectionSel));
        const heading = titles.find((t) => (t.textContent ?? '').trim() === cardTitle);
        const card = heading?.closest('[data-slot="settings-card"]') ?? null;
        const steps = card ? Array.from(card.querySelectorAll(stepSel)) : [];
        const counts: Record<string, number> = {};
        let inCard = Boolean(card);
        for (const sel of controls) {
          const found = Array.from(document.querySelectorAll(sel));
          counts[sel] = found.length;
          if (!found.every((el) => card?.contains(el))) inCard = false;
        }
        return {
          cardTitles: titles.map((t) => (t.textContent ?? '').trim()),
          description: (heading?.nextElementSibling?.textContent ?? '').trim(),
          items: steps.map((s) => (s.textContent ?? '').trim()),
          itemDescriptions: steps.map((s) => (s.nextElementSibling?.textContent ?? '').trim()),
          controlCounts: counts,
          controlsInCard: inCard,
        };
      },
      CARD_TITLE,
      SECTION_TITLE,
      STEP_TITLE,
      [
        `#${SWITCH_ID.showPoint}`,
        `#${SWITCH_ID.showReward}`,
        radioGroupCss('defaultScreen'),
        radioGroupCss('fontSize'),
      ],
    );
  }

  async isOn(which: CustomerDisplaySwitch): Promise<boolean> {
    const sw = $(`#${SWITCH_ID[which]}`);
    await sw.waitForDisplayed({ timeout: Timeouts.MEDIUM });
    return (await sw.getAttribute('aria-checked')) === 'true';
  }

  async options(group: PosRadioGroup): Promise<RadioOption[]> {
    return browser.execute((sel: string) => {
      const root = document.querySelector(sel);
      return Array.from(root?.querySelectorAll('[role="radio"]') ?? []).map((radio) => {
        const box = radio.closest('label') ?? radio.parentElement?.parentElement ?? radio;
        const text = ((box as HTMLElement).innerText ?? '').trim();
        return {
          value: radio.getAttribute('value') ?? '',
          label: text.split('\n')[0]?.trim() ?? '',
          text,
          checked: radio.getAttribute('aria-checked') === 'true',
        };
      });
    }, radioGroupCss(group));
  }

  async selected(group: PosRadioGroup): Promise<string> {
    const checked = (await this.options(group)).filter((o) => o.checked);
    return checked.length === 1 ? (checked[0]?.value ?? '') : '';
  }

  async values(): Promise<PosAccessibilityValues> {
    return {
      showPoint: await this.isOn('showPoint'),
      showReward: await this.isOn('showReward'),
      defaultScreen: await this.selected('defaultScreen'),
      fontSize: await this.selected('fontSize'),
    };
  }

  /**
   * Let an earlier toast with the same text go away, so the next wait sees a fresh
   * one. Sonner pauses a toast while the pointer is over it, and the last click
   * leaves the pointer near the bottom-right where toasts stack, so move it away
   * first.
   */
  private async awaitToastGone(text: string): Promise<void> {
    await browser
      .action('pointer')
      .move({ x: 5, y: 5, origin: 'viewport' })
      .perform()
      .catch(() => undefined);
    await $(toastXpath(text))
      .waitForDisplayed({ reverse: true, timeout: Timeouts.MEDIUM })
      .catch(() => undefined);
  }

  /** Click; when a toast sits on top of the control, click it through the DOM instead. */
  private async safeClick(selector: string): Promise<void> {
    const el = $(selector);
    await el.scrollIntoView({ block: 'center' });
    try {
      await el.click();
    } catch (e) {
      if (!/intercepted/i.test(String(e))) throw e;
      await browser.execute((sel: string) => {
        document.querySelector<HTMLElement>(sel)?.click();
      }, selector);
    }
  }

  async waitForToast(text: string): Promise<void> {
    await $(toastXpath(text)).waitForDisplayed({
      timeout: Timeouts.LONG,
      timeoutMsg: `${this.name}: no "${text}" toast.`,
    });
  }

  async isUnsavedBarShown(): Promise<boolean> {
    return $(UNSAVED_BAR).isDisplayed();
  }

  async unsavedBarText(): Promise<string> {
    const bar = $(UNSAVED_BAR);
    await bar.waitForDisplayed({
      timeout: Timeouts.SHORT,
      timeoutMsg: `${this.name}: no unsaved-changes bar.`,
    });
    return (await bar.getText()).trim();
  }

  /** Flip a Customer display switch (saves on its own); waits for its toast. */
  async toggle(which: CustomerDisplaySwitch): Promise<boolean> {
    const before = await this.isOn(which);
    await this.awaitToastGone(TOAST.customerDisplay);
    await this.safeClick(`#${SWITCH_ID[which]}`);
    await browser.waitUntil(async () => (await this.isOn(which)) !== before, {
      timeout: Timeouts.SHORT,
      timeoutMsg: `${this.name}: switch ${which} did not flip.`,
    });
    await this.waitForToast(TOAST.customerDisplay);
    return !before;
  }

  async setSwitch(which: CustomerDisplaySwitch, on: boolean): Promise<void> {
    if ((await this.isOn(which)) !== on) await this.toggle(which);
  }

  /** Click a radio; does not save (Default POS screen needs the bar's Save). */
  async choose(group: PosRadioGroup, value: string): Promise<void> {
    await this.safeClick(`${radioGroupCss(group)} [role="radio"][value="${value}"]`);
    await browser.waitUntil(async () => (await this.selected(group)) === value, {
      timeout: Timeouts.SHORT,
      timeoutMsg: `${this.name}: ${group} radio "${value}" did not get checked.`,
    });
  }

  async clickBar(label: 'Save' | 'Discard'): Promise<void> {
    const btn = $(BAR_BUTTON(label));
    await btn.waitForClickable({
      timeout: Timeouts.MEDIUM,
      timeoutMsg: `${this.name}: no ${label} on the bar.`,
    });
    await btn.click();
  }

  /** Font size saves on change; waits for its toast. No-op when already `value`. */
  async setFontSize(value: string): Promise<void> {
    if ((await this.selected('fontSize')) === value) return;
    await this.awaitToastGone(TOAST.fontSize);
    await this.choose('fontSize', value);
    await this.waitForToast(TOAST.fontSize);
  }

  /** Default POS screen: choose → bar Save → toast. No-op when already `value`. */
  async setDefaultScreen(value: string): Promise<void> {
    if ((await this.selected('defaultScreen')) === value) return;
    await this.awaitToastGone(TOAST.defaultScreen);
    await this.choose('defaultScreen', value);
    await this.clickBar('Save');
    await this.waitForToast(TOAST.defaultScreen);
  }

  /** Put all four values back (used by the restore step). */
  async apply(v: PosAccessibilityValues): Promise<void> {
    await this.setSwitch('showPoint', v.showPoint);
    await this.setSwitch('showReward', v.showReward);
    await this.setDefaultScreen(v.defaultScreen);
    await this.setFontSize(v.fontSize);
  }
}

export const portalPosAccessibilityCard = new PortalPosAccessibilityCard();
