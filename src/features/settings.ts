/**
 * Settings helpers (shared by staging/production feature specs). Production
 * specs must restore every value they change — callers read the original with
 * these getters first and write it back in `after`.
 */
import { browser } from '@wdio/globals';
import { click, go, pause } from './pos.js';

export const openSettings = (page: 'accessibility' | 'receipt' | 'charge-fee' | 'business'): Promise<void> =>
  go(`/settings/${page}`, 2500);

/** aria-checked of the switch/checkbox labelled `label` in main ('true' | 'false'), or null. */
export async function switchState(label: string): Promise<boolean | null> {
  const v = await browser.execute((l: string) => {
    const el = [...document.querySelectorAll('main *')].find(
      (e) => e.childElementCount === 0 && e.textContent?.trim() === l,
    );
    let p: Element | null | undefined = el;
    let sw: Element | null = null;
    for (let i = 0; i < 6 && p && !sw; i++) {
      p = p.parentElement;
      sw = p?.querySelector('[role=switch],[role=checkbox],button[aria-checked]') ?? null;
    }
    return sw ? sw.getAttribute('aria-checked') : null;
  }, label);
  return v === null ? null : v === 'true';
}

export async function setSwitch(label: string, on: boolean): Promise<void> {
  if ((await switchState(label)) === on) return;
  const ok = await browser.execute((l: string) => {
    document.querySelectorAll('[data-qc-sw]').forEach((e) => e.removeAttribute('data-qc-sw'));
    const el = [...document.querySelectorAll('main *')].find(
      (e) => e.childElementCount === 0 && e.textContent?.trim() === l,
    );
    let p: Element | null | undefined = el;
    let sw: Element | null = null;
    for (let i = 0; i < 6 && p && !sw; i++) {
      p = p.parentElement;
      sw = p?.querySelector('[role=switch],[role=checkbox],button[aria-checked]') ?? null;
    }
    if (!sw) return false;
    sw.setAttribute('data-qc-sw', '1');
    return true;
  }, label);
  if (!ok) throw new Error(`setSwitch: no switch for "${label}"`);
  const el = browser.$('[data-qc-sw="1"]');
  await el.scrollIntoView({ block: 'center' });
  await el.click();
  await pause(300);
}

/** Click the Save button of the settings card whose heading is `heading`; returns the toast text. */
export async function saveCard(heading: string): Promise<string> {
  const ok = await browser.execute((h: string) => {
    document.querySelectorAll('[data-qc-save]').forEach((e) => e.removeAttribute('data-qc-save'));
    const head = [...document.querySelectorAll('main *')].find(
      (e) => e.childElementCount === 0 && e.textContent?.trim() === h,
    );
    let p: Element | null | undefined = head;
    let b: Element | undefined;
    for (let i = 0; i < 6 && p && !b; i++) {
      p = p.parentElement;
      b = p
        ? [...p.querySelectorAll('button')].find((x) => (x as HTMLElement).innerText.trim() === 'Save')
        : undefined;
    }
    if (!b) return false;
    b.setAttribute('data-qc-save', '1');
    return true;
  }, heading);
  if (!ok) throw new Error(`saveCard: no Save for "${heading}"`);
  const el = browser.$('[data-qc-save="1"]');
  if (!(await el.isEnabled())) return 'DISABLED';
  await el.click();
  await pause(2000);
  return browser.execute(() =>
    [...document.querySelectorAll('[data-sonner-toast]')]
      .map((t) => (t as HTMLElement).innerText)
      .join(' | '),
  );
}

export async function saveDisabled(heading: string): Promise<boolean> {
  await browser.execute((h: string) => {
    document.querySelectorAll('[data-qc-save]').forEach((e) => e.removeAttribute('data-qc-save'));
    const head = [...document.querySelectorAll('main *')].find(
      (e) => e.childElementCount === 0 && e.textContent?.trim() === h,
    );
    let p: Element | null | undefined = head;
    let b: Element | undefined;
    for (let i = 0; i < 6 && p && !b; i++) {
      p = p.parentElement;
      b = p
        ? [...p.querySelectorAll('button')].find((x) => (x as HTMLElement).innerText.trim() === 'Save')
        : undefined;
    }
    b?.setAttribute('data-qc-save', '1');
  }, heading);
  return !(await browser.$('[data-qc-save="1"]').isEnabled());
}

export const inputValue = (css: string): Promise<string> =>
  browser.execute((c: string) => document.querySelector<HTMLInputElement>(c)?.value ?? '', css);

export async function setInput(css: string, value: string): Promise<void> {
  const el = browser.$(css);
  await el.scrollIntoView({ block: 'center' });
  await el.click();
  await browser.keys(['Control', 'a']);
  await browser.keys(['Backspace']);
  await browser.keys(value.split(''));
  await pause(300);
}

// ── Appearance (Dark mode) ──────────────────────────────────────────────────

export const htmlTheme = (): Promise<string> => browser.execute(() => document.documentElement.className);

export async function setAppearance(mode: 'Light' | 'Dark'): Promise<void> {
  await openSettings('accessibility');
  await click(mode, { scope: 'main', any: true });
  await pause(1200);
}
