import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight, RotateCcw, CheckCircle2, FileText, Bookmark, Check } from "lucide-react";
import {
  schemesQueryOptions,
  matchesProfile,
  scoreScheme,
  type UserProfile,
  type Scheme,
} from "@/lib/schemes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/results")({
  loader: ({ context }) => context.queryClient.ensureQueryData(schemesQueryOptions),
  head: () => ({
    meta: [
      { title: "Your Eligible Schemes — Scheme Sathi AI" },
      { name: "description", content: "Government schemes matched to your profile." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Results,
});

function Results() {
  const { data: schemes } = useSuspenseQuery(schemesQueryOptions);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("yojana:profile");
      if (raw) setProfile(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  if (!hydrated) return <div className="mx-auto max-w-4xl px-4 py-16" />;

  if (!profile) {
    return (
      <section className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">No profile found</h1>
        <p className="mt-2 text-muted-foreground">
          Fill the quick questionnaire to see schemes you're eligible for.
        </p>
        <Link
          to="/questionnaire"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Start Questionnaire <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  const eligible = schemes
    .filter((s) => matchesProfile(s, profile))
    .sort((a, b) => scoreScheme(b, profile) - scoreScheme(a, profile));

  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Your Results</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            {eligible.length} scheme{eligible.length === 1 ? "" : "s"} matched
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Based on your age ({profile.age}), gender, income and occupation. Always verify
            details on the official portal before applying.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SaveButton profile={profile} schemeIds={eligible.map((s) => s.id)} />
          <Link
            to="/questionnaire"
            className="inline-flex items-center gap-2 rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            <RotateCcw className="h-4 w-4" /> Redo
          </Link>
        </div>
      </div>

      {/* profile summary */}
      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        {[
          `Age ${profile.age}`,
          profile.gender,
          profile.state,
          `Income ₹${profile.annualIncome.toLocaleString("en-IN")}`,
          profile.isBpl ? "BPL" : null,
          profile.hasDisability ? "PwD" : null,
          profile.occupation,
        ].filter(Boolean).map((t) => (
          <span key={t as string} className="rounded-full bg-secondary px-3 py-1 font-medium">
            {t as string}
          </span>
        ))}
      </div>

      {eligible.length === 0 ? (
        <div className="card-elevated mt-10 p-10 text-center">
          <p className="text-lg font-semibold">No schemes matched your current profile.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your answers — our catalog is growing.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {eligible.map((s) => <SchemeCard key={s.id} scheme={s} />)}
        </div>
      )}
    </section>
  );
}

function SchemeCard({ scheme }: { scheme: Scheme }) {
  return (
    <article className="card-elevated flex flex-col p-6">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          <CheckCircle2 className="h-3.5 w-3.5" /> Eligible
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">{scheme.category}</span>
      </div>
      <h3 className="mt-3 font-display text-lg font-bold">{scheme.name}</h3>
      {scheme.ministry && (
        <p className="text-xs text-muted-foreground">{scheme.ministry}</p>
      )}
      <p className="mt-3 text-sm text-muted-foreground">{scheme.short_description}</p>

      <div className="mt-4 rounded-xl bg-accent/40 p-3 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-foreground/80">Benefit</p>
        <p className="mt-0.5 text-foreground">{scheme.benefits}</p>
      </div>

      {scheme.documents.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <FileText className="h-3.5 w-3.5" /> Documents
          </p>
          <div className="flex flex-wrap gap-1.5">
            {scheme.documents.map((d) => (
              <span key={d} className="rounded-md border border-border px-2 py-0.5 text-xs">{d}</span>
            ))}
          </div>
        </div>
      )}

      <a
        href={scheme.apply_url}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
      >
        Apply on official portal <ArrowRight className="h-4 w-4" />
      </a>
    </article>
  );
}

function SaveButton({ profile, schemeIds }: { profile: UserProfile; schemeIds: string[] }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    if (!user) {
      try { sessionStorage.setItem("scheme-sathi:pending-save", "1"); } catch {}
      navigate({ to: "/auth" });
      return;
    }
    setSaving(true);
    setError(null);
    const label = `${profile.state} · Age ${profile.age} · ${profile.occupation}`;
    const { error } = await supabase.from("saved_results").insert({
      user_id: user.id,
      label,
      profile: profile as any,
      scheme_ids: schemeIds,
    });
    setSaving(false);
    if (error) setError(error.message);
    else setSaved(true);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={onSave}
        disabled={saving || loading || saved}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 disabled:opacity-70"
      >
        {saved ? (<><Check className="h-4 w-4" /> Saved</>) : (<><Bookmark className="h-4 w-4" /> {saving ? "Saving…" : user ? "Save results" : "Sign in to save"}</>)}
      </button>
      {error && <span className="text-xs text-destructive">{error}</span>}
      {saved && <Link to="/saved" className="text-xs text-primary hover:underline">View saved →</Link>}
    </div>
  );
}

