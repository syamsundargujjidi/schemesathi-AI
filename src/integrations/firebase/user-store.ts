// Firestore + Realtime DB helpers for user profile, saved results, history & analytics.

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
  increment,
} from "firebase/firestore";
import { ref, set, serverTimestamp as rtServerTimestamp } from "firebase/database";
import type { User } from "firebase/auth";
import { getDb, getRtDb } from "./client";
import type { UserProfile } from "@/lib/schemes";

// Strip undefined / empty-string / null values so we never overwrite existing data with blanks.
function clean<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = v;
  }
  return out as Partial<T>;
}

function deviceType(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

/**
 * On login OR signup: ensure users/{uid} exists and touch lastLogin/lastSeen.
 * Populates the full user document schema on first-time create.
 */
export async function ensureUserDoc(user: User, isSignup: boolean) {
  try {
    const dref = doc(getDb(), "users", user.uid);
    const snap = await getDoc(dref);
    if (!snap.exists()) {
      const provider = user.providerData?.[0]?.providerId || "password";
      const payload = clean({
        uid: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        phoneNumber: user.phoneNumber || "",
        provider,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        lastSeen: serverTimestamp(),
        language: (typeof window !== "undefined" && localStorage.getItem("i18nextLng")) || "en",
        state: "",
        district: "",
        occupation: "",
        profileCompleted: false,
        eligibilityCount: 0,
        savedSchemesCount: 0,
        deviceType: deviceType(),
        isVerified: !!user.emailVerified,
      });
      await setDoc(dref, payload);
      console.log("[firestore] created users/%s", user.uid);
    } else {
      await updateDoc(dref, {
        lastLogin: serverTimestamp(),
        lastSeen: serverTimestamp(),
        deviceType: deviceType(),
        isVerified: !!user.emailVerified,
      });
      console.log("[firestore] updated lastLogin for users/%s", user.uid);
    }

    if (isSignup) {
      await writeRealtimeUserSignup(user);
      await bumpAnalytics({ totalUsers: 1 });
    }
    await bumpAnalytics({ dailyVisitors: 1 });
  } catch (err) {
    console.error("[firestore] ensureUserDoc failed", err);
  }
}

/** Fetch user doc — used by auth flow to decide where to redirect. */
export async function getUserDoc(uid: string) {
  try {
    const snap = await getDoc(doc(getDb(), "users", uid));
    return snap.exists() ? (snap.data() as any) : null;
  } catch (err) {
    console.error("[firestore] getUserDoc failed", err);
    return null;
  }
}

/** Write /users/{uid} in Realtime Database after signup (also updated on login). */
export async function writeRealtimeUserSignup(user: User) {
  try {
    const payload = clean({
      uid: user.uid,
      name: user.displayName || "",
      email: user.email || "",
      phone: user.phoneNumber || "",
      online: true,
      lastSeen: rtServerTimestamp(),
      createdAt: rtServerTimestamp(),
    });
    await set(ref(getRtDb(), `users/${user.uid}`), payload);
    console.log("[rtdb] wrote /users/%s", user.uid);
  } catch (err) {
    console.error("[rtdb] writeRealtimeUserSignup failed", err);
  }
}

/** Merge questionnaire answers into users/{uid} — never overwrite with empty. */
export async function updateUserProfile(uid: string, profile: UserProfile) {
  try {
    const payload = clean({
      age: profile.age || undefined,
      gender: profile.gender,
      disability: profile.hasDisability,
      annualIncome: profile.annualIncome || undefined,
      state: profile.state,
      area_type: profile.areaType,
      occupation: profile.occupation,
      parentOccupation: profile.parentOccupation,
      profileUpdatedAt: serverTimestamp(),
    });
    if (Object.keys(payload).length === 0) return;
    await updateDoc(doc(getDb(), "users", uid), payload);
    console.log("[firestore] updated profile fields for users/%s", uid, payload);
  } catch (err) {
    console.error("[firestore] updateUserProfile failed", err);
  }
}

/** Called from /complete-profile — writes all fields + marks profileCompleted:true. */
export async function completeUserProfile(uid: string, data: Record<string, any>) {
  try {
    const payload = { ...clean(data), profileCompleted: true, profileUpdatedAt: serverTimestamp() };
    await updateDoc(doc(getDb(), "users", uid), payload);
    console.log("[firestore] profile completed for users/%s", uid);
  } catch (err) {
    console.error("[firestore] completeUserProfile failed", err);
    throw err;
  }
}

/** Ensure occupations/{slug} exists. */
export async function upsertOccupation(occupation: string, label?: string) {
  if (!occupation) return;
  try {
    const dref = doc(getDb(), "occupations", occupation);
    const snap = await getDoc(dref);
    if (!snap.exists()) {
      await setDoc(dref, {
        occupationName: label || occupation,
        category: occupation,
        createdAt: serverTimestamp(),
      });
      console.log("[firestore] created occupations/%s", occupation);
    }
  } catch (err) {
    console.error("[firestore] upsertOccupation failed", err);
  }
}

/** Deterministic signature for de-duplicating saved results by profile. */
export function profileSignature(p: UserProfile): string {
  return [
    p.age, p.gender, p.state, p.areaType, p.annualIncome,
    p.occupation, p.parentOccupation ?? "", p.hasDisability ? 1 : 0,
  ].join("|");
}

/**
 * Save (or update) a saved-results entry — reuses the doc if the same profile
 * signature already exists for this user.
 */
export async function saveSchemesResult(
  uid: string,
  profile: UserProfile,
  schemeIds: string[],
  label: string,
) {
  try {
    const sig = profileSignature(profile);
    const col = collection(getDb(), "users", uid, "savedResults");
    const existing = await getDocs(query(col, where("signature", "==", sig)));
    if (!existing.empty) {
      const first = existing.docs[0];
      await setDoc(
        first.ref,
        {
          label,
          profile,
          scheme_ids: schemeIds,
          signature: sig,
          updated_at: serverTimestamp(),
        },
        { merge: true },
      );
      console.log("[firestore] updated savedResults/%s", first.id);
      return first.id;
    }
    const created = await addDoc(col, {
      label,
      profile,
      scheme_ids: schemeIds,
      signature: sig,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    console.log("[firestore] created savedResults/%s", created.id);
    return created.id;
  } catch (err) {
    console.error("[firestore] saveSchemesResult failed", err);
    throw err;
  }
}

/** Save individual scheme — users/{uid}/savedSchemes/{schemeId} */
export async function saveScheme(uid: string, schemeId: string, schemeName: string) {
  try {
    await setDoc(
      doc(getDb(), "users", uid, "savedSchemes", schemeId),
      { schemeId, schemeName, savedAt: serverTimestamp(), status: "saved" },
      { merge: true },
    );
    await updateDoc(doc(getDb(), "users", uid), { savedSchemesCount: increment(1) }).catch(() => {});
    await bumpSchemeStat(schemeId, "saved");
    console.log("[firestore] saved scheme %s for %s", schemeId, uid);
  } catch (err) {
    console.error("[firestore] saveScheme failed", err);
    throw err;
  }
}

/** Add scheme to recently viewed list. */
export async function trackRecentScheme(uid: string, schemeId: string, schemeName: string) {
  try {
    await setDoc(
      doc(getDb(), "users", uid, "recentSchemes", schemeId),
      { schemeId, schemeName, viewedAt: serverTimestamp() },
      { merge: true },
    );
    await bumpSchemeStat(schemeId, "viewed");
  } catch (err) {
    console.error("[firestore] trackRecentScheme failed", err);
  }
}

/** Append to users/{uid}/searchHistory. */
export async function trackSearch(uid: string, queryStr: string, filters: Record<string, any>) {
  if (!queryStr && !Object.keys(filters).length) return;
  try {
    await addDoc(collection(getDb(), "users", uid, "searchHistory"), {
      query: queryStr,
      filters,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("[firestore] trackSearch failed", err);
  }
}

/** Log an eligibility check under users/{uid}/eligibilityHistory. */
export async function logEligibilityCheck(
  uid: string,
  answers: UserProfile,
  eligibleSchemes: string[],
) {
  try {
    await addDoc(collection(getDb(), "users", uid, "eligibilityHistory"), {
      timestamp: serverTimestamp(),
      answers,
      eligibleSchemes,
      state: answers.state,
      occupation: answers.occupation,
      income: answers.annualIncome,
      age: answers.age,
      gender: answers.gender,
    });
    await updateDoc(doc(getDb(), "users", uid), {
      eligibilityCount: increment(1),
      lastEligibilityCheck: serverTimestamp(),
    }).catch(() => {});
    await bumpAnalytics({ totalEligibilityChecks: 1 });
    console.log("[firestore] logged eligibility check for %s (%d matches)", uid, eligibleSchemes.length);
  } catch (err) {
    console.error("[firestore] logEligibilityCheck failed", err);
  }
}

/** Increment global analytics counters. */
export async function bumpAnalytics(fields: Record<string, number>) {
  try {
    const payload: Record<string, any> = { updatedAt: serverTimestamp() };
    for (const [k, v] of Object.entries(fields)) payload[k] = increment(v);
    await setDoc(doc(getDb(), "analytics", "global"), payload, { merge: true });
  } catch (err) {
    console.error("[firestore] bumpAnalytics failed", err);
  }
}

async function bumpSchemeStat(schemeId: string, kind: "viewed" | "saved") {
  try {
    const field = kind === "viewed" ? "viewCount" : "saveCount";
    await setDoc(
      doc(getDb(), "analytics", "schemes"),
      { [schemeId]: { [field]: increment(1) }, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch {}
}

/** Idempotent write of a scheme record into the top-level schemes collection. */
export async function syncSchemeToFirestore(scheme: any) {
  try {
    const id = scheme.slug || scheme.id;
    if (!id) return;
    await setDoc(
      doc(getDb(), "schemes", String(id)),
      clean({
        slug: scheme.slug,
        schemeName: scheme.name,
        name: scheme.name,
        category: scheme.category,
        state: scheme.state,
        ministry: scheme.ministry,
        description: scheme.short_description,
        short_description: scheme.short_description,
        benefits: scheme.benefits,
        documents: scheme.documents ?? [],
        officialWebsite: scheme.apply_url,
        officialApplicationLink: scheme.apply_url,
        apply_url: scheme.apply_url,
        eligibility: scheme.eligibility ?? null,
        tags: scheme.tags ?? [],
        featured: !!scheme.is_popular,
        popular: !!scheme.is_popular,
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp(),
      }),
      { merge: true },
    );
  } catch (err) {
    console.error("[firestore] syncSchemeToFirestore failed", err);
  }
}

export function tsToMs(ts: any): number {
  if (!ts) return Date.now();
  if (typeof ts === "number") return ts;
  if (ts instanceof Timestamp) return ts.toMillis();
  if (typeof ts?.toMillis === "function") return ts.toMillis();
  return Date.now();
}
