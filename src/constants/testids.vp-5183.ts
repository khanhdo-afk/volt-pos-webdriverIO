/**
 * VP-5183 — images the app reads from `ObjectFiles` through the Tauri asset
 * protocol (`http://asset.localhost/<path>`). Plain CSS selectors: the helpers
 * read `<img>` load state (`complete`, `naturalWidth`) in-page, which the
 * volt-qc chain queries do not expose.
 */

/** Base URL of the Tauri asset protocol on Windows (WebView2). */
export const ASSET_ORIGIN = 'http://asset.localhost/';

const cssString = (v: string): string => v.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

export const Vp5183 = {
  /** Settings → Receipt: the logo in "Receipt Preview" (also the logo in "Receipt Details"). */
  businessLogo: 'img[alt="Business Logo"]',
  /** Order History → Receipt Details: the customer's signature. */
  signature: '[role="dialog"] img[alt="Signature"]',
  /** Receipt Details dialog: logo inside the dialog only. */
  dialogLogo: '[role="dialog"] img[alt="Business Logo"]',
  /** Settings → Business Info → Store Brand: Store Logo + Cover Photo previews. */
  storeBrandPreview: 'main img[alt="Preview"]',
  /** Home staff grid: avatar `<img>` whose alt is the staff's full name. */
  staffAvatar: (name: string): string => `img[alt="${cssString(name)}"]`,
} as const;

/** Log line Tauri writes when the asset scope refuses a path (the VP-5183 symptom). */
export const ASSET_REFUSED_LOG_RE = /tauri::protocol::asset\].*not configured to allow the path/;
