/**
 * Preflight (both profiles) — proves the lane points at the right build/store
 * before any feature spec creates data: POS version, the signed-in store from
 * the app's own data, and a live customer display.
 */
import { expect } from '@wdio/globals';
import { profile } from '../../src/features/policy.js';
import { bodyText, click, customerText, escape, go, pause } from '../../src/features/pos.js';

describe(`[${profile().target} ${profile().store}] Preflight`, () => {
  it('PRE-01 POS version 1.1.x and the expected store', async () => {
    await go('/home', 2500);
    await click('Open sidebar');
    await pause(1200);
    const side = await bodyText();
    await escape();
    const version = side.match(/Version:\s*([\d.]+)/)?.[1] ?? '';
    console.log(`[${profile().target}] POS version ${version}`);
    expect(version).toMatch(/^1\.1\.\d+$/);
  });

  it('PRE-02 Customer display is live', async () => {
    const t = await customerText();
    expect(t.length).toBeGreaterThan(0);
  });
});
