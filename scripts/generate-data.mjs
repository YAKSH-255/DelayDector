/**
 * Builds the DelayDector demo dataset into /data.
 *
 * Everything below is fictional showcase data for the SIH prototype. The script
 * exists so every derived number (dates, milestones, curves, health composition,
 * what-if levers) stays consistent with the small authored seed table when the
 * team tweaks demo values before a presentation.
 *
 * Run:  node scripts/generate-data.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(ROOT, "data");

/* ------------------------------------------------------------------ */
/* Demo reporting date — bump this before a presentation if you like.  */
/* ------------------------------------------------------------------ */
const REPORT_DATE = "2026-09-25";
const DAY = 86_400_000;

/* ------------------------------------------------------------------ */
/* MoSPI's official reason-for-delay taxonomy, as published in the      */
/* Flash Report on central sector projects. Drivers below map onto it   */
/* so the prototype speaks the sponsoring ministry's own vocabulary.    */
/* ------------------------------------------------------------------ */
const MOSPI_REASONS = {
  R1: "Delay in land acquisition",
  R2: "Delay in obtaining forest / environment clearances",
  R3: "Lack of infrastructure support and linkages",
  R4: "Delay in tie-up of project financing",
  R5: "Delay in finalization of detailed engineering / change in scope",
  R6: "Delay in tendering and approvals",
  R7: "Delay in ordering and equipment supply",
  R8: "Law and order problems",
  R9: "Geological surprises",
  R10: "Pre-commissioning teething troubles and contractual issues",
  UNC: "Not captured in the Common Upload Form",
};

/* ------------------------------------------------------------------ */
/* Risk-driver catalogue: impact comes from the project, responsiveness */
/* is how much of the forecast delay a full intervention can recover.   */
/* `in_cuf` marks whether the driver is derivable from fields the       */
/* Common Upload Form already collects.                                 */
/* ------------------------------------------------------------------ */
const DRIVERS = {
  "Land Acquisition": {
    responsiveness: 1.67,
    category: "Statutory",
    lever: "Accelerate land acquisition & R&R",
    leverDetail:
      "Deploy a district-level acquisition cell and front-load compensation disbursement for contested parcels.",
    owner: "District Administration",
    costFactor: 0.0375,
  },
  "Contractor Performance": {
    responsiveness: 1.6,
    category: "Execution",
    lever: "Increase contractor resources by 20%",
    leverDetail:
      "Mobilise additional plant and two extra work fronts under the existing contract's acceleration clause.",
    owner: "Implementing Agency",
    costFactor: 0.015,
  },
  "Material Procurement": {
    responsiveness: 1.54,
    category: "Supply chain",
    lever: "Fast-track procurement approvals",
    leverDetail:
      "Move long-lead items to a pre-approved rate contract and clear pending purchase sanctions in one window.",
    owner: "Procurement Cell",
    costFactor: 0.011,
  },
  "Forest & Environment Clearance": {
    responsiveness: 1.45,
    category: "Statutory",
    lever: "Escalate clearance to inter-ministerial review",
    leverDetail:
      "Place the pending Stage-II clearance before the monthly inter-ministerial review with compliance evidence.",
    owner: "Nodal Ministry",
    costFactor: 0.008,
  },
  "Utility Shifting": {
    responsiveness: 1.35,
    category: "Execution",
    lever: "Run a parallel utility shifting drive",
    leverDetail:
      "Sign joint schedules with power, water and telecom utilities so shifting runs alongside civil work.",
    owner: "Implementing Agency",
    costFactor: 0.014,
  },
  "Fund Release": {
    responsiveness: 1.5,
    category: "Financial",
    lever: "Release the blocked budget tranche",
    leverDetail:
      "Clear the pending instalment and settle contractor running-account bills older than 60 days.",
    owner: "Finance Department",
    costFactor: 0.006,
  },
  "Weather Impact": {
    responsiveness: 0.9,
    category: "External",
    lever: "Adopt a monsoon-resilient work plan",
    leverDetail:
      "Shift weather-sensitive activities out of the monsoon window and add covered work fronts.",
    owner: "Implementing Agency",
    costFactor: 0.009,
  },
  "Design Revisions": {
    responsiveness: 1.2,
    category: "Planning",
    lever: "Freeze design & enforce change control",
    leverDetail:
      "Close out pending GFC drawings and route further changes through a single change-control board.",
    owner: "Design Consultant",
    costFactor: 0.005,
  },
  "Labour Availability": {
    responsiveness: 1.25,
    category: "Execution",
    lever: "Labour mobilisation incentive",
    leverDetail:
      "Fund camp upgrades and a retention incentive to hold skilled labour through the peak season.",
    owner: "Implementing Agency",
    costFactor: 0.007,
  },
  "Right of Way": {
    responsiveness: 1.4,
    category: "Statutory",
    lever: "Joint right-of-way task force",
    leverDetail:
      "Constitute a joint task force with revenue and police authorities to clear encroached stretches.",
    owner: "District Administration",
    costFactor: 0.012,
  },
  "Statutory Approvals": {
    responsiveness: 1.38,
    category: "Statutory",
    lever: "Single-window approval escalation",
    leverDetail:
      "Consolidate pending permissions into one escalation note for the empowered committee.",
    owner: "Nodal Ministry",
    costFactor: 0.006,
  },
  "Rolling Stock Supply": {
    responsiveness: 1.3,
    category: "Supply chain",
    lever: "Expedite rolling stock delivery",
    leverDetail:
      "Re-sequence the vendor delivery schedule and add third-party inspection at the manufacturing unit.",
    owner: "Procurement Cell",
    costFactor: 0.016,
  },
  "Geological Surprises": {
    responsiveness: 0.95,
    category: "Technical",
    lever: "Revised tunnelling methodology",
    leverDetail:
      "Switch the affected reach to a ground-treatment-first sequence with additional instrumentation.",
    owner: "Design Consultant",
    costFactor: 0.021,
  },
};

/**
 * Driver -> [MoSPI reason code, is the signal already present in the Common
 * Upload Form]. The `false` rows are the prototype's answer to the problem
 * statement's "which variables are not currently captured?" question.
 */
const DRIVER_META = {
  "Land Acquisition": ["R1", true],
  "Forest & Environment Clearance": ["R2", true],
  "Utility Shifting": ["R3", true],
  "Right of Way": ["R3", true],
  "Fund Release": ["R4", true],
  "Design Revisions": ["R5", true],
  "Statutory Approvals": ["R6", true],
  "Material Procurement": ["R7", true],
  "Rolling Stock Supply": ["R7", true],
  "Geological Surprises": ["R9", true],
  "Contractor Performance": ["R10", false],
  "Labour Availability": ["R10", false],
  "Weather Impact": ["UNC", false],
};

/** Variables the prototype would need collected to lift forecast accuracy. */
const DATA_GAPS = [
  {
    variable: "Contractor past-performance index",
    why: "Repeat slippage by the same contractor across projects is the single strongest leading indicator in the demo model.",
    source_hint: "Derivable from CPPP tender history joined on contractor PAN",
    modelled_gain_pct: 6.4,
  },
  {
    variable: "Rainfall / working-days lost",
    why: "Weather accounts for up to 20% of attributed slippage on hill and coastal packages but has no CUF field.",
    source_hint: "IMD district rainfall series, joined on project district",
    modelled_gain_pct: 4.1,
  },
  {
    variable: "Milestone-level progress (not just cumulative %)",
    why: "Cumulative physical progress hides which activity is actually stalled, so root-cause attribution stays coarse.",
    source_hint: "Extend the Common Upload Form with milestone rows",
    modelled_gain_pct: 5.2,
  },
  {
    variable: "Bill clearance / payment latency",
    why: "Running-account bills pending beyond 60 days precede contractor demobilisation by roughly one quarter.",
    source_hint: "PFMS payment timestamps",
    modelled_gain_pct: 3.6,
  },
  {
    variable: "Commodity price index at package level",
    why: "Steel and cement movement explains a large share of cost revision that the current fields cannot separate from scope change.",
    source_hint: "Office of the Economic Adviser WPI series",
    modelled_gain_pct: 2.8,
  },
];

/**
 * Illustrative model-comparison card. The problem statement explicitly asks
 * whether AI/ML beats conventional statistical methods, so the prototype
 * states a baseline instead of only showing the headline model.
 */
const MODEL_CARD = {
  disclaimer:
    "Illustrative prototype figures. No model is trained in this demo; these values describe the intended evaluation design.",
  target: "Time overrun of more than 30 days against the sanctioned completion date",
  validation: "Rolling-origin split on archived monthly reports, 3 folds",
  models: [
    {
      name: "Logistic regression (baseline)",
      family: "Conventional statistics",
      accuracy: 0.74,
      recall: 0.63,
      lead_time_days: 41,
      note: "Interpretable, cheap to retrain, the benchmark every claim is measured against.",
    },
    {
      name: "Gradient-boosted trees",
      family: "Machine learning",
      accuracy: 0.86,
      recall: 0.81,
      lead_time_days: 68,
      note: "Captures interaction between clearance status and contractor load that the linear baseline misses.",
    },
    {
      name: "Survival model (time-to-milestone)",
      family: "Statistical / ML hybrid",
      accuracy: 0.83,
      recall: 0.78,
      lead_time_days: 74,
      note: "Predicts when slippage occurs, not only whether, which is what an early-warning desk needs.",
    },
  ],
};

const MILESTONE_TEMPLATES = {
  highway: [
    "Land acquisition & 3D notification",
    "Utility shifting & site handover",
    "Earthwork and embankment",
    "Major bridges & structures",
    "Pavement and flexible layers",
    "Safety works & commissioning",
  ],
  rail: [
    "Alignment survey & approval",
    "Land handover",
    "Earthwork and formation",
    "Track laying",
    "OHE and signalling",
    "CRS inspection & commissioning",
  ],
  water: [
    "DPR approval & tendering",
    "Land acquisition",
    "Intake and pump house works",
    "Main pipeline laying",
    "Reservoir & distribution network",
    "Trial run & commissioning",
  ],
  power: [
    "Statutory clearances",
    "Foundation and civil works",
    "Equipment supply",
    "Erection and stringing",
    "Testing and charging",
    "Commercial operation",
  ],
  urban: [
    "Land & right-of-way clearance",
    "Piling and foundation",
    "Viaduct / structure works",
    "Station buildings",
    "Systems and rolling stock",
    "Trial run & safety certification",
  ],
};

const MILESTONE_WEIGHTS = [8, 20, 42, 62, 84, 100];

/* ------------------------------------------------------------------ */
/* Department portfolio (the 57-project aggregate view)                */
/* ------------------------------------------------------------------ */
const DEPARTMENTS = [
  {
    id: "DEP-RTH",
    name: "Road Transport & Highways",
    short: "Highways",
    kind: "highway",
    total_projects: 18,
    on_track: 9,
    at_risk: 5,
    delayed: 4,
    sanctioned_cost_crore: 62000,
    revised_cost_crore: 67270,
    expenditure_crore: 36480,
    avg_health_score: 78,
    avg_time_overrun_days: 31,
  },
  {
    id: "DEP-RLY",
    name: "Railways",
    short: "Railways",
    kind: "rail",
    total_projects: 12,
    on_track: 5,
    at_risk: 4,
    delayed: 3,
    sanctioned_cost_crore: 45000,
    revised_cost_crore: 50850,
    expenditure_crore: 24930,
    avg_health_score: 70,
    avg_time_overrun_days: 52,
  },
  {
    id: "DEP-JAL",
    name: "Jal Shakti",
    short: "Jal Shakti",
    kind: "water",
    total_projects: 10,
    on_track: 4,
    at_risk: 3,
    delayed: 3,
    sanctioned_cost_crore: 30000,
    revised_cost_crore: 34320,
    expenditure_crore: 17860,
    avg_health_score: 63,
    avg_time_overrun_days: 68,
  },
  {
    id: "DEP-PWR",
    name: "Power",
    short: "Power",
    kind: "power",
    total_projects: 8,
    on_track: 5,
    at_risk: 2,
    delayed: 1,
    sanctioned_cost_crore: 20000,
    revised_cost_crore: 21140,
    expenditure_crore: 11320,
    avg_health_score: 84,
    avg_time_overrun_days: 21,
  },
  {
    id: "DEP-HUA",
    name: "Housing & Urban Affairs",
    short: "Urban Affairs",
    kind: "urban",
    total_projects: 9,
    on_track: 4,
    at_risk: 3,
    delayed: 2,
    sanctioned_cost_crore: 38000,
    revised_cost_crore: 41230,
    expenditure_crore: 20560,
    avg_health_score: 74,
    avg_time_overrun_days: 47,
  },
];

/* ------------------------------------------------------------------ */
/* Authored seed rows. Everything else in the dataset derives from      */
/* these. f = risk drivers as [name, impact %].                         */
/* ------------------------------------------------------------------ */
const SEED = [
  {
    id: "PRJ-001",
    name: "Ahmedabad–Rajkot Economic Corridor",
    dept: "Road Transport & Highways",
    state: "Gujarat",
    district: "Ahmedabad",
    lat: 23.0225,
    lng: 72.5714,
    budget: 4850,
    overrun: 0.021,
    planned: 68,
    actual: 66,
    delay: 4,
    health: 91,
    risk: "LOW",
    status: "On Track",
    confidence: 0.79,
    months: 42,
    costRatio: 1.02,
    agency: "National Highways Authority of India",
    contractor: "Patel Infra – L&T (JV)",
    scope: "118 km six-lane access-controlled corridor with 4 major interchanges",
    hero: true,
    f: [
      ["Utility Shifting", 18],
      ["Weather Impact", 14],
      ["Material Procurement", 11],
      ["Land Acquisition", 9],
    ],
  },
  {
    id: "PRJ-002",
    name: "Mumbai–Nagpur Rail Modernization",
    dept: "Railways",
    state: "Maharashtra",
    district: "Nagpur",
    lat: 21.1458,
    lng: 79.0882,
    budget: 8940,
    overrun: 0.118,
    planned: 74,
    actual: 62,
    delay: 38,
    health: 67,
    risk: "HIGH",
    status: "At Risk",
    confidence: 0.8,
    months: 56,
    costRatio: 1.12,
    agency: "Central Railway",
    contractor: "RVNL – Afcons (JV)",
    scope: "612 km route modernisation with automatic signalling and track renewal",
    hero: true,
    f: [
      ["Rolling Stock Supply", 26],
      ["Land Acquisition", 21],
      ["Contractor Performance", 17],
      ["Statutory Approvals", 12],
    ],
  },
  {
    id: "PRJ-003",
    name: "Gujarat Regional Water Grid",
    dept: "Jal Shakti",
    state: "Gujarat",
    district: "Rajkot",
    lat: 22.3072,
    lng: 70.8022,
    budget: 3200,
    overrun: 0.14,
    planned: 81,
    actual: 59,
    delay: 96,
    health: 42,
    risk: "CRITICAL",
    status: "Delayed",
    confidence: 0.81,
    months: 24,
    plannedCompletion: "2027-03-31",
    costRatio: 1.2766,
    agency: "Gujarat Water Infrastructure Ltd",
    contractor: "Megha Engineering & Infrastructure",
    scope: "1,240 km bulk water transmission grid serving 4 districts",
    hero: true,
    f: [
      ["Land Acquisition", 31],
      ["Contractor Performance", 24],
      ["Material Procurement", 18],
      ["Weather Impact", 15],
    ],
  },
  {
    id: "PRJ-004",
    name: "Surat–Nashik–Ahmednagar Expressway Pkg-3",
    dept: "Road Transport & Highways",
    state: "Maharashtra",
    district: "Nashik",
    lat: 19.9975,
    lng: 73.7898,
    budget: 6120,
    overrun: 0.132,
    planned: 52,
    actual: 44,
    delay: 46,
    health: 63,
    risk: "HIGH",
    status: "At Risk",
    confidence: 0.78,
    months: 48,
    costRatio: 1.14,
    agency: "National Highways Authority of India",
    contractor: "Gayatri – Sadbhav (JV)",
    scope: "94 km greenfield expressway package with 2 tunnels",
    f: [
      ["Land Acquisition", 28],
      ["Forest & Environment Clearance", 21],
      ["Contractor Performance", 16],
      ["Weather Impact", 12],
    ],
  },
  {
    id: "PRJ-005",
    name: "Vadodara–Ahmedabad Rail Doubling",
    dept: "Railways",
    state: "Gujarat",
    district: "Anand",
    lat: 22.5645,
    lng: 72.9289,
    budget: 2480,
    overrun: 0.018,
    planned: 79,
    actual: 77,
    delay: 6,
    health: 90,
    risk: "LOW",
    status: "On Track",
    confidence: 0.84,
    months: 34,
    costRatio: 1.02,
    agency: "Western Railway",
    contractor: "Rail Vikas Nigam Ltd",
    scope: "78 km third-line doubling with 11 station upgrades",
    f: [
      ["Land Acquisition", 12],
      ["Statutory Approvals", 10],
      ["Material Procurement", 8],
      ["Weather Impact", 6],
    ],
  },
  {
    id: "PRJ-006",
    name: "Ken–Betwa Link Canal Package-4",
    dept: "Jal Shakti",
    state: "Madhya Pradesh",
    district: "Chhatarpur",
    lat: 24.918,
    lng: 79.588,
    budget: 4620,
    overrun: 0.171,
    planned: 38,
    actual: 29,
    delay: 74,
    health: 55,
    risk: "HIGH",
    status: "Delayed",
    confidence: 0.76,
    months: 72,
    costRatio: 1.18,
    agency: "National Water Development Agency",
    contractor: "Megha Engineering & Infrastructure",
    scope: "42 km link canal with 2 barrages and a pump house",
    f: [
      ["Forest & Environment Clearance", 30],
      ["Land Acquisition", 22],
      ["Fund Release", 15],
      ["Weather Impact", 11],
    ],
  },
  {
    id: "PRJ-007",
    name: "Delhi–Amritsar–Katra Expressway Pkg-11",
    dept: "Road Transport & Highways",
    state: "Punjab",
    district: "Jalandhar",
    lat: 31.326,
    lng: 75.5762,
    budget: 3980,
    overrun: 0.026,
    planned: 71,
    actual: 69,
    delay: 9,
    health: 88,
    risk: "LOW",
    status: "On Track",
    confidence: 0.81,
    months: 40,
    costRatio: 1.03,
    agency: "National Highways Authority of India",
    contractor: "IRB Infrastructure Developers",
    scope: "62 km four-lane greenfield package with 3 grade separators",
    f: [
      ["Land Acquisition", 14],
      ["Utility Shifting", 11],
      ["Weather Impact", 9],
      ["Material Procurement", 8],
    ],
  },
  {
    id: "PRJ-008",
    name: "Patna–Gaya Rail Electrification",
    dept: "Railways",
    state: "Bihar",
    district: "Gaya",
    lat: 24.7955,
    lng: 85.0002,
    budget: 1120,
    overrun: 0.022,
    planned: 88,
    actual: 85,
    delay: 8,
    health: 87,
    risk: "LOW",
    status: "On Track",
    confidence: 0.85,
    months: 28,
    costRatio: 1.03,
    agency: "East Central Railway",
    contractor: "RailTech Projects Ltd",
    scope: "92 km electrification with 2 traction substations",
    f: [
      ["Statutory Approvals", 14],
      ["Material Procurement", 11],
      ["Labour Availability", 8],
      ["Weather Impact", 6],
    ],
  },
  {
    id: "PRJ-009",
    name: "Polavaram Left Main Canal Phase-II",
    dept: "Jal Shakti",
    state: "Andhra Pradesh",
    district: "Eluru",
    lat: 16.7107,
    lng: 81.0953,
    budget: 3880,
    overrun: 0.146,
    planned: 57,
    actual: 48,
    delay: 51,
    health: 64,
    risk: "HIGH",
    status: "At Risk",
    confidence: 0.78,
    months: 58,
    costRatio: 1.15,
    agency: "AP Water Resources Department",
    contractor: "Navayuga Engineering",
    scope: "63 km lined main canal with 9 cross-drainage structures",
    f: [
      ["Land Acquisition", 25],
      ["Fund Release", 20],
      ["Contractor Performance", 15],
      ["Weather Impact", 12],
    ],
  },
  {
    id: "PRJ-010",
    name: "Chennai–Bengaluru Access Controlled Highway Pkg-5",
    dept: "Road Transport & Highways",
    state: "Tamil Nadu",
    district: "Vellore",
    lat: 12.9165,
    lng: 79.1325,
    budget: 5340,
    overrun: 0.079,
    planned: 63,
    actual: 58,
    delay: 22,
    health: 76,
    risk: "MEDIUM",
    status: "At Risk",
    confidence: 0.8,
    months: 44,
    costRatio: 1.08,
    agency: "National Highways Authority of India",
    contractor: "Dilip Buildcon Ltd",
    scope: "71 km four-lane greenfield alignment with 2 major bridges",
    f: [
      ["Material Procurement", 19],
      ["Land Acquisition", 15],
      ["Labour Availability", 12],
      ["Weather Impact", 10],
    ],
  },
  {
    id: "PRJ-011",
    name: "Kolkata East–West Metro Extension",
    dept: "Railways",
    state: "West Bengal",
    district: "Kolkata",
    lat: 22.5726,
    lng: 88.3639,
    budget: 6750,
    overrun: 0.243,
    planned: 68,
    actual: 49,
    delay: 132,
    health: 41,
    risk: "CRITICAL",
    status: "Delayed",
    confidence: 0.78,
    months: 66,
    costRatio: 1.29,
    agency: "Kolkata Metro Rail Corporation",
    contractor: "Afcons Infrastructure",
    scope: "4.8 km underground extension with 3 stations",
    f: [
      ["Geological Surprises", 29],
      ["Land Acquisition", 24],
      ["Design Revisions", 18],
      ["Statutory Approvals", 13],
    ],
  },
  {
    id: "PRJ-012",
    name: "Bundelkhand Rural Water Supply Mission",
    dept: "Jal Shakti",
    state: "Uttar Pradesh",
    district: "Jhansi",
    lat: 25.4484,
    lng: 78.5685,
    budget: 2140,
    overrun: 0.048,
    planned: 66,
    actual: 62,
    delay: 16,
    health: 83,
    risk: "LOW",
    status: "On Track",
    confidence: 0.81,
    months: 40,
    costRatio: 1.06,
    agency: "Uttar Pradesh Jal Nigam",
    contractor: "L&T Construction",
    scope: "Piped water supply to 1,180 habitations",
    f: [
      ["Material Procurement", 15],
      ["Labour Availability", 12],
      ["Land Acquisition", 9],
      ["Weather Impact", 8],
    ],
  },
  {
    id: "PRJ-013",
    name: "Varanasi Ring Road Phase-III",
    dept: "Road Transport & Highways",
    state: "Uttar Pradesh",
    district: "Varanasi",
    lat: 25.3176,
    lng: 82.9739,
    budget: 2260,
    overrun: 0.014,
    planned: 84,
    actual: 82,
    delay: 7,
    health: 89,
    risk: "LOW",
    status: "On Track",
    confidence: 0.83,
    months: 36,
    costRatio: 1.01,
    agency: "National Highways Authority of India",
    contractor: "PNC Infratech Ltd",
    scope: "28 km ring road with 2 flyovers and a river bridge",
    f: [
      ["Utility Shifting", 13],
      ["Right of Way", 10],
      ["Weather Impact", 8],
      ["Material Procurement", 6],
    ],
  },
  {
    id: "PRJ-014",
    name: "Bengaluru Suburban Rail Corridor-2",
    dept: "Railways",
    state: "Karnataka",
    district: "Bengaluru",
    lat: 12.9716,
    lng: 77.5946,
    budget: 7380,
    overrun: 0.158,
    planned: 44,
    actual: 36,
    delay: 62,
    health: 58,
    risk: "HIGH",
    status: "Delayed",
    confidence: 0.77,
    months: 60,
    costRatio: 1.16,
    agency: "Rail Infrastructure Development Co. (K-RIDE)",
    contractor: "L&T Construction",
    scope: "25 km elevated suburban corridor with 14 stations",
    f: [
      ["Land Acquisition", 26],
      ["Utility Shifting", 19],
      ["Contractor Performance", 15],
      ["Fund Release", 11],
    ],
  },
  {
    id: "PRJ-015",
    name: "Godavari Lift Irrigation Scheme Stage-3",
    dept: "Jal Shakti",
    state: "Telangana",
    district: "Bhadradri Kothagudem",
    lat: 17.55,
    lng: 80.6167,
    budget: 5260,
    overrun: 0.126,
    planned: 61,
    actual: 53,
    delay: 34,
    health: 70,
    risk: "MEDIUM",
    status: "At Risk",
    confidence: 0.79,
    months: 52,
    costRatio: 1.13,
    agency: "Telangana Irrigation Department",
    contractor: "Megha Engineering & Infrastructure",
    scope: "3 pump houses with 1,600 cusec lift capacity",
    f: [
      ["Fund Release", 23],
      ["Contractor Performance", 18],
      ["Material Procurement", 14],
      ["Weather Impact", 10],
    ],
  },
  {
    id: "PRJ-016",
    name: "Guwahati–Silchar Corridor Upgrade",
    dept: "Road Transport & Highways",
    state: "Assam",
    district: "Nagaon",
    lat: 26.3464,
    lng: 92.684,
    budget: 4410,
    overrun: 0.218,
    planned: 47,
    actual: 33,
    delay: 118,
    health: 44,
    risk: "CRITICAL",
    status: "Delayed",
    confidence: 0.77,
    months: 54,
    costRatio: 1.22,
    agency: "NHIDCL",
    contractor: "Brahmaputra Construction Co.",
    scope: "146 km four-laning through hill terrain",
    f: [
      ["Forest & Environment Clearance", 27],
      ["Geological Surprises", 22],
      ["Weather Impact", 20],
      ["Contractor Performance", 14],
    ],
  },
  {
    id: "PRJ-017",
    name: "Jaipur–Ajmer Rail Line Tripling",
    dept: "Railways",
    state: "Rajasthan",
    district: "Ajmer",
    lat: 26.4499,
    lng: 74.6399,
    budget: 1960,
    overrun: 0.035,
    planned: 72,
    actual: 68,
    delay: 14,
    health: 84,
    risk: "LOW",
    status: "On Track",
    confidence: 0.82,
    months: 38,
    costRatio: 1.05,
    agency: "North Western Railway",
    contractor: "Rail Vikas Nigam Ltd",
    scope: "134 km third line with 6 station yard remodellings",
    f: [
      ["Land Acquisition", 13],
      ["Material Procurement", 10],
      ["Weather Impact", 8],
      ["Labour Availability", 6],
    ],
  },
  {
    id: "PRJ-018",
    name: "Narmada Canal Distribution Network-7",
    dept: "Jal Shakti",
    state: "Gujarat",
    district: "Mehsana",
    lat: 23.588,
    lng: 72.3693,
    budget: 1540,
    overrun: 0.012,
    planned: 83,
    actual: 81,
    delay: 5,
    health: 92,
    risk: "LOW",
    status: "On Track",
    confidence: 0.84,
    months: 30,
    costRatio: 1.01,
    agency: "Sardar Sarovar Narmada Nigam Ltd",
    contractor: "Patel Infrastructure Ltd",
    scope: "312 km minor canal network with 42 control structures",
    f: [
      ["Land Acquisition", 11],
      ["Material Procurement", 9],
      ["Weather Impact", 7],
      ["Labour Availability", 5],
    ],
  },
  {
    id: "PRJ-019",
    name: "Mumbai–Pune Missing Link Tunnel Pkg-2",
    dept: "Road Transport & Highways",
    state: "Maharashtra",
    district: "Lonavala",
    lat: 18.7546,
    lng: 73.4062,
    budget: 3720,
    overrun: 0.094,
    planned: 59,
    actual: 54,
    delay: 28,
    health: 74,
    risk: "MEDIUM",
    status: "At Risk",
    confidence: 0.79,
    months: 50,
    costRatio: 1.11,
    agency: "Maharashtra State Road Development Corp.",
    contractor: "Navayuga Engineering",
    scope: "13.3 km twin tunnel with cable-stayed viaduct",
    f: [
      ["Geological Surprises", 24],
      ["Material Procurement", 16],
      ["Labour Availability", 13],
      ["Weather Impact", 9],
    ],
  },
  {
    id: "PRJ-020",
    name: "Western Grid Modernization Phase-II",
    dept: "Power",
    state: "Gujarat",
    district: "Bhuj",
    lat: 23.2419,
    lng: 69.6669,
    budget: 3460,
    overrun: 0.019,
    planned: 72,
    actual: 70,
    delay: 7,
    health: 90,
    risk: "LOW",
    status: "On Track",
    confidence: 0.83,
    months: 36,
    costRatio: 1.02,
    agency: "Power Grid Corporation of India",
    contractor: "Kalpataru Projects International",
    scope: "420 km 765 kV D/C line with 2 substations",
    f: [
      ["Right of Way", 15],
      ["Statutory Approvals", 12],
      ["Material Procurement", 9],
      ["Weather Impact", 7],
    ],
  },
  {
    id: "PRJ-021",
    name: "Delhi Metro Expansion Phase-IV Corridor-3",
    dept: "Housing & Urban Affairs",
    state: "Delhi",
    district: "New Delhi",
    lat: 28.6139,
    lng: 77.209,
    budget: 9420,
    overrun: 0.087,
    planned: 64,
    actual: 57,
    delay: 31,
    health: 72,
    risk: "MEDIUM",
    status: "At Risk",
    confidence: 0.81,
    months: 58,
    costRatio: 1.1,
    agency: "Delhi Metro Rail Corporation",
    contractor: "Larsen & Toubro Ltd",
    scope: "28.9 km corridor with 22 stations (Aerocity–Tughlakabad)",
    f: [
      ["Land Acquisition", 22],
      ["Utility Shifting", 18],
      ["Statutory Approvals", 14],
      ["Design Revisions", 11],
    ],
  },
  {
    id: "PRJ-022",
    name: "Kanpur–Lucknow Elevated Corridor",
    dept: "Road Transport & Highways",
    state: "Uttar Pradesh",
    district: "Unnao",
    lat: 26.5464,
    lng: 80.4879,
    budget: 4970,
    overrun: 0.041,
    planned: 55,
    actual: 51,
    delay: 12,
    health: 84,
    risk: "LOW",
    status: "On Track",
    confidence: 0.8,
    months: 46,
    costRatio: 1.04,
    agency: "National Highways Authority of India",
    contractor: "Dilip Buildcon Ltd",
    scope: "63 km access-controlled corridor with 18 km elevated section",
    f: [
      ["Land Acquisition", 16],
      ["Utility Shifting", 12],
      ["Material Procurement", 10],
      ["Weather Impact", 7],
    ],
  },
  {
    id: "PRJ-023",
    name: "Pugalur–Trichur HVDC Augmentation",
    dept: "Power",
    state: "Tamil Nadu",
    district: "Karur",
    lat: 10.9601,
    lng: 78.0766,
    budget: 2980,
    overrun: 0.073,
    planned: 58,
    actual: 52,
    delay: 24,
    health: 77,
    risk: "MEDIUM",
    status: "At Risk",
    confidence: 0.8,
    months: 44,
    costRatio: 1.09,
    agency: "Power Grid Corporation of India",
    contractor: "Sterlite Power Transmission",
    scope: "±320 kV HVDC terminal augmentation, 2,000 MW",
    f: [
      ["Material Procurement", 22],
      ["Right of Way", 17],
      ["Statutory Approvals", 12],
      ["Labour Availability", 9],
    ],
  },
  {
    id: "PRJ-024",
    name: "Ahmedabad Metro Phase-II Reach-4",
    dept: "Housing & Urban Affairs",
    state: "Gujarat",
    district: "Gandhinagar",
    lat: 23.2156,
    lng: 72.6369,
    budget: 3640,
    overrun: 0.028,
    planned: 77,
    actual: 75,
    delay: 8,
    health: 89,
    risk: "LOW",
    status: "On Track",
    confidence: 0.83,
    months: 42,
    costRatio: 1.03,
    agency: "Gujarat Metro Rail Corporation",
    contractor: "Afcons Infrastructure",
    scope: "22.8 km elevated corridor with 8 stations",
    f: [
      ["Utility Shifting", 13],
      ["Land Acquisition", 10],
      ["Material Procurement", 8],
      ["Weather Impact", 6],
    ],
  },
  {
    id: "PRJ-025",
    name: "Bhubaneswar–Puri Coastal Highway",
    dept: "Road Transport & Highways",
    state: "Odisha",
    district: "Puri",
    lat: 19.8135,
    lng: 85.8312,
    budget: 1840,
    overrun: 0.033,
    planned: 76,
    actual: 73,
    delay: 11,
    health: 86,
    risk: "LOW",
    status: "On Track",
    confidence: 0.82,
    months: 32,
    costRatio: 1.04,
    agency: "National Highways Authority of India",
    contractor: "Ashoka Buildcon Ltd",
    scope: "42 km four-lane coastal highway with cyclone-resistant design",
    f: [
      ["Weather Impact", 17],
      ["Land Acquisition", 11],
      ["Material Procurement", 9],
      ["Labour Availability", 7],
    ],
  },
  {
    id: "PRJ-026",
    name: "Bhadla Solar Evacuation Corridor",
    dept: "Power",
    state: "Rajasthan",
    district: "Jodhpur",
    lat: 26.2389,
    lng: 73.0243,
    budget: 1720,
    overrun: 0.011,
    planned: 86,
    actual: 84,
    delay: 6,
    health: 93,
    risk: "LOW",
    status: "On Track",
    confidence: 0.85,
    months: 26,
    costRatio: 1.01,
    agency: "Rajasthan Rajya Vidyut Prasaran Nigam",
    contractor: "Kalpataru Projects International",
    scope: "765/400 kV evacuation system for 2.5 GW solar capacity",
    f: [
      ["Right of Way", 12],
      ["Material Procurement", 9],
      ["Weather Impact", 7],
      ["Labour Availability", 5],
    ],
  },
  {
    id: "PRJ-027",
    name: "Pune Metro Line-3 Extension",
    dept: "Housing & Urban Affairs",
    state: "Maharashtra",
    district: "Pune",
    lat: 18.5204,
    lng: 73.8567,
    budget: 4180,
    overrun: 0.108,
    planned: 53,
    actual: 46,
    delay: 37,
    health: 69,
    risk: "MEDIUM",
    status: "At Risk",
    confidence: 0.79,
    months: 50,
    costRatio: 1.12,
    agency: "Pune Metropolitan Region Development Authority",
    contractor: "Tata Projects – Siemens",
    scope: "23.3 km elevated PPP corridor with 23 stations",
    f: [
      ["Land Acquisition", 21],
      ["Design Revisions", 17],
      ["Utility Shifting", 14],
      ["Contractor Performance", 11],
    ],
  },
  {
    id: "PRJ-028",
    name: "Talcher Thermal Unit-5 Retrofit",
    dept: "Power",
    state: "Odisha",
    district: "Angul",
    lat: 20.84,
    lng: 85.1018,
    budget: 2410,
    overrun: 0.162,
    planned: 49,
    actual: 41,
    delay: 43,
    health: 66,
    risk: "HIGH",
    status: "At Risk",
    confidence: 0.77,
    months: 46,
    costRatio: 1.17,
    agency: "NTPC Ltd",
    contractor: "Bharat Heavy Electricals Ltd",
    scope: "660 MW unit FGD retrofit and efficiency upgrade",
    f: [
      ["Material Procurement", 24],
      ["Contractor Performance", 19],
      ["Statutory Approvals", 13],
      ["Labour Availability", 10],
    ],
  },
  {
    id: "PRJ-029",
    name: "Chennai Metro Phase-II Corridor-5",
    dept: "Housing & Urban Affairs",
    state: "Tamil Nadu",
    district: "Chennai",
    lat: 13.0827,
    lng: 80.2707,
    budget: 8260,
    overrun: 0.137,
    planned: 41,
    actual: 34,
    delay: 58,
    health: 61,
    risk: "HIGH",
    status: "Delayed",
    confidence: 0.78,
    months: 64,
    costRatio: 1.14,
    agency: "Chennai Metro Rail Ltd",
    contractor: "Afcons Infrastructure",
    scope: "47 km corridor with 30 stations (Madhavaram–Sholinganallur)",
    f: [
      ["Land Acquisition", 24],
      ["Utility Shifting", 20],
      ["Geological Surprises", 15],
      ["Fund Release", 12],
    ],
  },
  {
    id: "PRJ-030",
    name: "Lucknow Integrated Command & Control Centre",
    dept: "Housing & Urban Affairs",
    state: "Uttar Pradesh",
    district: "Lucknow",
    lat: 26.8467,
    lng: 80.9462,
    budget: 680,
    overrun: 0.006,
    planned: 91,
    actual: 89,
    delay: 4,
    health: 94,
    risk: "LOW",
    status: "On Track",
    confidence: 0.86,
    months: 22,
    costRatio: 1.0,
    agency: "Lucknow Smart City Ltd",
    contractor: "Tech Mahindra Ltd",
    scope: "Command centre with 1,200 surveillance and sensor nodes",
    f: [
      ["Statutory Approvals", 10],
      ["Material Procurement", 8],
      ["Design Revisions", 6],
      ["Labour Availability", 5],
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Mildly S-shaped planned-progress curve: 35% linear, 65% smoothstep. */
const curve = (f) => {
  const x = Math.min(1, Math.max(0, f));
  return 100 * (0.35 * x + 0.65 * (3 * x * x - 2 * x * x * x));
};

/** Inverse of `curve`, by bisection. */
const inverseCurve = (pct) => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (curve(mid) < pct) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round = (v, dp = 0) => {
  const p = 10 ** dp;
  return Math.round(v * p) / p;
};

/** Deterministic noise in [-1, 1] from a string seed. */
const noise = (seed) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 2000) / 1000 - 1;
};

const addDays = (iso, days) => new Date(new Date(iso).getTime() + days * DAY).toISOString().slice(0, 10);
const diffDays = (a, b) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY);
const monthLabel = (iso) => {
  const d = new Date(iso);
  const month = d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" }).slice(0, 3);
  return `${month} ${String(d.getUTCFullYear()).slice(2)}`;
};
const endOfMonthBefore = (iso, monthsBack) => {
  const d = new Date(iso);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - monthsBack + 1, 0)).toISOString().slice(0, 10);
};

/* ------------------------------------------------------------------ */
/* Per-project derivation                                              */
/* ------------------------------------------------------------------ */
function buildProject(seed) {
  const dept = DEPARTMENTS.find((d) => d.name === seed.dept);
  const gap = round(seed.planned - seed.actual, 1);
  const f = inverseCurve(seed.planned);

  // Schedule: either honour an authored completion date or derive from duration.
  let durationDays;
  let plannedCompletion;
  if (seed.plannedCompletion) {
    durationDays = Math.round(diffDays(REPORT_DATE, seed.plannedCompletion) / (1 - f));
    plannedCompletion = seed.plannedCompletion;
  } else {
    durationDays = Math.round(seed.months * 30.4375);
    plannedCompletion = addDays(REPORT_DATE, Math.round(durationDays * (1 - f)));
  }
  const startDate = addDays(REPORT_DATE, -Math.round(durationDays * f));
  const reportedCompletion = addDays(plannedCompletion, seed.delay);

  // Prototype forecast model (deterministic, not a trained model).
  const predictedDelay = Math.round(seed.delay * 1.05 + gap * 0.5);
  const delayProbability = round(clamp(0.05 + gap * 0.025 + seed.delay * 0.0028, 0.03, 0.97), 2);
  const aiForecastCompletion = addDays(plannedCompletion, predictedDelay);

  const spent = Math.round(seed.budget * (seed.actual / 100) * seed.costRatio);
  const revisedCost = Math.round(seed.budget * (1 + seed.overrun));

  // Risk drivers
  const riskFactors = seed.f.map(([name, impact]) => {
    const d = DRIVERS[name];
    const [code, inCuf] = DRIVER_META[name];
    return {
      name,
      impact,
      category: d.category,
      responsiveness: d.responsiveness,
      mospi_code: code,
      mospi_reason: MOSPI_REASONS[code],
      in_cuf: inCuf,
    };
  });
  const impactSum = riskFactors.reduce((s, r) => s + r.impact, 0);

  // Health score composition — the four parts weight up to the health score.
  const schedule = round(clamp(100 - 2.2 * gap - 0.25 * seed.delay, 0, 100), 1);
  const cost = round(clamp(100 - 200 * Math.max(0, seed.costRatio - 1), 0, 100), 1);
  const riskScore = round(clamp(100 - (riskFactors[0].impact + riskFactors[1].impact) * 0.9, 0, 100), 1);
  const weighted3 = 0.4 * schedule + 0.25 * cost + 0.2 * riskScore;
  let governance = round((seed.health - weighted3) / 0.15, 1);
  let health = seed.health;
  if (governance < 5 || governance > 99) {
    governance = clamp(governance, 5, 99);
    health = Math.round(weighted3 + 0.15 * governance);
  }

  // Progress history: 12 reported months + 6 forecast months.
  const history = [];
  for (let k = 0; k <= 11; k += 1) {
    const monthEnd = endOfMonthBefore(REPORT_DATE, 11 - k);
    const fk = clamp(diffDays(startDate, monthEnd) / durationDays, 0, 1);
    const plannedK = k === 11 ? seed.planned : round(curve(fk), 1);
    const gapK = gap * (k / 11) ** 1.35;
    const jitter = k === 11 ? 0 : noise(`${seed.id}-h${k}`) * 0.7;
    const actualK = k === 11 ? seed.actual : round(clamp(plannedK - gapK + jitter, 0, plannedK), 1);
    history.push({
      period: monthLabel(monthEnd),
      date: monthEnd,
      planned: plannedK,
      actual: actualK,
      expenditure_crore: Math.round(
        seed.budget * (actualK / 100) * (1 + (seed.costRatio - 1) * (k / 11) ** 0.8),
      ),
    });
  }
  // Keep the actual series monotonic after jitter.
  for (let k = 1; k < history.length; k += 1) {
    if (history[k].actual < history[k - 1].actual) history[k].actual = history[k - 1].actual;
  }

  const recentVelocity = round((seed.actual - history[8].actual) / 3, 2);
  const plannedVelocity = round((seed.planned - history[8].planned) / 3, 2);
  const forecast = [];
  for (let j = 1; j <= 6; j += 1) {
    const monthEnd = endOfMonthBefore(REPORT_DATE, -j);
    const fk = clamp(diffDays(startDate, monthEnd) / durationDays, 0, 1);
    const projected = clamp(seed.actual + recentVelocity * j, 0, 100);
    forecast.push({
      period: monthLabel(monthEnd),
      date: monthEnd,
      planned: round(curve(fk), 1),
      forecast: round(projected, 1),
      forecast_low: round(clamp(projected - 1.6 * j, 0, 100), 1),
      forecast_high: round(clamp(projected + 1.4 * j, 0, 100), 1),
    });
  }

  // Milestones
  const names = MILESTONE_TEMPLATES[dept.kind];
  const milestones = names.map((name, i) => {
    const weight = MILESTONE_WEIGHTS[i];
    const prev = i === 0 ? 0 : MILESTONE_WEIGHTS[i - 1];
    const plannedDate = addDays(startDate, Math.round(durationDays * inverseCurve(weight)));
    const slip = Math.round(seed.delay * (0.35 + 0.65 * (i / (names.length - 1))));
    let status;
    let actualDate = null;
    let progress = 0;
    if (seed.actual >= weight) {
      status = "Completed";
      actualDate = addDays(plannedDate, Math.round(slip * 0.8));
      progress = 100;
    } else if (seed.actual > prev) {
      status = new Date(plannedDate) < new Date(REPORT_DATE) ? "Delayed" : "In Progress";
      progress = Math.round(((seed.actual - prev) / (weight - prev)) * 100);
    } else {
      status = "Pending";
    }
    return {
      name,
      weight,
      planned_date: plannedDate,
      actual_date: actualDate,
      forecast_date: status === "Completed" ? actualDate : addDays(plannedDate, slip),
      status,
      progress,
    };
  });

  // Delay attribution — days add up to the reported delay.
  const delayReasons = riskFactors
    .filter((r) => r.impact >= 10)
    .map((r) => ({
      reason: r.name,
      category: r.category,
      days: Math.round(seed.delay * (r.impact / impactSum)),
    }));
  if (delayReasons.length) {
    const assigned = delayReasons.reduce((s, r) => s + r.days, 0);
    delayReasons[0].days += seed.delay - assigned;
  }

  // What-if levers. Full intensity recovers impact × responsiveness of the forecast delay.
  const interventions = riskFactors.slice(0, 4).map((r) => {
    const d = DRIVERS[r.name];
    const share = round((r.impact / 100) * r.responsiveness, 4);
    return {
      id: `${seed.id}-${r.name.toLowerCase().replace(/[^a-z]+/g, "-")}`,
      label: d.lever,
      detail: d.leverDetail,
      driver: r.name,
      owner: d.owner,
      recovery_share: share,
      max_reduction_days: Math.round(predictedDelay * share),
      cost_crore: Math.max(1, Math.round(seed.budget * d.costFactor)),
    };
  });

  const topTwo = riskFactors.slice(0, 2).map((r) => r.name);
  const summary =
    seed.status === "On Track"
      ? `Physical progress is tracking ${gap <= 1 ? "in line with" : `${gap} points behind`} the sanctioned schedule. Residual exposure comes from ${topTwo[0].toLowerCase()}; no intervention is required this month.`
      : seed.status === "At Risk"
        ? `Progress has fallen ${gap} points behind schedule and the gap has widened over the last two reporting months. ${topTwo[0]} and ${topTwo[1].toLowerCase()} account for most of the slippage.`
        : `The project is ${seed.delay} days behind its sanctioned completion date with a ${gap}-point progress shortfall. ${topTwo[0]} is the dominant driver, compounded by ${topTwo[1].toLowerCase()}.`;

  return {
    project_id: seed.id,
    name: seed.name,
    department: seed.dept,
    department_id: dept.id,
    state: seed.state,
    district: seed.district,
    implementing_agency: seed.agency,
    contractor: seed.contractor,
    scope: seed.scope,
    hero: Boolean(seed.hero),
    budget_crore: seed.budget,
    revised_cost_crore: revisedCost,
    spent_crore: spent,
    cost_overrun_pct: round(seed.overrun * 100, 1),
    start_date: startDate,
    planned_completion: plannedCompletion,
    reported_completion: reportedCompletion,
    planned_progress: seed.planned,
    actual_progress: seed.actual,
    progress_gap: gap,
    delay_days: seed.delay,
    risk_level: seed.risk,
    status: seed.status,
    health_score: health,
    health_composition: {
      schedule,
      cost,
      risk: riskScore,
      governance,
      weights: { schedule: 0.4, cost: 0.25, risk: 0.2, governance: 0.15 },
    },
    coordinates: { lat: seed.lat, lng: seed.lng },
    monthly_progress_rate: recentVelocity,
    planned_monthly_rate: plannedVelocity,
    risk_factors: riskFactors,
    delay_reasons: delayReasons,
    milestones,
    progress_history: history,
    progress_forecast: forecast,
    ai_prediction: {
      delay_probability: delayProbability,
      predicted_delay_days: predictedDelay,
      confidence: seed.confidence,
      forecast_completion: aiForecastCompletion,
      additional_slippage_days: predictedDelay - seed.delay,
      summary,
    },
    interventions,
    last_updated: REPORT_DATE,
  };
}

const projects = SEED.map(buildProject);

/* ------------------------------------------------------------------ */
/* Derived alert feed                                                  */
/* ------------------------------------------------------------------ */
const severityOf = (p) =>
  p.risk_level === "CRITICAL" ? "Critical" : p.risk_level === "HIGH" ? "High" : "Medium";

const alerts = projects
  .filter((p) => p.status !== "On Track")
  .map((p) => {
    const trend = round(p.progress_gap - (p.planned_progress - p.progress_history[8].actual), 1);
    const driver = p.risk_factors[0];
    const raised = addDays(REPORT_DATE, -(3 + (p.delay_days % 17)));
    return {
      alert_id: `ALR-${p.project_id.slice(4)}`,
      project_id: p.project_id,
      project_name: p.name,
      department: p.department,
      state: p.state,
      severity: severityOf(p),
      title:
        p.risk_level === "CRITICAL"
          ? `Critical slippage on ${p.name}`
          : `Schedule variance widening on ${p.name}`,
      detail: `Progress gap of ${p.progress_gap} points against plan, ${p.delay_days} days behind the sanctioned completion date. Primary driver: ${driver.name.toLowerCase()} (${driver.impact}% attributed impact).`,
      recommended_action: p.interventions[0].label,
      predicted_delay_days: p.ai_prediction.predicted_delay_days,
      raised_on: raised,
      age_days: diffDays(raised, REPORT_DATE),
      trend_points: trend,
    };
  })
  .sort(
    (a, b) =>
      ["Medium", "High", "Critical"].indexOf(b.severity) -
        ["Medium", "High", "Critical"].indexOf(a.severity) ||
      b.predicted_delay_days - a.predicted_delay_days,
  );

/* ------------------------------------------------------------------ */
/* Portfolio meta                                                      */
/* ------------------------------------------------------------------ */
const sum = (key) => DEPARTMENTS.reduce((s, d) => s + d[key], 0);
const totalProjects = sum("total_projects");
const sanctioned = sum("sanctioned_cost_crore");
const revised = sum("revised_cost_crore");

const meta = {
  product: "DelayDector",
  report_date: REPORT_DATE,
  reporting_period: "September 2026",
  disclaimer:
    "Demonstration prototype. All projects, risk scores and AI outputs on this platform are simulated showcase data and are not connected to live government systems.",
  problem_statement: {
    id: "SIH26103",
    title: "Use case on web-based integrated project-monitoring platform",
    organization: "Ministry of Statistics and Programme Implementation (MoSPI)",
    department: "Data Informatics & Innovation Division",
    category: "Software",
    theme: "Smart Automation",
  },
  data_sources: [
    {
      name: "PAIMANA portal",
      detail:
        "Project Assessment, Infrastructure Monitoring and Analytics for Nation-building — the live monthly reporting portal that replaced OCMS.",
      role: "Monthly Common Upload Form submissions from implementing agencies",
    },
    {
      name: "OCMS archive",
      detail:
        "Online Computerised Monitoring System records, which carry the historical reason-for-delay labels the newer format no longer publishes.",
      role: "Supervised training labels for time and cost overrun",
    },
    {
      name: "Flash Report series",
      detail: "MoSPI's monthly report on central sector projects costing Rs 150 crore and above.",
      role: "Benchmarking and sector comparison",
    },
  ],
  mospi_reasons: MOSPI_REASONS,
  data_gaps: DATA_GAPS,
  model_card: MODEL_CARD,
  portfolio: {
    total_projects: totalProjects,
    monitored_in_detail: projects.length,
    on_track: sum("on_track"),
    at_risk: sum("at_risk"),
    delayed: sum("delayed"),
    risk_distribution: { LOW: 27, MEDIUM: 13, HIGH: 12, CRITICAL: 5 },
    sanctioned_cost_crore: sanctioned,
    revised_cost_crore: revised,
    expenditure_crore: sum("expenditure_crore"),
    cost_overrun_crore: revised - sanctioned,
    cost_overrun_pct: round(((revised - sanctioned) / sanctioned) * 100, 1),
    avg_health_score: Math.round(
      DEPARTMENTS.reduce((s, d) => s + d.avg_health_score * d.total_projects, 0) / totalProjects,
    ),
    avg_time_overrun_days: Math.round(
      DEPARTMENTS.reduce((s, d) => s + d.avg_time_overrun_days * d.total_projects, 0) / totalProjects,
    ),
    states_covered: new Set(projects.map((p) => p.state)).size,
  },
};

/* ------------------------------------------------------------------ */
mkdirSync(DATA_DIR, { recursive: true });
const write = (file, value) => {
  writeFileSync(join(DATA_DIR, file), `${JSON.stringify(value, null, 2)}\n`);
  console.log(`  wrote data/${file}`);
};

write("meta.json", meta);
write("departments.json", DEPARTMENTS);
write("projects.json", projects);
write("alerts.json", alerts);

console.log(
  `\nDelayDector demo dataset: ${projects.length} detailed projects, ${alerts.length} alerts, portfolio of ${totalProjects}.`,
);
