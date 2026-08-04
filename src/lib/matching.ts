// Extended eligibility matching with per-scheme reasons and confidence score.
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

export type SchemeMatch = {
  scheme: Scheme;
  eligible: boolean;
  reasons: MatchReason[];
  confidence: number; // 0..100
};

/** A scheme belonging to a different state must never be shown to the user. */
export function belongsToUser(scheme: Scheme, p: UserProfile): boolean {
  return !scheme.state || scheme.state === p.state;
}

export function evaluateScheme(scheme: Scheme, p: UserProfile): SchemeMatch {
  const reasons: MatchReason[] = [];
  let eligible = true;
  let hardHits = 0;
  let hardTotal = 0;

  // Age
  if (scheme.min_age != null || scheme.max_age != null) {
    hardTotal++;
    const okMin = scheme.min_age == null || p.age >= scheme.min_age;
    const okMax = scheme.max_age == null || p.age <= scheme.max_age;
    if (okMin && okMax) {
      hardHits++;
      reasons.push("ageMatches");
    } else {
      eligible = false;
    }
  }

  // Gender
  if (scheme.gender && scheme.gender !== "any") {
    hardTotal++;
    if (scheme.gender === p.gender) {
      hardHits++;
      reasons.push("genderMatches");
    } else {
      eligible = false;
    }
  }

  // Income
  if (scheme.max_annual_income != null) {
    hardTotal++;
    if (p.annualIncome <= scheme.max_annual_income) {
      hardHits++;
      reasons.push("incomeMatches");
    } else {
      eligible = false;
    }
  }

  // Disability
  if (scheme.disability_required) {
    hardTotal++;
    if (p.hasDisability) {
      hardHits++;
      reasons.push("disabilityMatches");
    } else {
      eligible = false;
    }
  }

  // State
  if (scheme.state) {
    hardTotal++;
    if (scheme.state === p.state) {
      hardHits++;
      reasons.push("stateMatches");
    } else {
      eligible = false;
    }
  }

  // Occupation
  if (scheme.occupations && scheme.occupations.length > 0) {
    hardTotal++;
    const allowed = scheme.occupations;
    if (allowed.includes("any") || allowed.includes(p.occupation)) {
      hardHits++;
      reasons.push("occupationMatches");
    } else {
      eligible = false;
    }
  }

  if (scheme.is_popular) reasons.push("popular");

  // Confidence: base 60 for eligible, distributed by how many criteria we could
  // affirmatively confirm. Higher when the scheme targets specific attributes
  // that this user matches.
  let confidence = 0;
  if (eligible) {
    const base = 60;
    const bonus = hardTotal === 0 ? 20 : Math.round((hardHits / hardTotal) * 35);
    const popularity = scheme.is_popular ? 5 : 0;
    confidence = Math.min(99, base + bonus + popularity);
  } else {
    // partial — how many of the checked criteria still align
    confidence = hardTotal > 0 ? Math.round((hardHits / hardTotal) * 55) : 30;
  }

  return { scheme, eligible, reasons, confidence };
}

export function rankMatches(schemes: Scheme[], p: UserProfile): SchemeMatch[] {
  return schemes
    .map((s) => evaluateScheme(s, p))
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      return b.confidence - a.confidence;
    });
}

export function myschemeUrl(name: string): string {
  return `https://www.myscheme.gov.in/search?q=${encodeURIComponent(name)}`;
}
