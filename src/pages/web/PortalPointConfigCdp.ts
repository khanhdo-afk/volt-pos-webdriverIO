import { loadEnv } from '../../../configs/env/loadEnv.js';
import type { PortalCdp } from '../../support/portal/PortalCdp.js';

const env = loadEnv();

/** Values of the Portal's "Checkout type" radios (= `merchant_point_payment_config.checkout_type`). */
export type PortalCheckoutType = 'payment_method' | 'auto_checkout' | 'hybrid_checkout';

export interface PortalPointConfig {
  checkoutType: PortalCheckoutType;
  earnOnTip: boolean;
}

/**
 * The card holding both settings: climb from the "Earn points on tip" label until the
 * box also holds the "Checkout type" radios. Returned as a JS expression body.
 */
const CARD = `
  const leaf = Array.from(document.querySelectorAll('body *')).find(
    (e) => e.children.length === 0 && (e.textContent || '').trim() === 'Earn points on tip');
  let card = leaf;
  while (card && !card.querySelector('[role="radio"][value="payment_method"]')) card = card.parentElement;
`;

const READ = `${CARD}
  if (!card) return null;
  const checked = card.querySelector('[role="radio"][aria-checked="true"]');
  const sw = card.querySelector('[role="switch"]');
  return {
    checkoutType: checked ? checked.getAttribute('value') : null,
    earnOnTip: sw ? sw.getAttribute('aria-checked') === 'true' : null,
  };`;

/**
 * Fastboy Portal › Store Settings › Payment & transactions › "Checkout setting" +
 * "Setting point config", driven through {@link PortalCdp} from an app-lane spec.
 * The Portal ships no data-testids: the card is found by its label text, the radios by
 * their `value`, the tip toggle by `role="switch"`.
 */
export class PortalPointConfigCdp {
  constructor(private readonly cdp: PortalCdp) {}

  get url(): string {
    return `${env.PORTAL_URL}/pos/nail/${env.PORTAL_MERCHANT_ID}/setting?tab=payment-transactions`;
  }

  /** Open the tab and wait for the stored values; false when the session is gone (/login). */
  async open(): Promise<boolean> {
    await this.cdp.goto(this.url);
    await this.cdp.waitFor(
      `if (location.pathname.includes('/login')) return true; const v = (() => { ${READ} })(); return !!v && !!v.checkoutType;`,
      30_000,
      'Portal login page or the Checkout setting card',
    );
    if (!(await this.cdp.isSignedIn())) return false;
    await new Promise((r) => setTimeout(r, 1_000)); // stored values land a beat after first paint
    return true;
  }

  async read(): Promise<PortalPointConfig> {
    const v = await this.cdp.eval<PortalPointConfig | null>(READ);
    if (!v) throw new Error('PortalPointConfigCdp: Checkout setting card not found');
    return v;
  }

  /** Bring the card into view (for screenshots). */
  async scrollToCard(): Promise<void> {
    await this.cdp.eval(`${CARD} if (card) card.scrollIntoView({ block: 'start' }); return true;`);
    await new Promise((r) => setTimeout(r, 400));
  }

  /**
   * Make the card read `want`, Save, reload and confirm the Portal stored it.
   * A no-op (no Save) when it already matches. Returns what the Portal reads after.
   */
  async set(want: Partial<PortalPointConfig>): Promise<PortalPointConfig> {
    const now = await this.read();
    const needType = want.checkoutType !== undefined && want.checkoutType !== now.checkoutType;
    const needTip = want.earnOnTip !== undefined && want.earnOnTip !== now.earnOnTip;
    if (!needType && !needTip) return now;

    if (needType) {
      await this.click(`card.querySelector('[role="radio"][value="${String(want.checkoutType)}"]')`);
    }
    if (needTip) await this.click(`card.querySelector('[role="switch"]')`);

    await this.cdp.waitFor(
      `return !!Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim() === 'Save' && !b.disabled);`,
      10_000,
      'an enabled Save button',
    );
    await this.cdp.eval(
      `Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim() === 'Save' && !b.disabled).click(); return true;`,
    );
    await this.cdp
      .waitFor(
        `return (document.body.innerText || '').includes('Point settings saved');`,
        15_000,
        '"Point settings saved" toast',
      )
      .catch(() => undefined); // the reload below is the real check

    await this.cdp.reload();
    await this.open();
    const after = await this.read();
    if (
      (want.checkoutType !== undefined && after.checkoutType !== want.checkoutType) ||
      (want.earnOnTip !== undefined && after.earnOnTip !== want.earnOnTip)
    ) {
      throw new Error(
        `PortalPointConfigCdp: wanted ${JSON.stringify(want)} but the Portal reads ${JSON.stringify(after)} after Save + reload`,
      );
    }
    return after;
  }

  private async click(selectorExpr: string): Promise<void> {
    const ok = await this.cdp.eval<boolean>(
      `${CARD} if (!card) return false; const el = ${selectorExpr}; if (!el) return false; el.scrollIntoView({ block: 'center' }); el.click(); return true;`,
    );
    if (!ok) throw new Error(`PortalPointConfigCdp: control not found (${selectorExpr})`);
    await new Promise((r) => setTimeout(r, 400));
  }
}
