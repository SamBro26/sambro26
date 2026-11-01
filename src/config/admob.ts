/**
 * AdMob configuration.
 *
 * Google's official test IDs are used everywhere except a production build,
 * which uses the verified real IDs below. VITE_ADMOB_APP_ID /
 * VITE_ADMOB_BANNER_ID environment variables override the real IDs if set.
 */

// Official Google AdMob test IDs.
export const TEST_APP_ID = "ca-app-pub-3940256099942544~3347511713";
export const TEST_BANNER_ID = "ca-app-pub-3940256099942544/6300978111";

// Verified production IDs (sam.app).
const PRODUCTION_APP_ID = "ca-app-pub-5516554712058767~1697857878";
const PRODUCTION_BANNER_ID = "ca-app-pub-5516554712058767/2044809405";

const ENV_APP_ID = import.meta.env["VITE_ADMOB_APP_ID"] as string | undefined;
const ENV_BANNER_ID = import.meta.env["VITE_ADMOB_BANNER_ID"] as string | undefined;

const REAL_APP_ID = ENV_APP_ID || PRODUCTION_APP_ID;
const REAL_BANNER_ID = ENV_BANNER_ID || PRODUCTION_BANNER_ID;

/** Real ads only in a production build; test ads in dev/staging. */
export const ADMOB_IS_TESTING = !import.meta.env.PROD;

export const ADMOB_APP_ID = ADMOB_IS_TESTING ? TEST_APP_ID : REAL_APP_ID;
export const ADMOB_BANNER_ID = ADMOB_IS_TESTING ? TEST_BANNER_ID : REAL_BANNER_ID;
