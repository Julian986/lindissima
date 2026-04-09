/**
 * Google Analytics 4 helpers (gtag.js).
 * No-op in development and when NEXT_PUBLIC_GA_MEASUREMENT_ID is unset.
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

function isGaEnabled(): boolean {
  return process.env.NODE_ENV === "production" && GA_MEASUREMENT_ID.length > 0;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Send a virtual pageview (route changes in the App Router). */
export function pageview(url: string): void {
  if (!isGaEnabled()) return;
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer ?? [];
  const send = () => {
    window.gtag?.("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  };

  if (typeof window.gtag === "function") {
    send();
    return;
  }

  window.requestAnimationFrame(() => {
    if (typeof window.gtag === "function") {
      send();
    }
  });
}

/** Track a custom GA4 event (e.g. conversions, funnels). */
export function event(action: string, params?: Record<string, unknown>): void {
  if (!isGaEnabled()) return;
  if (typeof window === "undefined") return;
  window.gtag?.("event", action, params ?? {});
}
