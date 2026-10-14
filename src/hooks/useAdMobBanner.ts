import { useEffect, useState } from "react";

import { ADMOB_BANNER_ID, ADMOB_IS_TESTING } from "@/config/admob";
import { initAdMob, isNativeApp } from "@/lib/admob";

/**
 * Shows an AdMob adaptive banner pinned to the top of the native app window and
 * returns its measured height (0 on the web) so the layout can reserve space.
 * ADAPTIVE_BANNER makes Google compute the height from the current device width.
 */
export function useAdMobBanner(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!isNativeApp()) return;

    let cancelled = false;
    const listeners: { remove: () => void }[] = [];

    (async () => {
      try {
        const ready = await initAdMob();
        if (!ready || cancelled) return;

        const { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents } = await import(
          "@capacitor-community/admob"
        );

        listeners.push(
          await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info: { height: number }) => {
            console.info("[AdMob] banner size", info, "device width", window.innerWidth);
            if (!cancelled) setHeight(info?.height ?? 0);
          }),
          await AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
            console.info(`[AdMob] banner loaded (testing=${ADMOB_IS_TESTING})`);
          }),
          await AdMob.addListener(
            BannerAdPluginEvents.FailedToLoad,
            (err: { code?: number; message?: string }) => {
              const hint =
                err?.code === 3 ? " (No Fill — no ad available right now)" : "";
              console.error(`[AdMob] bannerAdFailedToLoad code=${err?.code}${hint}`, err?.message);
              if (!cancelled) setHeight(0);
            },
          ),
        );

        await AdMob.showBanner({
          adId: ADMOB_BANNER_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.TOP_CENTER,
          margin: 0,
          isTesting: ADMOB_IS_TESTING,
        });
      } catch (error) {
        console.warn("[AdMob] banner unavailable", error);
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
