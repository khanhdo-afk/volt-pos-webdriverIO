/**
 * Customer display over raw CDP.
 *
 * In attach mode msedgedriver exposes the customer window as a stale
 * `about:blank` handle, while the real `/customer/` page is a separate CDP
 * target. So the customer screen is read and clicked directly over CDP:
 * Runtime.evaluate to read/locate, Input.dispatchMouseEvent for a real click.
 */
import { loadEnv } from '../../configs/env/loadEnv.js';
import { primeCustomerWindow } from '../support/attachApp.js';

interface Target {
  type?: string;
  url?: string;
  webSocketDebuggerUrl?: string;
}

async function findCustomer(): Promise<Target | undefined> {
  const env = loadEnv();
  const list = (await (
    await fetch(`http://127.0.0.1:${String(env.REMOTE_DEBUG_PORT)}/json/list`)
  ).json()) as Target[];
  return list.find((x) => x.type === 'page' && (x.url ?? '').includes('/customer'));
}

async function customerWs(): Promise<string> {
  let t = await findCustomer();
  if (!t) {
    // An attached session can leave the customer window on about:blank — reload /customer/ there.
    await primeCustomerWindow();
    t = await findCustomer();
  }
  if (!t?.webSocketDebuggerUrl) throw new Error('customer display: no /customer/ CDP target');
  return t.webSocketDebuggerUrl;
}

async function cdp(calls: { method: string; params: Record<string, unknown> }[]): Promise<unknown[]> {
  const ws = new WebSocket(await customerWs());
  await new Promise<void>((resolve, reject) => {
    ws.onopen = (): void => resolve();
    ws.onerror = (): void => reject(new Error('customer CDP socket failed'));
  });
  try {
    const out: unknown[] = [];
    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      if (!call) continue;
      const id = i + 1;
      out.push(
        await new Promise<unknown>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error(`customer CDP ${call.method} timed out`)), 10_000);
          ws.onmessage = (ev: MessageEvent): void => {
            const msg = JSON.parse(String(ev.data)) as {
              id?: number;
              result?: unknown;
              error?: { message: string };
            };
            if (msg.id !== id) return;
            clearTimeout(timer);
            if (msg.error) reject(new Error(msg.error.message));
            else resolve(msg.result);
          };
          ws.send(JSON.stringify({ id, method: call.method, params: call.params }));
        }),
      );
    }
    return out;
  } finally {
    ws.close();
  }
}

export async function customerEval<T>(expression: string): Promise<T> {
  const [r] = await cdp([{ method: 'Runtime.evaluate', params: { expression, returnByValue: true } }]);
  return (r as { result?: { value?: T } }).result?.value as T;
}

/** Text of the customer display; waits (≤ 10 s) for a freshly reloaded page to render. */
export async function customerText(): Promise<string> {
  const deadline = Date.now() + 10_000;
  let t = '';
  while (Date.now() < deadline) {
    t = (await customerEval<string>('document.body ? document.body.innerText : ""')) ?? '';
    if (t.trim()) return t;
    await new Promise((r) => setTimeout(r, 400));
  }
  return t;
}

/** Click the first visible element whose normalized text equals `text` (real mouse event). */
export async function customerClick(text: string): Promise<boolean> {
  const rect = await customerEval<{ x: number; y: number } | null>(`(() => {
    const want = ${JSON.stringify(text)};
    const norm = (t) => (t || '').replace(/\\s+/g, ' ').trim();
    const els = [...document.querySelectorAll('button,[role=button],*')].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && norm(e.innerText) === want;
    });
    els.sort((a, b) => a.getBoundingClientRect().width * a.getBoundingClientRect().height - b.getBoundingClientRect().width * b.getBoundingClientRect().height);
    const e = els[0];
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);
  if (!rect) return false;
  const base = { x: rect.x, y: rect.y, button: 'left', clickCount: 1 };
  await cdp([
    { method: 'Input.dispatchMouseEvent', params: { ...base, type: 'mouseMoved' } },
    { method: 'Input.dispatchMouseEvent', params: { ...base, type: 'mousePressed' } },
    { method: 'Input.dispatchMouseEvent', params: { ...base, type: 'mouseReleased' } },
  ]);
  return true;
}
