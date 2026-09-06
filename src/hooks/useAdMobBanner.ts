import { useEffect, useState } from "react";

import { ADMOB_BANNER_ID, ADMOB_IS_TESTING } from "@/config/admob";

function isNativeApp() {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

/**
 * Shows an AdMob adaptive banner pinned to the top of the native app window and
 * returns its measured height (0 on the web) so the layout can reserve space.
 */
export function useAdMobBanner(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!isNativeApp()) return;

    let cancelled = false;
    const listeners: { remove: () => void }[] = [];

    (async () => {
      try {
        const { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents } = await import(
          "@capacitor-community/admob"
        );

        await AdMob.initialize();
        if (cancelled) return;

        listeners.push(
          await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info: { height: number }) => {
            if (!cancelled) setHeight(info?.height ?? 0);
          }),
        );

        await AdMob.showBanner({
          adId: ADMOB_BANNER_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.TOP_CENTER,
          margin: 0,
          isTesting: ADMOB_IS_TESTING,
        });
      } catch (error) {
        console.warn("AdMob banner unavailable", error);
      }
    })();

    return () => {
      cancelled = true;
      listeners.forEach((l) => l.remove());
      void import("@capacitor-community/admob")
        .then(({ AdMob }) => AdMob.removeBanner())
        .catch(() => {});
    };
  }, []);

  return height;
}
