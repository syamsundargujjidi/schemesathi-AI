import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight, RotateCcw, CheckCircle2, FileText, Bookmark, Check,
  ChevronDown, ExternalLink, Volume2, VolumeX, Filter, Sparkles,
} from "lucide-react";
import {
  schemesQueryOptions,
  type UserProfile,
} from "@/lib/schemes";
import { rankMatches, myschemeUrl, type SchemeMatch } from "@/lib/matching";
import {
  saveSchemesResult, saveScheme, syncSchemeToFirestore,
  logEligibilityCheck, trackRecentScheme,
} from "@/integrations/firebase/user-store";
import { useAuth } from "@/hooks/use-auth";
import { AuthGate } from "@/components/site/AuthGate";

export const Route = createFileRoute("/results")({
  ssr: false,
  loader: ({ context }) => context.queryClient.ensureQueryData(schemesQueryOptions),
  head: () => ({
    meta: [
      { title: "Your Eligible Schemes — Scheme Sathi AI" },
      { name: "description", content: "Government schemes matched to your profile." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AuthGate feature="your personalised scheme matches">
      <Results />
    </AuthGate>
  ),
});

function Results() {
  const { t } = useTranslation();
  const { data: schemes } = useSuspenseQuery(schemesQueryOptions);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [category, setCategory] = useState<string>("all");
  const [scope, setScope] = useState<"all" | "central" | "state">("all");

  const { user } = useAuth();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("yojana:profile");
      if (raw) setProfile(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!schemes?.length) return;
    const key = "scheme-sathi:schemes-synced";
    if (typeof window !== "undefined" && sessionStorage.getItem(key)) return;
    Promise.all(schemes.map((s) => syncSchemeToFirestore(s)))
      .then(() => { try { sessionStorage.setItem(key, "1"); } catch {} })
      .catch((e) => console.error("[firestore] scheme sync failed", e));
  }, [schemes]);

  const ranked = useMemo(
    () => (profile ? rankMatches(schemes, profile) : []),
    [schemes, profile],
  );

  const eligible = ranked.filter((m) => m.eligible);
  const related = ranked.filter((m) => !m.eligible && m.confidence >= 30).slice(0, 6);

  // Log eligibility check once per profile+session
  useEffect(() => {
    if (!user || !profile || !ranked.length) return;
    const key = `scheme-sathi:eligibility-logged:${user.uid}:${profile.age}:${profile.state}:${profile.occupation}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    logEligibilityCheck(user.uid, profile, eligible.map((m) => m.scheme.id));
  }, [user, profile, ranked, eligible]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    eligible.forEach((m) => m.scheme.category && set.add(m.scheme.category));
    return Array.from(set).sort();
  }, [eligible]);

  const filtered = eligible.filter((m) => {
    if (category !== "all" && m.scheme.category !== category) return false;
    if (scope === "central" && m.scheme.state) return false;
    if (scope === "state" && !m.scheme.state) return false;
    return true;
  });

  if (!hydrated) return <div className="mx-auto max-w-4xl px-4 py-16" />;

  if (!profile) {
    return (
      <section className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">{t("results.noProfile")}</h1>
        <Link
          to="/questionnaire"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          {t("results.startQuestionnaire")} <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Your Results</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            {eligible.length} {eligible.length === 1 ? t("results.scheme") : t("results.schemes")} {t("results.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t("results.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReadAloudButton matches={filtered} />
          <SaveButton profile={profile} schemeIds={eligible.map((m) => m.scheme.id)} />
          <Link
            to="/questionnaire"
            className="inline-flex items-center gap-2 rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            <RotateCcw className="h-4 w-4" /> {t("results.redo")}
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        {[
          `Age ${profile.age}`, profile.gender, profile.state, profile.areaType,
          `Income ₹${profile.annualIncome.toLocaleString("en-IN")}`,
          profile.education ?? null, profile.caste ? profile.caste.toUpperCase() : null,
          profile.hasDisability ? "PwD" : null, profile.occupation,
          profile.parentOccupation && profile.parentOccupation !== "na" ? `Parent: ${profile.parentOccupation}` : null,
        ].filter(Boolean).map((t) => (
          <span key={t as string} className="rounded-full bg-secondary px-3 py-1 font-medium">{t as string}</span>
        ))}
      </div>

      {/* Filters */}
      {eligible.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Filter
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "central", "state"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  scope === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:brightness-95"
                }`}
              >
                {s === "all" ? t("results.filterAll") : s === "central" ? "Central" : "State"}
              </button>
            ))}
          </div>
          {categories.length > 0 && (
            <div className="ml-auto flex flex-wrap gap-1.5">
              <button
                onClick={() => setCategory("all")}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  category === "all" ? "bg-primary text-primary-foreground" : "bg-secondary hover:brightness-95"
                }`}
              >
                {t("results.filterAll")}
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    category === c ? "bg-primary text-primary-foreground" : "bg-secondary hover:brightness-95"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {eligible.length === 0 ? (
        <div className="card-elevated mt-10 p-8">
          <p className="text-lg font-semibold">{t("results.empty")}</p>
          {related.length > 0 && (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {related.map((m) => <SchemeCard key={m.scheme.id} match={m} />)}
            </div>
          )}
        </div>
      ) : (
        <SchemeGroups matches={filtered} />
      )}
    </section>
  );
}

function SchemeGroups({ matches }: { matches: SchemeMatch[] }) {
  const { t } = useTranslation();
  const central = matches.filter((m) => !m.scheme.state);
  const state = matches.filter((m) => m.scheme.state);
  const stateName = state[0]?.scheme.state;
  return (
    <div className="mt-8 space-y-10">
      {state.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold">
            {stateName ? `${stateName} Government Schemes` : t("results.state")}{" "}
            <span className="text-sm font-normal text-muted-foreground">({state.length})</span>
          </h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {state.map((m) => <SchemeCard key={m.scheme.id} match={m} />)}
          </div>
        </div>
      )}
      {central.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold">
            {t("results.central")} <span className="text-sm font-normal text-muted-foreground">({central.length})</span>
          </h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {central.map((m) => <SchemeCard key={m.scheme.id} match={m} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function SchemeCard({ match }: { match: SchemeMatch }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { scheme, eligible, reasons, confidence } = match;
  const [showDocs, setShowDocs] = useState(false);
  const [savedOne, setSavedOne] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const { i18n } = useTranslation();
  const apply = myschemeUrl(scheme.name);
  const isValidUrl = scheme.apply_url && /^https?:\/\/.+\.(gov|nic)\.in/i.test(scheme.apply_url);

  function onApplyClick() {
    if (user) trackRecentScheme(user.uid, scheme.id, scheme.name);
  }
  async function onSaveOne() {
    if (!user) return;
    await saveScheme(user.uid, scheme.id, scheme.name);
    setSavedOne(true);
  }
  async function onExplain() {
    if (explanation) { setExplanation(null); return; }
    setExplaining(true);
    let profile: Record<string, unknown> = {};
    try { profile = JSON.parse(sessionStorage.getItem("yojana:profile") || "{}"); } catch {}
    try {
      const res = await explainScheme({
        data: {
          schemeName: scheme.name,
          state: scheme.state,
          benefits: scheme.benefits ?? "",
          documents: scheme.documents ?? [],
          applyUrl: (scheme as any).official_website || scheme.apply_url || "",
          eligible,
          profile,
          lang: i18n.language,
        },
      });
      setExplanation(res.explanation);
    } catch (e: any) {
      setExplanation(`Could not load AI explanation. ${e?.message ?? ""}`);
    } finally {
      setExplaining(false);
    }
  }

  return (
    <article className="card-elevated flex flex-col p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          eligible ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
        }`}>
          <CheckCircle2 className="h-3.5 w-3.5" /> {eligible ? t("results.eligible") : "Partial"}
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">{scheme.category}</span>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
          {scheme.state ? `State · ${scheme.state}` : "Central"}
        </span>
        <span className="ml-auto text-xs font-semibold text-primary">
          {confidence}% {t("results.matchConfidence")}
        </span>
      </div>

      <h3 className="mt-3 font-display text-lg font-bold">{scheme.name}</h3>
      {scheme.ministry && <p className="text-xs text-muted-foreground">{scheme.ministry}</p>}
      <p className="mt-3 text-sm text-muted-foreground">{scheme.short_description}</p>

      <div className="mt-4 rounded-xl bg-accent/40 p-3 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-foreground/80">Benefit</p>
        <p className="mt-0.5 text-foreground">{scheme.benefits}</p>
      </div>

      {reasons.length > 0 && (
        <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> {t("results.whyMatches")}
          </p>
          <ul className="mt-1.5 space-y-0.5 text-xs text-foreground">
            {reasons.map((r) => (
              <li key={r} className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-primary" /> {t(`reasons.${r}`)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {scheme.documents.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowDocs((v) => !v)}
            className="flex w-full items-center justify-between gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:bg-secondary"
            aria-expanded={showDocs}
          >
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> {t("results.docs")} ({scheme.documents.length})
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
          href={apply}
          target="_blank"
          rel="noreferrer"
          onClick={onApplyClick}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          {t("results.apply")} <ArrowRight className="h-4 w-4" />
        </a>
        <button
          onClick={onSaveOne}
          disabled={savedOne}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-input px-3 py-2 text-xs font-semibold hover:bg-secondary disabled:opacity-60"
        >
          {savedOne ? <><Check className="h-3.5 w-3.5" /> Saved</> : <><Bookmark className="h-3.5 w-3.5" /> Save</>}
        </button>
        {isValidUrl ? (
          <a
            href={scheme.apply_url!}
            target="_blank"
            rel="noreferrer"
            onClick={onApplyClick}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-input px-4 py-2.5 text-xs font-semibold hover:bg-secondary"
          >
            Official site <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span className="inline-flex items-center justify-center gap-1 rounded-full border border-dashed border-input px-3 py-2 text-[11px] text-muted-foreground">
            {t("results.portalUnavailable")}
          </span>
        )}
      </div>
    </article>
  );
}

function ReadAloudButton({ matches }: { matches: SchemeMatch[] }) {
  const { t, i18n } = useTranslation();
  const [reading, setReading] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function toggle() {
    if (!("speechSynthesis" in window)) return;
    if (reading) {
      window.speechSynthesis.cancel();
      setReading(false);
      return;
    }
    const langMap: Record<string, string> = {
      en: "en-IN", hi: "hi-IN", te: "te-IN", ta: "ta-IN", kn: "kn-IN",
      ml: "ml-IN", mr: "mr-IN", bn: "bn-IN", gu: "gu-IN", or: "or-IN",
    };
    const text = matches.slice(0, 10).map((m, i) =>
      `${i + 1}. ${m.scheme.name}. ${m.confidence}% match. ${m.scheme.short_description}. Benefit: ${m.scheme.benefits}.`
    ).join(" ");
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langMap[i18n.language] || "en-IN";
    u.rate = 0.95;
    u.onend = () => setReading(false);
    u.onerror = () => setReading(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setReading(true);
  }

  return (
    <button
      onClick={toggle}
      disabled={matches.length === 0}
      className="inline-flex items-center gap-2 rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-50"
    >
      {reading ? <><VolumeX className="h-4 w-4" /> {t("a11y.stopReading")}</> : <><Volume2 className="h-4 w-4" /> {t("a11y.readAloud")}</>}
    </button>
  );
}

function SaveButton({ profile, schemeIds }: { profile: UserProfile; schemeIds: string[] }) {
  const { t } = useTranslation();
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
      await saveSchemesResult(user.uid, profile, schemeIds, label);
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
        {saved ? (<><Check className="h-4 w-4" /> {t("results.saved")}</>) : (<><Bookmark className="h-4 w-4" /> {saving ? t("results.saving") : user ? t("results.save") : t("results.signInToSave")}</>)}
      </button>
      {error && <span className="text-xs text-destructive">{error}</span>}
      {saved && <Link to="/saved" className="text-xs text-primary hover:underline">{t("results.viewSaved")} →</Link>}
    </div>
  );
}
