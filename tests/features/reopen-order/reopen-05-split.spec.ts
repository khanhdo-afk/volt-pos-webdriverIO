/**
 * VP-4067 — Re-Open an order settled by a split (Cash + Other) must owe nothing:
 * every payment tab reads $0.00 and Re-Open Done keeps the total (no odd cent to
 * pay a second time). Cash/Other only; the order is cancelled in `after`.
 */
import { expect } from '@wdio/globals';
import { profile } from '../../../src/features/policy.js';
import { completeSplit, openSplit, orderByCode, payCheck, reopen } from '../../../src/features/pos.js';
import {
  cancelOrder,
  checkoutQuote,
  newOrder,
  orderMoney,
  pickService,
  reopenDoneClean,
  type CatalogItem,
} from '../../../src/features/reopen.js';
import { itNeeds, noteSkip } from '../../../src/features/spec.js';

const d = profile().data;
let id = '';

describe(`[${profile().target}] Reopen — split Cash + Other owes nothing (VP-4067)`, () => {
  let svc: CatalogItem | undefined;
  before(async function () {
    svc = await pickService(4000);
    if (!svc) {
      noteSkip(this.test?.title ?? '', `store ${profile().store} has no active service ≥ $40`);
      this.skip();
    }
  });
  after(async () => {
    if (id) await cancelOrder(id).catch((e: Error) => console.warn(`[cleanup] ${e.message}`));
  });

  itNeeds(
    ['writes'],
    'RS-01 (VP-4067) Split Cash + Other, Re-Open: $0.00 on every tab, Re-Open Done keeps the total',
    async () => {
      const code = await newOrder(d.staffA, [(svc as CatalogItem).name]);
      id = (await orderByCode(code))?.id ?? '';
      await openSplit(id, 'Equally');
      await payCheck(code, 1, 'Cash');
      await payCheck(code, 2, 'Other', 'QC Other');
      await completeSplit();
      const before = await orderMoney(code);
      expect(before.status).toBe('successful');
      await reopen(id);
      const q = await checkoutQuote();
      console.log(`[RS-01] total ${String(before.total)} · reopen quote ${JSON.stringify(q)}`);
      expect(q.card).toBe(0);
      expect(q.cash).toBe(0);
      expect(q.other).toBe(0);
      await reopenDoneClean();
      const after = await orderMoney(code);
      expect(after.status).toBe('successful');
      expect(after.total).toBe(before.total);
    },
  );
});
