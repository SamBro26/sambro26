import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LangProvider } from "../lib/i18n";
import { AuthProvider } from "../hooks/useAuth";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FindMeDZ دبرلي — Immobilier en Algérie" },
      {
        name: "description",
        content:
          "FindMeDZ (دبرلي) : annonces immobilières en Algérie — offres et demandes, filtrées par wilaya et baladiya.",
      },
      { name: "author", content: "FindMeDZ" },
      { property: "og:title", content: "FindMeDZ دبرلي — Immobilier en Algérie" },
      {
        property: "og:description",
        content: "Offres et demandes immobilières dans les 58 wilayas d'Algérie.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;900&family=Tajawal:wght@400;500;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `(function(){if(window.top===window.self)return;if(!document.requestStorageAccess||!document.hasStorageAccess)return;document.hasStorageAccess().then(function(has){if(has)return;var ask=function(){document.requestStorageAccess().then(function(){location.reload();}).catch(function(){})};document.addEventListener("click",ask,{once:true});document.addEventListener("touchend",ask,{once:true});}).catch(function(){})})();`,
          }}
        />
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `(function(){function shouldHide(){return typeof window!=='undefined'&&(!!window.Capacitor||!!window.NativeBridge||/Capacitor|wv|WebView|Android.*AppleWebKit|iPhone.*AppleWebKit.*CriOS/i.test(navigator.userAgent)));}if(!shouldHide())return;document.documentElement.classList.add('in-capacitor');function injectCss(root){var css='[data-lovable-badge],.lovable-badge,.lovable-preview-badge,.lovable-floating-badge,[class*="lovable-badge"],[class*="preview-badge"],[class*="floating-badge"],[class*="lovable-close"],[class*="lovable-dismiss"],iframe[src*="lovable"],iframe[src*="gptengineer"],a[href*="lovable.dev"],a[href*="gptengineer.app"],button[aria-label*="close" i][style*="fixed"],button[aria-label*="dismiss" i][style*="fixed"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;height:0!important;width:0!important;z-index:-9999!important;}';var s=document.createElement('style');s.textContent=css;(root.head||root.documentElement||root).appendChild(s);}injectCss(document);function scanShadows(node){if(node.shadowRoot){injectCss(node.shadowRoot);node.shadowRoot.querySelectorAll('*').forEach(scanShadows);}}function removeBadges(){var selectors='[data-lovable-badge],.lovable-badge,.lovable-preview-badge,.lovable-floating-badge,[class*="lovable-badge"],[class*="preview-badge"],[class*="floating-badge"],[class*="lovable-close"],[class*="lovable-dismiss"],iframe[src*="lovable"],iframe[src*="gptengineer"],a[href*="lovable.dev"],a[href*="gptengineer.app"]';document.querySelectorAll(selectors).forEach(function(el){el.remove();});document.querySelectorAll('*').forEach(function(el){scanShadows(el);var style=window.getComputedStyle(el),rect=el.getBoundingClientRect();if((style.position==='fixed'||style.position==='absolute')&&rect.width>0&&rect.height>0){var vw=window.innerWidth,vh=window.innerHeight;if(rect.bottom>=vh-90&&rect.right>=vw-90){var text=(el.textContent||'').toLowerCase(),html=(el.outerHTML||'').toLowerCase(),cls=(el.className||'').toLowerCase();if(text.indexOf('×')>=0||text.indexOf('x')>=0||html.indexOf('close')>=0||html.indexOf('dismiss')>=0||cls.indexOf('close')>=0||cls.indexOf('dismiss')>=0||cls.indexOf('badge')>=0||cls.indexOf('lovable')>=0||html.indexOf('lovable')>=0||html.indexOf('gptengineer')>=0||(/^\s*<svg/i.test(el.innerHTML)&&rect.width<60&&rect.height<60)){el.remove();}}}});}removeBadges();var mo=window.MutationObserver?new MutationObserver(function(){removeBadges();document.querySelectorAll('*').forEach(scanShadows);}):null;if(mo){mo.observe(document.body||document.documentElement,{childList:true,subtree:true});}[0,100,300,500,1000,1500,2500,4000].forEach(function(d){setTimeout(removeBadges,d);});})();`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <AuthProvider>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
          <Toaster position="top-center" />
        </AuthProvider>
      </LangProvider>
    </QueryClientProvider>
  );
}
