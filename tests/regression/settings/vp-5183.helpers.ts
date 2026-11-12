/**
 * VP-5183 helpers — images from `ObjectFiles` (store logo, store brand,
 * signature, staff avatars) load through the Tauri asset protocol.
 *
 * NOT a spec. Test data from env with merchant #14 defaults (dev only):
 *   VP5183_FILES        — files under ObjectFiles\<merchant> to fetch, comma separated
 *   VP5183_AVATAR_STAFF — a staff with an avatar on Home ("Angela Tyler 89999")
 *   VP5183_SIGNED_ORDER — a Card order with a signature ("OD261109-28956493")
 */

import fs from 'node:fs';
import { browser } from '@wdio/globals';
import { Timeouts } from '../../../configs/constants/timeouts.js';
import { env } from '../../../configs/env/loadEnv.js';
import { gql } from '../../../src/api/index.js';
import { ASSET_ORIGIN, ASSET_REFUSED_LOG_RE } from '../../../src/constants/testids.vp-5183.js';
import { currentAppLogFile } from '../../../src/db/appLogs.js';
import { switchToMain } from '../../../src/helpers/window.js';
import { voltQcProbe as P } from '../../../src/pages/voltqc/pos/VoltQcProbe.js';

export const vp5183 = {
  files: (
    process.env.VP5183_FILES?.trim() ||
    '01a05bb3-7eb2-7e03-b17f-f1166822fa81.png,019dd1c5-0867-7860-b30c-bcb5550ed9c7.webp'
  )
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean),
  avatarStaff: process.env.VP5183_AVATAR_STAFF?.trim() || 'Angela Tyler 89999',
  signedOrder: process.env.VP5183_SIGNED_ORDER?.trim() || 'OD261109-28956493',
} as const;

/** Load state of one `<img>`, as the page sees it. */
export interface ImgState {
  found: boolean;
  /** Decoded `src` (the asset path, readable). */
  src: string;
  complete: boolean;
  naturalWidth: number;
}

/** True when `img` points at ObjectFiles through the asset protocol and decoded. */
export const loadedFromAsset = (img: ImgState): boolean =>
  img.found &&
  img.src.startsWith(ASSET_ORIGIN) &&
  /ObjectFiles/i.test(img.src) &&
  img.complete &&
  img.naturalWidth > 0;

/** Every `<img>` matching `css` on the staff window. */
export async function images(css: string): Promise<ImgState[]> {
  await switchToMain();
  return P.exec<ImgState[]>(
    `return Array.prototype.map.call(document.querySelectorAll(arguments[0]), function (i) {
       var s = String(i.currentSrc || i.src || '');
       try { s = decodeURIComponent(s); } catch (e) {}
       return { found: true, src: s, complete: !!i.complete, naturalWidth: i.naturalWidth || 0 };
     });`,
    css,
  );
}

/**
 * Poll until `min` images matching `css` have loaded from the asset protocol;
 * returns the last read either way, so the spec can show what it saw.
 */
export async function waitAssetImages(
  css: string,
  min = 1,
  timeout: number = Timeouts.MEDIUM,
): Promise<ImgState[]> {
  let last: ImgState[] = [];
  try {
    await browser.waitUntil(
      async () => {
        last = await images(css);
        return last.filter(loadedFromAsset).length >= min;
      },
      { timeout, interval: 300 },
    );
  } catch {
    // Timed out: the spec asserts on `last`.
  }
  return last;
}

/** Scroll the first match of `css` into view (lazy lists, long settings pages). */
export async function scrollIntoView(css: string): Promise<void> {
  await P.exec<null>(
    'var e = document.querySelector(arguments[0]); if (e) e.scrollIntoView({ block: "center" }); return null;',
    css,
  );
}

/** `objectFilesPath` the frontend builds image URLs from (per merchant). */
export async function objectFilesPath(): Promise<string> {
  const r = await gql().query<{ objectFilesPath: string }>('query { objectFilesPath }');
  return r.objectFilesPath;
}

export interface AssetFetch {
  label: string;
  path: string;
  status: number;
  contentType: string;
  bytes: number;
  error: string;
}

/** `fetch()` each path through the asset protocol from inside the staff window. */
export async function fetchAssets(paths: readonly { label: string; path: string }[]): Promise<AssetFetch[]> {
  await switchToMain();
  return browser.executeAsync(
    (origin: string, list: { label: string; path: string }[], done: (r: AssetFetch[]) => void) => {
      void Promise.all(
        list.map((p) =>
          fetch(origin + encodeURIComponent(p.path))
            .then((res) =>
              res.arrayBuffer().then((buf) => ({
                label: p.label,
                path: p.path,
                status: res.status,
                contentType: res.headers.get('content-type') ?? '',
                bytes: buf.byteLength,
                error: '',
              })),
            )
            .catch((e: unknown) => ({
              label: p.label,
              path: p.path,
              status: 0,
              contentType: '',
              bytes: 0,
              error: String(e),
            })),
        ),
      ).then(done);
    },
    ASSET_ORIGIN,
    [...paths],
  );
}

/** The three path spellings the bug report tried: mixed (what `useImage` builds), all `\`, all `/`. */
export function pathVariants(base: string, file: string): { label: string; path: string }[] {
  return [
    { label: `${file} mixed`, path: `${base}/${file}` },
    { label: `${file} backslash`, path: `${base}\\${file}` },
    { label: `${file} slash`, path: `${base}/${file}`.replace(/\\/g, '/') },
  ];
}

/**
 * Count of "asset protocol not configured to allow the path" lines in the
 * app's current log; `null` when there is no log file (debug build / not
 * Windows / spec on another machine than the app).
 */
export function assetRefusalsInLog(): number | null {
  const file = currentAppLogFile(env.APP_IDENTIFIER);
  if (!file) return null;
  try {
    return fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((l) => ASSET_REFUSED_LOG_RE.test(l)).length;
  } catch {
    return null;
  }
}
