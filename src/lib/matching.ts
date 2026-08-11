// Rule-based, multi-scheme eligibility engine.
// Every scheme in the database is evaluated independently against the user's
// profile. Nothing is truncated: all eligible schemes are returned.
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

export type MatchStatus = "eligible" | "verify" | "ineligible";

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

/** Central schemes are stored either with a null state or the literal "Central". */
export function isCentral(scheme: Scheme): boolean {
  const s = norm(scheme.state);
  return s === "" || s === "central" || s === "all india" || s === "india";
}

export function schemeLevel(scheme: Scheme): "central" | "state" {
  return isCentral(scheme) ? "central" : "state";
}

/** A scheme from a different state must never be shown to the user. */
export function belongsToUser(scheme: Scheme, p: UserProfile): boolean {
  return isCentral(scheme) || norm(scheme.state) === norm(p.state);
}

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

function listHas(list: string[] | null | undefined, value?: string | null) {
  const arr = (list ?? []).map(norm).filter(Boolean);
  if (arr.length === 0) return "empty" as const;
  if (arr.includes("any") || arr.includes("all")) return "any" as const;
  if (!value) return "unknown" as const;
  return arr.includes(norm(value)) ? ("yes" as const) : ("no" as const);
}

/**
 * Evaluate ONE scheme against the profile. Each condition is checked
 * independently — evaluation never short-circuits, so the user always gets the
 * full "why you qualify" / "why not" breakdown.
 */
export function evaluateScheme(scheme: Scheme, p: UserProfile): SchemeMatch {
  const checks: EligibilityCheck[] = [];
  const reasons: MatchReason[] = [];
  const add = (key: string, label: string, status: CheckStatus, detail: string) =>
    checks.push({ key, label, status, detail });

  // ---- State / level -------------------------------------------------
  if (isCentral(scheme)) {
    add("state", "Government level", "pass", "Central scheme — open to every state");
  } else if (norm(scheme.state) === norm(p.state)) {
    add("state", "State", "pass", `${p.state} — matched`);
    reasons.push("stateMatches");
  } else {
    add("state", "State", "fail", `Only for ${scheme.state}`);
  }

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
  const schemeArea = (scheme as any).area_type as string | undefined;
  if (schemeArea && norm(schemeArea) !== "any") {
    if (!p.areaType) {
      add("area", "Rural / urban", "unknown", `Required ${schemeArea} — not provided`);
    } else if (norm(schemeArea) === norm(p.areaType)) {
      add("area", "Rural / urban", "pass", `${p.areaType} — matched`);
      reasons.push("areaMatches");
    } else {
      add("area", "Rural / urban", "fail", `Only for ${schemeArea} applicants`);
    }
  }

  // ---- Education (OR list) ------------------------------------------
  {
    const r = listHas((scheme as any).education_levels, p.education);
    if (r === "yes") {
      add("education", "Education", "pass", `${p.education} — matched`);
      reasons.push("educationMatches");
    } else if (r === "unknown") {
      add("education", "Education", "unknown", "Education level is required for this scheme");
    } else if (r === "no") {
      add("education", "Education", "fail", `For ${((scheme as any).education_levels ?? []).join(", ")}`);
    }
  }

  // ---- Caste category (OR list) --------------------------------------
  {
    const r = listHas((scheme as any).caste_categories, p.caste);
    if (r === "yes") {
      add("caste", "Category", "pass", `${(p.caste ?? "").toUpperCase()} — matched`);
      reasons.push("casteMatches");
    } else if (r === "unknown") {
      add("caste", "Category", "unknown", "Caste / social category is required for this scheme");
    } else if (r === "no") {
      add("caste", "Category", "fail", `For ${((scheme as any).caste_categories ?? []).join(", ").toUpperCase()}`);
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

  if (scheme.is_popular) reasons.push("popular");

  const failures = checks.filter((c) => c.status === "fail").map((c) => `${c.label}: ${c.detail}`);
  const missing = checks.filter((c) => c.status === "unknown").map((c) => `${c.label}: ${c.detail}`);

  const status: MatchStatus =
    failures.length > 0 ? "ineligible" : missing.length > 0 ? "verify" : "eligible";

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
};

/**
 * Full pipeline: normalize → load all → keep Central + user's state →
 * evaluate every scheme → classify → dedupe → return every group.
 */
export function evaluateAll(schemes: Scheme[], p: UserProfile): EligibilityResult {
  const relevant = dedupeSchemes(schemes).filter((s) => belongsToUser(s, p));
  const all = sortMatches(relevant.map((s) => evaluateScheme(s, p)), "match");
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
  };
}

/** Backwards-compatible ranked list (all evaluated schemes, best first). */
export function rankMatches(schemes: Scheme[], p: UserProfile): SchemeMatch[] {
  return evaluateAll(schemes, p).all;
}

export function myschemeUrl(name: string): string {
  return `https://www.myscheme.gov.in/search?q=${encodeURIComponent(name)}`;
}
