/**
 * VP-5183 — on Windows the Tauri asset protocol refused every `ObjectFiles`
 * path (HTTP 403, log "asset protocol not configured to allow the path"), so
 * the store logo, store brand, receipt signature and staff avatars never
 * loaded and receipts could print without a logo. Retested PASS on dev 1.1.115.
 *
 * docs/qc/volt-qc/vp-tickets/VP-5183-asset-protocol-objectfiles-images-test-cases.md (TC-VP5183-01..10)
 *
 *   npm run test:spec -- tests/regression/settings/vp-5183-objectfiles-images.spec.ts
 *
 * Read-only apart from TC-03, which presses Print on the newest Order History
 * receipt (no printer: the payload is captured, the app toasts "Printer not
 * connected"). TC-10 kills and relaunches the app — do not run while another
 * session drives the same app. Test data: see vp-5183.helpers.ts. dev only.
 */

import { expect } from '@wdio/globals';
import { Routes } from '../../../src/constants/routes.js';
import { VpReceiptSf as R } from '../../../src/constants/testids.vp-receipt-sf.js';
import { Vp5183 as I } from '../../../src/constants/testids.vp-5183.js';
import { returnToHome } from '../../../src/flows/index.js';
import { switchToMain } from '../../../src/helpers/window.js';
import businessInfoPage from '../../../src/pages/settings/BusinessInfoPage.js';
import { app } from '../../../src/pages/voltqc/cd-e2e/cdApp.js';
import { voltQcProbe as P } from '../../../src/pages/voltqc/pos/VoltQcProbe.js';
import { Tag, title } from '../../../src/types/testTags.js';
import { capturePrint } from '../checkout/vp-5634.helpers.js';
import { ensure } from '../volt-qc/cd-e2e/cd-e2e.helpers.js';
import { openReceiptDialog, openReceiptSettings } from './vp-4390.helpers.js';
import { relaunchApp } from './vp-5685.helpers.js';
import {
  assetRefusalsInLog,
  fetchAssets,
  loadedFromAsset,
  objectFilesPath,
  pathVariants,
  scrollIntoView,
  vp5183,
  waitAssetImages,
} from './vp-5183.helpers.js';

describe('VP-5183 — ObjectFiles images load through the asset protocol', () => {
  /** Refusal lines already in today's log before this spec ran (null = no log file). */
  let refusalsBefore: number | null = null;

  before(async () => {
    await switchToMain();
    await returnToHome();
    refusalsBefore = assetRefusalsInLog();
  });

  afterEach(async () => {
    await switchToMain().catch(() => undefined);
    await app.closeStrayDialogs().catch(() => undefined);
  });

  after(async () => {
    await returnToHome().catch(() => undefined);
  });

  describe('1. Asset protocol', () => {
    it(
      title(
        'TC-VP5183-01: ObjectFiles files are served (200) for mixed, all-backslash and all-slash paths',
        Tag.REGRESSION,
        Tag.CRITICAL,
      ),
      async () => {
        const base = await objectFilesPath();
        ensure(/ObjectFiles/i.test(base), `objectFilesPath looks wrong: "${base}"`);
        const results = await fetchAssets(vp5183.files.flatMap((f) => pathVariants(base, f)));

        const bad = results.filter(
          (r) => r.status !== 200 || !r.contentType.startsWith('image/') || r.bytes === 0,
        );
        expect(
          bad.map((r) => `${r.label}: ${String(r.status)} ${r.contentType} ${String(r.bytes)}B ${r.error}`),
        ).toEqual([]);
        expect(results).toHaveLength(vp5183.files.length * 3);
      },
    );
  });

  describe('2. Store logo, store brand, signature', () => {
    it(
      title('TC-VP5183-02: Settings → Receipt Preview shows the business logo', Tag.REGRESSION),
      async () => {
        await openReceiptSettings();
        const imgs = await waitAssetImages(I.businessLogo);
        expect(imgs.length).toBeGreaterThan(0);
        expect(imgs.filter(loadedFromAsset).length).toBeGreaterThan(0);
      },
    );

    it(
      title(
        'TC-VP5183-03: the printed receipt starts with the logo image and Receipt Details shows it',
        Tag.REGRESSION,
        Tag.WRITE,
      ),
      async function () {
        this.timeout(3 * 60_000);
        const { code } = await openReceiptDialog();
        ensure(code !== '', 'no order in Order History to print');

        const dialogLogo = await waitAssetImages(I.dialogLogo);
        expect(dialogLogo.filter(loadedFromAsset).length).toBeGreaterThan(0);

        const receipt = await capturePrint(() => P.clickQ(R.receiptDialogPrint));
        const firstText = receipt.lines.findIndex((l) => l !== '[IMAGE]');
        expect(receipt.lines[0]).toBe('[IMAGE]');
        expect(firstText).toBeGreaterThan(0);
      },
    );

    it(
      title('TC-VP5183-04: Receipt Details of a signed Card order shows the signature', Tag.REGRESSION),
      async function () {
        this.timeout(2 * 60_000);
        await openReceiptDialog(vp5183.signedOrder);
        await scrollIntoView(I.signature);
        const sig = await waitAssetImages(I.signature);
        ensure(
          sig.length > 0,
          `order ${vp5183.signedOrder} has no signature on its receipt — set VP5183_SIGNED_ORDER`,
        );
        expect(sig.filter(loadedFromAsset).length).toBe(sig.length);
      },
    );

    it(
      title(
        'TC-VP5183-05: Settings → Business Info → Store Brand shows the store logo and cover photo',
        Tag.REGRESSION,
      ),
      async () => {
        await switchToMain();
        await app.go(Routes.SETTINGS_BUSINESS);
        await businessInfoPage.waitForForm();
        await scrollIntoView(I.storeBrandPreview);
        const imgs = await waitAssetImages(I.storeBrandPreview, 2);
        expect(imgs.filter(loadedFromAsset).length).toBe(2);
      },
    );
  });

  describe('3. Staff avatars', () => {
    it(
      title('TC-VP5183-06: Home staff tile shows the staff avatar', Tag.REGRESSION, Tag.CRITICAL),
      async () => {
        await returnToHome();
        const css = I.staffAvatar(vp5183.avatarStaff);
        await scrollIntoView(css);
        const imgs = await waitAssetImages(css);
        ensure(
          imgs.length > 0,
          `no avatar <img> for "${vp5183.avatarStaff}" on Home — set VP5183_AVATAR_STAFF`,
        );
        expect(imgs.filter(loadedFromAsset).length).toBeGreaterThan(0);
      },
    );

    it.skip(
      title(
        'TC-VP5183-08: Staff Payroll / Staff Income show the avatar — PENDING (report has no avatar, out of scope; manual)',
        Tag.REGRESSION,
      ),
      () => undefined,
    );

    it.skip(
      title(
        'TC-VP5183-09: Time Tracking avatar — BLOCKED (1.1.115: Time Tracking freezes on +, Search staff or the date preset; VP-6823)',
        Tag.REGRESSION,
      ),
      () => undefined,
    );
  });

  describe('4. Log and restart', () => {
    it(
      title(
        'TC-VP5183-07: no "asset protocol not configured to allow the path" line was logged while the screens loaded',
        Tag.REGRESSION,
      ),
      function () {
        const after = assetRefusalsInLog();
        if (after === null || refusalsBefore === null) {
          // Debug build (stdout) or the app runs on another machine: nothing to read.
          this.skip();
          return;
        }
        expect(after - refusalsBefore).toBe(0);
      },
    );

    it(
      title(
        'TC-VP5183-10: after a relaunch with a saved login, the logo and avatar still load and nothing is refused',
        Tag.REGRESSION,
        Tag.CRITICAL,
      ),
      async function () {
        this.timeout(5 * 60_000);
        const before = assetRefusalsInLog();
        // Kill + start again: the boot path with saved credentials (no login),
        // where the report suspected the splash `Configuration` step is skipped.
        await relaunchApp();

        await openReceiptSettings();
        expect((await waitAssetImages(I.businessLogo)).filter(loadedFromAsset).length).toBeGreaterThan(0);

        await returnToHome();
        const css = I.staffAvatar(vp5183.avatarStaff);
        await scrollIntoView(css);
        expect((await waitAssetImages(css)).filter(loadedFromAsset).length).toBeGreaterThan(0);

        const base = await objectFilesPath();
        const fetched = await fetchAssets(vp5183.files.map((f) => ({ label: f, path: `${base}/${f}` })));
        expect(fetched.filter((r) => r.status !== 200).map((r) => `${r.label}: ${String(r.status)}`)).toEqual(
          [],
        );

        const after = assetRefusalsInLog();
        if (before !== null && after !== null) expect(after - before).toBe(0);
      },
    );
  });
});
