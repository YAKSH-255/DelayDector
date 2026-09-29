# DelayDector

**Prototype early-warning and monitoring platform for central sector infrastructure projects.**

Built for **SIH26103 — "Use case on web-based integrated project-monitoring platform"**
(Ministry of Statistics and Programme Implementation, Data Informatics & Innovation Division ·
Software · Smart Automation).

> **Demonstration prototype.** Every project, risk score and AI output in this application is
> simulated showcase data. Nothing here is connected to PAIMANA, OCMS or any live government
> system.

The product narrative: move project monitoring from *"what is happening?"* to *"why is it
happening?"*, *"what will happen next?"* and *"what can we do about it?"*

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>, pick a demo role, and you are in. No API keys, no external services,
no database — the app runs entirely offline, including the map.

```bash
npm run build && npm start   # production build
```

---

## Demo script for judges (about four minutes)

1. **Role selection** — choose *MoSPI Administrator*. Roles genuinely re-scope the data.
2. **Executive Dashboard** — 57 projects, ₹2.15 lakh Cr anticipated cost, 13 delayed. Point at the
   planned-vs-actual chart: the variance is widening, not closing.
3. **Open the Gujarat Regional Water Grid** (critical, health 42) from *Projects in focus*.
4. **Planned vs actual** — 59% actual against 81% planned, with a forecast band running forward.
5. **Simulated AI insight** — 112-day predicted delay, 87% slippage probability, 81% confidence,
   and the four contributing factors mapped to MoSPI reason codes.
6. **What-if simulation** — click *Accelerate land acquisition*: 112 days drops to 54, completion
   moves from 21 Jul 2027 to 24 May 2027, at ₹120 Cr (₹2.07 Cr per day recovered). Then click
   *Combined intervention package*: 24 days, slippage probability 87% → 37%.
7. **GIS Project Map** — risk-coded markers, state shading by share of flagged projects. Fully
   offline: no tile server, so venue wi-fi cannot break the demo.
8. **AI Assistant** — ask *"Which projects require immediate attention?"*, then
   *"Which department has the worst cost overrun?"*
9. **Problem Statement Fit** — the honest coverage table: what is demonstrated, what is partly
   demonstrated, what is only stated as a design.

Closing line: *DelayDector identifies risk early and supports informed intervention.*

---

## What is real, and what is simulated

**Real** — every screen, filter, sort, chart and simulation runs on live application logic over a
consistent dataset of 30 detailed project records with 12 months of reported progress each. The
what-if engine genuinely recomputes forecast delay, completion date, cost and probability. Role
selection really does re-scope the data.

**Simulated** — all names, values, coordinates and risk scores are fictional. No model is trained:
risk and forecast values are deterministic and pre-authored. The assistant answers from rule-based
templates, not a hosted language model. The model-accuracy figures describe an intended evaluation
design, not measured results.

This split is stated in the UI itself, on the **Problem Statement Fit** page.

---

## How the problem statement is addressed

| Expected outcome | Where |
| --- | --- |
| Time overrun prediction | Project detail → Simulated AI insight |
| Cost overrun prediction | Project detail → Financial progress |
| Project risk scoring framework | Health score composition (schedule / cost / risk / governance) |
| Early warning alert system | Early Warning Centre |
| Cost escalation & delay driver analysis | Delay attribution, mapped to MoSPI reason codes |
| Benchmarking & comparative analytics | Dashboard department summary, assistant comparisons |
| AI-powered monitoring dashboard | Executive Dashboard + GIS map |
| Project intelligence assistant | AI Assistant |
| Data sufficiency assessment | Early Warning → *Data the model would need next* |
| AI vs conventional statistics | Early Warning → *Model transparency* (logistic baseline quoted) |

Two details worth knowing when you present:

- **OCMS is now PAIMANA.** The Online Computerised Monitoring System was modernised into the
  Project Assessment, Infrastructure Monitoring and Analytics for Nation-building portal. Say
  "OCMS archive + PAIMANA live feed" rather than OCMS alone.
- **Delay drivers use MoSPI's own taxonomy.** Every risk factor carries a reason code (R1–R10) from
  the published reason-for-delay categories — land acquisition, forest/environment clearances,
  project financing, detailed engineering, tendering, equipment supply, law and order, geological
  surprises, contractual issues — so attribution reconciles against existing reporting. Drivers
  that the Common Upload Form does *not* capture are flagged separately; that list is the
  prototype's answer to the problem statement's data-sufficiency question.

---

## Architecture

```
app/
  page.tsx              role selection (mocked auth)
  dashboard/            executive dashboard
  projects/             searchable, sortable, filterable project list
  projects/[id]/        project intelligence: progress, budget, milestones, AI insight, what-if
  map/                  offline GIS map
  alerts/               early warning centre, driver rollup, data gaps, model card
  about/                problem statement fit
  api/projects/         mock REST endpoint over the same dataset
components/             app shell, charts, UI primitives, map, simulator, risk insight
lib/
  types.ts              data model
  data.ts               typed dataset access + demo roles
  analytics.ts          formatting, risk metadata, aggregations, SPI/CPI
  simulation.ts         deterministic what-if engine
  mock-ai.ts            deterministic assistant (10 intents)
  scope.ts              role-based data scoping
data/                   generated demo dataset (projects, departments, alerts, meta)
scripts/generate-data.mjs   regenerates data/ from one seed table
public/india-states.json    simplified state boundaries, served locally
```

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Recharts · React-Leaflet ·
Lucide icons. No backend, no external API calls at runtime.

---

## Demo data

`data/` is generated, not hand-maintained. To tune the demo numbers, edit the `SEED` table in
`scripts/generate-data.mjs` and run:

```bash
node scripts/generate-data.mjs
```

Everything else derives from that seed and stays internally consistent:

- start and completion dates are solved backwards from planned progress through an S-curve, so the
  dates and the percentages can never disagree;
- the health score decomposes into four weighted sub-scores that add back up to it;
- attributed delay days across drivers sum exactly to the reported delay;
- what-if levers recover `driver impact × driver responsiveness` of the forecast delay, so a single
  lever at full intensity produces the exact figure shown in the PRD.

`REPORT_DATE` at the top of the script is the demo's "data as on" date — bump it before a
presentation if you want the dates to look current.

Portfolio: 57 projects across 5 ministries (30 with full monitoring records), ₹1.95 lakh Cr
sanctioned against ₹2.15 lakh Cr anticipated, 15 states.

---

## Design system

The "Molten Glass" theme from `components.html`: orange + white family, warm paper base, glass
elevation levels, restrained motion. Tokens live at the top of `app/globals.css`.

Risk colours are deliberately a **separate ramp** from the brand orange, and every risk mark also
carries a glyph (● ◆ ▲ ■) and a text label — colour is never the only signal.

### Logo

The supplied mark — a Didone **D** with a hand-drawn **D** in its counter — is the product logo. Its
orange (`#ec6315`) already sits between the theme's orange-500 and orange-600, so it needed no
recolouring.

| File | What it is |
| --- | --- |
| `public/logo.png` | the mark exactly as supplied, on its orange tile |
| `public/logo-mark.png` | the mark alone, transparent background, for any surface |
| `app/icon.png`, `app/apple-icon.png` | favicon and touch icon, picked up automatically by Next.js |

`<Logo />` (`components/Logo.tsx`) renders the glass treatment: the transparent mark on a
translucent warm tile with a specular highlight, a soft diagonal sheen, a lit lower rim and a warm
cast shadow. It is used in the sidebar (38px) and on the role-selection screen (52px), and the
styling lives under `/* Logo — the supplied mark, set in glass */` in `app/globals.css`.

The proportions of the mark inside the tile match the original artwork, so the glass version reads
as the same logo rather than a redraw.

If the artwork ever changes, regenerate the derived files with:

```bash
npm i --no-save sharp && node scripts/make-logo.mjs path/to/new-logo.png
```

`sharp` is intentionally not a project dependency — it is a heavy native module needed only for
this one-off transform, and the generated PNGs are committed.

---

## Taking it further

The prototype stops short of training anything, which is deliberate. The path to a real system:

1. Ingest the Common Upload Form fields from PAIMANA; backfill labels from OCMS-era archives, which
   still carry the reason-for-delay categories the newer format dropped.
2. Train a time-overrun classifier and a cost-escalation model, and report both against a logistic
   regression baseline — the problem statement asks specifically whether ML beats conventional
   statistics.
3. Quantify how much accuracy comes from CUF fields alone versus the uncaptured variables listed in
   the Early Warning Centre, and hand that back as a recommendation on what to start collecting.
4. Replace the deterministic assistant with a retrieval-grounded LLM that cites the project record
   behind every number it quotes.
