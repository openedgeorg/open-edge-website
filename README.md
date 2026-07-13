# Open Edge — presentational website

A single-page, first-touch marketing site for **Open Edge** and the
**Edge Settlement Protocol (ESP)** — a neutral clearing layer for the open
Internet that federates ISPs into a global metering, clearing and
data-aggregation layer.

The content is drawn from the ESP whitepaper (*Reinventing the ISP*) and the
ESP investor/partner deck. The design is a deliberately **minimal, editorial
document** — black serif on white, generous whitespace, monospace meta labels,
hairline rules, spare line diagrams, and a single restrained green accent —
following the restraint of [europe2031.ai](https://europe2031.ai/). A metering
dial motif nods to the deck's "put a metering device in the house" metaphor.
A light/dark theme toggle is included (respects `prefers-color-scheme`).

## Run it locally

Requires Docker + Docker Compose.

```bash
docker compose up -d
```

Then open **http://localhost:8080**.

Stop it with:

```bash
docker compose down
```

The site is served by nginx (`nginx:1.27-alpine`). Static files under `site/`
are bind-mounted read-only, so **edits are live on refresh** — no rebuild
needed. A health check is exposed at `/healthz`.

## What's inside

```
site/
  index.html          # the whole page (semantic sections + inline SVG diagrams)
  css/styles.css      # design system: tokens, layout, responsive, reveal anim
  js/main.js          # progressive enhancement: scroll-reveal, sticky nav, year
  assets/favicon.svg  # Open Edge mark
nginx/default.conf    # server config: gzip, caching, security headers, /healthz
docker-compose.yml    # one service: web (nginx) on :8080
```

### Highlights

- **Zero external dependencies** — no CDN, web fonts, or JS frameworks. Fully
  self-contained and offline-capable; the page works with JavaScript disabled
  (theme toggle and subtle scroll-reveal are progressive enhancements).
- **Hand-built line diagrams** rendering the *economic loop* (funding / spending
  legs around the Clearing Pool) and the *CPE evidence witness* flow as spare,
  theme-aware SVG.
- **Scroll-driven metering gauge** — starts large in the hero, then docks to the
  top-right corner as you scroll out of the first screen while its metered value
  (odometer + needle + filling arc) climbs with page progress. Tunables live at
  the top of [main.js](site/js/main.js): `METER_MAX` (final value) and the
  `HERO`/`CORNER`/`DOCK` states in `computeStates()`.
- **Responsive** down to small mobile; honors `prefers-reduced-motion`.

## Sections

Hero → at-a-glance stats → the problem (hyperscaler capture) → the thesis
(three pillars) → the economic loop → settlement / CPE evidence witness →
use case (frictionless pay-per-view) → the three remaining moats → design
principles → whitepaper CTA → footer.

## Editing the content

Everything is plain HTML/CSS/JS. Edit files under `site/` and refresh the
browser. To change the port, edit the `ports:` mapping in `docker-compose.yml`.
