/**
 * Re-Open helpers for the feature lane (staging + production share them).
 *
 * Everything locates by visible text, reads money back through the app's own
 * local GraphQL, and computes expectations from the STORE'S OWN rates
 * (Service Fee %, Cash Discount %, tax %) — never from hard-coded prices — so the
 * same spec runs on any store (2949 has SF 10% / CD 10% / tax 10%, 20258 differs).
 */
import { browser } from '@wdio/globals';
import {
  bodyText,
  buildOrder,
  click,
  completePayment,
  dialogTexts,
  exists,
  go,
  gql,
  mainText,
  money,
  noReceipt,
  passcodeIfPrompted,
  pause,
  pickMethod,
  selectStaff,
  typeInto,
  waitText,
} from './pos.js';

// ── store rates ──────────────────────────────────────────────────────────────

export interface StoreRates {
  /** Service fee %, cash discount %, product tax %, service tax % (as saved on the merchant). */
  sf: number;
  cd: number;
  productTax: number;
  serviceTax: number;
}

export async function storeRates(): Promise<StoreRates> {
  const d = await gql<{
    merchantSettingList: {
      serviceFeePercentage: number | null;
      cashDiscountPercentage: number | null;
      taxPercentage: number | null;
    }[];
    sysSettingList: { key: string; value: string | null }[];
  }>(
    'query{ merchantSettingList{ serviceFeePercentage cashDiscountPercentage taxPercentage } sysSettingList(where:{key:{eq:"merchant_service_tax_percentage"}}){ key value } }',
  );
  const m = d.merchantSettingList[0];
  const st = Number(d.sysSettingList[0]?.value ?? 0);
  return {
    sf: Number(m?.serviceFeePercentage ?? 0),
    cd: Number(m?.cashDiscountPercentage ?? 0),
    productTax: Number(m?.taxPercentage ?? 0),
    serviceTax: Number.isFinite(st) ? st : 0,
  };
}

const r2 = (x: number): number => Math.round(x + 1e-9);

/**
 * What the till should quote for an ADDED amount `cents` (one item kind):
 * Card = (Δ + SF) + tax(Δ + SF);  Cash/Other = (Δ + SF − CD) + tax(that).
 * Formula from docs 10-service-fee.md / VP-4012 (tax base = net + service fee).
 */
export function expectedQuote(
  cents: number,
  rates: StoreRates,
  kind: 'service' | 'product',
): { card: number; cash: number } {
  const taxPct = kind === 'service' ? rates.serviceTax : rates.productTax;
  const sf = r2((cents * rates.sf) / 100);
  const cardBase = cents + sf;
  const card = cardBase + r2((cardBase * taxPct) / 100);
  const cashBase = cardBase - r2((cents * rates.cd) / 100);
  const cash = cashBase + r2((cashBase * taxPct) / 100);
  return { card, cash };
}

/** Amounts on the payment-method buttons of the open checkout (cents). */
export async function checkoutQuote(): Promise<{
  card: number;
  cash: number;
  other: number;
  giftCard: number | null;
}> {
  const t = await mainText();
  const get = (m: string): number | null => {
    const r = t.match(new RegExp(`(?:^|\\n)${m}\\n\\$([\\d,.]+)`));
    return r?.[1] ? money(r[1]) : null;
  };
  return {
    card: get('Card') ?? Number.NaN,
    cash: get('Cash') ?? Number.NaN,
    other: get('Other') ?? Number.NaN,
    giftCard: get('Gift Card'),
  };
}

// ── catalogue ────────────────────────────────────────────────────────────────

export interface CatalogItem {
  name: string;
  cents: number;
  type: 'service' | 'product';
}

/** Active priced catalogue items from the till's DB, cheapest first. */
export async function catalog(): Promise<CatalogItem[]> {
  const d = await gql<{ serviceList: { name: string; price: number; type: string; status: string }[] }>(
    'query{ serviceList(limit: 2000){ name price type status } }',
  );
  return d.serviceList
    .filter((s) => s.status === 'active' && s.price > 0 && (s.type === 'service' || s.type === 'product'))
    .map((s) => ({ name: s.name, cents: s.price, type: s.type as 'service' | 'product' }))
    .sort((a, b) => a.cents - b.cents);
}

/** A service around `minCents` (≥) — big enough that a $1 / 1% formula error shows. Cash orders only. */
export async function pickService(minCents: number): Promise<CatalogItem | undefined> {
  return (await catalog()).find((c) => c.type === 'service' && c.cents >= minCents && !/gift/i.test(c.name));
}

export async function pickProduct(minCents = 1): Promise<CatalogItem | undefined> {
  return (await catalog()).find((c) => c.type === 'product' && c.cents >= minCents && !/gift/i.test(c.name));
}

/**
 * Add a catalogue item through the "Search service" box. Tiles may sit below the
 * fold or be truncated ("Gel Removal ...") — find the smallest priced tile in the
 * catalogue column whose first line is a prefix of `name`, then click it.
 */
export async function addItem(name: string): Promise<void> {
  await typeInto('Search service', name);
  await pause(1200);
  const ok = await browser.execute((n: string) => {
    document.querySelectorAll('[data-qc-tile]').forEach((e) => e.removeAttribute('data-qc-tile'));
    const W = window.innerWidth;
    const els = [...document.querySelectorAll('main *')].filter((e) => {
      const t = ((e as HTMLElement).innerText || '').trim();
      const r = e.getBoundingClientRect();
      if (r.width < 60 || r.height < 60 || r.left < W * 0.6 || r.top < 150) return false;
      const first = (t.split('\n')[0] ?? '').replace(/(\.\.\.|…)$/, '').trim();
      return first.length >= 3 && n.startsWith(first) && /\$\d/.test(t);
    });
    els.sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return ra.width * ra.height - rb.width * rb.height;
    });
    const e = els[0];
    if (!e) return false;
    e.setAttribute('data-qc-tile', '1');
    return true;
  }, name);
  if (!ok) throw new Error(`addItem: no catalogue tile for "${name}"`);
  await browser.$('[data-qc-tile="1"]').click();
  await pause(900);
  // Clear the search so the next item (and the cart) see the full grid again.
  const box = browser.$('input[placeholder="Search service"]');
  if (await box.isExisting()) {
    await box.click().catch(() => undefined);
    await browser.keys(['Control', 'a']);
    await browser.keys(['Backspace']);
  }
  await pause(500);
}

/** New order (Quick Checkout) for `staff` with `items` added through the search box; returns its code. */
export async function newOrder(staff: string, items: string[]): Promise<string> {
  const code = await buildOrder([[staff, []]]);
  for (const i of items) await addItem(i);
  return code;
}

export async function addLinesBySearch(staff: string, items: string[]): Promise<void> {
  await selectStaff(staff);
  for (const i of items) await addItem(i);
}

// ── gift card top-up ─────────────────────────────────────────────────────────

/** Home → Gift Card tile → enter an ACTIVE card → pick $25/$50/$100 → Add (a top-up line). */
export async function addGiftCardTopUp(code: string, amount: '$25' | '$50' | '$100' = '$25'): Promise<void> {
  await click('Gift Card', { scope: 'main', any: true });
  await pause(1500);
  await typeInto('Enter gift card code', code, true);
  await pause(2500);
  const dlg = (await dialogTexts()).join('\n');
  if (/Invalid gift card number/.test(dlg)) throw new Error(`gift card ${code} is not valid on this store`);
  await click(amount, { scope: 'dialog', any: true });
  await pause(700);
  await click('Add', { scope: 'dialog' });
  await pause(2500);
}

export interface GiftCardMove {
  type: string;
  change: number;
  after: number;
  orderId: string | null;
  at: string;
}

/** Balance history of one gift card, oldest first. */
export async function giftCardHistory(code: string): Promise<{ balance: number; moves: GiftCardMove[] }> {
  const gc = await gql<{ giftCardList: { id: string; currentBalance: number }[] }>(
    'query($c:String!){ giftCardList(where:{code:{eq:$c}}){ id currentBalance } }',
    { c: code },
  );
  const card = gc.giftCardList[0];
  if (!card) throw new Error(`gift card ${code} not in the till`);
  const h = await gql<{
    giftCardHistoryList: {
      type: string;
      balanceChange: number;
      balanceAfter: number;
      orderId: string | null;
      createdAt: string;
    }[];
  }>(
    'query($id:String!){ giftCardHistoryList(limit: 5000, where:{giftCardId:{eq:$id}}){ type balanceChange balanceAfter orderId createdAt } }',
    { id: card.id },
  );
  const moves = h.giftCardHistoryList
    .map((x) => ({
      type: x.type,
      change: x.balanceChange,
      after: x.balanceAfter,
      orderId: x.orderId,
      at: x.createdAt,
    }))
    .sort((a, b) => a.at.localeCompare(b.at));
  return { balance: card.currentBalance, moves };
}

// ── re-open editing ──────────────────────────────────────────────────────────

/** In reopen checkout/home: open the item editor (header "Edit Order"). */
export async function editOrder(): Promise<void> {
  await click('Edit Order', { scope: 'header' }).catch(() => click('Edit Order'));
  await pause(2500);
  await passcodeIfPrompted();
}

/** Cart → Pay (reopen editor) → passcode as needed; returns the void-all prompt text if one appears. */
export async function payFromEditor(): Promise<string> {
  await click('Pay', { scope: 'main' });
  await pause(2500);
  await passcodeIfPrompted();
  const d = (await dialogTexts()).join('\n');
  return /Void Order Transactions/.test(d) ? d : '';
}

/** Confirm the "Void Order Transactions" popup and wait until Total Paid is back to $0.00. */
export async function confirmVoidAll(): Promise<void> {
  await click('Confirm Void', { scope: 'body', last: true });
  await pause(1500);
  await passcodeIfPrompted();
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (/Total Paid\n\$0\.00/.test(await mainText())) return;
    await pause(1000);
  }
  throw new Error('Void All: Total Paid never returned to $0.00');
}

/** Item discount of `cents` ($ mode) on the cart line `service` (reopen editor or Home). */
export async function lineDiscount(service: string, cents: number): Promise<void> {
  const ok = await browser.execute((n: string) => {
    document.querySelectorAll('[data-qc-line]').forEach((e) => e.removeAttribute('data-qc-line'));
    const W = window.innerWidth;
    const hit = [...document.querySelectorAll('main *')].find((e) => {
      const r = e.getBoundingClientRect();
      return (
        e.childElementCount === 0 &&
        e.textContent?.trim() === n &&
        r.left > W * 0.33 &&
        r.left < W * 0.62 &&
        r.width > 0
      );
    });
    if (!hit) return false;
    hit.setAttribute('data-qc-line', '1');
    return true;
  }, service);
  if (!ok) throw new Error(`lineDiscount: no cart line "${service}"`);
  await browser.$('[data-qc-line="1"]').click();
  await pause(1500);
  await browser.execute(() => {
    const d = [...document.querySelectorAll('[role=dialog]')].pop();
    (d?.querySelector('[role=switch]') as HTMLElement | null)?.click();
  });
  await pause(700);
  await browser.execute(() => {
    const d = [...document.querySelectorAll('[role=dialog]')].pop();
    const b = d
      ? [...d.querySelectorAll('button')].find((x) => (x as HTMLElement).innerText.trim() === '$')
      : undefined;
    (b as HTMLElement | undefined)?.click();
  });
  await pause(500);
  // The discount box is the last plain text input of the dialog (price + note come first).
  const inputs = await browser.$$('[role=dialog] input[type="text"]').getElements();
  const box = inputs[inputs.length - 1];
  if (!box) throw new Error('lineDiscount: no discount input');
  await box.click();
  await browser.keys(['Control', 'a']);
  await browser.keys(['Backspace']);
  await browser.keys(String(cents).split(''));
  await pause(700);
  await click('Save', { scope: 'dialog' });
  await pause(1500);
}

/** Reopen editor: "Change Staff" on the first staff group → pick `to` → Confirm. */
export async function changeStaff(to: string): Promise<void> {
  await click('Change Staff', { scope: 'main' });
  await pause(1200);
  await click(to, { scope: 'main', any: true });
  await pause(1200);
  if (await exists('This action will update the staff'))
    await click('Confirm', { scope: 'body', last: true });
  await pause(1500);
}

/** Pay the open checkout with Cash (no tip) and close the receipt prompt. */
export async function settleCash(): Promise<void> {
  await pickMethod('Cash');
  const out = await completePayment('No Tip');
  if (out.result !== 'success') throw new Error(`cash payment did not succeed: ${out.text.slice(0, 200)}`);
  await noReceipt();
}

/** "Re-Open Done" on a reopen checkout that owes nothing. */
export async function reopenDoneClean(): Promise<void> {
  await click('Re-Open Done', { scope: 'main' });
  await pause(2500);
  await passcodeIfPrompted();
  await completePayment('No Tip', 15_000, false).catch(() => undefined);
  await noReceipt();
}

// ── order data ───────────────────────────────────────────────────────────────

export interface OrderMoney {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  customerId: string | null;
  pointBonus: number | null;
  userInput: Record<string, unknown>;
}

export async function orderMoney(code: string): Promise<OrderMoney> {
  const d = await gql<{ orderList: (Omit<OrderMoney, 'userInput'> & { userInput: string | null })[] }>(
    'query($c:String!){ orderList(where:{orderCode:{eq:$c}}){ id status total subtotal taxAmount customerId pointBonus userInput } }',
    { c: code },
  );
  const o = d.orderList[0];
  if (!o) throw new Error(`order ${code} not found`);
  let ui: Record<string, unknown> = {};
  try {
    ui = JSON.parse(o.userInput ?? '{}') as Record<string, unknown>;
  } catch {
    /* keep {} */
  }
  return { ...o, userInput: ui };
}

/** Payment rows as Order History shows them: method, amount (cents), status. */
export async function paymentRows(): Promise<{ method: string; cents: number; status: string }[]> {
  const t = (await mainText()).split('Payment Details')[1]?.split('Order Note')[0] ?? '';
  const rows: { method: string; cents: number; status: string }[] = [];
  const re =
    /(Card|Cash|Other|Gift Card|-)\s*-?\s*\n[^\n]*\n(?:[\s\S]*?)(Successful|Voided|Refunded|Failed)\n\$([\d,.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) rows.push({ method: m[1] ?? '', cents: money(m[3] ?? '0'), status: m[2] ?? '' });
  return rows;
}

/** Cancel a completed test order from Order History (Cancel Order → passcode → reason → Confirm Cancel). */
export async function cancelOrder(id: string): Promise<void> {
  await go(`/order-history/${id}`, 2500);
  // The Order History passcode gate can come up after go() already looked for it.
  for (let i = 0; i < 10 && !(await exists('Order Information')); i++) {
    await passcodeIfPrompted();
    await pause(1000);
  }
  if (!(await waitText('Cancel Order', 10_000, 'main'))) {
    console.warn(`[cleanup] order ${id}: no Cancel Order button (already cancelled?)`);
    return;
  }
  await click('Cancel Order', { scope: 'main' });
  await pause(1500);
  await passcodeIfPrompted();
  // The reason picker is a Radix select: its trigger and options render outside role=dialog.
  await click('Select cancellation reason', { scope: 'body', any: true });
  await pause(800);
  await click(/^(Staff mistake|Other)$/, { scope: 'body' });
  await pause(500);
  await click('Confirm Cancel', { scope: 'body', last: true });
  await pause(4000);
}

/** Wait until `pred` holds on the customer row (sync from the server takes seconds to a minute). */
export async function customerRow(name: string): Promise<{ points: number; visits: number } | null> {
  const d = await gql<{ customerList: { pointBalance: number | null; visitCount: number | null }[] }>(
    'query($n:String!){ customerList(where:{name:{eq:$n}}){ pointBalance visitCount } }',
    { n: name },
  );
  const c = d.customerList[0];
  return c ? { points: c.pointBalance ?? 0, visits: c.visitCount ?? 0 } : null;
}

export async function bodyHas(re: RegExp): Promise<boolean> {
  return re.test(await bodyText());
}
