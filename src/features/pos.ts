/**
 * PRODUCTION driver for the installed Volt POS (attach lane, CDP 9222).
 *
 * Deliberately separate from the dev/staging page objects + flows: production
 * builds strip data-testids and run on the live backend, so everything here
 * locates by visible text / role, reads data back through the app's own local
 * GraphQL, and never resets or relaunches anything.
 */
import { browser } from '@wdio/globals';
import { switchToMain } from '../helpers/window.js';
import { customerClick, customerText } from './customerCdp.js';
import { assertCardAmount, passcode } from './policy.js';

const BASE = 'http://tauri.localhost';
export const pause = (ms: number): Promise<void> => browser.pause(ms);
const DEBUG = process.env.QC_DEBUG === '1';
export const dbg = (m: string): void => {
  if (DEBUG) console.log(`[qc ${new Date().toISOString().slice(11, 19)}] ${m}`);
};

// ── low level ────────────────────────────────────────────────────────────────

export async function go(path: string, wait = 1800): Promise<void> {
  dbg(`go ${path}`);
  await switchToMain();
  await browser.url(BASE + path);
  await pause(wait);
  await passcodeIfPrompted();
}

export const bodyText = (): Promise<string> => browser.execute(() => document.body.innerText);
export const mainText = (): Promise<string> =>
  browser.execute(() => (document.querySelector('main') ?? document.body).innerText);
export const dialogTexts = (): Promise<string[]> =>
  browser.execute(() =>
    [...document.querySelectorAll('[role=dialog],[role=alertdialog]')].map(
      (d) => (d as HTMLElement).innerText,
    ),
  );

type Scope = 'main' | 'dialog' | 'alert' | 'body' | 'header';
interface ClickOpts {
  scope?: Scope;
  exact?: boolean;
  /** match against buttons only (default) or any element whose own text matches */
  any?: boolean;
  last?: boolean;
  timeout?: number;
}

/**
 * Find a visible element by text (button text / aria-label, or any leaf text),
 * tag it, and click it through WebDriver so React gets real pointer events.
 */
export async function click(text: string | RegExp, opts: ClickOpts = {}): Promise<void> {
  dbg(`click ${String(text)} ${JSON.stringify(opts)}`);
  const { scope = 'body', exact = true, any = false, last = false, timeout = 15_000 } = opts;
  const src = text instanceof RegExp ? { re: text.source, flags: text.flags } : { s: text };
  const deadline = Date.now() + timeout;
  let tagged = false;
  while (Date.now() < deadline) {
    tagged = await browser.execute(
      (
        src: { re?: string; flags?: string; s?: string },
        scope: string,
        exact: boolean,
        any: boolean,
        last: boolean,
      ) => {
        document.querySelectorAll('[data-qc-click]').forEach((e) => e.removeAttribute('data-qc-click'));
        const roots: Element[] =
          scope === 'dialog'
            ? [...document.querySelectorAll('[role=dialog]')].slice(-1)
            : scope === 'alert'
              ? [...document.querySelectorAll('[role=alertdialog]')].slice(-1)
              : scope === 'main'
                ? [document.querySelector('main') ?? document.body]
                : scope === 'header'
                  ? [document.querySelector('header') ?? document.body]
                  : [document.body];
        const norm = (t: string | null | undefined): string => (t ?? '').replace(/\s+/g, ' ').trim();
        const ok = (t: string): boolean => {
          if (src.re !== undefined) return new RegExp(src.re, src.flags).test(t);
          return exact ? t === src.s : t.includes(src.s ?? '');
        };
        const visible = (e: Element): boolean => {
          const r = (e as HTMLElement).getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        };
        const hits: Element[] = [];
        for (const root of roots) {
          const pool = any
            ? [...root.querySelectorAll('*')].filter(
                (e) => e.childElementCount === 0 || e.tagName === 'BUTTON',
              )
            : [
                ...root.querySelectorAll(
                  'button,[role=button],[role=tab],a,[role=menuitem],[role=option],label',
                ),
              ];
          for (const e of pool) {
            if (!visible(e)) continue;
            const t = norm((e as HTMLElement).innerText || e.getAttribute('aria-label'));
            if (ok(t) || ok(norm(e.getAttribute('aria-label')))) hits.push(e);
          }
        }
        const el = last ? hits[hits.length - 1] : hits[0];
        if (!el) return false;
        el.setAttribute('data-qc-click', '1');
        return true;
      },
      src,
      scope,
      exact,
      any,
      last,
    );
    if (tagged) break;
    await pause(300);
  }
  if (!tagged)
    throw new Error(`click: no visible ${any ? 'element' : 'button'} "${String(text)}" in ${scope}`);
  const el = browser.$('[data-qc-click="1"]');
  await el.scrollIntoView({ block: 'center' }).catch(() => undefined);
  try {
    await el.click();
  } catch (e) {
    // A closing dialog/overlay can swallow the pointer click — fall back to a DOM click.
    if (!/intercepted|not interactable/i.test((e as Error).message)) throw e;
    dbg(`click intercepted → DOM click ${String(text)}`);
    await pause(800);
    await browser.execute(() => {
      document.querySelector<HTMLElement>('[data-qc-click="1"]')?.click();
    });
  }
}

export async function exists(text: string | RegExp, scope: Scope = 'body'): Promise<boolean> {
  const t =
    scope === 'body'
      ? await bodyText()
      : scope === 'main'
        ? await mainText()
        : (await dialogTexts()).join('\n');
  return typeof text === 'string' ? t.includes(text) : text.test(t);
}

export async function waitText(
  text: string | RegExp,
  timeout = 15_000,
  scope: Scope = 'body',
): Promise<boolean> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await exists(text, scope)) return true;
    await pause(300);
  }
  return false;
}

/** Type into an input located by placeholder (or CSS), replacing its value. */
export async function typeInto(placeholderOrCss: string, value: string, inDialog = false): Promise<void> {
  dbg(`type ${placeholderOrCss} = ${value}`);
  const css =
    placeholderOrCss.startsWith('#') || placeholderOrCss.includes('[')
      ? placeholderOrCss
      : `input[placeholder="${placeholderOrCss}"]`;
  const sel = inDialog ? `[role=dialog] ${css}` : css;
  const els = await browser.$$(sel).getElements();
  const el = els[els.length - 1];
  if (!el) throw new Error(`typeInto: no input ${sel}`);
  try {
    await el.click();
  } catch (e) {
    // Transparent overlay inputs (gift-card code boxes) refuse a pointer click — focus instead.
    if (!/intercepted|not interactable/i.test((e as Error).message)) throw e;
    await browser.execute((x: HTMLElement) => x.focus(), el as unknown as HTMLElement);
  }
  await browser.keys(['Control', 'a']);
  await browser.keys(['Backspace']);
  await browser.keys(value.split(''));
  await pause(300);
}

/** The staff-code prompt in every UI language (en / vi). */
export const STAFF_CODE = /Enter staff code|Nhập mã nhân viên/;

/** Enter the owner passcode when a staff-code dialog is up. Returns whether it was asked. */
let autoPasscode = true;
/** Gate specs turn this off so helpers do not answer the prompt they are testing. */
export function setAutoPasscode(on: boolean): void {
  autoPasscode = on;
}

export async function passcodeIfPrompted(code = passcode(), force = false): Promise<boolean> {
  if (!autoPasscode && !force) return false;
  if (!(await exists(STAFF_CODE))) return false;
  if (!code)
    throw new Error(
      'A passcode prompt appeared but this store has no OWNER_PASSCODE configured (configs/env/.env.prod.<store>) — not guessing one.',
    );
  dbg('passcode');
  // One DOM click per digit (a WebDriver click on the keypad can register twice).
  for (const d of code) {
    const open = await browser.execute((digit: string) => {
      const dlg = [...document.querySelectorAll('[role=dialog]')]
        .reverse()
        .find((x) => /Enter staff code|Nhập mã nhân viên/.test((x as HTMLElement).innerText));
      if (!dlg) return false;
      const b = [...dlg.querySelectorAll('button')].find(
        (x) => (x as HTMLElement).innerText.trim() === digit,
      );
      (b as HTMLElement | undefined)?.click();
      return true;
    }, d);
    if (!open) break;
    await pause(120);
  }
  await pause(1500);
  return true;
}

export async function passcodeTitle(): Promise<string | null> {
  const m = (await bodyText()).match(/(?:Enter staff code to access|Nhập mã nhân viên để truy cập) ([^\n]+)/);
  return m?.[1] ?? null;
}

export async function escape(times = 1): Promise<void> {
  for (let i = 0; i < times; i++) {
    await browser.keys(['Escape']);
    await pause(400);
  }
}

// ── app data (local GraphQL inside the POS) ──────────────────────────────────

export async function gql<T = unknown>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  await switchToMain();
  const res = await browser.executeAsync(
    (q: string, v: Record<string, unknown>, done: (r: unknown) => void) => {
      const w = window as unknown as {
        __TAURI_INTERNALS__: { invoke: (c: string, a: unknown) => Promise<unknown> };
      };
      w.__TAURI_INTERNALS__
        .invoke('graphql', { query: q, variables: v, operation: null })
        .then(done, (e: unknown) => done({ errors: [{ message: String(e) }] }));
    },
    query,
    variables,
  );
  const r = res as { data?: T; errors?: { message: string }[] };
  if (r.errors?.length) throw new Error(`gql: ${r.errors.map((e) => e.message).join('; ')}`);
  return r.data as T;
}

export interface OrderRow {
  id: string;
  orderCode: string;
  status: string;
  total: number;
  tipAmount: number | null;
  customerId: string | null;
  merchantPromotionPercent: number | null;
  staffPromotionPercent: number | null;
  totalPromotionDiscount: number | null;
}

export async function orderByCode(code: string): Promise<OrderRow | null> {
  const d = await gql<{ orderList: OrderRow[] }>(
    `query($c:String!){ orderList(where:{orderCode:{eq:$c}}){ id orderCode status total tipAmount customerId merchantPromotionPercent staffPromotionPercent totalPromotionDiscount } }`,
    { c: code },
  );
  return d.orderList[0] ?? null;
}

export async function giftCard(code: string): Promise<{ status: string; currentBalance: number } | null> {
  const d = await gql<{ giftCardList: { status: string; currentBalance: number }[] }>(
    `query($c:String!){ giftCardList(where:{code:{eq:$c}}){ status currentBalance } }`,
    { c: code },
  );
  return d.giftCardList[0] ?? null;
}

// ── order building ───────────────────────────────────────────────────────────

export const money = (s: string): number => Math.round(Number.parseFloat(s.replace(/[$,]/g, '')) * 100);

export async function currentOrderCode(): Promise<string> {
  // The cart header reads "#OD…"; bare OD codes in <main> belong to the pending sidebar list.
  const t = await mainText();
  const m = t.match(/#(OD\d{6}-\d+)/) ?? t.match(/Order #(OD\d{6}-\d+)/);
  if (!m?.[1]) throw new Error('no open order code on screen');
  return m[1];
}

export async function pendingCodes(): Promise<string[]> {
  const d = await gql<{ orderList: { orderCode: string }[] }>(
    'query{ orderList(where:{status:{eq:"pending"}}){ orderCode } }',
  );
  return d.orderList.map((o) => o.orderCode);
}

/**
 * Start a NEW order (Quick Checkout — never an existing draft someone else left
 * open), then for each [staff, services[]] pick the staff tile and its services.
 * Throws if the till put the lines on an order that already existed.
 */
export async function buildOrder(lines: [string, string[]][]): Promise<string> {
  const before = new Set(await pendingCodes());
  const started = Date.now();
  await go('/order-pending', 2500);
  await click('Quick Checkout', { scope: 'main' });
  await pause(1500);
  await passcodeIfPrompted();
  if (/#OD\d{6}-\d+/.test(await mainText())) {
    throw new Error(
      'buildOrder: an existing order is still selected after Quick Checkout — not adding lines to it.',
    );
  }
  // If Quick Checkout already created the new (empty) order, select it explicitly so
  // no other open draft can receive the lines.
  for (let i = 0; i < 4; i++) {
    const fresh = (await pendingCodes()).filter((c) => !before.has(c));
    if (fresh.length === 1 && fresh[0]) {
      await click(fresh[0], { scope: 'main', any: true }).catch(() => undefined);
      await pause(1200);
      break;
    }
    await pause(500);
  }
  // Pick the first staff, then make sure the order on screen was JUST created
  // before any service is added to it.
  const [first, ...rest] = lines;
  if (!first) throw new Error('buildOrder: no lines');
  await selectStaff(first[0]);
  const code = await currentOrderCode();
  const row = await gql<{ orderList: { createdAt: string }[] }>(
    'query($c:String!){ orderList(where:{orderCode:{eq:$c}}){ createdAt } }',
    { c: code },
  ).catch(() => ({ orderList: [] as { createdAt: string }[] }));
  const created = Date.parse(row.orderList[0]?.createdAt ?? '');
  if (before.has(code) || (Number.isFinite(created) && created < started - 15_000)) {
    throw new Error(
      `buildOrder: staff landed on the pre-existing order ${code} — refusing to add lines to it.`,
    );
  }
  for (const s of first[1]) {
    await clickService(s);
    await pause(800);
  }
  await addLines(rest);
  return code;
}

/**
 * Click a staff tile by name. Uses the tile container (`staff-tile-*`): in
 * reopen/edit mode the name text sits under an overlay that swallows clicks.
 */
export async function selectStaff(name: string): Promise<void> {
  const ok = await browser.execute((n: string) => {
    document.querySelectorAll('[data-qc-staff]').forEach((e) => e.removeAttribute('data-qc-staff'));
    const tiles = [...document.querySelectorAll('[data-testid^="staff-tile-"]')];
    const t = tiles.find((e) => (e as HTMLElement).innerText.split('\n').some((l) => l.trim() === n));
    if (!t) return false;
    t.setAttribute('data-qc-staff', '1');
    return true;
  }, name);
  if (ok) {
    const el = browser.$('[data-qc-staff="1"]');
    await el.scrollIntoView({ block: 'center' }).catch(() => undefined);
    await el.click();
  } else {
    await click(name, { scope: 'main', any: true });
  }
  await pause(900);
  await passcodeIfPrompted();
  if (await exists('Select Staff First')) {
    await click('Done', { scope: 'dialog' });
    throw new Error(`selectStaff(${name}): the till still asks to select a staff`);
  }
}

/**
 * Click a service tile in the catalogue grid. The same name also appears on
 * pending-order cards in the sidebar and on cart lines — clicking those would
 * select another order — so this takes the LAST match (the grid is last in DOM).
 */
export async function clickService(name: string): Promise<void> {
  await click(name, { scope: 'main', any: true, last: true });
  await pause(800);
  if (await exists('Select Staff First'))
    throw new Error(`adding "${name}": the till asks to select a staff first`);
}

export async function addLines(lines: [string, string[]][]): Promise<void> {
  for (const [staff, services] of lines) {
    await selectStaff(staff);
    for (const s of services) {
      await clickService(s);
      await pause(800);
      if (await exists('Select Staff First'))
        throw new Error(`adding "${s}": the till asks to select a staff first`);
    }
  }
}

export interface CustomerRow {
  id: string;
  name: string;
  pointBalance: number | null;
  visitCount: number | null;
}

/**
 * Loyalty numbers reach the till by sync, seconds to a minute after the payment.
 * Poll until `want` holds (or the timeout), so a slow sync is not mistaken for
 * "nothing changed" — the caller then asserts on the returned values.
 */
export async function waitCustomer(
  name: string,
  want: (s: { points: number; visits: number }) => boolean,
  timeout = 120_000,
): Promise<{ points: number; visits: number }> {
  const read = async (): Promise<{ points: number; visits: number }> => {
    const c = await customerByName(name);
    return { points: c?.pointBalance ?? 0, visits: c?.visitCount ?? 0 };
  };
  const end = Date.now() + timeout;
  let cur = await read();
  while (!want(cur) && Date.now() < end) {
    await pause(5000);
    cur = await read();
  }
  return cur;
}

export async function customerByName(name: string): Promise<CustomerRow | null> {
  const d = await gql<{ customerList: CustomerRow[] }>(
    'query($n:String!){ customerList(where:{name:{eq:$n}}){ id name pointBalance visitCount } }',
    { n: name },
  );
  return d.customerList[0] ?? null;
}

/** Remove the customer from the open cart (✕ next to the customer card → Remove). */
export async function removeCustomer(name: string): Promise<void> {
  const ok = await browser.execute((n: string) => {
    const label = [...document.querySelectorAll('main *')].find(
      (e) => e.childElementCount === 0 && e.textContent?.trim() === n,
    );
    let p: Element | null | undefined = label;
    for (let k = 0; k < 4 && p; k++) p = p.parentElement;
    const bs = p ? [...p.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().width > 0) : [];
    const b = bs[bs.length - 1];
    if (!b) return false;
    b.setAttribute('data-qc-rmcust', '1');
    return true;
  }, name);
  if (!ok) throw new Error(`removeCustomer: no customer card "${name}"`);
  await browser.$('[data-qc-rmcust="1"]').click();
  await pause(1200);
  if (await exists('Remove Customer')) await click('Remove', { scope: 'alert' });
  await pause(1200);
  await passcodeIfPrompted();
}

/** Order History → Re-Open Order → returns the confirm text, then Confirm (passcode as needed). */
export async function reopen(orderId: string): Promise<string> {
  await openHistoryOrder(orderId);
  await click('Re-Open Order', { scope: 'main' });
  await pause(1500);
  await passcodeIfPrompted();
  await waitText('Re-Open Order?', 10_000);
  const text = (await dialogTexts()).join('\n');
  await click('Confirm', { scope: 'body', last: true });
  await pause(2500);
  await passcodeIfPrompted();
  return text;
}

/** In reopen checkout, "Re-Open Done" closes the ticket keeping its transactions. */
export async function reopenDone(): Promise<void> {
  await click('Re-Open Done', { scope: 'main' });
  await pause(2500);
  await passcodeIfPrompted();
  await customerTip('No Tip').catch(() => false);
  await pause(1500);
  await noReceipt();
}

export async function attachCustomer(name: string, search = 'checkin'): Promise<void> {
  await click('Enter Customer Phone, Name or Email', { scope: 'main', any: true });
  await pause(900);
  await typeInto('Phone, name or email', search);
  await pause(2500);
  await click(name, { any: true });
  await pause(1500);
}

export async function openCheckout(): Promise<void> {
  await click('Pay', { scope: 'main' });
  await pause(2200);
}

/** Amount (cents) on a payment-method button of the checkout panel. */
export async function methodCents(method: 'Card' | 'Cash' | 'Gift Card' | 'Other'): Promise<number> {
  const t = await mainText();
  const m = t.match(new RegExp(`(?:^|\\n)${method}\\n\\$([\\d,.]+)`));
  if (!m?.[1]) throw new Error(`no ${method} amount on checkout`);
  return money(m[1]);
}

export async function pickMethod(method: 'Card' | 'Cash' | 'Gift Card' | 'Other'): Promise<void> {
  await click(new RegExp(`^${method}( \\$|$)`), { scope: 'main' });
  await pause(900);
}

export type TipChoice = 'No Tip' | '10%' | '15%' | '20%' | '25%' | '30%';

/** On the customer display: pick a tip and press Continue (when the tip screen is up). */
export async function customerTip(choice: TipChoice): Promise<boolean> {
  const t = await customerText();
  if (!t.includes('Add a tip')) return false;
  await customerClick(choice);
  await pause(300);
  await customerClick('Continue');
  await pause(500);
  return true;
}

export { customerText };

export interface PayOutcome {
  result: 'success' | 'failed' | 'other';
  ms: number;
  text: string;
}

/**
 * Press Complete Payment (or an equivalent already-pressed state) and drive it to
 * an outcome: passcode, the customer tip screen, then Payment Successful / failed.
 */
export async function completePayment(
  tip: TipChoice = 'No Tip',
  timeout = 30_000,
  press = true,
): Promise<PayOutcome> {
  if (press) await click('Complete Payment', { scope: 'main' });
  const t0 = Date.now();
  let tipped = false;
  let text = '';
  while (Date.now() - t0 < timeout) {
    await pause(400);
    await passcodeIfPrompted();
    if (!tipped) tipped = await customerTip(tip).catch(() => false);
    text = await bodyText();
    if (text.includes('Payment Successful')) return { result: 'success', ms: Date.now() - t0, text };
    if (text.includes('Payment failed')) return { result: 'failed', ms: Date.now() - t0, text };
    if (text.includes('Input Gift Card Code')) return { result: 'other', ms: Date.now() - t0, text };
  }
  const cust = await customerText().catch(() => '');
  console.log(
    `[completePayment] no outcome after ${String(timeout)}ms. url=${await browser.getUrl()} staff: ${text.replace(/\s+/g, ' ').slice(0, 500)} | customer: ${cust.replace(/\s+/g, ' ').slice(0, 250)}`,
  );
  return { result: 'other', ms: Date.now() - t0, text };
}

export async function noReceipt(): Promise<void> {
  if (await exists('No Receipt')) await click('No Receipt');
  await pause(1500);
}

/** Pay the open checkout in cash with no tip; returns the order code. */
export async function payCash(): Promise<PayOutcome> {
  await pickMethod('Cash');
  return completePayment('No Tip');
}

/** Card charge on production — caller must have checked cardChargeAllowed(). */
export async function payCard(tip: TipChoice, timeout = 120_000): Promise<PayOutcome> {
  await pickMethod('Card');
  assertCardAmount(await methodCents('Card'));
  return completePayment(tip, timeout);
}

/** Delete a pending draft (Remove → passcode → Delete). Safe if it is already gone. */
export async function deleteDraft(code: string): Promise<void> {
  const o = await orderByCode(code).catch(() => null);
  if (!o || o.status !== 'pending') return;
  await go('/home', 2500);
  await click(code, { scope: 'main', any: true }).catch(() => undefined);
  await pause(1500);
  if (!(await mainText()).includes(`#${code}`)) {
    console.warn(`[cleanup] could not select draft ${code} — left as is`);
    return;
  }
  // An order that already took a payment shows "Cancel Order" instead of "Remove".
  if (!(await exists('Remove', 'main'))) {
    console.warn(`[cleanup] draft ${code} already has a payment — not deleted (finish or void it by hand)`);
    return;
  }
  await click('Remove', { scope: 'main' });
  await pause(1200);
  await passcodeIfPrompted();
  if (await exists('Delete Order')) await click('Delete', { scope: 'alert' });
  await pause(1500);
}

export async function openHistoryOrder(id: string): Promise<string> {
  // A direct /order-history/<id> load sometimes stays blank ("Loading …"): retry once,
  // then go through the Order History list (search by order code) like a cashier would.
  for (let attempt = 0; attempt < 2; attempt++) {
    await go(`/order-history/${id}`, 2500);
    for (let i = 0; i < 12; i++) {
      if (await exists('Order Information')) return mainText();
      await passcodeIfPrompted();
      await pause(1000);
    }
  }
  const row = await gql<{ orderList: { orderCode: string }[] }>(
    'query($id:String!){ orderList(where:{id:{eq:$id}}){ orderCode } }',
    { id },
  );
  const code = row.orderList[0]?.orderCode;
  if (!code) throw new Error(`openHistoryOrder: no order ${id}`);
  await go('/order-pending', 2000);
  await click('Order History', { scope: 'body', any: true });
  await pause(2000);
  await passcodeIfPrompted();
  await typeInto('Search order ID, customer name or phone', code);
  await pause(2000);
  await click(code, { scope: 'main', any: true });
  await waitText('Order Information', 15_000);
  return mainText();
}

// ── printing (no printer needed: read the ESC/POS the app sends) ────────────

const PRINT_CAPTURE = `
(() => {
  const w = window;
  if (!w.__qcPrints) {
    w.__qcPrints = [];
    const orig = w.fetch;
    w.fetch = function (url, opts) {
      try {
        const body = opts && opts.body;
        if (String(url).includes('ipc.localhost/graphql') && typeof body === 'string' && /mutation\\s+print\\b/.test(body)) {
          const parsed = JSON.parse(body);
          w.__qcPrints.push(String((parsed.variables && parsed.variables.data) || ''));
        }
      } catch (e) {}
      return orig.apply(this, arguments);
    };
  }
  w.__qcPrints.length = 0;
  w.__qcDecode = (b64) => {
    const s = atob(b64.trim());
    const raw = Uint8Array.from(s, (ch) => ch.charCodeAt(0));
    let out = '', i = 0;
    while (i < raw.length) {
      const b = raw[i], c = raw[i + 1];
      if (b === 0x1d && c === 0x76 && raw[i + 2] === 0x30) { const wd = raw[i + 4] + raw[i + 5] * 256, h = raw[i + 6] + raw[i + 7] * 256; i += 8 + wd * h; out += '[IMAGE]\\n'; continue; }
      if (b === 0x1b || b === 0x1d) { if (b === 0x1b && c === 0x40) i += 2; else if (b === 0x1d && c === 0x28) i += 5 + raw[i + 3] + raw[i + 4] * 256; else i += 3; continue; }
      if (b === 0x0a) out += '\\n'; else if (b >= 0x20 && b < 0x7f) out += String.fromCharCode(b);
      i += 1;
    }
    return out.split('\\n').filter((l) => l.trim() !== '').join('\\n');
  };
  return true;
})();`;

/** Arm the print capture, run `press`, return the decoded receipt text. */
export async function capturePrint(press: () => Promise<void>): Promise<string> {
  await browser.execute(PRINT_CAPTURE);
  await press();
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const got = await browser.execute(() => {
      const w = window as unknown as { __qcPrints: string[]; __qcDecode: (s: string) => string };
      return w.__qcPrints.length ? w.__qcDecode(w.__qcPrints[0] ?? '') : '';
    });
    if (got) return got;
    await pause(300);
  }
  throw new Error('Print pressed but no print job was sent');
}

/** Service lines between the 2nd "====" rule and the next "----" rule. */
export function receiptItems(text: string): { name: string; cents: number }[] {
  const lines = text.split('\n');
  const rules = lines.map((l, i) => (/^={10,}$/.test(l.trim()) ? i : -1)).filter((i) => i >= 0);
  const start = (rules[rules.length >= 3 ? 2 : 1] ?? -1) + 1;
  const end = lines.findIndex((l, i) => i >= start && /^-{10,}$/.test(l.trim()));
  return lines
    .slice(start, end)
    .map((l) => l.match(/^(.*\S)\s+\$([\d,.]+)$/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => ({ name: (m[1] ?? '').trim(), cents: money(m[2] ?? '0') }));
}

export function receiptAmount(text: string, label: string): number {
  const line = text.split('\n').find((l) => l.trim().startsWith(label));
  const m = line?.match(/\$([\d,.]+)\s*$/);
  return m?.[1] ? money(m[1]) : Number.NaN;
}

// ── split order ──────────────────────────────────────────────────────────────

export async function openSplit(orderId: string, method: 'Equally' | 'By Amount' = 'Equally'): Promise<void> {
  await go(`/order/${orderId}/split-order`, 3000);
  await click(method, { scope: 'main' });
  await pause(1200);
}

/** Pay check `n` of a split order with Cash or Other (optionally named). Returns the success popup text. */
export async function payCheck(
  code: string,
  n: number,
  method: 'Cash' | 'Other',
  otherName = '',
): Promise<string> {
  await click(`Select #${code}-${String(n)}`, { scope: 'main' }).catch(() => undefined);
  await pause(700);
  await click(method, { scope: 'main' });
  await pause(500);
  await click(/^Pay/, { scope: 'main', last: true });
  // Pay → passcode → customer tip screen → (Other name dialog) → "Check n Paid Successfully";
  // the order of the last steps varies, so drive whatever is on screen until paid.
  let named = false;
  const t0 = Date.now();
  while (Date.now() - t0 < 40_000) {
    await pause(500);
    await passcodeIfPrompted();
    await customerTip('No Tip').catch(() => false);
    if (/Check \d Paid Successfully/.test(await bodyText())) break;
    // Cash on 1.1.x opens an "Enter Amount" keypad first — confirm the pre-filled amount.
    if ((await dialogTexts()).some((t) => /Enter Amount/.test(t) && /Complete Check \d/.test(t))) {
      await click(/^Complete Check \d$/, { scope: 'dialog', last: true });
      continue;
    }
    if (
      method === 'Other' &&
      !named &&
      (await browser.execute(
        () => !!document.querySelector('input[placeholder="Input payment method name"]'),
      ))
    ) {
      if (otherName) await typeInto('Input payment method name', otherName);
      await click(/^Pay/, { scope: 'dialog', last: true });
      named = true;
    }
  }
  if (!(await waitText(/Check \d Paid Successfully/, 5000)))
    throw new Error(`payCheck ${String(n)}: never reached "Paid Successfully"`);
  const text = await bodyText();
  if (await exists('Continue Payment')) await click('Continue Payment', { scope: 'dialog', last: true });
  else if (await exists('All checks paid')) await click('Done', { scope: 'dialog', last: true });
  // Do not touch the next check until the "Paid Successfully" popup is really gone.
  for (let i = 0; i < 10; i++) {
    const open = (await dialogTexts()).some((t) => /Paid Successfully/.test(t));
    if (!open) break;
    if (i === 5) await browser.keys(['Escape']);
    await pause(500);
  }
  await pause(800);
  return text;
}

/** After every check is paid: press Complete, then No Receipt. */
export async function completeSplit(): Promise<string> {
  await click(/^Complete/, { scope: 'main' });
  await pause(2500);
  await passcodeIfPrompted();
  await waitText('Payment Successful', 20_000);
  const t = await bodyText();
  await noReceipt();
  return t;
}
