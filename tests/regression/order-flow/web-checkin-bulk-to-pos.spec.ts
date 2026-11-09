/**
 * WEB CHECK-IN BULK → POS sync — Phase B of the bulk GoCheckin load.
 *
 * Reads every check-in the bulk web lane (`tests/web/create-checkin-bulk.spec.ts`)
 * appended to `.tmp/web-checkin-bulk.json` and confirms each one surfaced on the
 * Volt POS **Pending Orders** screen.
 *
 * A pending card shows only the first two words of the name and a masked phone
 * (`***-***-0042`), so the match key is the name prefix `Bulk042 T12345` OR the
 * batch-unique last4. With 100+ cards the list scrolls; we walk every scrollable
 * container to its end and accumulate the text, in case the list virtualises.
 *
 * Polls until all are present or the sync window closes, then reports found vs
 * missing and fails listing the missing ones.
 *
 *   npm run test:checkin-bulk-to-pos
 *
 * READ-ONLY on the app: it only navigates, scrolls and reads.
 */

import { browser, expect } from '@wdio/globals';
import type { CheckinHandoff } from '../../../src/pages/web/CheckinKioskPage.js';
import { freshCheckinBulk } from '../../../src/support/web/webLane.js';
import { loadEnv } from '../../../configs/env/loadEnv.js';
import { Timeouts } from '../../../configs/constants/timeouts.js';
import { Routes } from '../../../src/constants/routes.js';
import { goTo } from '../../../src/helpers/navigate.js';
import { settle } from '../../../src/helpers/wait.js';

const env = loadEnv();
let batch: CheckinHandoff[] = [];

/** Scroll every scrollable element top→bottom, collecting innerText at each step. */
async function collectPendingText(): Promise<string> {
  await goTo(Routes.ORDER_PENDING).catch(() => undefined);
  await settle(Timeouts.ANIMATION);
  const chunks: string[] = [];
  for (let step = 0; step < 80; step += 1) {
    const { text, atEnd } = await browser.execute((i: number) => {
      const scrollers = Array.from(document.querySelectorAll<HTMLElement>('*')).filter(
        (el) => el.scrollHeight > el.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(el).overflowY),
      );
      let end = true;
      for (const el of scrollers) {
        if (i === 0) el.scrollTop = 0;
        else el.scrollTop += el.clientHeight * 0.8;
        if (el.scrollTop + el.clientHeight < el.scrollHeight - 4) end = false;
      }
      return { text: document.body.innerText, atEnd: end };
    }, step);
    chunks.push(text);
    if (atEnd && step > 0) break;
    await settle(250);
  }
  return chunks.join('\n');
}

describe('WEB CHECK-IN BULK → POS sync', function () {
  this.timeout(45 * 60_000); // suite-level: the before() below may build 18 GAP check-ins
  before(async function () {
    // Pending lists today's check-ins only: make today's batch on the GAP kiosk when
    // the saved one is older or missing (same batch VP-4823 uses).
    batch = await freshCheckinBulk(18);
    if (env.MERCHANT_ID !== env.WEB_MERCHANT_ID) {
      // eslint-disable-next-line no-console
      console.log(
        `[bulk-checkin] app MERCHANT_ID=${env.MERCHANT_ID} ≠ web ${env.WEB_MERCHANT_ID}; cannot sync. Skipping.`,
      );
      this.skip();
    }
  });

  it(`shows all bulk check-ins as pending orders`, async () => {
    const key = (name: string): string => name.split(' ').slice(0, 2).join(' ').toLowerCase();
    let missing = batch;

    const allListed = async (): Promise<boolean> => {
      const text = (await collectPendingText()).toLowerCase();
      missing = batch.filter((c) => !text.includes(key(c.name)) && !text.includes(`***-***-${c.last4}`));
      // eslint-disable-next-line no-console
      console.log(`[bulk-checkin] found ${batch.length - missing.length}/${batch.length} on /order-pending`);
      return missing.length === 0;
    };

    await browser
      .waitUntil(allListed, { timeout: Timeouts.APP_BOOT, interval: 5_000 })
      .catch(() => undefined);

    /* eslint-disable no-console */
    console.log(
      `[bulk-checkin] RESULT found=${batch.length - missing.length} missing=${missing.length} total=${batch.length}`,
    );
    for (const c of missing) console.log(`[bulk-checkin] MISSING ${c.name} ${c.phone} (${c.createdAtLabel})`);
    /* eslint-enable no-console */

    expect(missing.map((c) => c.name)).toEqual([]);
  });
});
