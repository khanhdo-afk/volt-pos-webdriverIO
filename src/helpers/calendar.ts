import { browser } from '@wdio/globals';

/**
 * Bring `day` into the OPEN calendar popover by paging its month navigation.
 *
 * 1.1.109's date pickers render ONE month (older builds showed two side by side),
 * and react-day-picker leaves the other months' days as empty
 * `td[data-outside][data-hidden]` cells with no button — so a helper that clicks
 * `td[data-day="2026-10-26"] button` while November is shown finds nothing.
 * Page with "Go to the Previous/Next Month" until the day has a button (max 24
 * pages). Returns false when it never shows (a disabled future day, no calendar).
 */
export async function showCalendarDay(day: Date): Promise<boolean> {
  const iso = `${String(day.getFullYear())}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  const us = `${String(day.getMonth() + 1)}/${String(day.getDate())}/${String(day.getFullYear())}`;
  for (let i = 0; i < 24; i += 1) {
    const move = await browser.execute(
      (isoDay: string, usDay: string) => {
        const pops = Array.from(
          document.querySelectorAll<HTMLElement>(
            '[data-slot="calendar"], [data-radix-popper-content-wrapper] table[role="grid"]',
          ),
        ).filter((el) => el.getClientRects().length > 0);
        const root =
          pops[pops.length - 1]?.closest<HTMLElement>('[data-radix-popper-content-wrapper]') ??
          pops[pops.length - 1];
        if (!root) return 'none';
        if (
          root.querySelector(
            `td[data-day="${isoDay}"]:not([data-hidden]) button, button[data-day="${usDay}"]`,
          )
        )
          return 'ok';
        // Compare with the first visible (non-outside) day shown.
        const shown = Array.from(root.querySelectorAll('td[data-day]:not([data-outside])')).map(
          (td) => td.getAttribute('data-day') ?? '',
        );
        if (shown.length === 0) return 'none';
        const first = shown[0] ?? '';
        const dir = isoDay < first ? 'Previous' : 'Next';
        const btn = root.querySelector<HTMLButtonElement>(`button[aria-label*="${dir}"]`);
        if (!btn || btn.disabled) return 'none';
        btn.click();
        return 'moved';
      },
      iso,
      us,
    );
    if (move === 'ok') return true;
    if (move === 'none') return false;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}
