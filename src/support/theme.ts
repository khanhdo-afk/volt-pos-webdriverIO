import { browser } from '@wdio/globals';
import { moduleLogger } from '../utils/logger.js';

const log = moduleLogger('theme');

/**
 * Setting › General › Themes (POS Builder theme packs, build 1.1.117).
 *
 * The app stores the choice per DEVICE and per merchant in localStorage —
 * `pos-builder.theme-pack:<merchantId>` (merchant id in
 * `pos-builder.theme-pack-merchant`) — and mirrors the active pack on
 * `<html data-theme-pack="…">`. Nothing goes to the tauri store, so
 * {@link restoreDeviceBaseline} never touches it.
 *
 * | env `THEME` | pack id        | Linear project      |
 * |-------------|----------------|---------------------|
 * | classic     | `volt`         | —                   |
 * | summer      | `volt-summer`  | MAC USA POS Theme   |
 * | spring      | `volt-spring`  | GoPOS Theme         |
 * | winter      | `volt-winter`  | Zota POS Theme      |
 */
export type ThemePack = 'volt' | 'volt-summer' | 'volt-spring' | 'volt-winter';

export const THEME_PACKS: readonly ThemePack[] = ['volt', 'volt-summer', 'volt-spring', 'volt-winter'];

const ALIASES: Record<string, ThemePack> = {
  classic: 'volt',
  volt: 'volt',
  summer: 'volt-summer',
  spring: 'volt-spring',
  winter: 'volt-winter',
};

/**
 * The pack the run asked for through `THEME=…`. Unset means Classic — the
 * suite's baseline, so a run after a theme run is not left on Winter.
 * `THEME=keep` leaves the device as it is (`undefined`).
 */
export function requestedThemePack(): ThemePack | undefined {
  const raw =
    (process.env.THEME ?? 'classic')
      .trim()
      .toLowerCase()
      .replace(/^volt-/, '') || 'classic';
  if (raw === 'keep') return undefined;
  const pack = ALIASES[raw];
  if (!pack) throw new Error(`THEME="${process.env.THEME}" is not one of classic | summer | spring | winter`);
  return pack;
}

/** Display name of a pack, as the Themes page lists it. */
export function themeLabel(pack: ThemePack): string {
  return {
    volt: 'Volt POS (Classic)',
    'volt-summer': 'Volt Summer',
    'volt-spring': 'Volt Spring',
    'volt-winter': 'Volt Winter',
  }[pack];
}

/** The pack the app is rendering right now (`volt` when the attribute is absent). */
export async function activeThemePack(): Promise<ThemePack> {
  const pack = await browser.execute(() => document.documentElement.getAttribute('data-theme-pack'));
  return (pack as ThemePack | null) ?? 'volt';
}

/** Shorthand for page objects: is the run on this pack? Reads the env, not the DOM (no round trip). */
export function onTheme(...packs: ThemePack[]): boolean {
  return packs.includes(requestedThemePack() ?? 'volt');
}

/** Pick a value per theme; `classic` is the fallback for packs not listed. */
export function byTheme<T>(values: { classic: T; summer?: T; spring?: T; winter?: T }): T {
  const pack = requestedThemePack() ?? 'volt';
  const key = pack === 'volt' ? 'classic' : (pack.replace('volt-', '') as 'summer' | 'spring' | 'winter');
  return values[key] ?? values.classic;
}

/**
 * Make the device render `THEME`'s pack. Returns true when it changed the
 * stored choice — the caller must then reload (the app reads it on boot).
 *
 * Writes the same localStorage key the Themes page writes, so it costs a
 * reload instead of a passcode-gated trip to Settings. The Settings page itself
 * is covered by `tests/regression/settings/themes.spec.ts`.
 */
export async function ensureRequestedThemePack(): Promise<boolean> {
  const wanted = requestedThemePack();
  if (!wanted) return false;
  const changed = await browser.execute((pack: string) => {
    const merchant = localStorage.getItem('pos-builder.theme-pack-merchant');
    if (!merchant) return 'no-merchant';
    const key = `pos-builder.theme-pack:${merchant}`;
    const allowed = JSON.parse(
      localStorage.getItem(`pos-builder.theme-packs-allowed:${merchant}`) ?? '[]',
    ) as string[];
    if (allowed.length && !allowed.includes(pack)) return `not-allowed:${allowed.join(',')}`;
    if (
      localStorage.getItem(key) === pack &&
      document.documentElement.getAttribute('data-theme-pack') === pack
    )
      return '';
    localStorage.setItem(key, pack);
    return 'set';
  }, wanted);
  if (changed === 'no-merchant') {
    log.warn('Theme: no merchant id in localStorage yet — cannot pin THEME before the first sign-in');
    return false;
  }
  if (changed.startsWith('not-allowed')) {
    throw new Error(`THEME=${wanted} is not allowed for this store (${changed.slice(12)})`);
  }
  if (changed === 'set') log.warn(`Theme: switched the device to ${themeLabel(wanted)}`);
  return changed === 'set';
}
