# Embed CSP test harness

A standalone page that loads the real hosted widget
(`https://synccontact.com/timespace/embed.js`) from a different origin, under a
simulated host-page CSP, and reports exactly what the browser blocked.

```sh
python3 -m http.server 8137 --directory embed-test
# then open http://localhost:8137/?csp=off
```

Serve it over HTTP — don't open it as `file://`. A `file://` page has an opaque
origin, so `'self'` stops standing for a real host and the presets no longer
represent a policy any actual embedder would ship. (Measured 2026-07-27: the
verdicts happened to come out identical from `file://`, but that is luck, not a
guarantee — the diagnostics panel shows `Page origin` so you can tell which way
you ran it.)

## What it tests

Two mounts, so a failure can be attributed:

- **A · loader script** — the documented `<script src=".../embed.js" data-*>`
  integration. Exercises `script-src` *and* `frame-src`.
- **B · direct iframe** — frames `/timespace-embed.html` itself, no loader.
  Exercises `frame-src` alone, so you can tell the two apart. With no loader to
  consume the height handshake, the harness applies it to this frame itself —
  otherwise `data-height` stays a fixed height and leaves dead space under a
  shorter widget (380 given, 306 reported). Resizing is a host-page concern, not
  a CSP one, so B still isolates `frame-src` from `script-src`.

Switch host policies with `?csp=`:

| preset          | simulated host policy                      | expected                          |
| --------------- | ------------------------------------------ | --------------------------------- |
| `off`           | none                                       | **pass** — both render            |
| `strict`        | `default-src 'self'`                       | **fail** — both blocked           |
| `script-ok`     | script allowed, `frame-src 'none'`         | **fail** — frame blocked, script runs |
| `wildcard-trap` | `https://*.synccontact.com`                | **fail** — both blocked           |
| `correct`       | `script-src` + `frame-src synccontact.com` | **pass** — both render            |

Every preset keeps `'unsafe-inline'` so the harness's own inline code survives
its own policy. That never whitelists an external `src`, so the test stays real.

## Reading the results

**Three of the five presets are supposed to fail.** They are negative controls
that prove the harness can actually see blocking, so red under `strict`,
`script-ok` and `wildcard-trap` means it is working. Only `off` and `correct`
must come out green — if either of those goes red, embedding is genuinely
broken and that is the signal to chase.

`wildcard-trap` will stay red permanently, by design. It models a mistake in the
**embedder's** CSP — a third-party header served from their origin — not ours.
Nothing deployed on `synccontact.com` can turn it green; the fix for a host page
hitting it is to allowlist the apex, which is exactly what `correct` shows.
(That is a separate thing from the same-shaped bug in the site's *own* policy,
fixed in CloudFront and described under Findings below.)

**A small height such as 152px is an artifact, not the content height.** The
loader tags its iframe `loading="lazy"`, and browsers deprioritise offscreen
cross-origin frames in general, so a mount sitting below the fold can be
sampled while still half-rendered. Scroll both into view and reload; they
converge on the real height. Screenshots have the mirror-image version of this:
a frame that is genuinely fine can capture blank, because `captureBeyondViewport`
does not rasterise offscreen cross-origin frames. Trust the height handshake in
the message log over either.

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

**Height sync was a no-op — fixed and deployed 2026-07-27.**
`timespace:height` used to report back whatever height the iframe already had,
so `data-height` became a permanent fixed height:

```
frame  250 -> reported 362     frame  900 -> reported 900
frame  380 -> reported 380     frame 1400 -> reported 1400
frame  500 -> reported 500
```

`EmbedApp.jsx` measured `document.documentElement.scrollHeight` and observed
`documentElement`. GlobalStyles pins `html`/`body` to `height: 100%`, and
`scrollHeight` is floored at the viewport height, so both track the iframe being
sized — the frame's height fed into itself and stuck wherever the host started
it. (It only ever read true when the frame was *shorter* than the content, hence
362 at 250px.)

Fixed in `sync-contact` at
`apps/web/containers/TimespacePlayground/EmbedApp.jsx` by measuring the React
root, which is laid out from its content rather than the viewport, plus a
same-value guard so a future viewport-sized descendant degrades to a no-op
instead of a resize/report loop. Verified against production on bundle
`timespace-embed-CdJfHlNF.js`:

```
data-height  ->  reported sequence   ->  final frame
       250   ->  136 -> 319 -> 362   ->  362px
       380   ->  136 -> 319 -> 362   ->  362px
       500   ->  136 -> 319 -> 362   ->  362px
       900   ->  136 -> 319 -> 362   ->  362px
```

It now grows from 250 and shrinks from 900, neither of which the old code could
do. The three-step sequence is the widget rendering in stages; each frame then
goes quiet rather than looping.
