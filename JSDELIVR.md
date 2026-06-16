# Hosting / mirroring Prism on jsDelivr

jsDelivr is a **static CDN**. It serves the files in your GitHub repo as-is;
it does not run server code and it does not let your page register a service
worker scoped to your own site. That has real consequences for this project.

## What works on jsDelivr

- Mirroring individual client bundles so other sites can `<script src=...>` them:
  - `public/baremod/index.mjs` — bare-v3 transport
  - `public/baremux/` — bare-mux loader + worker
  - `public/scramjet/` — Scramjet runtime, worker, controller
  - `public/uv/` — Ultraviolet runtime
- Serving plain landing/redirect HTML that links into the real proxy.

## What does NOT work on jsDelivr

- **The proxy itself.** UV and Scramjet both require a service worker, and
  browsers only allow a page to register a SW under its own origin's scope.
  A page loaded from `cdn.jsdelivr.net` cannot register a SW for *your* site.
- **`/api/public/bare/*` and any other server route.** jsDelivr serves files,
  not the TanStack Start worker. Keep the bare server on Lovable.

## Setup

### 1. Connect to GitHub from Lovable
In the Lovable editor → `+` menu (bottom-left of the chat) → **GitHub** →
**Connect project**. Authorize the Lovable GitHub App, pick the account/org,
then **Create Repository**. Code now syncs both ways.

### 2. jsDelivr URL shapes

Live (tracks a branch — changes propagate within ~12h):

```
https://cdn.jsdelivr.net/gh/<user>/<repo>@main/<path>
```

Pinned (recommended for anything you share publicly):

```
https://cdn.jsdelivr.net/gh/<user>/<repo>@v1.0.0/<path>
```

Tag a release on GitHub (`git tag v1.0.0 && git push --tags`) so the URL is
immutable.

### 3. Examples

```html
<!-- Pull the bare-v3 transport from jsDelivr instead of /baremod/ -->
<script type="module"
  src="https://cdn.jsdelivr.net/gh/<user>/<repo>@main/public/baremod/index.mjs">
</script>

<!-- Scramjet controller -->
<script
  src="https://cdn.jsdelivr.net/gh/<user>/<repo>@main/public/scramjet/scramjet.controller.js">
</script>
```

## Pointing a forked frontend at this bare server

The bare endpoint at `https://scramjet2.lovable.app/api/public/bare/` already
sends `Access-Control-Allow-Origin: *` on every response, so a frontend served
from any other origin (jsDelivr, GitHub Pages, your own domain) can use it.

Two ways to switch the default in a fork:

1. **Settings sheet** in the running app — change "Bare server URL" and save.
2. **Build-time env var** — set `VITE_BARE_ORIGIN` before building:
   ```
   VITE_BARE_ORIGIN=https://scramjet2.lovable.app bun run build
   ```

When the page is served from any host other than `*.lovable.app` /
`*.lovable.dev` / localhost, the default automatically falls back to
`VITE_BARE_ORIGIN` (or `https://scramjet2.lovable.app` if unset).
