// Firestore + Realtime DB helpers for user profile & saved results.
// Every write wrapped in try/catch with console logging.

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

/**
 * On login OR signup: ensure users/{uid} exists and touch lastLogin.
 * On first-time create, fills in identity fields from the auth user.
 */
export async function ensureUserDoc(user: User, isSignup: boolean) {
  try {
    const dref = doc(getDb(), "users", user.uid);
    const snap = await getDoc(dref);
    if (!snap.exists()) {
      const payload = clean({
        uid: user.uid,
        displayName: user.displayName || user.email?.split("@")[0] || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
        photoURL: user.photoURL || "",
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
      await setDoc(dref, payload);
      console.log("[firestore] created users/%s", user.uid);
    } else {
      await updateDoc(dref, { lastLogin: serverTimestamp() });
      console.log("[firestore] updated lastLogin for users/%s", user.uid);
    }

    if (isSignup) {
      await writeRealtimeUserSignup(user);
    }
  } catch (err) {
    console.error("[firestore] ensureUserDoc failed", err);
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

/** Idempotent write of a scheme record into the top-level schemes collection. */
export async function syncSchemeToFirestore(scheme: any) {
  try {
    const id = scheme.slug || scheme.id;
    if (!id) return;
    await setDoc(
      doc(getDb(), "schemes", String(id)),
      clean({
        slug: scheme.slug,
        name: scheme.name,
        category: scheme.category,
        state: scheme.state,
        ministry: scheme.ministry,
        short_description: scheme.short_description,
        benefits: scheme.benefits,
        documents: scheme.documents ?? [],
        apply_url: scheme.apply_url,
        eligibility: scheme.eligibility ?? null,
        tags: scheme.tags ?? [],
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
