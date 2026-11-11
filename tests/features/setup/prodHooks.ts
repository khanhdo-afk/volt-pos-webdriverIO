/**
 * Root hooks for the PRODUCTION lane only (dev/staging use tests/setup/rootHooks.ts).
 * Safety layer: right lane, staff window, no dialog left open, screenshot on
 * failure. No Portal baseline, no passcode grant, no device baseline, no kills.
 */
import path from 'node:path';
import { browser } from '@wdio/globals';
import { Paths } from '../../../configs/constants/paths.js';
import { switchToMain } from '../../../src/helpers/window.js';
import { assertLane, cardPendingReason } from '../../../src/features/policy.js';
import { discoverStoreData, signedInStore } from '../../../src/features/discover.js';

export const mochaHooks = {
  async beforeAll(): Promise<void> {
    const p = assertLane();
    await switchToMain();
    // The device must be signed in to the store this run targets — never test the wrong merchant.
    const s = await signedInStore();
    if (s.id !== p.store) {
      throw new Error(
        `The app is signed in to store ${s.id} (${s.name}) but this run targets STORE_ID=${p.store}.`,
      );
    }
    const d = await discoverStoreData();
    console.log(
      `[${p.target} ${p.store} ${s.name}] ${p.data.readOnly ? 'READ-ONLY store' : 'writes allowed'} · staff ${d.staffA}/${d.staffB} · ` +
        `cheap ${d.cheap}/${d.cheap2}/${d.cheap3} · $25 ${d.svc25}/${d.svc25b} · customers ${d.customer}/${d.customer2} · ` +
        `gift card ${d.giftCardActive ? '…' + d.giftCardActive.slice(-4) : '-'}`,
    );
    const card = cardPendingReason();
    console.log(
      `[${p.target} ${p.store}] ${card || 'Card charges ENABLED for this run (real money, capped).'}`,
    );
  },
  async afterEach(this: Mocha.Context): Promise<void> {
    const t = this.currentTest;
    if (t?.state === 'failed') {
      const file = path.join(Paths.SCREENSHOTS, `prod-${t.title.replace(/[^\w-]+/g, '_').slice(0, 80)}.png`);
      await browser.saveScreenshot(file).catch(() => undefined);
    }
    await switchToMain().catch(() => undefined);
    for (let i = 0; i < 2; i++) await browser.keys(['Escape']).catch(() => undefined);
  },
};
