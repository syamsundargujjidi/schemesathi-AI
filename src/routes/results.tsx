import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowRight, RotateCcw, CheckCircle2, FileText } from "lucide-react";
import {
  schemesQueryOptions,
  matchesProfile,
  scoreScheme,
  type UserProfile,
  type Scheme,
} from "@/lib/schemes";

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
        <Link
          to="/questionnaire"
          className="inline-flex items-center gap-2 rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary"
        >
          <RotateCcw className="h-4 w-4" /> Redo
        </Link>
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
