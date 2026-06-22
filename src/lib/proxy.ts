/**
 * Proxy engine helpers.
 *
 * Two completely separate stacks now:
 *
 *   Ultraviolet 3
 *     - URL-encoded iframe src style (cfg.prefix + cfg.encodeUrl(url)).
 *     - Transport: bare-mux + bare-v3, hitting our embedded bare server at
 *       /api/public/bare/v3/ (Cloudflare Worker, no external host needed).
 *
 *   Scramjet 2.0.67-alpha.1
 *     - Brand-new controller architecture: window owns a `Controller`
 *       which attaches to an iframe element and drives navigation via
 *       `frame.go(url)`. The controller talks RPC to the SW, which
 *       holds the ScramjetFetchHandler.
 *     - Transport: wisp WebSocket (LibcurlClient). Defaults to the
 *       Mercury Workshop public wisp endpoint so it works free with
 *       zero setup.
 */

export type ProxyEngine = "uv" | "scramjet";

export type PrismAccent =
  | "mint" | "violet" | "amber" | "rose"
  | "sky" | "emerald" | "crimson" | "indigo"
  | "lime" | "cyan" | "fuchsia" | "orange"
  | "teal" | "slate" | "midnight";

export const ACCENTS: { id: PrismAccent; label: string; swatch: string }[] = [
  { id: "mint",     label: "Mint",     swatch: "oklch(0.78 0.15 150)" },
  { id: "violet",   label: "Violet",   swatch: "oklch(0.74 0.16 295)" },
  { id: "amber",    label: "Amber",    swatch: "oklch(0.82 0.14 80)" },
  { id: "rose",     label: "Rose",     swatch: "oklch(0.72 0.18 15)" },
  { id: "sky",      label: "Sky",      swatch: "oklch(0.78 0.13 230)" },
  { id: "emerald",  label: "Emerald",  swatch: "oklch(0.72 0.17 160)" },
  { id: "crimson",  label: "Crimson",  swatch: "oklch(0.62 0.22 25)" },
  { id: "indigo",   label: "Indigo",   swatch: "oklch(0.62 0.18 270)" },
  { id: "lime",     label: "Lime",     swatch: "oklch(0.86 0.18 130)" },
  { id: "cyan",     label: "Cyan",     swatch: "oklch(0.82 0.13 200)" },
  { id: "fuchsia",  label: "Fuchsia",  swatch: "oklch(0.72 0.22 330)" },
  { id: "orange",   label: "Orange",   swatch: "oklch(0.74 0.18 50)" },
  { id: "teal",     label: "Teal",     swatch: "oklch(0.72 0.13 190)" },
  { id: "slate",    label: "Slate",    swatch: "oklch(0.68 0.03 250)" },
  { id: "midnight", label: "Midnight", swatch: "oklch(0.55 0.14 260)" },
];

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    BareMux?: any;
    Ultraviolet?: any;
    __uv$config?: {
      prefix: string;
      encodeUrl: (s: string) => string;
      decodeUrl: (s: string) => string;
      [k: string]: unknown;
    };
    $scramjet?: any;
    $scramjetController?: any;
    __prismScramjetController?: any;
    __prismBareConn?: any;
  }
}

export const SETTINGS_KEY = "prism.settings.v2";

export type PrismTheme =
  | "default"
  | "linux"
  | "cartoon"
  | "paper"
  | "noir"
  | "synthwave"
  | "ocean";

export const THEMES: { id: PrismTheme; label: string; hint: string }[] = [
  { id: "default",   label: "Default",   hint: "Calm slate · mint" },
  { id: "linux",     label: "Linux",     hint: "Terminal green on black" },
  { id: "cartoon",   label: "Cartoon",   hint: "Bright pastel + bold" },
  { id: "paper",     label: "Paper",     hint: "Cream + ink" },
  { id: "noir",      label: "Noir",      hint: "Pure black & white" },
  { id: "synthwave", label: "Synthwave", hint: "Purple · pink neon" },
  { id: "ocean",     label: "Ocean",     hint: "Deep blue + teal" },
];

export type PerformanceMode = "boot" | "hover" | "ondemand";

export const PERFORMANCE_MODES: { id: PerformanceMode; label: string; hint: string }[] = [
  { id: "boot",     label: "Eager",    hint: "Warm both engines on startup. Fastest clicks." },
  { id: "hover",    label: "Balanced", hint: "Prefetch on hover/focus only." },
  { id: "ondemand", label: "Light",    hint: "No prewarm. Lowest memory + bandwidth." },
];

export type SearchEngine = "duckduckgo" | "brave" | "startpage" | "ecosia" | "qwant";

export const SEARCH_ENGINES: { id: SearchEngine; label: string; url: (q: string) => string }[] = [
  { id: "duckduckgo", label: "DuckDuckGo", url: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}` },
  { id: "brave",      label: "Brave",      url: (q) => `https://search.brave.com/search?q=${encodeURIComponent(q)}` },
  { id: "startpage",  label: "Startpage",  url: (q) => `https://www.startpage.com/do/search?q=${encodeURIComponent(q)}` },
  { id: "ecosia",     label: "Ecosia",     url: (q) => `https://www.ecosia.org/search?q=${encodeURIComponent(q)}` },
  { id: "qwant",      label: "Qwant",      url: (q) => `https://www.qwant.com/?q=${encodeURIComponent(q)}` },
];

export interface ProxySettings {
  bareUrl: string;
  wispUrl: string;
  defaultEngine: ProxyEngine;
  reducedMotion: boolean;
  accent: PrismAccent;
  theme: PrismTheme;
  wallpaperUrl: string;
  performanceMode: PerformanceMode;
  searchEngine: SearchEngine;
}

export const BUILT_IN_BARE_PATH = "/api/public/bare/";
/** Public wisp endpoint run by Mercury Workshop. Free, no key. */
export const DEFAULT_WISP_URL = "wss://wisp.mercurywork.shop/";

const FALLBACK_BARE_ORIGIN =
  (import.meta.env.VITE_BARE_ORIGIN as string | undefined) ||
  "https://scramjet2.lovable.app";

function defaultBareUrl(): string {
  if (typeof window === "undefined") return BUILT_IN_BARE_PATH;
  const host = window.location.hostname;
  const sameOrigin =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovable.dev");
  const origin = sameOrigin ? window.location.origin : FALLBACK_BARE_ORIGIN;
  return origin + BUILT_IN_BARE_PATH;
}

export const DEFAULT_SETTINGS: ProxySettings = {
  bareUrl: BUILT_IN_BARE_PATH,
  wispUrl: DEFAULT_WISP_URL,
  defaultEngine: "uv",
  reducedMotion: false,
  accent: "mint",
  theme: "default",
  wallpaperUrl: "",
};

export function loadSettings(): ProxySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    const base: ProxySettings = {
      ...DEFAULT_SETTINGS,
      bareUrl: defaultBareUrl(),
    };
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<ProxySettings>;
    if (!parsed.bareUrl) parsed.bareUrl = base.bareUrl;
    if (!parsed.wispUrl) parsed.wispUrl = base.wispUrl;
    return { ...base, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS, bareUrl: defaultBareUrl() };
  }
}

export function saveSettings(s: ProxySettings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-prism-src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.dataset.prismSrc = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

/* -------------------------------------------------------------------------- */
/* Service worker registration (shared)                                       */
/* -------------------------------------------------------------------------- */

let swPromise: Promise<ServiceWorker> | null = null;

function ensureServiceWorker(): Promise<ServiceWorker> {
  if (swPromise) return swPromise;
  swPromise = (async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service workers are required.");
    }
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    // Wait until a controller actually exists (first install needs reload otherwise).
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        const onChange = () => {
          navigator.serviceWorker.removeEventListener("controllerchange", onChange);
          resolve();
        };
        navigator.serviceWorker.addEventListener("controllerchange", onChange);
        // Timeout fallback so the UI doesn't lock forever.
        setTimeout(resolve, 5000);
      });
    }
    return (
      navigator.serviceWorker.controller ?? reg.active ?? (await navigator.serviceWorker.ready).active!
    );
  })().catch((err) => {
    swPromise = null;
    throw err;
  });
  return swPromise;
}

/* -------------------------------------------------------------------------- */
/* Ultraviolet (bare-mux + bare-v3)                                           */
/* -------------------------------------------------------------------------- */

let uvPromise: Promise<void> | null = null;

export function ensureUltravioletReady(bareUrl: string): Promise<void> {
  if (uvPromise) return uvPromise;
  uvPromise = (async () => {
    if (!bareUrl) throw new Error("No bare server configured.");
    // SW first — UV's bundle expects a controller to be live when it fetches.
    await ensureServiceWorker();
    await loadScript("/baremux/index.js");
    await loadScript("/uv/uv.bundle.js");
    await loadScript("/uv/uv.config.js");
    const conn = (window.__prismBareConn ??=
      new window.BareMux.BareMuxConnection("/baremux/worker.js"));
    // Use bare-v3 against our embedded /api/public/bare/ Worker endpoint.
    // Epoxy/wisp was the source of intermittent "headers is not iterable"
    // failures — bare-v3 over our own origin is the reliable path.
    await conn.setTransport("/baremod/index.mjs", [bareUrl]);
    console.info("[prism] UV ready — transport: bare-v3 ->", bareUrl);
  })().catch((err) => {
    uvPromise = null;
    console.error("[prism] UV setup failed:", err);
    throw err;
  });
  return uvPromise;
}

export async function updateBareTransport(bareUrl: string) {
  if (typeof window === "undefined" || !window.__prismBareConn) return;
  await window.__prismBareConn.setTransport("/baremod/index.mjs", [bareUrl]);
}

/** Encode a destination URL for UV (iframe-src style). */
export function buildUvUrl(target: string): string {
  const normalized = normalizeTarget(target);
  const cfg = window.__uv$config;
  if (!cfg) throw new Error("Ultraviolet not loaded yet.");
  return cfg.prefix + cfg.encodeUrl(normalized);
}

/* -------------------------------------------------------------------------- */
/* Scramjet 2 (controller + wisp libcurl transport)                           */
/* -------------------------------------------------------------------------- */

const SCRAMJET_PREFIX = "/~/sj/";
let scramjetPromise: Promise<any> | null = null;

export function ensureScramjetReady(wispUrl: string): Promise<any> {
  if (scramjetPromise) return scramjetPromise;
  scramjetPromise = (async () => {
    if (!wispUrl) throw new Error("No wisp URL configured.");
    // 1. Service worker + controller bundles need to be live in the SW first.
    const sw = await ensureServiceWorker();

    // 2. Load scramjet runtime, then controller API (order matters — controller
    //    asserts $scramjet exists and version-matches).
    await loadScript("/scram/scramjet.js");
    await loadScript("/scram-controller/controller.api.js");

    // 3. Load libcurl transport via a module script (Vite refuses to import
    //    /public ESM directly). The module stashes the class on window.
    if (!(window as any).__prismLibcurl) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.type = "module";
        s.textContent =
          'import LC from "/libcurl/index.mjs"; window.__prismLibcurl = LC; window.dispatchEvent(new Event("__prism-libcurl-ready"));';
        s.onerror = () => reject(new Error("Failed to load libcurl module"));
        window.addEventListener("__prism-libcurl-ready", () => resolve(), { once: true });
        document.head.appendChild(s);
        setTimeout(() => reject(new Error("libcurl load timeout")), 15000);
      });
    }
    const LibcurlClient: any = (window as any).__prismLibcurl;
    const transport = new LibcurlClient({ wisp: wispUrl });

    // NOTE: Do NOT touch bare-mux here. Scramjet has its own libcurl
    // transport; reconfiguring bare-mux would break UV's bare-v3 transport
    // that ensureUltravioletReady set up.

    // 4. Construct the Controller and wait for it to handshake with the SW.
    const { Controller } = window.$scramjetController;
    const controller = new Controller({
      serviceworker: sw,
      transport,
      config: {
        prefix: SCRAMJET_PREFIX,
        scramjetPath: "/scram/scramjet.js",
        injectPath: "/scram-controller/controller.inject.js",
        wasmPath: "/scram/scramjet.wasm",
      },
    });
    await controller.wait();
    window.__prismScramjetController = controller;
    console.info("[prism] Scramjet ready — wisp:", wispUrl);
    return controller;
  })().catch((err) => {
    scramjetPromise = null;
    console.error("[prism] Scramjet setup failed:", err);
    throw err;
  });
  return scramjetPromise;
}

/** Create a Scramjet Frame bound to an iframe element. */
export async function createScramjetFrame(iframeEl: HTMLIFrameElement, wispUrl: string) {
  const controller = await ensureScramjetReady(wispUrl);
  return controller.createFrame(iframeEl, { plugins: [] });
}

/** Warm BOTH engines in the background so first navigation feels instant. */
export function prewarmEngines(s: ProxySettings) {
  void ensureUltravioletReady(s.bareUrl).catch((e) =>
    console.warn("[prism] UV prewarm failed:", e),
  );
  void ensureScramjetReady(s.wispUrl).catch((e) =>
    console.warn("[prism] Scramjet prewarm failed:", e),
  );
}

/**
 * Clear all proxy state: service workers, CacheStorage, and localStorage
 * junk written by the engines. The user's settings are preserved.
 */
export async function clearProxyState(): Promise<void> {
  swPromise = null;
  uvPromise = null;
  scramjetPromise = null;
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch { /* ignore */ }
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch { /* ignore */ }
  try {
    const keep = window.localStorage.getItem(SETTINGS_KEY);
    window.localStorage.clear();
    if (keep !== null) window.localStorage.setItem(SETTINGS_KEY, keep);
  } catch { /* ignore */ }
}

/* -------------------------------------------------------------------------- */

export function normalizeTarget(target: string): string {
  const t = target.trim();
  if (!t) return t;
  if (/^https?:\/\//i.test(t)) return t;
  if (/\.[a-z]{2,}/i.test(t)) return `https://${t}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(t)}`;
}

export function otherEngine(e: ProxyEngine): ProxyEngine {
  return e === "uv" ? "scramjet" : "uv";
}

export function engineLabel(e: ProxyEngine): string {
  return e === "uv" ? "Ultraviolet" : "Scramjet";
}

/**
 * Warm a target URL through the service worker so a later click feels
 * instant. Best-effort: silently ignores errors and dedupes per URL.
 */
const prefetched = new Set<string>();
export function prefetchTarget(target: string, settings: ProxySettings) {
  if (!target) return;
  const url = normalizeTarget(target);
  if (prefetched.has(url)) return;
  prefetched.add(url);
  // Kick UV's pipeline first — it's the default engine.
  ensureUltravioletReady(settings.bareUrl)
    .then(() => {
      try {
        const proxied = buildUvUrl(url);
        // no-cors fetch warms the SW + bare cache without CORS errors.
        void fetch(proxied, { mode: "no-cors", credentials: "omit" }).catch(() => {});
      } catch {
        /* ignore */
      }
    })
    .catch(() => {});
}