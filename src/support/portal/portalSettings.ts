import { join } from 'node:path';
import { browser } from '@wdio/globals';
import { LoyaltyService } from '../../api/index.js';
import { PortalPointConfigCdp, type PortalPointConfig } from '../../pages/web/PortalPointConfigCdp.js';
import { moduleLogger } from '../../utils/logger.js';
import { PortalCdp } from './PortalCdp.js';

const log = moduleLogger('portal-settings');

/** How long POS may take to pull a Portal change into its local `sys_setting`. */
const POS_SYNC_TIMEOUT = 180_000;

/**
 * "This test case needs THIS Portal setting" — for app-lane specs.
 *
 * Each case calls {@link ensure} with only the settings it depends on; the Portal is
 * opened (Edge on the signed-in `.portal-profile/`, over CDP, in the same run), the
 * card is changed and saved only when it differs, and the call returns once POS
 * itself reads the new value — so the very next POS step runs under it. The next
 * case calls `ensure` with its own settings, and so on.
 *
 * The first `ensure` snapshots what the Portal held; {@link restore} (in the
 * describe's `after`) puts it back, so a run never leaves the merchant changed.
 *
 * These are merchant-wide settings: tag specs that use this `Tag.EXCLUSIVE` so no
 * other spec runs against the merchant while it is flipped.
 */
export class PortalSettingsSession {
  private cdp: PortalCdp | null = null;
  private page: PortalPointConfigCdp | null = null;
  private original: PortalPointConfig | null = null;
  private signedIn: boolean | null = null;

  constructor(
    private readonly shotDir?: string,
    private readonly loyalty = new LoyaltyService(),
  ) {}

  /** Open the Portal once; false when the profile's session expired (run `npm run portal:login`). */
  async available(): Promise<boolean> {
    if (this.signedIn !== null) return this.signedIn;
    try {
      log.info('Portal: attaching to Edge (.portal-profile)…');
      this.cdp = await new PortalCdp().start();
      log.info('Portal: attached, opening Store Settings › Payment & transactions');
      this.page = new PortalPointConfigCdp(this.cdp);
      this.signedIn = await this.page.open();
      log.info(`Portal: signed in = ${String(this.signedIn)}`);
    } catch (error) {
      log.warn(`Portal unavailable: ${(error as Error).message}`);
      this.signedIn = false;
    }
    return this.signedIn;
  }

  /** Make the Portal hold `want` (only the keys given) and wait until POS reads it. */
  async ensure(want: Partial<PortalPointConfig>, shotName?: string): Promise<PortalPointConfig> {
    if (!(await this.available()) || !this.page)
      throw new Error(
        'Portal session missing/expired in .portal-profile/ — run `npm run portal:login` (QR once).',
      );
    await this.page.open();
    const before = await this.page.read();
    this.original ??= before;
    const after = await this.page.set(want);
    log.info(`Portal ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
    if (shotName && this.shotDir && this.cdp) {
      await this.page.scrollToCard();
      await this.cdp.screenshot(join(this.shotDir, `${shotName}.png`));
    }
    await this.waitPosReads(want);
    return after;
  }

  /** Put back what the Portal held before the first `ensure`, wait for POS, close Edge. */
  async restore(): Promise<void> {
    try {
      if (this.original && this.page) {
        await this.page.open();
        await this.page.set(this.original);
        await this.waitPosReads(this.original);
        log.info(`Portal restored to ${JSON.stringify(this.original)}`);
      }
    } finally {
      await this.cdp?.stop().catch(() => undefined);
      this.cdp = null;
      this.page = null;
      this.signedIn = null;
      this.original = null;
    }
  }

  private async waitPosReads(want: Partial<PortalPointConfig>): Promise<void> {
    let last = '';
    await browser.waitUntil(
      async () => {
        const s = await this.loyalty.pointSetting();
        last = JSON.stringify({ checkoutType: s.checkoutType, earnOnTip: s.earnOnTip });
        return (
          (want.checkoutType === undefined || s.checkoutType === want.checkoutType) &&
          (want.earnOnTip === undefined || s.earnOnTip === want.earnOnTip)
        );
      },
      {
        timeout: POS_SYNC_TIMEOUT,
        interval: 3_000,
        timeoutMsg: `POS never read ${JSON.stringify(want)} from the Portal (last read ${last})`,
      },
    );
  }
}
