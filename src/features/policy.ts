/**
 * Run-time policy for feature specs, built on the active profile
 * (configs/profiles). This is where staging and production differ in what a
 * spec may DO; the specs themselves are shared.
 *
 * Production rules:
 *   - lane pinned to ENV=prod + STORE_ID (any store; the app must be signed in to it)
 *     + attach mode, never resets/relaunches; read-only stores get no writes;
 *   - Cash / Other / gift-card orders on the cheap test services are allowed;
 *   - store settings may be changed only if the spec restores them;
 *   - CARD moves real money: only when the operator confirmed, for this run,
 *     PROD_CARD_GATEWAY=connected AND PROD_CARD_REAL_MONEY=confirmed, and every
 *     charge ≤ profile.cardMaxCents (≤ $0.50). Otherwise the card TC is SKIPPED.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Paths } from '../../configs/constants/paths.js';
import { loadEnv } from '../../configs/env/loadEnv.js';
import { type Capability, type Profile, profile } from '../../configs/profiles/index.js';

export { profile };
export type { Capability, Profile };

/** Throws unless the process runs the profile it claims (backend + store + mode). */
export function assertLane(): Profile {
  const p = profile();
  const env = loadEnv();
  if (env.ENV !== p.env) throw new Error(`${p.target} profile needs ENV=${p.env} (got ENV=${env.ENV}).`);
  if (env.UPSTREAM_BASE_URI !== p.backend) {
    throw new Error(`${p.target} profile expects backend ${p.backend}, env says ${env.UPSTREAM_BASE_URI}.`);
  }
  // MERCHANT_ID comes from .env.<env>.<store> or the run wrapper; the store the APP is
  // signed in to is checked against STORE_ID in the root before-all (signedInStore()).
  if (env.MERCHANT_ID !== p.store && process.env.MERCHANT_ID !== p.store) {
    throw new Error(`MERCHANT_ID=${env.MERCHANT_ID} but ${p.target} store is ${p.store}.`);
  }
  if (p.attachOnly && env.MODE !== 'attach')
    throw new Error(`${p.target} runs attach-only (WDIO_MODE=attach).`);
  return p;
}

/** '' when the capability is allowed on this run, otherwise the skip reason. */
export function deniedReason(cap: Capability): string {
  const p = profile();
  if (!p.allows[cap]) return `${cap} is not allowed on ${p.target}.`;
  if (cap === 'writes' && !loadEnv().WRITE_ALLOWED) return `writes disabled for this run (ENV=${p.env}).`;
  if (cap === 'card' && p.target === 'production') return cardPendingReason();
  return '';
}

export function cardPendingReason(): string {
  if (profile().target !== 'production') return '';
  const e = process.env;
  const missing: string[] = [];
  if (e.PROD_CARD_GATEWAY !== 'connected') missing.push('PROD_CARD_GATEWAY=connected');
  if (e.PROD_CARD_REAL_MONEY !== 'confirmed') missing.push('PROD_CARD_REAL_MONEY=confirmed');
  if (!missing.length) return '';
  return (
    'PENDING Card — production charges REAL money. Ask the operator to confirm the terminal is connected ' +
    `to the production gateway and real money may be charged, then rerun with ${missing.join(' + ')}.`
  );
}

/** Refuse a card charge above the profile's per-transaction cap (cents). */
export function assertCardAmount(cents: number): void {
  const max = profile().cardMaxCents;
  if (!Number.isFinite(cents) || cents <= 0 || cents > max) {
    throw new Error(
      `Refusing to charge ${String(cents)}¢ on ${profile().target}: cap is ${String(max)}¢ per transaction.`,
    );
  }
}

/**
 * Owner passcode of THIS store — only from the store's own env file / env var.
 * No default: a guessed passcode typed into a real store's till is never acceptable.
 */
export const passcode = (): string => {
  const p = profile();
  const own =
    fs.existsSync(path.join(Paths.ENV_DIR, `.env.${p.env}.${p.store}`)) || !!process.env.OWNER_PASSCODE;
  return own ? loadEnv().OWNER_PASSCODE : '';
};
