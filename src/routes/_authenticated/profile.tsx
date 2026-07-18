import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { ArrowRight, LogOut, User as UserIcon, Bookmark } from "lucide-react";
import { getDb, getFirebaseAuth } from "@/integrations/firebase/client";
import { tsToMs } from "@/integrations/firebase/user-store";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My profile — Scheme Sathi AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      doc(getDb(), "users", user.uid),
      (snap) => {
        setProfile(snap.exists() ? snap.data() : null);
        setLoading(false);
      },
      (err) => {
        console.error("[firestore] profile snapshot error", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [user]);

  async function doSignOut() {
    await signOut(getFirebaseAuth());
    window.location.href = "/";
  }

  const fields: Array<[string, any]> = profile
    ? [
        ["Display name", profile.displayName],
        ["Email", profile.email],
        ["Phone", profile.phone],
        ["Age", profile.age],
        ["Gender", profile.gender],
        ["Disability", profile.disability === true ? "Yes" : profile.disability === false ? "No" : ""],
        ["Annual income", profile.annualIncome ? `₹${Number(profile.annualIncome).toLocaleString("en-IN")}` : ""],
        ["State", profile.state],
        ["District", profile.district],
        ["Area type", profile.area_type],
        ["Occupation", profile.occupation],
        ["Parent occupation", profile.parentOccupation],
        ["Member since", profile.createdAt ? new Date(tsToMs(profile.createdAt)).toLocaleDateString() : ""],
        ["Last login", profile.lastLogin ? new Date(tsToMs(profile.lastLogin)).toLocaleString() : ""],
      ]
    : [];

  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <UserIcon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Your profile</p>
            <h1 className="mt-1 font-display text-3xl font-bold">
              {profile?.displayName || user?.email || "Welcome!"}
            </h1>
            {user?.email && (
              <p className="mt-1 text-xs text-muted-foreground">Signed in as {user.email}</p>
            )}
          </div>
        </div>
        <button
          onClick={doSignOut}
          className="inline-flex items-center gap-1.5 rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <div className="card-elevated mt-8 p-6 md:p-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading your profile…</p>
        ) : !profile ? (
          <p className="text-sm text-muted-foreground">No profile yet.</p>
        ) : (
          <>
            <h2 className="font-display text-lg font-bold">Account details</h2>
            <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              {fields.map(([k, v]) => (
                <div key={k} className="border-b border-border/50 pb-3 last:border-0">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k}</dt>
                  <dd className="mt-1 text-sm">
                    {v !== undefined && v !== null && v !== "" ? String(v) : (
                      <span className="text-muted-foreground italic">Not provided</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/questionnaire"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
        >
          {profile?.occupation ? "Update eligibility answers" : "Complete eligibility questionnaire"}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/saved"
          className="inline-flex items-center gap-2 rounded-full border border-input px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
        >
          <Bookmark className="h-4 w-4" /> My saved schemes
        </Link>
      </div>
    </section>
  );
}
