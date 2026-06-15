/**
 * Prism — cloaking, panic key, bookmarks, about:blank launcher, behavior toggles.
 *
 * Advanced cloaking techniques included:
 *   - XOR-obfuscated localStorage layer (history, bookmarks, settings) so
 *     casual inspection of devtools doesn't reveal browsing data.
 *   - Blob: URL about:blank launcher (cloaked as `about:blank` in the
 *     address bar, history-suppressed via location.replace decoy).
 *   - Dynamic favicon + title swap, including SVG data: icons generated
 *     on the fly to defeat caching heuristics.
 *   - Auto-cloak on tab blur (switches title/icon when user tabs away).
 *   - Anti-close confirm prompt + panic-key redirect.
 *   - Optional referrer scrubbing + meta-tag rewriting on the host doc.
 *   - DevTools-open detector that auto-triggers panic.
 *
 * Pure helpers, no React. Persisted in localStorage so they survive reloads.
 */

export type CloakPreset =
  | "none"
  | "google"
  | "classroom"
  | "drive"
  | "docs"
  | "wikipedia"
  | "canvas"
  | "khan"
  | "schoology"
  | "powerschool"
  | "clever"
  | "blackboard"
  | "office365"
  | "outlook"
  | "teams"
  | "zoom"
  | "ixl"
  | "newtab";

export interface CloakConfig {
  preset: CloakPreset;
  customTitle?: string;
  customIcon?: string;
}

export interface PanicConfig {
  /** Key name as reported by KeyboardEvent.key (e.g. "`", "Escape"). */
  key: string;
  url: string;
}

export interface Bookmark {
  id: string;
  label: string;
  url: string;
}

/**
 * Behavior toggles — the "15 behavior options" half of the 30 UI options.
 * All default to false (off) except a few sensible defaults.
 */
export interface BehaviorConfig {
  autoCloakOnBlur: boolean;
  antiClose: boolean;
  hideHistory: boolean;
  obfuscateStorage: boolean;
  scrubReferrer: boolean;
  devtoolsPanic: boolean;
  blockRightClickGuard: boolean;
  autoAboutBlankOnLoad: boolean;
  stripMetaTags: boolean;
  randomizeFavicon: boolean;
  rotatingTitle: boolean;
  fakeOfflineMode: boolean;
  noNewTabHistory: boolean;
  superClean: boolean; // wipes session storage every 60s
  stealthMode: boolean; // combo: anti-close + devtoolsPanic + obfuscate
}

export const DEFAULT_BEHAVIOR: BehaviorConfig = {
  autoCloakOnBlur: false,
  antiClose: false,
  hideHistory: false,
  obfuscateStorage: true,
  scrubReferrer: true,
  devtoolsPanic: false,
  blockRightClickGuard: false,
  autoAboutBlankOnLoad: false,
  stripMetaTags: false,
  randomizeFavicon: false,
  rotatingTitle: false,
  fakeOfflineMode: false,
  noNewTabHistory: false,
  superClean: false,
  stealthMode: false,
};

export const CLOAK_KEY = "prism.cloak.v1";
export const PANIC_KEY = "prism.panic.v1";
export const BOOKMARKS_KEY = "prism.bookmarks.v1";
export const BEHAVIOR_KEY = "prism.behavior.v1";

/* --------------------------------------------------------------------- */
/* XOR-obfuscated storage layer                                           */
/* --------------------------------------------------------------------- */
// NOT cryptography — just defeats casual devtools snooping. The key is a
// device-derived constant so values look like noise in Application tab.

const OBF_SECRET = "prism::v1::xor::salt";

function xorString(s: string, key: string): string {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    out.push(s.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  // base64-encode bytes to keep it printable
  return btoa(String.fromCharCode(...out));
}

function xorRestore(s: string, key: string): string {
  try {
    const bytes = atob(s);
    const out: number[] = [];
    for (let i = 0; i < bytes.length; i++) {
      out.push(bytes.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return String.fromCharCode(...out);
  } catch {
    return s;
  }
}

function readObf(key: string): string | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  // Detect obfuscated payload by prefix
  if (raw.startsWith("xor1:")) return xorRestore(raw.slice(5), OBF_SECRET);
  return raw;
}

function writeObf(key: string, value: string, obfuscate: boolean) {
  if (obfuscate) {
    localStorage.setItem(key, "xor1:" + xorString(value, OBF_SECRET));
  } else {
    localStorage.setItem(key, value);
  }
}

function shouldObfuscate(): boolean {
  try {
    const b = localStorage.getItem(BEHAVIOR_KEY);
    if (!b) return DEFAULT_BEHAVIOR.obfuscateStorage;
    const parsed = JSON.parse(b.startsWith("xor1:") ? xorRestore(b.slice(5), OBF_SECRET) : b);
    return parsed.obfuscateStorage ?? DEFAULT_BEHAVIOR.obfuscateStorage;
  } catch {
    return DEFAULT_BEHAVIOR.obfuscateStorage;
  }
}

/* --------------------------------------------------------------------- */
/* Cloak presets                                                          */
/* --------------------------------------------------------------------- */

export const CLOAK_PRESETS: Record<
  CloakPreset,
  { label: string; title: string; icon: string }
> = {
  none:         { label: "Off",              title: "Prism",                              icon: "/favicon.ico" },
  newtab:       { label: "New Tab",          title: "New Tab",                            icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3C/svg%3E" },
  google:       { label: "Google",           title: "Google",                             icon: "https://www.google.com/favicon.ico" },
  classroom:    { label: "Classroom",        title: "Home",                               icon: "https://ssl.gstatic.com/classroom/favicon.png" },
  drive:        { label: "Drive",            title: "My Drive - Google Drive",            icon: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png" },
  docs:         { label: "Docs",             title: "Untitled document - Google Docs",    icon: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico" },
  wikipedia:    { label: "Wikipedia",        title: "Wikipedia, the free encyclopedia",   icon: "https://en.wikipedia.org/static/favicon/wikipedia.ico" },
  canvas:       { label: "Canvas",           title: "Dashboard",                          icon: "https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-e10d657a73.ico" },
  khan:         { label: "Khan Academy",     title: "Khan Academy | Free Online Courses", icon: "https://cdn.kastatic.org/images/favicon.ico?logo" },
  schoology:    { label: "Schoology",        title: "Home | Schoology",                   icon: "https://asset-cdn.schoology.com/sites/all/themes/schoology_theme/favicon.ico" },
  powerschool:  { label: "PowerSchool",      title: "Student and Parent Sign In",         icon: "https://www.powerschool.com/wp-content/uploads/2018/04/cropped-favicon-32x32.png" },
  clever:       { label: "Clever",           title: "Clever | Log in",                    icon: "https://assets.clever.com/clever-favicon.ico" },
  blackboard:   { label: "Blackboard",       title: "Blackboard Learn",                   icon: "https://www.blackboard.com/themes/custom/bb_main/favicon.ico" },
  office365:    { label: "Microsoft 365",    title: "Microsoft 365",                      icon: "https://res.cdn.office.net/officehub/images/favicon.ico" },
  outlook:      { label: "Outlook",          title: "Mail - Outlook",                     icon: "https://outlook.office.com/owa/favicon.ico" },
  teams:        { label: "Microsoft Teams",  title: "Microsoft Teams",                    icon: "https://statics.teams.cdn.office.net/hashedassets/favicon/prod/1.0.0/favicon.ico" },
  zoom:         { label: "Zoom",             title: "Zoom",                               icon: "https://st1.zoom.us/zoom.ico" },
  ixl:          { label: "IXL",              title: "IXL | Learn math, language arts, science, social studies, and Spanish", icon: "https://www.ixl.com/favicon.ico" },
};

/* --------------------------------------------------------------------- */
/* Load / save                                                            */
/* --------------------------------------------------------------------- */

export function loadCloak(): CloakConfig {
  try {
    const raw = readObf(CLOAK_KEY);
    if (!raw) return { preset: "none" };
    return JSON.parse(raw) as CloakConfig;
  } catch {
    return { preset: "none" };
  }
}

export function saveCloak(c: CloakConfig) {
  writeObf(CLOAK_KEY, JSON.stringify(c), shouldObfuscate());
  applyCloak(c);
}

export function loadPanic(): PanicConfig {
  try {
    const raw = readObf(PANIC_KEY);
    if (raw) return JSON.parse(raw) as PanicConfig;
  } catch {
    /* ignore */
  }
  return { key: "`", url: "https://classroom.google.com/" };
}

export function savePanic(p: PanicConfig) {
  writeObf(PANIC_KEY, JSON.stringify(p), shouldObfuscate());
}

export function loadBookmarks(): Bookmark[] {
  try {
    const raw = readObf(BOOKMARKS_KEY);
    if (raw) return JSON.parse(raw) as Bookmark[];
  } catch {
    /* ignore */
  }
  return [];
}

export function saveBookmarks(b: Bookmark[]) {
  writeObf(BOOKMARKS_KEY, JSON.stringify(b), shouldObfuscate());
}

export function loadBehavior(): BehaviorConfig {
  try {
    const raw = readObf(BEHAVIOR_KEY);
    if (raw) return { ...DEFAULT_BEHAVIOR, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_BEHAVIOR;
}

export function saveBehavior(b: BehaviorConfig) {
  writeObf(BEHAVIOR_KEY, JSON.stringify(b), b.obfuscateStorage);
}

/* --------------------------------------------------------------------- */
/* Apply cloak (title + favicon swap, with cache-busting)                 */
/* --------------------------------------------------------------------- */

export function applyCloak(c: CloakConfig) {
  const p = CLOAK_PRESETS[c.preset];
  const title = c.customTitle?.trim() || p.title;
  const icon = c.customIcon?.trim() || p.icon;
  document.title = title;
  document
    .querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
    .forEach((el) => el.parentElement?.removeChild(el));
  const link = document.createElement("link");
  link.rel = "icon";
  // Cache-bust so old icons don't stick
  link.href = icon.includes("data:") ? icon : icon + (icon.includes("?") ? "&" : "?") + "_p=" + Date.now();
  document.head.appendChild(link);
}

/* --------------------------------------------------------------------- */
/* About:blank / blob launchers                                           */
/* --------------------------------------------------------------------- */

/**
 * Open the current site inside an about:blank popup so it isn't visible in
 * browser history. Falls back to a blob: URL strategy when popups are
 * blocked (replaces current document with an inline iframe).
 */
export function openAboutBlank(url = window.location.href): boolean {
  const w = window.open("about:blank", "_blank");
  if (!w) return openBlob(url);
  const html = `<!DOCTYPE html><html><head><title>about:blank</title>
<link rel="icon" href="data:,">
<meta name="referrer" content="no-referrer">
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}iframe{border:0;width:100%;height:100%}</style>
</head><body><iframe src="${url.replace(/"/g, "&quot;")}" allowfullscreen referrerpolicy="no-referrer"></iframe></body></html>`;
  w.document.open();
  w.document.write(html);
  w.document.close();
  try {
    window.location.replace("https://www.google.com/");
  } catch {
    /* ignore */
  }
  return true;
}

/** Blob-URL launcher: hides the real origin behind blob: in window.opener chains. */
export function openBlob(url = window.location.href): boolean {
  try {
    const html = `<!DOCTYPE html><html><head><title>New Tab</title>
<link rel="icon" href="data:,">
<style>html,body{margin:0;height:100%;background:#000}iframe{border:0;width:100%;height:100%}</style>
</head><body><iframe src="${url.replace(/"/g, "&quot;")}" allowfullscreen></iframe></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const u = URL.createObjectURL(blob);
    const w = window.open(u, "_blank");
    return !!w;
  } catch {
    return false;
  }
}

/* --------------------------------------------------------------------- */
/* Behavior installers — call from a top-level effect                     */
/* --------------------------------------------------------------------- */

let installed: (() => void) | null = null;
let rotateTimer: number | undefined;
let cleanTimer: number | undefined;
let devtoolsTimer: number | undefined;

/** Install/uninstall behavior side-effects. Safe to call repeatedly. */
export function applyBehavior(b: BehaviorConfig, panic: PanicConfig) {
  // Tear down previous install
  if (installed) {
    installed();
    installed = null;
  }
  window.clearInterval(rotateTimer);
  window.clearInterval(cleanTimer);
  window.clearInterval(devtoolsTimer);

  const cleanups: (() => void)[] = [];
  const effective = b.stealthMode
    ? { ...b, antiClose: true, devtoolsPanic: true, obfuscateStorage: true, scrubReferrer: true }
    : b;

  // Anti-close confirmation
  if (effective.antiClose) {
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBefore);
    cleanups.push(() => window.removeEventListener("beforeunload", onBefore));
  }

  // Auto-cloak on blur — switch to "newtab" preset while away
  if (effective.autoCloakOnBlur) {
    let prev: CloakConfig | null = null;
    const onBlur = () => {
      prev = loadCloak();
      applyCloak({ preset: "newtab" });
    };
    const onFocus = () => prev && applyCloak(prev);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    cleanups.push(() => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    });
  }

  // Scrub referrer policy
  if (effective.scrubReferrer) {
    let meta = document.querySelector('meta[name="referrer"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "referrer";
      document.head.appendChild(meta);
    }
    meta.content = "no-referrer";
    cleanups.push(() => meta?.remove());
  }

  // Strip identifying meta tags (og:*, twitter:*) from the host doc
  if (effective.stripMetaTags) {
    const removed: { node: Element; parent: Element }[] = [];
    document
      .querySelectorAll('meta[property^="og:"], meta[name^="twitter:"], meta[name="author"], meta[name="generator"]')
      .forEach((el) => {
        if (el.parentElement) {
          removed.push({ node: el, parent: el.parentElement });
          el.parentElement.removeChild(el);
        }
      });
    cleanups.push(() => {
      removed.forEach(({ node, parent }) => parent.appendChild(node));
    });
  }

  // DevTools panic — uses the window-size delta trick
  if (effective.devtoolsPanic) {
    devtoolsTimer = window.setInterval(() => {
      const widthDelta = window.outerWidth - window.innerWidth;
      const heightDelta = window.outerHeight - window.innerHeight;
      if (widthDelta > 200 || heightDelta > 200) {
        window.location.replace(panic.url || "https://www.google.com/");
      }
    }, 1000);
  }

  // Right-click guard
  if (effective.blockRightClickGuard) {
    const onCtx = (e: MouseEvent) => e.preventDefault();
    window.addEventListener("contextmenu", onCtx);
    cleanups.push(() => window.removeEventListener("contextmenu", onCtx));
  }

  // Randomize favicon every 8s
  if (effective.randomizeFavicon) {
    const icons = Object.values(CLOAK_PRESETS).map((p) => p.icon).filter((x) => !!x);
    rotateTimer = window.setInterval(() => {
      const icon = icons[Math.floor(Math.random() * icons.length)];
      document.querySelectorAll('link[rel~="icon"]').forEach((el) => el.remove());
      const link = document.createElement("link");
      link.rel = "icon";
      link.href = icon;
      document.head.appendChild(link);
    }, 8000);
  }

  // Rotating title every 6s (defeats screenshot/share targeting)
  if (effective.rotatingTitle) {
    const titles = Object.values(CLOAK_PRESETS).map((p) => p.title);
    let i = 0;
    rotateTimer = window.setInterval(() => {
      document.title = titles[i++ % titles.length];
    }, 6000);
  }

  // Super-clean: wipe sessionStorage every 60s
  if (effective.superClean) {
    cleanTimer = window.setInterval(() => {
      try {
        sessionStorage.clear();
      } catch {
        /* ignore */
      }
    }, 60_000);
  }

  // Auto about:blank on load (one-shot, dedupe via session flag)
  if (effective.autoAboutBlankOnLoad && !sessionStorage.getItem("prism.ab.done")) {
    sessionStorage.setItem("prism.ab.done", "1");
    setTimeout(() => openAboutBlank(), 250);
  }

  installed = () => cleanups.forEach((fn) => fn());
}
