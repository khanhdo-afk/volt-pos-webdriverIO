/**
 * Every store-wide setting a test case can ask the Portal for, by a readable name.
 *
 * Fastboy Portal › Store Settings ships stable element ids on every control
 * (`#serviceFeePercentage`, `#tipTiming-before_payment`, `#passcode-refund`, …), so
 * each entry is just: which tab, which control, and where POS keeps the same value
 * once it has synced (`merchantSettingList` or one `sysSettingList` JSON row) — the
 * latter lets {@link PortalStoreSession.ensure} wait until the till really runs
 * under the new value before the case goes on.
 *
 * Any Portal control id not listed here can still be passed raw (e.g.
 * `'commission_salary.percentCreditCardTip'`): its tab and kind are inferred, its
 * POS mirror is derived from the id when it is a compensation-default field.
 */

export type PortalTab = 'payment-transactions' | 'configuration';
export type PortalValue = boolean | number | string;

/** What the POS holds, flattened: `ms.<merchantSetting field>` and `sys.<key>` (JSON parsed). */
export type PosSnapshot = Record<string, unknown>;

export type FieldKind =
  /** Radix switch or checkbox button with an id. */
  | 'switch'
  /** Radix radio group: ids `${group}-${value}`. */
  | 'radio'
  /** Radio buttons with no id, picked by their visible text. */
  | 'textRadio'
  /** Plain numeric text input ("5", "12.5"). */
  | 'number'
  /** Currency-masked input ("$30.00"), typed in cents. Value given in dollars. */
  | 'money'
  /** Radix Select (`button[role=combobox]#id` + hidden native `select[name=id]`). */
  | 'select'
  /** Compensation-default type = which sub-tab is active. */
  | 'subtab';

export interface FieldSpec {
  key: string;
  tab: PortalTab;
  kind: FieldKind;
  /** Element id (switch/number/money/select) or radio group prefix. */
  id: string;
  /** radio / textRadio / select / subtab: value → visible label (for textRadio/select) or id suffix. */
  values?: Record<string, string>;
  /** Where POS mirrors it; undefined = no POS mirror known (the session waits a fixed beat). */
  pos?: (s: PosSnapshot) => unknown;
  /** Portal value → the POS value `pos` returns (default identity). */
  toPos?: (v: PortalValue) => unknown;
}

const sys =
  (key: string, ...path: string[]) =>
  (s: PosSnapshot) =>
    path.reduce<unknown>(
      (o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined),
      s[`sys.${key}`],
    );
const ms = (field: string) => (s: PosSnapshot) => s[`ms.${field}`];
const cents = (v: PortalValue) => Math.round(Number(v) * 100);
const num = (v: PortalValue) => Number(v);
const tipTypes = (method: string) => (s: PosSnapshot) => {
  const raw = s['ms.tipPaymentTypes'];
  try {
    return (JSON.parse(typeof raw === 'string' ? raw : '[]') as string[]).includes(method);
  } catch {
    return undefined;
  }
};

const TIMING = { before_payment: 'before_payment', after_payment: 'after_payment' };

/** Readable name → spec. */
export const PORTAL_FIELDS: Record<string, Omit<FieldSpec, 'key'>> = {
  /* ---- Payment & transactions › Tipping ---- */
  tipOnCard: { tab: 'payment-transactions', kind: 'switch', id: 'card', pos: tipTypes('card') },
  tipOnCash: { tab: 'payment-transactions', kind: 'switch', id: 'cash', pos: tipTypes('cash') },
  tipOnGiftCard: { tab: 'payment-transactions', kind: 'switch', id: 'gift_card', pos: tipTypes('gift_card') },
  tipOnOther: { tab: 'payment-transactions', kind: 'switch', id: 'other', pos: tipTypes('other') },
  tipActive: { tab: 'payment-transactions', kind: 'switch', id: 'tipActive', pos: ms('tipActive') },
  tipTiming: {
    tab: 'payment-transactions',
    kind: 'radio',
    id: 'tipTiming',
    values: TIMING,
    pos: ms('tipTiming'),
  },
  tipType: {
    tab: 'payment-transactions',
    kind: 'textRadio',
    id: 'tipType',
    values: { percent: 'Percentage', amount: 'Fixed amount' },
    pos: ms('tipType'),
  },
  tipSplitMethod: {
    tab: 'payment-transactions',
    kind: 'radio',
    id: 'method',
    values: { evenly: 'evenly', proportion: 'proportion' },
    pos: sys('merchant_default_split_tip_method'),
  },
  /* ---- Signature ---- */
  signatureRequired: {
    tab: 'payment-transactions',
    kind: 'switch',
    id: 'signatureSetting',
    pos: ms('signatureSetting'),
  },
  signatureTiming: {
    tab: 'payment-transactions',
    kind: 'radio',
    id: 'signatureTiming',
    values: TIMING,
    pos: ms('signatureTiming'),
  },
  /* ---- Supply share ---- */
  supplyShareMethod: {
    tab: 'payment-transactions',
    kind: 'radio',
    id: 'method',
    values: { before_commission: 'before_commission', after_commission: 'after_commission' },
    pos: sys('merchant_supply_deduct_method'),
  },
  /* ---- Checkout / points ---- */
  checkoutType: {
    tab: 'payment-transactions',
    kind: 'radio',
    id: 'checkout-type',
    values: {
      payment_method: 'payment_method',
      auto_checkout: 'auto_checkout',
      hybrid_checkout: 'hybrid_checkout',
    },
    pos: sys('merchant_point_payment_config', 'selected_type'),
  },
  pointRateCash: {
    tab: 'payment-transactions',
    kind: 'money',
    id: 'cashPoint',
    pos: sys('merchant_point_payment_config', 'cash', 'point'),
    toPos: cents,
  },
  pointRateCard: {
    tab: 'payment-transactions',
    kind: 'money',
    id: 'cardPoint',
    pos: sys('merchant_point_payment_config', 'card', 'point'),
    toPos: cents,
  },
  pointRateGiftCard: {
    tab: 'payment-transactions',
    kind: 'money',
    id: 'giftCardPoint',
    pos: sys('merchant_point_payment_config', 'gift_card', 'point'),
    toPos: cents,
  },
  pointRateOther: {
    tab: 'payment-transactions',
    kind: 'money',
    id: 'otherPoint',
    pos: sys('merchant_point_payment_config', 'other', 'point'),
    toPos: cents,
  },
  earnOnTip: {
    tab: 'payment-transactions',
    kind: 'switch',
    id: 'earnOnTip',
    pos: sys('merchant_point_payment_config', 'earn_on_tip'),
  },
  /* ---- Tax & pricing ---- */
  productTaxPct: {
    tab: 'payment-transactions',
    kind: 'number',
    id: 'taxPercentage',
    pos: ms('taxPercentage'),
    toPos: num,
  },
  serviceTaxPct: {
    tab: 'payment-transactions',
    kind: 'number',
    id: 'serviceTaxPercentage',
    pos: (s) => Number(s['sys.merchant_service_tax_percentage']),
    toPos: num,
  },
  cashDiscountPct: {
    tab: 'payment-transactions',
    kind: 'number',
    id: 'cashDiscountPercentage',
    pos: ms('cashDiscountPercentage'),
    toPos: num,
  },
  serviceFeePct: {
    tab: 'payment-transactions',
    kind: 'number',
    id: 'serviceFeePercentage',
    pos: ms('serviceFeePercentage'),
    toPos: num,
  },
  applyServiceFeeToGiftCard: {
    tab: 'payment-transactions',
    kind: 'switch',
    id: 'applyServiceFee',
    pos: (s) => Number(s['sys.merchant_gift_card_top_up_service_fee']) === 1,
  },
  /* ---- Discount setting (Owner / Staff split) ---- */
  discountOwnerPct: {
    tab: 'payment-transactions',
    kind: 'number',
    id: 'available.ownerPercent',
    pos: (s) => Number(s['sys.merchant_promotion_discount']),
    toPos: num,
  },
  discountStaffPct: { tab: 'payment-transactions', kind: 'number', id: 'available.staffPercent' },
  customDiscountOwnerPct: {
    tab: 'payment-transactions',
    kind: 'number',
    id: 'custom.ownerPercent',
    pos: (s) => Number(s['sys.merchant_custom_promotion_discount']),
    toPos: num,
  },
  customDiscountStaffPct: { tab: 'payment-transactions', kind: 'number', id: 'custom.staffPercent' },

  /* ---- Configuration › Compensation default ---- */
  compensationType: {
    tab: 'configuration',
    kind: 'subtab',
    id: 'compensation',
    values: { commission: 'commission', salary: 'salary', commission_salary: 'commission_salary' },
    pos: sys('merchant_compensation_default', 'selected_type'),
  },
  /* ---- Turn ---- */
  turnValue: {
    tab: 'configuration',
    kind: 'money',
    id: 'turnValue',
    pos: sys('merchant_turn_default', 'turn_value'),
    toPos: cents,
  },
  turnServiceBased: {
    tab: 'configuration',
    kind: 'switch',
    id: 'turnServiceBased',
    pos: sys('merchant_turn_default', 'turn_service_based'),
  },
  turnDecimal: {
    tab: 'configuration',
    kind: 'switch',
    id: 'turnDecimal',
    pos: sys('merchant_turn_default', 'turn_decimal'),
  },
  /* ---- Customer display / default screen / font ---- */
  showPointsOnCustomerDisplay: {
    tab: 'configuration',
    kind: 'switch',
    id: 'customer-display-show-point',
    pos: sys('merchant_customer_display', 'show_point'),
  },
  showRewardsOnCustomerDisplay: {
    tab: 'configuration',
    kind: 'switch',
    id: 'customer-display-show-reward',
    pos: sys('merchant_customer_display', 'show_reward'),
  },
  defaultScreen: {
    tab: 'configuration',
    kind: 'radio',
    id: 'screen',
    values: { pending_orders: 'pending_orders', home: 'home' },
    pos: (s) => {
      const v = s['sys.merchant_default_screen'];
      return typeof v === 'string' ? v.replace(/"/g, '') : v;
    },
  },
  fontSize: {
    tab: 'configuration',
    kind: 'radio',
    id: 'font-size',
    values: { small: 'small', medium: 'medium', large: 'large' },
    pos: sys('merchant_theme_pos_style', 'font_size'),
  },
  /** VP-5724 — POS Accessibility › Tile colors (`#tileColors-bold|pastel`, Portal DEV 12/11/2026). */
  tileColors: {
    tab: 'configuration',
    kind: 'radio',
    id: 'tileColors',
    values: { bold: 'bold', pastel: 'pastel' },
    pos: sys('merchant_theme_pos_style', 'tile_colors'),
  },
};

/** Portal passcode switch (`#passcode-<x>`) → `merchant_passcode_settings` path. */
const PASSCODE: Record<string, [string, string]> = {
  summaryIncome: ['reports', 'summary_income'],
  dailyIncome: ['reports', 'daily_income'],
  staffIncome: ['reports', 'staff_income'],
  staffPayroll: ['reports', 'staff_payroll'],
  batchHistory: ['reports', 'batch_history'],
  completeOrder: ['orders', 'complete_order'],
  cancelOrderVoid: ['orders', 'cancel_order'],
  refund: ['orders', 'refund'],
  reopenOrder: ['orders', 'reopen_order'],
  deleteOrder: ['orders', 'delete_order'],
  orderHistory: ['orders', 'view_order_history'],
  quickPay: ['orders', 'quick_pay'],
  applyDiscount: ['orders', 'apply_discount'],
  openCashDrawer: ['others', 'open_cash_drawer'],
  settingsPage: ['others', 'settings_page'],
  timeTracking: ['others', 'time_tracking'],
};
for (const [name, path] of Object.entries(PASSCODE)) {
  PORTAL_FIELDS[`passcode.${name}`] = {
    tab: 'configuration',
    kind: 'switch',
    id: `passcode-${name}`,
    pos: sys('merchant_passcode_settings', ...path),
  };
}

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const COMP_GROUPS = ['commission', 'salary', 'commission_salary'];
const COMP_MONEY = new Set(['deductionPerDay', 'salaryAmount']);
const COMP_BOOL = new Set(['enablePayrollTip', 'cardFeeCharge', 'limitDayOff']);

/**
 * Resolve a readable name, a `passcode.<x>` name, a compensation-default field
 * (`commission.cashCheckSplit`, `salary.salarySetting`, …) or a raw Portal id.
 */
export function resolveField(key: string): FieldSpec {
  const known = PORTAL_FIELDS[key];
  if (known) return { key, ...known };

  const [group, field] = key.split('.');
  if (group && field && COMP_GROUPS.includes(group)) {
    const pos = sys('merchant_compensation_default', group, snake(field));
    if (field === 'salarySetting')
      return {
        key,
        tab: 'configuration',
        kind: 'select',
        id: key,
        values: {
          salary_by_period: 'Salary by period',
          wage_per_day: 'Wage per day',
          wage_per_hour: 'Wage per hour',
        },
        pos,
      };
    if (COMP_MONEY.has(field))
      return { key, tab: 'configuration', kind: 'money', id: key, pos, toPos: cents };
    if (COMP_BOOL.has(field)) return { key, tab: 'configuration', kind: 'switch', id: key, pos };
    return { key, tab: 'configuration', kind: 'number', id: key, pos, toPos: num };
  }
  throw new Error(
    `Unknown Portal setting "${key}". Use a name from PORTAL_FIELDS (src/support/portal/portalStoreFields.ts), ` +
      `"passcode.<name>", or a compensation-default field like "commission.cashCheckSplit".`,
  );
}

/** Compensation-default fields live in a sub-tab that IS the default type; touching one moves it. */
export const compensationGroupOf = (key: string): string | null => {
  const g = key.split('.')[0] ?? '';
  return COMP_GROUPS.includes(g) && key.includes('.') ? g : null;
};
