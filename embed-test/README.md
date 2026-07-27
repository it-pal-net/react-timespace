# Embed CSP test harness

A standalone page that loads the real hosted widget
(`https://synccontact.com/timespace/embed.js`) from a different origin, under a
simulated host-page CSP, and reports exactly what the browser blocked.

```sh
python3 -m http.server 8137 --directory embed-test
# then open http://localhost:8137/?csp=off
```

Serve it over HTTP — don't open it as `file://`. A `file://` page has a null
origin, which changes how `'self'` and the `postMessage` origin check behave and
makes the results meaningless.

## What it tests

Two mounts, so a failure can be attributed:

- **A · loader script** — the documented `<script src=".../embed.js" data-*>`
  integration. Exercises `script-src` *and* `frame-src`.
- **B · direct iframe** — frames `/timespace-embed.html` itself, no loader.
  Exercises `frame-src` alone, so you can tell the two apart.

Switch host policies with `?csp=`:

| preset          | policy                                       | expected                        |
| --------------- | -------------------------------------------- | ------------------------------- |
| `off`           | none                                         | both render                     |
| `strict`        | `default-src 'self'`                         | both blocked                    |
| `script-ok`     | script allowed, `frame-src 'none'`           | script runs, iframe blocked     |
| `wildcard-trap` | `https://*.synccontact.com`                  | both blocked — see below        |
| `correct`       | `script-src` + `frame-src synccontact.com`   | both render                     |

Every preset keeps `'unsafe-inline'` so the harness's own inline code survives
its own policy. That never whitelists an external `src`, so the test stays real.

## Detecting whether a frame actually loaded

Harder than it looks, and two obvious approaches both lie:

- A CSP-blocked frame **still fires `load`** — the browser navigates it to
  `about:blank`.
- Reading `contentWindow.location` **throws for a blocked frame** exactly as it
  does for a genuine cross-origin one, because the blocked frame gets an opaque
  origin.

The harness instead keys off the widget's own height handshake. The embed page
posts `{type:"timespace:height", id}` echoing the `embedId` it was given, so each
frame confirms itself independently. No handshake + a `frame-src` violation =
blocked.

## Findings (verified 2026-07-27, headless Chrome against production)

**Third-party embedding currently works.** No CSP violation and a live height
handshake from both mounts under a permissive host policy.

**`synccontact.com` does not restrict framing.** The response carries no
`frame-ancestors` and no `X-Frame-Options`. Note `frame-ancestors` does *not*
fall back to `default-src`, so the `default-src 'none'` in the current policy
does nothing to limit who may frame the widget. That is correct for a public
embed — just be aware that adding `frame-ancestors 'self'` or
`X-Frame-Options: SAMEORIGIN` to the site later silently kills every embed.

**The wildcard trap.** `https://*.synccontact.com` does **not** match the apex
`https://synccontact.com` — a wildcard matches subdomains only. A host page
allowlisting the wildcard gets both the script and the frame blocked, which is
what the `wildcard-trap` preset reproduces.

The site's own policy had the same shape (`frame-src *.synccontact.com`) and so
could not frame its own apex either. Fixed 2026-07-27 in the two CloudFront
response headers policies on distribution `E2OVCXZD4I2H` (`synccontact-app` and
`synccontact-app-no-cache`), both now `frame-src 'self' *.synccontact.com`. It
was latent rather than live — a headless sweep of `/`, `/timespace` and
`/timespace-embed.html` reported zero violations both before and after.

**The silent failure mode.** Under `script-ok`, `embed.js` loads and runs with
no error, inserts the iframe, and the iframe is then blocked. There is nothing
in the console from the loader — just an empty box. Worth having the loader
detect this and surface a message.

**Height sync was a no-op — fixed in source, not yet deployed.**
`timespace:height` reported back whatever height the iframe already had, at
every size tested:

```
frame  250 -> reported 362     frame  900 -> reported 900
frame  380 -> reported 380     frame 1400 -> reported 1400
frame  500 -> reported 500
```

`EmbedApp.jsx` measured `document.documentElement.scrollHeight` and observed
`documentElement`. GlobalStyles pins `html`/`body` to `height: 100%`, and
`scrollHeight` is floored at the viewport height, so both track the iframe being
sized — the frame's height fed into itself and stuck at whatever `data-height`
the host started with. (It only ever read true when the frame was *shorter* than
the content, hence 362 at 250px.)

Fixed in `sync-contact` at
`apps/web/containers/TimespacePlayground/EmbedApp.jsx` by measuring the React
root, which is laid out from its content. Verified against the live page:

```
frame 250/380/500/900/1400 -> 362 constant   (old: tracked the frame exactly)
width 420 -> 393, 700 -> 378, 1200 -> 362    (still reflows for real)
```

Until that ships, this harness runs against production and will still show the
echo behaviour.
