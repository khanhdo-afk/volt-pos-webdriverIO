import { loadEnv } from '../../../configs/env/loadEnv.js';
import type { PortalCdp } from '../../support/portal/PortalCdp.js';
import {
  compensationGroupOf,
  resolveField,
  type FieldSpec,
  type PortalTab,
  type PortalValue,
} from '../../support/portal/portalStoreFields.js';

const env = loadEnv();

/** A tab is ready once this control has rendered with its stored value. */
const TAB_ANCHOR: Record<PortalTab, string> = {
  'payment-transactions': 'serviceFeePercentage',
  configuration: 'turnValue',
};

const byId = (id: string) => `document.getElementById(${JSON.stringify(id)})`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Fastboy Portal › Store Settings, every card, driven over CDP from an app-lane spec.
 *
 * One generic reader/writer keyed by {@link FieldSpec}: the Portal gives each control
 * a stable id, so nothing here is per-card. Edits on a tab are collected and saved
 * with the tab's sticky **Save** bar, then the tab is reloaded and every value
 * re-read — a save the backend rejected fails loudly instead of passing silently.
 */
export class PortalStoreSettingsCdp {
  private current: PortalTab | null = null;
  /** Did the last {@link set} actually Save anything (false = already matched)? */
  lastSaved = false;

  constructor(private readonly cdp: PortalCdp) {}

  url(tab: PortalTab): string {
    return `${env.PORTAL_URL}/pos/nail/${env.PORTAL_MERCHANT_ID}/setting?tab=${tab}`;
  }

  /** Open `tab` (discarding any unsaved edit) and wait for stored values; false = signed out. */
  async open(tab: PortalTab, force = false): Promise<boolean> {
    if (!force && this.current === tab && (await this.onTab(tab))) return true;
    await this.discard();
    await this.cdp.goto(this.url(tab));
    const ready = `if (location.pathname.includes('/login')) return true;
       const a = ${byId(TAB_ANCHOR[tab])}; return !!a && a.value !== '';`;
    try {
      await this.cdp.waitFor(ready, 30_000, `Portal ${tab} tab`);
    } catch {
      // The SPA occasionally sits on a blank shell after a long idle (seen 09/11
      // 02:28: readyState complete, no controls) — one hard reload brings it back.
      await this.cdp.reload();
      await this.cdp.waitFor(ready, 30_000, `Portal ${tab} tab (after reload)`);
    }
    if (!(await this.cdp.isSignedIn())) {
      // Refresh token lapsed: the year-long SSO session signs back in without a QR.
      if (!(await this.cdp.ssoRelogin())) return false;
      return this.open(tab, true);
    }
    await sleep(1_000); // stored values land a beat after first paint
    this.current = tab;
    return true;
  }

  private async onTab(tab: PortalTab): Promise<boolean> {
    return this.cdp
      .eval<boolean>(`return location.search.includes('tab=${tab}') && !!${byId(TAB_ANCHOR[tab])};`)
      .catch(() => false);
  }

  /** Throw away unsaved edits (the sticky bar's Discard) so a navigation never prompts. */
  async discard(): Promise<void> {
    await this.cdp
      .eval(
        `const d = Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim() === 'Discard');
         if (d) d.click(); window.onbeforeunload = null; return true;`,
      )
      .catch(() => undefined);
  }

  /** Read `keys` (all on their own tabs); `fresh` reloads first (to see changes made elsewhere, e.g. on POS). */
  async read(keys: string[], fresh = false): Promise<Record<string, PortalValue>> {
    const out: Record<string, PortalValue> = {};
    for (const [tab, specs] of groupByTab(keys.map(resolveField))) {
      await this.open(tab, fresh);
      for (const spec of specs) out[spec.key] = await this.readField(spec);
    }
    return out;
  }

  /**
   * Make the Portal hold `want`. Per tab: change only what differs, Save, reload,
   * verify. Returns what the Portal reads after (only the keys asked for).
   */
  async set(want: Record<string, PortalValue>): Promise<Record<string, PortalValue>> {
    const specs = Object.keys(want).map(resolveField);
    const after: Record<string, PortalValue> = {};
    this.lastSaved = false;
    for (const [tab, group] of groupByTab(specs)) {
      await this.open(tab);
      // A compensation field is only reachable on its own sub-tab — and that sub-tab
      // IS the default compensation type. Edit the fields first, pick the type LAST.
      const ordered = [...group].sort((a, b) => Number(a.kind === 'subtab') - Number(b.kind === 'subtab'));
      let dirty = false;
      for (const spec of ordered) {
        const target = want[spec.key] as PortalValue;
        const compGroup = compensationGroupOf(spec.key);
        if (compGroup) await this.showSubtab(compGroup);
        if (same(spec, await this.readField(spec), target)) continue;
        await this.writeField(spec, target);
        dirty = true;
      }
      if (dirty) {
        await this.save(tab);
        this.lastSaved = true;
      }
      // Each card saves through its own request and some (tip settings) land a few
      // seconds after the Save bar closes: re-read with reloads before calling it lost.
      const deadline = Date.now() + 30_000;
      for (;;) {
        const off: string[] = [];
        for (const spec of group) {
          const got = await this.readField(spec);
          const target = want[spec.key] as PortalValue;
          if (same(spec, got, target)) after[spec.key] = got;
          else off.push(`${spec.key}: wanted ${JSON.stringify(target)} but reads ${JSON.stringify(got)}`);
        }
        if (off.length === 0) break;
        if (Date.now() > deadline) throw new Error(`Portal after Save + reload — ${off.join('; ')}`);
        await sleep(3_000);
        await this.open(tab, true);
      }
    }
    return after;
  }

  /** Bring a control into view (for screenshots). */
  async scrollTo(key: string): Promise<void> {
    const spec = resolveField(key);
    await this.open(spec.tab);
    await this.cdp.eval(
      `const el = ${this.anchorExpr(spec)}; if (el) el.scrollIntoView({ block: 'center' }); return true;`,
    );
    await sleep(300);
  }

  /* ------------------------------------------------------------------ */

  private anchorExpr(spec: FieldSpec): string {
    switch (spec.kind) {
      case 'radio':
        return `document.querySelector('[role="radio"][id^=${JSON.stringify(`${spec.id}-`)}]')`;
      case 'textRadio':
        return `Array.from(document.querySelectorAll('[role="radio"]')).find((b) => (b.textContent || '').trim() === ${JSON.stringify(Object.values(spec.values ?? {})[0])})`;
      case 'subtab':
        return `document.querySelector('[role="tab"][id$="-trigger-commission_salary"]')`;
      default:
        return byId(spec.id);
    }
  }

  private async readField(spec: FieldSpec): Promise<PortalValue> {
    const v = await this.cdp.eval<PortalValue | null>(readExpr(spec));
    if (v === null || v === undefined)
      throw new Error(`PortalStoreSettingsCdp: cannot read ${spec.key} (#${spec.id}) on tab ${spec.tab}`);
    return v;
  }

  private async writeField(spec: FieldSpec, value: PortalValue): Promise<void> {
    switch (spec.kind) {
      case 'switch':
        await this.tap(spec, byId(spec.id), value);
        break;
      case 'radio':
        await this.tap(spec, byId(`${spec.id}-${String(spec.values?.[String(value)] ?? value)}`), value);
        break;
      case 'textRadio': {
        const label = spec.values?.[String(value)] ?? String(value);
        await this.tap(
          spec,
          `Array.from(document.querySelectorAll('[role="radio"]')).find((b) => (b.textContent || '').trim() === ${JSON.stringify(label)})`,
          value,
        );
        break;
      }
      case 'subtab':
        await this.showSubtab(String(value));
        break;
      case 'select': {
        const label = spec.values?.[String(value)] ?? String(value);
        // Radix Select opens on pointerdown and picks on pointerup — click() does neither.
        await this.cdp.eval(
          `const t = ${byId(spec.id)}; if (!t) return false; t.scrollIntoView({ block: 'center' });
           t.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse', isPrimary: true }));
           return true;`,
        );
        await this.cdp.waitFor(
          `return !!document.querySelector('[role="option"]');`,
          5_000,
          `${spec.key} options`,
        );
        await this.cdp.eval(
          `const o = Array.from(document.querySelectorAll('[role="option"]')).find((x) => (x.textContent || '').trim() === ${JSON.stringify(label)});
           if (!o) return false;
           const ev = { bubbles: true, button: 0, pointerType: 'mouse', isPrimary: true };
           o.dispatchEvent(new PointerEvent('pointermove', ev)); o.dispatchEvent(new PointerEvent('pointerup', ev)); o.click();
           return true;`,
        );
        await sleep(400);
        if (!same(spec, await this.readField(spec), value))
          throw new Error(`PortalStoreSettingsCdp: ${spec.key} did not change to ${JSON.stringify(value)}`);
        break;
      }
      case 'number':
      case 'money': {
        const text = spec.kind === 'money' ? String(Math.round(Number(value) * 100)) : String(value);
        const focused = await this.cdp.eval<boolean>(
          `const el = ${byId(spec.id)}; if (!el) return false; el.scrollIntoView({ block: 'center' });
           el.focus(); el.select?.(); return document.activeElement === el;`,
        );
        if (!focused) throw new Error(`PortalStoreSettingsCdp: cannot focus ${spec.key} (#${spec.id})`);
        await this.cdp.key('a', 'KeyA', 65, true);
        await this.cdp.key('Backspace', 'Backspace', 8);
        await this.cdp.insertText(text);
        await this.cdp.eval(`${byId(spec.id)}?.blur(); return true;`);
        await sleep(250);
        break;
      }
    }
  }

  /**
   * Toggle a Radix switch / radio and prove it took: DOM `click()` first (Radix
   * listens to click; a real mouse event can land on a sticky overlay), then a
   * real mouse click if the state did not move.
   */
  private async tap(spec: FieldSpec, selectorExpr: string, value: PortalValue): Promise<void> {
    const ok = await this.cdp.eval<boolean>(
      `const el = ${selectorExpr}; if (!el) return false; el.scrollIntoView({ block: 'center' }); el.click(); return true;`,
    );
    if (!ok) throw new Error(`PortalStoreSettingsCdp: no control for ${spec.key} (${selectorExpr})`);
    for (let i = 0; i < 8; i += 1) {
      await sleep(200);
      if (same(spec, await this.readField(spec), value)) return;
    }
    await this.cdp.mouseClick(selectorExpr);
    await sleep(400);
    if (!same(spec, await this.readField(spec), value))
      throw new Error(
        `PortalStoreSettingsCdp: ${spec.key} did not change to ${JSON.stringify(value)} on click`,
      );
  }

  /** Activate compensation sub-tab `group` (Radix Tabs: mouse-down only). */
  private async showSubtab(group: string): Promise<void> {
    const sel = `document.querySelector('[role="tab"][id$=${JSON.stringify(`-trigger-${group}`)}]')`;
    const isActive = () => this.cdp.eval<boolean>(`return ${sel}?.getAttribute('data-state') === 'active';`);
    if (await isActive()) return;
    // Radix Tabs activate on mousedown (and on focus in automatic mode) — not on click().
    await this.cdp.eval(
      `const t = ${sel}; if (!t) return false; t.scrollIntoView({ block: 'center' });
       t.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })); t.focus(); return true;`,
    );
    for (let i = 0; i < 10 && !(await isActive()); i += 1) await sleep(200);
    if (!(await isActive())) await this.cdp.mouseClick(sel);
    if (!(await isActive()))
      throw new Error(`PortalStoreSettingsCdp: compensation sub-tab "${group}" did not activate`);
    await sleep(300);
  }

  private async save(tab: PortalTab): Promise<void> {
    const saveBtn = `Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim() === 'Save' && !b.disabled)`;
    // Some cards save on toggle with no Save bar (POS Accessibility › Customer display:
    // toast "Customer display updated"). No bar → nothing to press; the readback in
    // set() still proves the value stuck.
    const hasBar = await this.cdp
      .waitFor(`return !!${saveBtn};`, 4_000, 'an enabled Save button')
      .then(() => true)
      .catch(() => false);
    if (!hasBar) {
      await sleep(2_000);
      await this.open(tab, true);
      return;
    }
    // The sticky bar leaves once every card's save request was accepted. Seen
    // 08/11/2026: saving two cards at once (Tax + Gift-card SF) left the bar up with
    // no error, while the same change saved on the next try — so press Save again,
    // and in the end let the post-reload readback in set() decide what stuck.
    const barGone = `return !Array.from(document.querySelectorAll('button')).some((b) => (b.textContent || '').trim() === 'Save');`;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await this.cdp.eval(`const b = ${saveBtn}; if (b) b.click(); return true;`);
      const closed = await this.cdp
        .waitFor(barGone, 15_000, 'the Save bar to close')
        .then(() => true)
        .catch(() => false);
      if (closed) break;
      const msg = await this.cdp
        .eval<string>(
          `return Array.from(document.querySelectorAll('[role="alert"], [data-sonner-toast], .text-destructive')).map((e) => e.textContent.trim()).filter(Boolean).join(' | ');`,
        )
        .catch(() => '');
      if (attempt === 3) {
        await this.discard();
        if (msg) throw new Error(`Portal refused the Save on ${tab}: ${msg}`);
      }
    }
    await sleep(2_500); // let the per-card save requests finish before the reload
    await this.open(tab, true);
  }
}

function groupByTab(specs: FieldSpec[]): Map<PortalTab, FieldSpec[]> {
  const m = new Map<PortalTab, FieldSpec[]>();
  for (const s of specs) m.set(s.tab, [...(m.get(s.tab) ?? []), s]);
  return m;
}

/** Portal readback vs wanted value, by kind (numbers compare numerically). */
function same(spec: FieldSpec, got: PortalValue, want: PortalValue): boolean {
  if (spec.kind === 'number' || spec.kind === 'money') return Math.abs(Number(got) - Number(want)) < 1e-6;
  if (spec.kind === 'switch') return Boolean(got) === Boolean(want);
  return String(got) === String(want);
}

function readExpr(spec: FieldSpec): string {
  switch (spec.kind) {
    case 'switch':
      return `const el = ${byId(spec.id)}; if (!el) return null;
              const s = el.getAttribute('aria-checked') ?? el.getAttribute('data-state');
              return s === 'true' || s === 'checked';`;
    case 'radio': {
      const vals = JSON.stringify(Object.entries(spec.values ?? {}));
      return `for (const [v, suffix] of ${vals}) {
                const el = document.getElementById(${JSON.stringify(`${spec.id}-`)} + suffix);
                if (el && el.getAttribute('aria-checked') === 'true') return v;
              } return null;`;
    }
    case 'textRadio': {
      const vals = JSON.stringify(Object.entries(spec.values ?? {}));
      return `const radios = Array.from(document.querySelectorAll('[role="radio"]'));
              for (const [v, label] of ${vals}) {
                const el = radios.find((b) => (b.textContent || '').trim() === label);
                if (el && el.getAttribute('aria-checked') === 'true') return v;
              } return null;`;
    }
    case 'subtab':
      return `const t = Array.from(document.querySelectorAll('[role="tab"]')).find((e) => /-trigger-(commission|salary|commission_salary)$/.test(e.id) && e.getAttribute('data-state') === 'active');
              return t ? t.id.replace(/^.*-trigger-/, '') : null;`;
    case 'select':
      return `const s = document.querySelector('select[name=${JSON.stringify(spec.id)}]'); return s ? s.value : null;`;
    case 'number':
    case 'money':
      return `const el = ${byId(spec.id)}; if (!el) return null;
              const n = Number(String(el.value).replace(/[^0-9.\\-]/g, ''));
              return Number.isFinite(n) ? n : null;`;
  }
}
