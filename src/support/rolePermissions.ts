import { gql } from '../api/index.js';
import { openPermissions, setPerm } from '../pages/voltqc/app-rpt-set-perm/aspFlows.js';
import { returnToHome } from '../flows/index.js';
import { moduleLogger } from '../utils/logger.js';

const log = moduleLogger('role-permissions');

/** Permission matrix row label → the key stored on `role.permissions`. */
export const PERMISSION_KEY: Readonly<Record<string, string>> = {
  'Edit Order': 'edit_order',
  'Cancel Order (Void)': 'cancel_order_void',
  Refund: 'refund',
  'Completed Payment': 'completed_payment',
  'Delete Order': 'delete_order',
  'Order History': 'view_order_history',
  'Quick Pay': 'quick_pay',
  'Apply Discount (Promo & Rewards)': 'apply_discount',
  'Quick Checkout': 'quick_checkout',
  'Sell Gift Card': 'gift_card_sale',
  'Edit Service Price': 'edit_service_price',
  Calendar: 'calendar',
  'Summary Income': 'summary_income',
  'Daily Income': 'daily_income',
  'Staff Income': 'staff_income',
  'Staff Payroll': 'staff_payroll',
  'Batch History': 'batch_history',
  'Batch Close': 'batch_close',
  'Open Cash Drawer': 'open_cash_drawer',
  'POS Settings': 'settings',
  'View Phone Number': 'view_phone_number',
  'View Time Tracking': 'view_time_tracking',
};

/** Matrix column of each editable role (Owner, column 0, is locked ON). */
const COLUMN = { Manager: 1, Partner: 2, Staff: 3 } as const;
export type EditableRole = keyof typeof COLUMN;

/** `{ Partner: { 'Quick Pay': true } }` — row labels as the Permissions screen shows them. */
export type RoleWant = Partial<Record<EditableRole, Record<string, boolean>>>;

interface RoleRow {
  name: string;
  permissions: string | Record<string, boolean>;
}

/** Each system role's stored permissions (POS gql, no UI). */
export async function rolePermissions(): Promise<Record<string, Record<string, boolean>>> {
  const data = await gql().query<{ roleList: RoleRow[] }>(
    'query rolePerms { roleList { name permissions } }',
    {
      operationName: 'rolePerms',
    },
  );
  const out: Record<string, Record<string, boolean>> = {};
  for (const r of data.roleList) {
    out[r.name] =
      typeof r.permissions === 'string'
        ? (JSON.parse(r.permissions) as Record<string, boolean>)
        : r.permissions;
  }
  return out;
}

/**
 * Make the role permissions a test case depends on TRUE before it runs — e.g.
 * "a Partner holds Quick Pay" (VP-4815) — through the Settings › Permissions
 * matrix, the same writes a manager makes. Returns the previous values so the
 * caller can put them back with {@link restoreRolePermissions}. No UI when
 * everything already matches.
 */
export async function ensureRolePermissions(want: RoleWant): Promise<RoleWant> {
  const now = await rolePermissions();
  const before: RoleWant = {};
  const diff: [EditableRole, string, boolean][] = [];
  for (const [role, rows] of Object.entries(want) as [EditableRole, Record<string, boolean>][]) {
    for (const [label, on] of Object.entries(rows)) {
      const key = PERMISSION_KEY[label];
      if (!key) throw new Error(`ensureRolePermissions: unknown permission row "${label}"`);
      const cur = now[role]?.[key] ?? false;
      if (cur !== on) {
        diff.push([role, label, on]);
        (before[role] ??= {})[label] = cur;
      }
    }
  }
  if (diff.length === 0) return before;
  log.info(`role permissions → ${diff.map(([r, l, v]) => `${r}.${l}=${String(v)}`).join(', ')}`);
  await openPermissions();
  for (const [role, label, on] of diff) await setPerm(label, COLUMN[role], on);
  await returnToHome();
  return before;
}

/** Put back what {@link ensureRolePermissions} changed. */
export async function restoreRolePermissions(before: RoleWant): Promise<void> {
  if (Object.keys(before).length) await ensureRolePermissions(before);
}
