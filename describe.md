# Problem Statement Fit

**SIH26103 · Use case on web-based integrated project-monitoring platform**

DelayDector is a monitoring and early-warning layer for central sector infrastructure projects. It
takes the monthly progress reporting that already exists, scores every project for schedule and cost
risk, explains the risk against the ministry's own delay taxonomy, and lets a reviewer test what an
intervention would actually recover before committing to it.

| | |
| --- | --- |
| Organisation | Ministry of Statistics and Programme Implementation (MoSPI) |
| Department | Data Informatics & Innovation Division |
| Category | Software |
| Theme | Smart Automation |

---

## Expected outcomes, and where each one is demonstrated

Honest coverage — what the prototype shows working, and what it only states as a design.

| Expected outcome | Coverage | Where to see it | How it is addressed |
| --- | --- | --- | --- |
| Time overrun prediction | Demonstrated | Project intelligence view (`/projects/PRJ-003`) | Forecast delay in days with slippage probability, confidence and a forecast completion date for every project. |
| Cost overrun prediction | Partly demonstrated | Financial progress panel (`/projects/PRJ-003`) | Sanctioned vs anticipated cost, funds drawn against physical progress and a cost performance index. Cost forecasting is shown as a revision figure rather than a trained model. |
| Project risk scoring framework | Demonstrated | Health score composition (`/projects`) | A 0–100 health score that decomposes into schedule, cost, risk exposure and governance sub-scores with published weights, plus a four-level risk classification. |
| Early warning alert system | Demonstrated | Early Warning Centre (`/alerts`) | Severity-ranked alerts with the attributed driver, age, forecast delay and a recommended intervention for each flagged project. |
| Cost escalation & delay driver analysis | Demonstrated | Delay attribution (`/alerts`) | Delay days apportioned across drivers, each mapped to MoSPI's published reason-for-delay taxonomy and aggregated across the portfolio. |
| Benchmarking & comparative analytics | Demonstrated | Dashboard and assistant (`/dashboard`) | Department-level comparison on health, time overrun and cost revision; state roll-ups on the map; ranked comparisons through the assistant. |
| AI-powered monitoring dashboard | Demonstrated | Executive dashboard & GIS map (`/map`) | Portfolio KPIs, planned-vs-actual trend, risk distribution, critical alert feed and geographic monitoring with risk-coded markers. |
| Project intelligence assistant | Partly demonstrated | AI Assistant (`/ai-assistant`) | The interaction is fully demonstrated over the real dataset, but answers come from deterministic rules so the prototype runs without a hosted language model. |
| Data sufficiency assessment | Demonstrated | Data the model would need next (`/alerts`) | Separates drivers derivable from Common Upload Form fields from variables that are not currently collected, with the modelled accuracy attributable to each. |
| AI vs conventional statistics | Design stated | Model transparency (`/alerts`) | A logistic-regression baseline is quoted alongside the machine-learning approaches so the gain is stated rather than assumed. No model is trained in this prototype. |
| Documentation & deployment framework | Design stated | Repository README | The prototype ships with a documented data model, a regenerable demo dataset and a local-only run path with no external service dependencies. |

---

## What is real in this prototype, and what is not

**Real**

- Every screen, filter, sort, chart and simulation runs on live application logic.
- A consistent dataset of 30 detailed project records with 12 months of reported progress each.
- Delay attribution mapped to MoSPI's published reason-for-delay categories.
- The what-if engine recomputes forecast delay, completion date and cost from the driver weights.
- Role selection genuinely re-scopes the data a user can see.

**Simulated**

- All project names, values, coordinates and risk scores are fictional demonstration data.
- No model is trained — risk and forecast values are deterministic and pre-authored.
- The assistant answers from rule-based templates, not a hosted language model.
- Model accuracy figures describe an intended evaluation design, not measured results.
- There is no connection to PAIMANA, OCMS or any government system.

---

## Demo flow for judges

Nine steps, about four minutes.

1. Open the executive dashboard and read the national summary.
2. Open the critical Gujarat Regional Water Grid project.
3. Show planned vs actual progress and the widening trend.
4. Walk through the AI risk analysis and the top contributing factors.
5. Show the predicted delay and the recommended intervention.
6. Run a what-if scenario and watch the predicted delay change.
7. Open the map to demonstrate geographic monitoring.
8. Ask the assistant which projects require immediate attention.
9. Close on the message: identify risk early, then act on it.

---

## Demonstration dataset

| | |
| --- | --- |
| Portfolio | 57 projects across 5 ministries |
| Detailed records | 30 projects, 15 states |
| Sanctioned cost | ₹1.95 lakh Cr |
| Anticipated cost | ₹2.15 lakh Cr |
| Cost overrun | ₹19,810 Cr (10.2%) |
| Reporting period | September 2026 |

The dataset regenerates from a single seed table via `node scripts/generate-data.mjs`, so demo
numbers stay internally consistent when the team tunes them.
