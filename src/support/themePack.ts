import { browser } from '@wdio/globals';
import { reloadCustomerWindow, switchToMain } from '../helpers/window.js';
import { moduleLogger } from '../utils/logger.js';

const log = moduleLogger('themePack');

/**
 * Runs the suite under a POS theme pack (Setting › Themes) chosen by `THEME_PACK`
 * (`volt` = Classic, `volt-summer`, `volt-spring`, `volt-winter`).
 *
 * The pack lives in the webview's localStorage (`pos-builder.theme-pack:<merchant>`),
 * and the launch lane starts every session on a throw-away WebView2 profile — so
 * without this every spec runs on Classic whatever the device was set to.
 * Writes the key, reloads both windows, and checks `<html data-theme-pack>`.
 * Returns true when it had to reload (the caller re-walks to the till).
 */
export async function applyThemePack(): Promise<boolean> {
  const pack = process.env.THEME_PACK?.trim();
  if (!pack) return false;
  const want = pack === 'volt' ? null : pack;
  const current = await browser.execute(() => document.documentElement.getAttribute('data-theme-pack'));
  if (current === want) return false;

  await browser.execute((p: string) => {
    const merchant = localStorage.getItem('pos-builder.theme-pack-merchant') ?? '14';
    localStorage.setItem('pos-builder.theme-pack-merchant', merchant);
    localStorage.setItem(`pos-builder.theme-pack:${merchant}`, p);
  }, pack);
  await reloadCustomerWindow().catch((e: unknown) => log.warn(`customer window reload: ${String(e)}`));
  await switchToMain();
  await browser.refresh();
  await browser.waitUntil(
    async () =>
      (await browser.execute(() => document.documentElement.getAttribute('data-theme-pack'))) === want,
    { timeout: 30_000, timeoutMsg: `theme pack ${pack} was not applied after reload` },
  );
  log.info(`theme pack applied: ${pack}`);
  return true;
}
