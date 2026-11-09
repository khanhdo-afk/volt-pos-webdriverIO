/**
 * Portal session for the automated runs — sign in ONCE, keep it for days.
 *
 *   npm run portal:auth        QR sign-in (GCI Business app), saved in .portal-profile/
 *   npm run portal:status      signed in? when do the refresh token / SSO session lapse?
 *   npm run portal:keepalive   keep the session warm (every PORTAL_KEEPALIVE_MIN, default 30)
 *
 * How the Portal session works (dev, read off the cookies 08/11/2026):
 * - `token` (access) lives 5 min, `fb_refresh_token` 8 h and is ROTATED on every use;
 * - `KEYCLOAK_SESSION` (auth.dev-fastboy.dev) lives a year.
 * So opening the Portal at least every few hours keeps it signed in, and even after a
 * long gap "Continue with GCI Business" signs back in without a QR (PortalCdp.ssoRelogin,
 * used automatically by every Portal step). A new QR is needed only when the SSO
 * session itself is revoked.
 */
import { env } from '../configs/env/loadEnv.js';
import { PortalCdp } from '../src/support/portal/PortalCdp.js';

const mode = process.argv[2] ?? 'status';
const settingsUrl = `${env.PORTAL_URL.replace(/\/$/, '')}/pos/nail/${env.WEB_MERCHANT_ID}/setting?tab=configuration`;
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function check(keepOpen = false): Promise<boolean> {
  const p = await new PortalCdp().start(settingsUrl);
  try {
    await p.goto(settingsUrl);
    await sleep(6_000);
    let ok = await p.isSignedIn();
    if (!ok) ok = await p.ssoRelogin();
    const s = await p.sessionInfo();
    const fmt = (d: Date | null): string => (d ? d.toLocaleString('vi-VN') : '—');
    console.log(
      `${new Date().toLocaleTimeString('vi-VN')}  Portal ${ok ? 'ĐÃ đăng nhập' : 'CHƯA đăng nhập'} | refresh token hết hạn: ${fmt(s.refreshExpires)} | SSO hết hạn: ${fmt(s.ssoExpires)}`,
    );
    if (!ok) console.log('  → chạy `npm run portal:auth` và quét QR bằng app GCI Business.');
    return ok;
  } finally {
    if (!keepOpen) await p.stop();
  }
}

if (mode === 'status') {
  process.exit((await check()) ? 0 : 1);
} else if (mode === 'keepalive') {
  const every = Number(process.env.PORTAL_KEEPALIVE_MIN ?? 30) * 60_000;
  for (;;) {
    await check().catch((e: Error) => console.log(`keepalive lỗi: ${e.message}`));
    await sleep(every);
  }
} else {
  console.log('usage: portal-session.ts status | keepalive');
}
