// Deterministic, rule-based multi-scheme eligibility engine.
//
// Every scheme in the catalogue is evaluated independently against the user's
// profile. Nothing is truncated and nothing is decided by AI: the classification
// comes purely from the stored scheme rules + the user profile.
import type { Scheme, UserProfile } from "./schemes";

export type MatchReason =
  | "ageMatches"
  | "genderMatches"
  | "incomeMatches"
  | "stateMatches"
  | "occupationMatches"
  | "disabilityMatches"
  | "educationMatches"
  | "casteMatches"
  | "areaMatches"
  | "popular";

export type CheckStatus = "pass" | "fail" | "unknown";

export type EligibilityCheck = {
  key: string;
  label: string;
  status: CheckStatus;
  detail: string;
};

export type MatchStatus =
  | "eligible"
  | "verify"
  | "ineligible"
  | "out_of_scope"
  | "inactive";

export type SchemeMatch = {
  scheme: Scheme;
  /** true only when every mandatory known condition passes */
  eligible: boolean;
  status: MatchStatus;
  reasons: MatchReason[];
  checks: EligibilityCheck[];
  /** human-readable list of information the user still needs to supply */
  missing: string[];
  /** conditions that clearly failed (used for the "not eligible" group) */
  failures: string[];
  confidence: number; // 0..100
};

const norm = (v?: string | null) =>
  (v ?? "").toString().trim().toLowerCase().replace(/\s+/g, " ");

const UNION_TERRITORIES = [
  "Delhi",
  "Puducherry",
  "Chandigarh",
  "Ladakh",
  "Jammu and Kashmir",
  "Lakshadweep",
  "Andaman and Nicobar Islands",
  "Dadra and Nagar Haveli and Daman and Diu",
];

export function isUnionTerritory(state?: string | null): boolean {
  return UNION_TERRITORIES.some((u) => norm(u) === norm(state));
}

type ScopedScheme = Scheme & {
  government_level?: string | null;
  scheme_scope?: string | null;
  available_states?: string[] | null;
  districts?: string[] | null;
  scheme_status?: string | null;
  verification_status?: string | null;
  official_source_url?: string | null;
  eligibility_rules?: unknown;
  min_annual_income?: number | null;
  student_required?: boolean | null;
  farmer_required?: boolean | null;
  land_ownership_required?: boolean | null;
  employment_status?: string | null;
  marital_status?: string | null;
  widow_required?: boolean | null;
  senior_citizen_required?: boolean | null;
  minority_required?: boolean | null;
  residency_required?: boolean | null;
  residency_years?: number | null;
  bpl_only?: boolean | null;
  area_type?: string | null;
  education_levels?: string[] | null;
  caste_categories?: string[] | null;
};

export type SchemeScope =
  | "CENTRAL_NATIONWIDE"
  | "CENTRAL_STATE_IMPLEMENTED"
  | "STATE_ONLY"
  | "MULTI_STATE"
  | "UT_ONLY"
  | "DISTRICT_SPECIFIC";

export function schemeScope(scheme: Scheme): SchemeScope {
  const s = (scheme as ScopedScheme).scheme_scope;
  if (s) return s as SchemeScope;
  // Legacy fallback derived from the state column only.
  const st = norm(scheme.state);
  if (!st || st === "central" || st === "all india" || st === "india") return "CENTRAL_NATIONWIDE";
  return isUnionTerritory(scheme.state) ? "UT_ONLY" : "STATE_ONLY";
}

/** Central-level schemes: nationwide, state-implemented or multi-state programmes. */
export function isCentral(scheme: Scheme): boolean {
  const level = norm((scheme as ScopedScheme).government_level);
  if (level) return level === "central";
  const scope = schemeScope(scheme);
  return scope === "CENTRAL_NATIONWIDE" || scope === "CENTRAL_STATE_IMPLEMENTED";
}

export function schemeLevel(scheme: Scheme): "central" | "state" {
  return isCentral(scheme) ? "central" : "state";
}

function availableStates(scheme: Scheme): string[] {
  const arr = (scheme as ScopedScheme).available_states ?? [];
  const list = arr.map(norm).filter(Boolean);
  if (list.length === 0 && scheme.state) list.push(norm(scheme.state));
  return list;
}

export type GeoResult = { ok: boolean; detail: string; label: string };

/**
 * Geographic availability — this NEVER reduces to `scheme.state === user.state`.
 * It is driven by government_level + scheme_scope + available_states.
 */
export function checkGeography(scheme: Scheme, p: UserProfile): GeoResult {
  const scope = schemeScope(scheme);
  const states = availableStates(scheme);
  const user = norm(p.state);

  switch (scope) {
    case "CENTRAL_NATIONWIDE":
      return { ok: true, label: "Government level", detail: "Central scheme — available across India" };
    case "CENTRAL_STATE_IMPLEMENTED":
      if (states.length === 0 || states.includes(user))
        return { ok: true, label: "Government level", detail: "Central scheme implemented through your State/UT" };
      return { ok: false, label: "State", detail: `Implemented only in ${(scheme as ScopedScheme).available_states?.join(", ")}` };
    case "MULTI_STATE":
      if (states.includes(user))
        return { ok: true, label: "State", detail: `${p.state} — scheme operates in your state` };
      return { ok: false, label: "State", detail: `Available only in ${(scheme as ScopedScheme).available_states?.join(", ")}` };
    case "DISTRICT_SPECIFIC": {
      const districts = ((scheme as ScopedScheme).districts ?? []).map(norm).filter(Boolean);
      if (!states.includes(user))
        return { ok: false, label: "State", detail: `Only for ${scheme.state}` };
      const userDistrict = norm((p as UserProfile & { district?: string }).district);
      if (districts.length === 0 || !userDistrict || districts.includes(userDistrict))
        return { ok: true, label: "District", detail: districts.length ? `Districts: ${(scheme as ScopedScheme).districts?.join(", ")}` : `${p.state} — matched` };
      return { ok: false, label: "District", detail: `Only for ${(scheme as ScopedScheme).districts?.join(", ")}` };
    }
    case "UT_ONLY":
    case "STATE_ONLY":
    default:
      if (states.includes(user))
        return { ok: true, label: "State", detail: `${p.state} — matched` };
      return { ok: false, label: "State", detail: `Only for residents of ${scheme.state ?? (scheme as ScopedScheme).available_states?.join(", ")}` };
  }
}

/** A scheme must be geographically available to the user to be shown at all. */
export function belongsToUser(scheme: Scheme, p: UserProfile): boolean {
  return checkGeography(scheme, p).ok;
}

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

function listHas(list: string[] | null | undefined, value?: string | null) {
  const arr = (list ?? []).map(norm).filter(Boolean);
  if (arr.length === 0) return "empty" as const;
  if (arr.includes("any") || arr.includes("all")) return "any" as const;
  if (!value) return "unknown" as const;
  return arr.includes(norm(value)) ? ("yes" as const) : ("no" as const);
}

// ---------------------------------------------------------------------------
// Generic rule engine for the scheme `eligibility_rules` JSON column.
// Supports: all / any / not, and the operators
// equals, not_equals, in, not_in, >=, <=, >, <, range, exists, boolean.
// ---------------------------------------------------------------------------
type Rule =
  | { all: Rule[] }
  | { any: Rule[] }
  | { not: Rule }
  | { field: string; operator: string; value?: unknown; label?: string };

type RuleOutcome = "pass" | "fail" | "unknown";

function profileValue(p: UserProfile, field: string): unknown {
  const anyP = p as unknown as Record<string, unknown>;
  const map: Record<string, unknown> = {
    age: p.age,
    gender: p.gender,
    state: p.state,
    district: anyP["district"],
    area: p.areaType,
    area_type: p.areaType,
    rural_urban: p.areaType,
    income: p.annualIncome,
    annual_income: p.annualIncome,
    occupation: p.occupation,
    education: p.education,
    education_level: p.education,
    category: p.caste,
    caste: p.caste,
    social_category: p.caste,
    disability: p.hasDisability,
    student: anyP["isStudent"] ?? (norm(p.occupation) === "student" ? true : undefined),
    farmer: anyP["isFarmer"] ?? (norm(p.occupation) === "farmer" ? true : undefined),
    land_ownership: anyP["ownsLand"],
    bpl: anyP["isBpl"],
    ration_card: anyP["hasRationCard"],
    marital_status: anyP["maritalStatus"],
    employment_status: anyP["employmentStatus"],
    parent_occupation: p.parentOccupation,
  };
  return field in map ? map[field] : anyP[field];
}

function compare(op: string, actual: unknown, expected: unknown): RuleOutcome {
  if (actual === undefined || actual === null || actual === "") {
    return op === "exists" ? "fail" : "unknown";
  }
  const n = typeof actual === "number" ? actual : Number(actual);
  const arr = Array.isArray(expected) ? expected.map((v) => norm(String(v))) : [];
  switch (op) {
    case "equals":
    case "==":
      return norm(String(actual)) === norm(String(expected)) ? "pass" : "fail";
    case "not_equals":
    case "!=":
      return norm(String(actual)) !== norm(String(expected)) ? "pass" : "fail";
    case "in":
      return arr.includes(norm(String(actual))) ? "pass" : "fail";
    case "not_in":
      return !arr.includes(norm(String(actual))) ? "pass" : "fail";
    case ">=":
      return !Number.isNaN(n) && n >= Number(expected) ? "pass" : "fail";
    case "<=":
      return !Number.isNaN(n) && n <= Number(expected) ? "pass" : "fail";
    case ">":
      return !Number.isNaN(n) && n > Number(expected) ? "pass" : "fail";
    case "<":
      return !Number.isNaN(n) && n < Number(expected) ? "pass" : "fail";
    case "range": {
      const [lo, hi] = Array.isArray(expected) ? expected : [undefined, undefined];
      const okLo = lo == null || n >= Number(lo);
      const okHi = hi == null || n <= Number(hi);
      return okLo && okHi ? "pass" : "fail";
    }
    case "boolean":
    case "is_true":
      return Boolean(actual) === (expected === undefined ? true : Boolean(expected)) ? "pass" : "fail";
    case "exists":
      return "pass";
    default:
      return "unknown";
  }
}

function evalRule(rule: Rule, p: UserProfile): { outcome: RuleOutcome; detail: string } {
  if ("all" in rule) {
    const parts = rule.all.map((r) => evalRule(r, p));
    if (parts.some((x) => x.outcome === "fail"))
      return { outcome: "fail", detail: parts.filter((x) => x.outcome === "fail").map((x) => x.detail).join("; ") };
    if (parts.some((x) => x.outcome === "unknown"))
      return { outcome: "unknown", detail: parts.filter((x) => x.outcome === "unknown").map((x) => x.detail).join("; ") };
    return { outcome: "pass", detail: parts.map((x) => x.detail).join("; ") };
  }
  if ("any" in rule) {
    const parts = rule.any.map((r) => evalRule(r, p));
    if (parts.some((x) => x.outcome === "pass"))
      return { outcome: "pass", detail: parts.find((x) => x.outcome === "pass")!.detail };
    if (parts.some((x) => x.outcome === "unknown"))
      return { outcome: "unknown", detail: parts.map((x) => x.detail).join(" or ") };
    return { outcome: "fail", detail: parts.map((x) => x.detail).join(" or ") };
  }
  if ("not" in rule) {
    const r = evalRule(rule.not, p);
    if (r.outcome === "unknown") return r;
    return { outcome: r.outcome === "pass" ? "fail" : "pass", detail: `not (${r.detail})` };
  }
  const actual = profileValue(p, rule.field);
  const outcome = compare(rule.operator, actual, rule.value);
  const expected = Array.isArray(rule.value) ? rule.value.join(" / ") : String(rule.value ?? "");
  const label = rule.label ?? `${rule.field} ${rule.operator} ${expected}`;
  const detail =
    outcome === "unknown" ? `${label} — your ${rule.field.replace(/_/g, " ")} is missing` : `${label} (yours: ${String(actual)})`;
  return { outcome, detail };
}

/**
 * Evaluate ONE scheme against the profile. Each condition is checked
 * independently — evaluation never short-circuits, so the user always gets the
 * full "why you qualify" / "why not" breakdown.
 */
export function evaluateScheme(scheme: Scheme, p: UserProfile): SchemeMatch {
  const s = scheme as ScopedScheme;
  const checks: EligibilityCheck[] = [];
  const reasons: MatchReason[] = [];
  const add = (key: string, label: string, status: CheckStatus, detail: string) =>
    checks.push({ key, label, status, detail });

  // ---- Geography (scope aware) ---------------------------------------
  const geo = checkGeography(scheme, p);
  add("state", geo.label, geo.ok ? "pass" : "fail", geo.detail);
  if (geo.ok && !isCentral(scheme)) reasons.push("stateMatches");

  // ---- Age -----------------------------------------------------------
  if (scheme.min_age != null || scheme.max_age != null) {
    const range = `${scheme.min_age ?? 0}–${scheme.max_age ?? "any"}`;
    if (!p.age || Number.isNaN(p.age)) {
      add("age", "Age", "unknown", `Required ${range} — your age is missing`);
    } else if (
      (scheme.min_age == null || p.age >= scheme.min_age) &&
      (scheme.max_age == null || p.age <= scheme.max_age)
    ) {
      add("age", "Age", "pass", `${p.age} — required ${range}`);
      reasons.push("ageMatches");
    } else {
      add("age", "Age", "fail", `${p.age} — required ${range}`);
    }
  }

  // ---- Gender --------------------------------------------------------
  if (scheme.gender && norm(scheme.gender) !== "any") {
    if (!p.gender) {
      add("gender", "Gender", "unknown", `Required ${scheme.gender} — not provided`);
    } else if (norm(scheme.gender) === norm(p.gender)) {
      add("gender", "Gender", "pass", `${p.gender} — matched`);
      reasons.push("genderMatches");
    } else {
      add("gender", "Gender", "fail", `Only for ${scheme.gender}`);
    }
  }

  // ---- Income --------------------------------------------------------
  if (scheme.max_annual_income != null) {
    if (p.annualIncome == null || Number.isNaN(p.annualIncome)) {
      add("income", "Annual income", "unknown", `Limit ${inr(scheme.max_annual_income)} — income not provided`);
    } else if (p.annualIncome <= scheme.max_annual_income) {
      add("income", "Annual income", "pass", `${inr(p.annualIncome)} — limit ${inr(scheme.max_annual_income)}`);
      reasons.push("incomeMatches");
    } else {
      add("income", "Annual income", "fail", `${inr(p.annualIncome)} exceeds limit ${inr(scheme.max_annual_income)}`);
    }
  }
  if (s.min_annual_income != null) {
    if (p.annualIncome == null || Number.isNaN(p.annualIncome)) {
      add("income_min", "Minimum income", "unknown", "Income not provided");
    } else if (p.annualIncome >= s.min_annual_income) {
      add("income_min", "Minimum income", "pass", `${inr(p.annualIncome)} — minimum ${inr(s.min_annual_income)}`);
    } else {
      add("income_min", "Minimum income", "fail", `${inr(p.annualIncome)} below minimum ${inr(s.min_annual_income)}`);
    }
  }

  // ---- Occupation (OR list) -----------------------------------------
  {
    const r = listHas(scheme.occupations, p.occupation);
    if (r === "yes") {
      add("occupation", "Occupation", "pass", `${p.occupation} — matched`);
      reasons.push("occupationMatches");
    } else if (r === "unknown") {
      add("occupation", "Occupation", "unknown", "Occupation not provided");
    } else if (r === "no") {
      // parent occupation can satisfy child/student schemes
      const viaParent = listHas(scheme.occupations, p.parentOccupation);
      if (viaParent === "yes") {
        add("occupation", "Occupation", "pass", `Parent occupation: ${p.parentOccupation} — matched`);
        reasons.push("occupationMatches");
      } else {
        add("occupation", "Occupation", "fail", `For ${(scheme.occupations ?? []).join(", ")}`);
      }
    }
  }

  // ---- Area type -----------------------------------------------------
  if (s.area_type && norm(s.area_type) !== "any") {
    if (!p.areaType) {
      add("area", "Rural / urban", "unknown", `Required ${s.area_type} — not provided`);
    } else if (norm(s.area_type) === norm(p.areaType)) {
      add("area", "Rural / urban", "pass", `${p.areaType} — matched`);
      reasons.push("areaMatches");
    } else {
      add("area", "Rural / urban", "fail", `Only for ${s.area_type} applicants`);
    }
  }

  // ---- Education (OR list) ------------------------------------------
  {
    const r = listHas(s.education_levels, p.education);
    if (r === "yes") {
      add("education", "Education", "pass", `${p.education} — matched`);
      reasons.push("educationMatches");
    } else if (r === "unknown") {
      add("education", "Education", "unknown", "Education level is required for this scheme");
    } else if (r === "no") {
      add("education", "Education", "fail", `For ${(s.education_levels ?? []).join(", ")}`);
    }
  }

  // ---- Caste category (OR list) --------------------------------------
  {
    const r = listHas(s.caste_categories, p.caste);
    if (r === "yes") {
      add("caste", "Category", "pass", `${(p.caste ?? "").toUpperCase()} — matched`);
      reasons.push("casteMatches");
    } else if (r === "unknown") {
      add("caste", "Category", "unknown", "Caste / social category is required for this scheme");
    } else if (r === "no") {
      add("caste", "Category", "fail", `For ${(s.caste_categories ?? []).join(", ").toUpperCase()}`);
    }
  }

  // ---- Disability ----------------------------------------------------
  if (scheme.disability_required) {
    if (p.hasDisability) {
      add("disability", "Disability", "pass", "Person with disability — matched");
      reasons.push("disabilityMatches");
    } else {
      add("disability", "Disability", "fail", "Requires a disability certificate");
    }
  }

  // ---- Boolean profile requirements ----------------------------------
  const anyP = p as unknown as Record<string, unknown>;
  const boolCheck = (
    key: string,
    label: string,
    required: boolean | null | undefined,
    value: unknown,
    passText: string,
    missingText: string,
  ) => {
    if (!required) return;
    if (value === undefined || value === null) add(key, label, "unknown", missingText);
    else if (value) add(key, label, "pass", passText);
    else add(key, label, "fail", `${label} is required for this scheme`);
  };

  const studentValue = anyP["isStudent"] ?? (norm(p.occupation) === "student" ? true : undefined);
  const farmerValue = anyP["isFarmer"] ?? (norm(p.occupation) === "farmer" ? true : undefined);
  boolCheck("student", "Student status", s.student_required, studentValue, "Student — matched", "Student status not provided");
  boolCheck("farmer", "Farmer status", s.farmer_required, farmerValue, "Farmer — matched", "Farmer status not provided");
  boolCheck("land", "Land ownership", s.land_ownership_required, anyP["ownsLand"], "Owns cultivable land", "Land ownership not provided");
  boolCheck("bpl", "BPL status", s.bpl_only, anyP["isBpl"], "BPL household — matched", "BPL / ration card status not provided");
  boolCheck("widow", "Widow", s.widow_required, anyP["isWidow"], "Widow — matched", "Marital status not provided");
  boolCheck("minority", "Minority", s.minority_required, p.caste ? norm(p.caste) === "minority" : undefined, "Minority — matched", "Social category not provided");

  if (s.senior_citizen_required) {
    if (!p.age) add("senior", "Senior citizen", "unknown", "Age not provided");
    else if (p.age >= 60) add("senior", "Senior citizen", "pass", `${p.age} — 60+`);
    else add("senior", "Senior citizen", "fail", `${p.age} — must be 60 or above`);
  }

  if (s.employment_status && norm(s.employment_status) !== "any") {
    const val = anyP["employmentStatus"] as string | undefined;
    if (!val) add("employment", "Employment status", "unknown", `Required ${s.employment_status} — not provided`);
    else if (norm(val) === norm(s.employment_status)) add("employment", "Employment status", "pass", `${val} — matched`);
    else add("employment", "Employment status", "fail", `Only for ${s.employment_status}`);
  }

  if (s.marital_status && norm(s.marital_status) !== "any") {
    const val = anyP["maritalStatus"] as string | undefined;
    if (!val) add("marital", "Marital status", "unknown", `Required ${s.marital_status} — not provided`);
    else if (norm(val) === norm(s.marital_status)) add("marital", "Marital status", "pass", `${val} — matched`);
    else add("marital", "Marital status", "fail", `Only for ${s.marital_status}`);
  }

  // ---- Custom JSON rules ---------------------------------------------
  if (s.eligibility_rules && typeof s.eligibility_rules === "object") {
    const r = evalRule(s.eligibility_rules as Rule, p);
    add("rules", "Scheme conditions", r.outcome === "pass" ? "pass" : r.outcome === "fail" ? "fail" : "unknown", r.detail);
  }

  if (scheme.is_popular) reasons.push("popular");

  const failures = checks.filter((c) => c.status === "fail").map((c) => `${c.label}: ${c.detail}`);
  const missing = checks.filter((c) => c.status === "unknown").map((c) => `${c.label}: ${c.detail}`);

  let status: MatchStatus;
  if (!geo.ok) status = "out_of_scope";
  else if (s.scheme_status && norm(s.scheme_status) !== "active") status = "inactive";
  else if (failures.length > 0) status = "ineligible";
  else if (missing.length > 0) status = "verify";
  else status = "eligible";

  const total = checks.length;
  const passed = checks.filter((c) => c.status === "pass").length;
  let confidence: number;
  if (status === "eligible") {
    const base = 60;
    const bonus = total === 0 ? 20 : Math.round((passed / total) * 35);
    confidence = Math.min(99, base + bonus + (scheme.is_popular ? 5 : 0) + (isCentral(scheme) ? 0 : 4));
  } else if (status === "verify") {
    confidence = Math.max(40, Math.round((passed / Math.max(1, total)) * 70));
  } else {
    confidence = total > 0 ? Math.round((passed / total) * 45) : 20;
  }

  return {
    scheme,
    eligible: status === "eligible",
    status,
    reasons,
    checks,
    missing,
    failures,
    confidence,
  };
}

/** Remove duplicate scheme records (same slug / id / name). */
export function dedupeSchemes(schemes: Scheme[]): Scheme[] {
  const seen = new Set<string>();
  const out: Scheme[] = [];
  for (const s of schemes) {
    const key = norm(s.slug) || norm(s.name) || s.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

export type SortKey = "match" | "relevance" | "popular" | "recent";

export function sortMatches(matches: SchemeMatch[], key: SortKey): SchemeMatch[] {
  const arr = [...matches];
  arr.sort((a, b) => {
    switch (key) {
      case "popular":
        if (!!a.scheme.is_popular !== !!b.scheme.is_popular) return a.scheme.is_popular ? -1 : 1;
        return b.confidence - a.confidence;
      case "recent": {
        const at = new Date((a.scheme as any).last_updated ?? a.scheme.created_at ?? 0).getTime();
        const bt = new Date((b.scheme as any).last_updated ?? b.scheme.created_at ?? 0).getTime();
        if (at !== bt) return bt - at;
        return b.confidence - a.confidence;
      }
      case "relevance": {
        const ap = a.checks.filter((c) => c.status === "pass").length;
        const bp = b.checks.filter((c) => c.status === "pass").length;
        if (ap !== bp) return bp - ap;
        return b.confidence - a.confidence;
      }
      default: {
        // own-state schemes first, then confidence
        const as = isCentral(a.scheme) ? 0 : 1;
        const bs = isCentral(b.scheme) ? 0 : 1;
        if (as !== bs) return bs - as;
        return b.confidence - a.confidence;
      }
    }
  });
  return arr;
}

export type EligibilityResult = {
  all: SchemeMatch[];
  eligible: SchemeMatch[];
  verify: SchemeMatch[];
  ineligible: SchemeMatch[];
  counts: { total: number; central: number; state: number; verify: number; ineligible: number };
  /** developer/debug diagnostics — never truncated */
  debug: {
    catalogue: number;
    duplicatesRemoved: number;
    candidates: number;
    outOfScope: number;
    inactive: number;
    eligible: number;
    verify: number;
    ineligible: number;
  };
};

/**
 * Full pipeline: normalize → load all → scope-aware geography →
 * evaluate every scheme → classify → dedupe → return every group.
 */
export function evaluateAll(schemes: Scheme[], p: UserProfile): EligibilityResult {
  const deduped = dedupeSchemes(schemes);
  const duplicatesRemoved = schemes.length - deduped.length;

  const evaluated = deduped.map((s) => evaluateScheme(s, p));
  const outOfScope = evaluated.filter((m) => m.status === "out_of_scope");
  const inactive = evaluated.filter((m) => m.status === "inactive");
  const inScope = evaluated.filter((m) => m.status !== "out_of_scope" && m.status !== "inactive");

  const all = sortMatches(inScope, "match");
  const eligible = all.filter((m) => m.status === "eligible");
  const verify = all.filter((m) => m.status === "verify");
  const ineligible = all.filter((m) => m.status === "ineligible");

  return {
    all,
    eligible,
    verify,
    ineligible,
    counts: {
      total: eligible.length,
      central: eligible.filter((m) => isCentral(m.scheme)).length,
      state: eligible.filter((m) => !isCentral(m.scheme)).length,
      verify: verify.length,
      ineligible: ineligible.length,
    },
    debug: {
      catalogue: schemes.length,
      duplicatesRemoved,
      candidates: inScope.length,
      outOfScope: outOfScope.length,
      inactive: inactive.length,
      eligible: eligible.length,
      verify: verify.length,
      ineligible: ineligible.length,
    },
  };
}

/** Backwards-compatible ranked list (all evaluated schemes, best first). */
export function rankMatches(schemes: Scheme[], p: UserProfile): SchemeMatch[] {
  return evaluateAll(schemes, p).all;
}

export function myschemeUrl(name: string): string {
  return `https://www.myscheme.gov.in/search?q=${encodeURIComponent(name)}`;
}
