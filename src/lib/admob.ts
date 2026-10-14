import { ADMOB_IS_TESTING } from "@/config/admob";

/** True only inside the Capacitor native app (never on the web or during SSR). */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

let initPromise: Promise<boolean> | null = null;

/**
 * Initializes AdMob once for the whole app. Safe to call many times and on the web
 * (resolves false without loading the plugin). Resolves true when ready.
 */
export function initAdMob(): Promise<boolean> {
  if (!isNativeApp()) return Promise.resolve(false);
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const { AdMob } = await import("@capacitor-community/admob");
        await AdMob.initialize({
          initializeForTesting: ADMOB_IS_TESTING,
        } as Parameters<typeof AdMob.initialize>[0]);
        console.info(`[AdMob] initialized (testing=${ADMOB_IS_TESTING})`);
        return true;
      } catch (error) {
        console.warn("[AdMob] initialize failed", error);
        initPromise = null; // allow retry
        return false;
      }
    })();
  }
  return initPromise;
}
