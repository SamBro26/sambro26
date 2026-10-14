/**
 * AdMob configuration.
 *
 * Google's official test IDs are used everywhere except a production build
 * that has real IDs configured via VITE_ADMOB_APP_ID / VITE_ADMOB_BANNER_ID.
 */

// Official Google AdMob test IDs.
export const TEST_APP_ID = "ca-app-pub-3940256099942544~3347511713";
export const TEST_BANNER_ID = "ca-app-pub-3940256099942544/6300978111";

const REAL_APP_ID = import.meta.env["VITE_ADMOB_APP_ID"] as string | undefined;
const REAL_BANNER_ID = import.meta.env["VITE_ADMOB_BANNER_ID"] as string | undefined;

/** Real ads only in a production build with a real banner ID configured. */
export const ADMOB_IS_TESTING = !(import.meta.env.PROD && REAL_BANNER_ID);

export const ADMOB_APP_ID = !ADMOB_IS_TESTING && REAL_APP_ID ? REAL_APP_ID : TEST_APP_ID;
export const ADMOB_BANNER_ID = ADMOB_IS_TESTING ? TEST_BANNER_ID : (REAL_BANNER_ID as string);
