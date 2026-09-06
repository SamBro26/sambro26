/**
 * AdMob configuration.
 *
 * Test IDs are used by default so ads render safely inside the Capacitor APK
 * during development. Set the VITE_ADMOB_* variables to go live.
 */

// Official Google AdMob test IDs.
const TEST_APP_ID = "ca-app-pub-3940256099942544~3347511713";
const TEST_BANNER_ID = "ca-app-pub-3940256099942544/6300978111";

export const ADMOB_APP_ID = import.meta.env["VITE_ADMOB_APP_ID"] ?? TEST_APP_ID;

export const ADMOB_BANNER_ID = import.meta.env["VITE_ADMOB_BANNER_ID"] ?? TEST_BANNER_ID;

/** When true, AdMob serves test ads (always true unless real IDs are configured). */
export const ADMOB_IS_TESTING = !import.meta.env["VITE_ADMOB_BANNER_ID"];
