import { browser } from '@wdio/globals';
import { Timeouts } from '../../configs/constants/timeouts.js';
import { loadEnv } from '../../configs/env/loadEnv.js';

/**
 * VP-5723 helpers:
 * 1. {@link installPageMonitor} — records `console.error`, uncaught errors and
 *    every XHR (method, path, status) from page load on, for TC-VP5723-12 and the
 *    "Discard sends nothing" check in TC-VP5723-09.
 * 2. {@link PosCdp} — a tiny Chrome DevTools client for the Volt POS WebView2 that
 *    is already running on this machine, so the Portal web lane can check the
 *    Portal → POS sync (TC-VP5723-13) and the POS Accessibility page (TC-14).
 */

const env = loadEnv();

export interface XhrRecord {
  method: string;
  path: string;
  status: number;
}

export interface PageLog {
  errors: string[];
  xhr: XhrRecord[];
}

declare global {
  interface Window {
    __vp5723?: PageLog;
  }
}

/**
 * The monitor itself — runs IN THE PAGE. Self-contained (no closure over module
 * scope) and idempotent, so it can be both a preload script and a late inject.
 */
function pageMonitor(): void {
  if (window.__vp5723) return;
  const log: PageLog = { errors: [], xhr: [] };
  window.__vp5723 = log;
  const origError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    log.errors.push(
      args
        .map((a) => (a instanceof Error ? a.message : String(a)))
        .join(' ')
        .slice(0, 300),
    );
    origError(...args);
  };
  window.addEventListener('error', (e) => log.errors.push(`uncaught: ${e.message}`));
  window.addEventListener('unhandledrejection', (e) => log.errors.push(`unhandled: ${String(e.reason)}`));
  // eslint-disable-next-line @typescript-eslint/unbound-method -- re-invoked below with .call(this)
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    isAsync?: boolean,
    user?: string | null,
    password?: string | null,
  ): void {
    const path = new URL(String(url), location.href).pathname;
    this.addEventListener('loadend', () =>
      log.xhr.push({ method: method.toUpperCase(), path, status: this.status }),
    );
    origOpen.call(this, method, url, isAsync ?? true, user, password);
  };
}

/** True when the session has no BiDi preload (attached Edge): inject after each load instead. */
let lateInject = false;

/**
 * Installs the monitor as a BiDi preload script: it runs before the Portal's
 * own scripts on every load/reload, so nothing logged at boot is missed. A
 * session attached to an already-open Edge (GUI runner) may not offer BiDi —
 * then {@link ensureMonitor} injects it after each load (boot-time errors of
 * that load are missed; every later XHR / error is still seen).
 */
export async function installPageMonitor(): Promise<void> {
  try {
    await browser.addInitScript(pageMonitor);
  } catch {
    lateInject = true;
  }
}

/** Call after every page load. No-op when the preload script is active. */
export async function ensureMonitor(): Promise<void> {
  if (lateInject) await browser.execute(pageMonitor);
}

export async function pageLog(): Promise<PageLog> {
  return browser.execute(() => window.__vp5723 ?? { errors: [], xhr: [] });
}

export const isWrite = (x: XhrRecord): boolean => !['GET', 'HEAD', 'OPTIONS'].includes(x.method);

// ---------------------------------------------------------------------------
// POS over CDP
// ---------------------------------------------------------------------------

/**
 * Where to look for the Volt POS DevTools: `POS_CDP_CANDIDATES` (comma list, set
 * by the GUI runner to every app port of the store under test) or
 * `VP5723_POS_CDP`, else this machine's REMOTE_DEBUG_PORT.
 */
export const POS_CDP_LIST = (
  process.env.POS_CDP_CANDIDATES?.trim() ||
  process.env.VP5723_POS_CDP?.trim() ||
  `http://${env.DRIVER_HOST}:${String(env.REMOTE_DEBUG_PORT)}`
)
  .split(',')
  .map((u) => u.trim().replace(/\/+$/, ''))
  .filter(Boolean);

interface CdpTarget {
  type: string;
  title: string;
  url: string;
  webSocketDebuggerUrl: string;
}

interface CdpReply {
  id?: number;
  result?: { result?: { value?: unknown }; exceptionDetails?: { text?: string } };
  error?: { message: string };
}

export interface PosSettings {
  showPoint: boolean | null;
  showReward: boolean | null;
  defaultScreen: string | null;
  fontSize: string | null;
}

export interface PosFound {
  pos: PosCdp;
  base: string;
  url: string;
  /** Merchant the POS is signed in to (its `pos-builder.theme-pack-merchant`), '' if unknown. */
  merchant: string;
}

async function posPage(base: string): Promise<CdpTarget | null> {
  try {
    const res = await fetch(`${base}/json/list`, { signal: AbortSignal.timeout(3_000) });
    const list = (await res.json()) as CdpTarget[];
    return (
      list.find(
        (t) =>
          t.type === 'page' && t.url.startsWith('http://tauri.localhost') && !t.url.includes('/customer'),
      ) ?? null
    );
  } catch {
    return null;
  }
}

/**
 * The first Volt POS main window on {@link POS_CDP_LIST} that is signed in to
 * `merchantId` (a POS whose merchant cannot be read is accepted), or null.
 */
export async function findPos(merchantId: string): Promise<PosFound | null> {
  for (const base of POS_CDP_LIST) {
    const target = await posPage(base);
    if (!target) continue;
    const pos = await PosCdp.connect(target);
    const merchant = await pos
      .eval<string | null>(`localStorage.getItem('pos-builder.theme-pack-merchant')`)
      .catch(() => null);
    if (!merchant || merchant === merchantId) return { pos, base, url: target.url, merchant: merchant ?? '' };
    pos.close();
  }
  return null;
}

export class PosCdp {
  private nextId = 0;
  private readonly pending = new Map<number, (r: CdpReply) => void>();

  private constructor(private readonly ws: WebSocket) {
    ws.addEventListener('message', (ev: MessageEvent<string>) => {
      const reply = JSON.parse(ev.data) as CdpReply;
      if (reply.id !== undefined) {
        this.pending.get(reply.id)?.(reply);
        this.pending.delete(reply.id);
      }
    });
  }

  static async connect(target: CdpTarget): Promise<PosCdp> {
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise<void>((resolve, reject) => {
      ws.addEventListener('open', () => resolve(), { once: true });
      ws.addEventListener(
        'error',
        () => reject(new Error(`POS CDP: cannot open ${target.webSocketDebuggerUrl}`)),
        {
          once: true,
        },
      );
    });
    return new PosCdp(ws);
  }

  close(): void {
    this.ws.close();
  }

  private send(method: string, params: Record<string, unknown> = {}): Promise<CdpReply> {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`POS CDP: ${method} timed out`)), Timeouts.MEDIUM);
      this.pending.set(id, (r) => {
        clearTimeout(timer);
        resolve(r);
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  /** Evaluate an expression in the POS main window (promises awaited, value by JSON). */
  async eval<T>(expression: string): Promise<T> {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.error) throw new Error(`POS CDP: ${r.error.message}`);
    if (r.result?.exceptionDetails)
      throw new Error(`POS CDP eval: ${r.result.exceptionDetails.text ?? 'exception'}`);
    return r.result?.result?.value as T;
  }

  /** A real mouse click (the POS passcode keypad ignores synthetic DOM clicks). */
  async click(x: number, y: number): Promise<void> {
    for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
      await this.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    }
  }

  async pathname(): Promise<string> {
    return this.eval<string>('location.pathname');
  }

  async htmlFontSize(): Promise<string | null> {
    return this.eval<string | null>('document.documentElement.getAttribute("data-font-size")');
  }

  /** The POS's own copy of the four settings (its local GraphQL over IPC). */
  async settings(): Promise<PosSettings> {
    return this.eval<PosSettings>(`(async () => {
      const r = await window.__TAURI_INTERNALS__.invoke('graphql', {
        query: '{ sysSettingList { key value } }', variables: {}, operation: null });
      const rows = (r && r.data && r.data.sysSettingList) || [];
      const get = (k) => { const row = rows.find((x) => x.key === k); return row ? row.value : null; };
      const parse = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
      const cd = parse(get('merchant_customer_display')) || {};
      const st = parse(get('merchant_theme_pos_style')) || {};
      return {
        showPoint: typeof cd.show_point === 'boolean' ? cd.show_point : null,
        showReward: typeof cd.show_reward === 'boolean' ? cd.show_reward : null,
        defaultScreen: get('merchant_default_screen'),
        fontSize: st.font_size ?? null,
      };
    })()`);
  }

  /**
   * Open POS Settings → Accessibility, typing the staff passcode if the gate asks.
   * Returns the card each section title sits in, so the caller can check they are
   * separate cards.
   */
  async openAccessibility(passcode: string): Promise<void> {
    await this.eval(`(location.href = '/settings/accessibility', 1)`);
    const deadline = Date.now() + Timeouts.LONG;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1_000));
      const state = await this.eval<string>(`(() => {
        if (location.pathname !== '/settings/accessibility') return 'loading';
        const t = document.body.innerText;
        if (t.includes('Enter staff code')) return 'passcode';
        return t.includes('Font Size') && t.includes('Customer Display') ? 'ready' : 'loading';
      })()`);
      if (state === 'ready') return;
      if (state === 'passcode') {
        for (const digit of passcode) {
          const at = await this.eval<[number, number] | null>(`(() => {
            const el = Array.from(document.querySelectorAll('button, div, span'))
              .filter((e) => e.children.length === 0 && (e.textContent || '').trim() === ${JSON.stringify(digit)})
              .map((e) => e.getBoundingClientRect()).find((r) => r.width > 0 && r.height > 0);
            return el ? [el.x + el.width / 2, el.y + el.height / 2] : null;
          })()`);
          if (!at) throw new Error(`POS passcode keypad: no "${digit}" key`);
          await this.click(at[0], at[1]);
        }
      }
    }
    throw new Error('POS: Settings → Accessibility did not open (passcode / route).');
  }

  /** For each title: the index of the card it sits in (same index = same card). */
  async accessibilityCards(titles: string[]): Promise<{ title: string; card: number }[]> {
    return this.eval(`(() => {
      const titles = ${JSON.stringify(titles)};
      const cards = [];
      return titles.map((title) => {
        const h = Array.from(document.querySelectorAll('h1,h2,h3,h4,div,span,p'))
          .find((e) => e.children.length === 0 && (e.textContent || '').trim() === title);
        if (!h) return { title, card: -1 };
        const card = h.closest('.rounded-lg.bg-card') || h.closest('[class*="bg-card"]');
        if (!card) return { title, card: -2 };
        let i = cards.indexOf(card);
        if (i < 0) { cards.push(card); i = cards.length - 1; }
        return { title, card: i };
      });
    })()`);
  }

  async bodyText(): Promise<string> {
    return this.eval<string>('document.body.innerText');
  }
}

/** Poll the POS until `pred` holds on its settings, or time out with what it last read. */
export async function waitForPosSettings(
  pos: PosCdp,
  pred: (s: PosSettings) => boolean,
  timeout = 60_000,
): Promise<PosSettings> {
  const deadline = Date.now() + timeout;
  let last = await pos.settings();
  while (!pred(last) && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2_000));
    last = await pos.settings();
  }
  return last;
}
