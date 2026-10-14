import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { lazy, useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { LangProvider } from "@/lib/i18n";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";

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

// Wrap in React.lazy so the component matches the router's ErrorRouteComponent
// type (which after the recent @tanstack/react-router update requires a lazy
// component with an optional preload method).
const ErrorComponent = lazy(async () => {
  function ErrorInner({ error, reset }: { error: unknown; reset: () => void }) {
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

  return { default: ErrorInner };
});

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "سكنة وحانوت — Immobilier en Algérie" },
      {
        name: "description",
        content:
          "سكنة وحانوت : annonces immobilières en Algérie — offres et demandes, filtrées par wilaya et baladiya.",
      },
      { name: "author", content: "سكنة وحانوت" },
      { property: "og:title", content: "سكنة وحانوت — Immobilier en Algérie" },
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
            __html: `(function(){var SELECTORS='[data-lovable-badge],.lovable-badge,.lovable-preview-badge,.lovable-floating-badge,[class*="lovable-badge"],[class*="preview-badge"],[class*="floating-badge"],[class*="lovable-close"],[class*="lovable-dismiss"],[id*="lovable-badge"],[id*="gptengineer"],iframe[src*="lovable"],iframe[src*="gptengineer"],a[href*="lovable.dev"],a[href*="gptengineer.app"]';var css=SELECTORS+'{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;height:0!important;width:0!important;z-index:-9999!important;}';function injectCss(root){var s=document.createElement('style');s.setAttribute('data-hide-lovable-badge','');s.textContent=css;(root.head||root.documentElement||root).appendChild(s);}injectCss(document);function scanShadows(node){if(node.shadowRoot){injectCss(node.shadowRoot);node.shadowRoot.querySelectorAll('*').forEach(scanShadows);}}function isBadgeLike(el){var html=(el.outerHTML||'').toLowerCase();if(html.indexOf('lovable')>=0||html.indexOf('gptengineer')>=0||html.indexOf('badge')>=0)return true;var text=(el.textContent||'').replace(/\\s/g,'');var rect=el.getBoundingClientRect();if(rect.width>64||rect.height>64)return false;return text==='\\u00d7'||text==='x'||text==='X'||(/^\\s*<svg/i.test(el.innerHTML)&&text==='');}function removeBadges(){document.querySelectorAll(SELECTORS).forEach(function(el){el.remove();});document.querySelectorAll('*').forEach(function(el){scanShadows(el);var style=window.getComputedStyle(el);if(style.position!=='fixed'&&style.position!=='absolute')return;var rect=el.getBoundingClientRect();if(rect.width<=0||rect.height<=0)return;var vw=window.innerWidth,vh=window.innerHeight;if(rect.bottom<vh-100||rect.right<vw-100)return;if(isBadgeLike(el))el.remove();});}removeBadges();var mo=window.MutationObserver?new MutationObserver(function(){removeBadges();}):null;if(mo){mo.observe(document.body||document.documentElement,{childList:true,subtree:true});}[0,100,300,500,1000,1500,2500,4000].forEach(function(d){setTimeout(removeBadges,d);});})();`,
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

  // Initialize AdMob once at the app root (no-op on the web).
  useEffect(() => {
    void import("@/lib/admob").then(({ initAdMob }) => initAdMob());
  }, []);

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
