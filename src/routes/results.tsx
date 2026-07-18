import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight, RotateCcw, CheckCircle2, FileText, Bookmark, Check, ChevronDown, ExternalLink } from "lucide-react";
import {
  schemesQueryOptions,
  matchesProfile,
  scoreScheme,
  type UserProfile,
  type Scheme,
} from "@/lib/schemes";
import { saveSchemesResult, syncSchemeToFirestore } from "@/integrations/firebase/user-store";
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
          profile.areaType,
          `Income ₹${profile.annualIncome.toLocaleString("en-IN")}`,
          profile.hasDisability ? "PwD" : null,
          profile.occupation,
          profile.parentOccupation && profile.parentOccupation !== "na" ? `Parent: ${profile.parentOccupation}` : null,
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
        <SchemeGroups schemes={eligible} />
      )}
    </section>
  );
}

function SchemeGroups({ schemes }: { schemes: Scheme[] }) {
  const central = schemes.filter((s) => !s.state);
  const state = schemes.filter((s) => s.state);
  return (
    <div className="mt-10 space-y-10">
      {central.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold">Central Government Schemes <span className="text-sm font-normal text-muted-foreground">({central.length})</span></h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {central.map((s) => <SchemeCard key={s.id} scheme={s} />)}
          </div>
        </div>
      )}
      {state.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold">State Government Schemes <span className="text-sm font-normal text-muted-foreground">({state.length})</span></h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {state.map((s) => <SchemeCard key={s.id} scheme={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function SchemeCard({ scheme }: { scheme: Scheme }) {
  const [showDocs, setShowDocs] = useState(false);
  const mySchemeUrl = `https://www.myscheme.gov.in/search?q=${encodeURIComponent(scheme.name)}`;
  return (
    <article className="card-elevated flex flex-col p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          <CheckCircle2 className="h-3.5 w-3.5" /> Eligible
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">{scheme.category}</span>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
          {scheme.state ? `State · ${scheme.state}` : "Central"}
        </span>
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
          <button
            type="button"
            onClick={() => setShowDocs((v) => !v)}
            className="flex w-full items-center justify-between gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:bg-secondary"
            aria-expanded={showDocs}
          >
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Required Documents ({scheme.documents.length})
            </span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDocs ? "rotate-180" : ""}`} />
          </button>
          {showDocs && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {scheme.documents.map((d) => (
                <span key={d} className="rounded-md border border-border px-2 py-0.5 text-xs">{d}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <a
          href={mySchemeUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          Apply via MyScheme <ArrowRight className="h-4 w-4" />
        </a>
        {scheme.apply_url && (
          <a
            href={scheme.apply_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-input px-4 py-2.5 text-xs font-semibold hover:bg-secondary"
          >
            Official site <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
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
    try {
      await addDoc(collection(getDb(), "users", user.uid, "savedResults"), {
        label,
        profile,
        scheme_ids: schemeIds,
        created_at: serverTimestamp(),
      });
      setSaved(true);
    } catch (err: any) {
      setError(err?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
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

