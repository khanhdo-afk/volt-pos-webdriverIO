import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { Paths } from '../../../configs/constants/paths.js';
import { loadEnv } from '../../../configs/env/loadEnv.js';

const env = loadEnv();

/** Longest a single CDP command may go unanswered (Page.navigate on a slow Portal included). */
const SEND_TIMEOUT = 45_000;

/**
 * A second browser for app-lane specs: Microsoft Edge on the QR-signed
 * `.portal-profile/`, driven over the Chrome DevTools Protocol.
 *
 * ## Why not a second WebDriver session
 *
 * An app-lane run owns one WebDriver session (the Volt POS WebView). Cross-surface
 * cases (Portal change → POS sees it, and back) need the Portal open in the SAME
 * run, between two POS steps. Edge is launched as a plain process with
 * `--remote-debugging-port` and spoken to over CDP with Node's built-in
 * WebSocket — no driver, no second wdio session, nothing to install.
 *
 * ## Sign-in
 *
 * Same profile as the web lane (`npm run portal:login`, QR once). {@link isSignedIn}
 * lets a spec skip with a clear reason when the session expired. The profile can be
 * open in ONE Edge at a time: close the portal:login window before running.
 */
export class PortalCdp {
  private ws: WebSocket | null = null;
  private browserWs: string | null = null;
  private seq = 0;
  private readonly pending = new Map<number, (msg: CdpReply) => void>();

  constructor(private readonly port = Number(process.env.PORTAL_CDP_PORT ?? 9333)) {}

  get profileDir(): string {
    return path.join(Paths.ROOT, '.portal-profile');
  }

  /** Launch Edge on the profile (or reuse one already listening on the port) and attach to its page. */
  async start(url = env.PORTAL_URL): Promise<this> {
    if (!(await this.version())) {
      spawn(
        edgeExe(),
        [
          `--user-data-dir=${this.profileDir}`,
          `--remote-debugging-port=${String(this.port)}`,
          '--no-first-run',
          '--no-default-browser-check',
          '--window-size=1400,900',
          url,
        ],
        { detached: true, stdio: 'ignore' },
      ).unref();
      const deadline = Date.now() + 25_000;
      while (!(await this.version())) {
        if (Date.now() > deadline)
          throw new Error(
            `PortalCdp: Edge never opened DevTools on :${String(this.port)}. Is .portal-profile already open in another Edge (portal:login)? Close it and re-run.`,
          );
        await sleep(500);
      }
    }
    this.browserWs = (await this.version())?.webSocketDebuggerUrl ?? null;
    const pages = (await (await fetch(`http://127.0.0.1:${String(this.port)}/json`)).json()) as CdpTarget[];
    const page = pages.find((t) => t.type === 'page' && !t.url.startsWith('chrome-extension'));
    if (!page) throw new Error('PortalCdp: no page target in Edge.');
    this.ws = await openSocket(page.webSocketDebuggerUrl, (m) => {
      if (m.id !== undefined) this.pending.get(m.id)?.(m);
      if (m.id !== undefined) this.pending.delete(m.id);
      // A dirty settings form raises "Leave site?" on navigate/reload; left open it
      // freezes every later Runtime.evaluate. The caller decided to leave: accept.
      if (m.method === 'Page.javascriptDialogOpening')
        this.ws?.send(
          JSON.stringify({ id: ++this.seq, method: 'Page.handleJavaScriptDialog', params: { accept: true } }),
        );
    });
    await this.send('Page.enable');
    return this;
  }

  /** Close the whole Edge instance this helper launched. */
  async stop(): Promise<void> {
    this.ws?.close();
    this.ws = null;
    if (!this.browserWs) return;
    const b = await openSocket(this.browserWs, () => undefined).catch(() => null);
    b?.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
    await sleep(800);
    b?.close();
    this.browserWs = null;
  }

  async send<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    if (!this.ws) throw new Error('PortalCdp: not started');
    const id = ++this.seq;
    const reply = new Promise<CdpReply>((resolve, reject) => {
      this.pending.set(id, resolve);
      setTimeout(() => {
        if (this.pending.delete(id))
          reject(new Error(`PortalCdp ${method}: no reply within ${String(SEND_TIMEOUT / 1000)}s`));
      }, SEND_TIMEOUT);
    });
    this.ws.send(JSON.stringify({ id, method, params }));
    const r = await reply;
    if (r.error) throw new Error(`PortalCdp ${method}: ${r.error.message}`);
    return r.result as T;
  }

  /** Evaluate `body` (a function body; may `await`) in the page and return its value. */
  async eval<T>(body: string): Promise<T> {
    const r = await this.send<{ result: { value?: T }; exceptionDetails?: { text: string } }>(
      'Runtime.evaluate',
      {
        expression: `(async () => { ${body} })()`,
        awaitPromise: true,
        returnByValue: true,
      },
    );
    if (r.exceptionDetails) throw new Error(`PortalCdp eval: ${r.exceptionDetails.text}`);
    return r.result.value as T;
  }

  async url(): Promise<string> {
    return this.eval<string>('return location.href;');
  }

  async goto(url: string): Promise<void> {
    await this.send('Page.navigate', { url });
    await this.waitFor('return document.readyState === "complete";', 30_000, `load ${url}`);
  }

  async reload(): Promise<void> {
    await this.send('Page.reload', {});
    await sleep(500);
    await this.waitFor('return document.readyState === "complete";', 30_000, 'reload');
  }

  /** Poll a boolean `body` until true. */
  async waitFor(body: string, timeout = 15_000, what = 'condition'): Promise<void> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await this.eval<boolean>(body).catch(() => false)) return;
      await sleep(250);
    }
    throw new Error(`PortalCdp: ${what} not met within ${String(timeout / 1000)}s`);
  }

  /**
   * A real mouse click at the centre of the element `selectorExpr` evaluates to.
   * Radix Tabs / Select / Vue handlers listen to pointer/mouse-down, which
   * `el.click()` never fires.
   */
  async mouseClick(selectorExpr: string): Promise<void> {
    const box = await this.eval<{ x: number; y: number } | null>(
      `const el = ${selectorExpr}; if (!el) return null; el.scrollIntoView({ block: 'center' });
       await new Promise((r) => setTimeout(r, 150)); const r = el.getBoundingClientRect();
       return { x: r.x + r.width / 2, y: r.y + r.height / 2 };`,
    );
    if (!box) throw new Error(`PortalCdp: nothing to click for ${selectorExpr}`);
    const base = { x: box.x, y: box.y, button: 'left', clickCount: 1 };
    await this.send('Input.dispatchMouseEvent', { ...base, type: 'mouseMoved' });
    await this.send('Input.dispatchMouseEvent', { ...base, type: 'mousePressed' });
    await this.send('Input.dispatchMouseEvent', { ...base, type: 'mouseReleased' });
    await sleep(250);
  }

  /** Press one key (optionally with Ctrl) on the focused element. */
  async key(key: string, code: string, vk: number, ctrl = false): Promise<void> {
    const p = { key, code, windowsVirtualKeyCode: vk, modifiers: ctrl ? 2 : 0 };
    await this.send('Input.dispatchKeyEvent', { ...p, type: 'rawKeyDown' });
    await this.send('Input.dispatchKeyEvent', { ...p, type: 'keyUp' });
  }

  /** Real typing into the focused element (React sees input events), replacing its selection. */
  async insertText(text: string): Promise<void> {
    await this.send('Input.insertText', { text });
  }

  async screenshot(file: string): Promise<void> {
    const r = await this.send<{ data: string }>('Page.captureScreenshot', { format: 'png' });
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
  }

  /** On the Portal and past /login (the profile's session is alive). */
  async isSignedIn(): Promise<boolean> {
    const u = await this.url();
    return u.startsWith(env.PORTAL_URL) && !u.includes('/login');
  }

  /**
   * The Portal keeps an 8 h `fb_refresh_token` (rotated on use, 5-min access `token`),
   * but the Keycloak SSO cookie (`KEYCLOAK_SESSION` on auth.dev-fastboy.dev) lives a
   * year. So when the refresh token has lapsed, "Continue with GCI Business" signs
   * back in WITHOUT a QR as long as that SSO session is alive. Returns true when the
   * page ends up signed in.
   */
  async ssoRelogin(timeout = 30_000): Promise<boolean> {
    if (await this.isSignedIn()) return true;
    const clicked = await this.eval<boolean>(
      `const b=[...document.querySelectorAll('button,a')].find(x=>/Continue with GCI Business/i.test(x.textContent||''));if(!b)return false;b.click();return true;`,
    ).catch(() => false);
    if (!clicked) return false;
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      await sleep(1_000);
      const u = await this.url().catch(() => '');
      if (u.startsWith(env.PORTAL_URL) && !u.includes('/login')) return true;
    }
    return false;
  }

  /** Expiry of the Portal refresh token and the SSO session (null = no such cookie). */
  async sessionInfo(): Promise<{ refreshExpires: Date | null; ssoExpires: Date | null }> {
    const { cookies } = await this.send<{ cookies: { name: string; expires: number }[] }>(
      'Network.getAllCookies',
    );
    const at = (name: string): Date | null => {
      const c = cookies.find((k) => k.name === name);
      return c && c.expires > 0 ? new Date(c.expires * 1000) : null;
    };
    return { refreshExpires: at('fb_refresh_token'), ssoExpires: at('KEYCLOAK_SESSION') };
  }

  private async version(): Promise<{ webSocketDebuggerUrl: string } | null> {
    try {
      const r = await fetch(`http://127.0.0.1:${String(this.port)}/json/version`, {
        signal: AbortSignal.timeout(1_000),
      });
      return r.ok ? ((await r.json()) as { webSocketDebuggerUrl: string }) : null;
    } catch {
      return null;
    }
  }
}

interface CdpTarget {
  type: string;
  url: string;
  webSocketDebuggerUrl: string;
}

interface CdpReply {
  method?: string;
  id?: number;
  result?: unknown;
  error?: { message: string };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function openSocket(url: string, onMessage: (m: CdpReply) => void): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timer = setTimeout(
      () => reject(new Error(`PortalCdp: WebSocket to ${url} did not open within 10s`)),
      10_000,
    );
    ws.onopen = () => {
      clearTimeout(timer);
      resolve(ws);
    };
    ws.onerror = () => {
      clearTimeout(timer);
      reject(new Error(`PortalCdp: cannot open ${url}`));
    };
    ws.onmessage = (e: MessageEvent) => onMessage(JSON.parse(String(e.data)) as CdpReply);
  });
}

function edgeExe(): string {
  const candidates = [
    process.env.EDGE_PATH,
    path.join(
      process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)',
      'Microsoft',
      'Edge',
      'Application',
      'msedge.exe',
    ),
    path.join(
      process.env.ProgramFiles ?? 'C:\\Program Files',
      'Microsoft',
      'Edge',
      'Application',
      'msedge.exe',
    ),
  ].filter((p): p is string => !!p);
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found)
    throw new Error(`PortalCdp: msedge.exe not found (set EDGE_PATH). Tried: ${candidates.join(', ')}`);
  return found;
}
