import fs from 'node:fs';
import { GAP_BOARD_FILE } from '../../src/support/web/webLane.js';
import { orderSitePage, type GapBoardHandoff } from '../../src/pages/web/OrderSitePage.js';

/**
 * WEB — read the GoCheckin (pos.gocheckin.net) Appointment calendar columns.
 *
 * READ-ONLY: logs in (`WEB_*` from `.env.dev`), lands on today's Appointment
 * calendar and writes every column header (name + colour, left to right) to
 * {@link GAP_BOARD_FILE}. The app lane (`vp-4402-staff-column-order-color.spec.ts`
 * TC-VP4402-19/20) compares the Volt POS board against it.
 *
 * Run alone: `npx wdio run configs/wdio/wdio.web.conf.ts --spec tests/web/gap-appointment-board.spec.ts`
 */
describe('WEB — GoCheckin appointment board columns', () => {
  it('reads every calendar column with its colour', async () => {
    await orderSitePage.login();
    const columns = await orderSitePage.readAppointmentColumns();
    if (columns.length === 0) throw new Error('GoCheckin calendar rendered no column header');
    const handoff: GapBoardHandoff = { readAt: new Date().toISOString(), columns };
    fs.writeFileSync(GAP_BOARD_FILE, JSON.stringify(handoff, null, 2), 'utf8');
    // eslint-disable-next-line no-console
    console.log(`\n[WEB] GoCheckin board: ${String(columns.length)} columns → ${GAP_BOARD_FILE}\n`);
  });
});
