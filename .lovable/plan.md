
## Heads-up before we do this

jsDelivr is a pure static CDN. Two things from your project will **not** work if served from `cdn.jsdelivr.net`:

1. **Service workers** (UV + Scramjet both require one). Browsers will not let your page register a SW on `cdn.jsdelivr.net/...` — the scope belongs to jsDelivr, not you. **This means the proxy itself cannot actually run from a jsDelivr-hosted page.**
2. **TanStack Start SSR / server routes** — jsDelivr only serves the files in your repo, not the built `.output/` worker.

What jsDelivr **is** good for here:
- Mirroring individual client assets (`/baremod/index.mjs`, the `/scramjet/` bundle, images, CSS) so other sites can `<script src="https://cdn.jsdelivr.net/gh/you/repo@main/public/scramjet/scramjet.controller.js">` them.
- Serving a static landing page that links to your real Lovable-hosted proxy.

If your actual goal is "the proxy works at a jsDelivr URL", that isn't possible regardless of what we change — the browser blocks it. The plan below assumes you want the **split: keep the working proxy on Lovable, expose the repo on jsDelivr** so the bundle files are CDN-hosted.

## Plan

### 1. Make the bare server URL fully cross-origin friendly
- `src/lib/proxy.ts` — change `defaultBareUrl()` so when the page is **not** on a `*.lovable.app` origin, it falls back to the project's published URL (`https://scramjet2.lovable.app/api/public/bare/`) instead of `window.location.origin + ...`. On Lovable previews it keeps the current same-origin behavior.
- Add a `VITE_BARE_URL` override so anyone forking the repo can point at their own bare host.

### 2. Add CORS to the bare endpoint
- `src/routes/api/public/bare.$.tsx` — add an `OPTIONS` handler returning 204 with permissive CORS, and append the same CORS headers (`Access-Control-Allow-Origin: *`, `Allow-Methods`, `Allow-Headers: *`, `Expose-Headers: *`) to every response (including the split `x-bare-headers-*` ones and error responses).
- This lets a page on any origin talk to `https://scramjet2.lovable.app/api/public/bare/`.

### 3. Add a tiny README section for jsDelivr
- New `JSDELIVR.md` at repo root explaining:
  - How to connect to GitHub from Lovable (+ menu → GitHub → Connect).
  - The two URL forms: `cdn.jsdelivr.net/gh/<user>/<repo>@<branch>/<path>` for live tracking, and `@<tag>` for pinned versions.
  - Which files are useful to mirror (`public/baremod/`, `public/scramjet/`, `public/baremux/`, `public/uv/`).
  - The hard limitation: a page served from jsDelivr **cannot** register the UV/Scramjet service worker, so the full proxy UI must stay on the Lovable URL.

### 4. (Optional, only if you confirm) Static landing page on jsDelivr
- A standalone `static/index.html` in the repo that just looks like the Prism homepage and redirects/links into the real `https://scramjet2.lovable.app`. That HTML file can be loaded from `cdn.jsdelivr.net` and gives you a "jsDelivr URL" to share, without pretending the proxy runs there.

## What I will NOT touch
- Service-worker registration code, UV bundle, Scramjet bundle.
- Settings/UI behavior — `bareUrl` is already user-editable in Settings; we're only changing its default.

## Question before I build

Step 4 (the static landing page) only makes sense if you actually want a `cdn.jsdelivr.net/...` link to hand out. If you just want the assets mirrored, steps 1-3 are enough. Tell me which, and I'll switch to build mode and ship it.
