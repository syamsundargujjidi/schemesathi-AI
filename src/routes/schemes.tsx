import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { Search, ArrowRight, Bookmark, Check } from "lucide-react";
import { schemesQueryOptions, type Scheme } from "@/lib/schemes";
import { AuthGate } from "@/components/site/AuthGate";
import { useAuth } from "@/hooks/use-auth";
import { saveScheme, trackRecentScheme, trackSearch } from "@/integrations/firebase/user-store";

export const Route = createFileRoute("/schemes")({
  ssr: false,
  loader: ({ context }) => context.queryClient.ensureQueryData(schemesQueryOptions),
  head: () => ({
    meta: [
      { title: "Browse All Schemes — Scheme Sathi AI" },
      { name: "description", content: "Explore every Central & State government welfare scheme in our catalog." },
      { property: "og:title", content: "Browse All Schemes — Scheme Sathi AI" },
      { property: "og:description", content: "Explore every Central & State government welfare scheme in our catalog." },
    ],
  }),
  component: () => (
    <AuthGate feature="the schemes catalog">
      <SchemesPage />
    </AuthGate>
  ),
});

function SchemesPage() {
  const { data: schemes } = useSuspenseQuery(schemesQueryOptions);
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [scope, setScope] = useState<"all" | "central" | "state">("all");
  const [stateFilter, setStateFilter] = useState<string | null>(null);

  // Debounced search history logging
  useEffect(() => {
    if (!user) return;
    if (!q && !tag && scope === "all") return;
    const h = setTimeout(() => {
      trackSearch(user.uid, q, { tag, scope, stateFilter });
    }, 900);
    return () => clearTimeout(h);
  }, [user, q, tag, scope, stateFilter]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    schemes.forEach((s) => s.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [schemes]);

  const allStates = useMemo(() => {
    const set = new Set<string>();
    schemes.forEach((s) => { if (s.state) set.add(s.state); });
    return Array.from(set).sort();
  }, [schemes]);

  const filtered = schemes.filter((s) => {
    const matchQ = !q || (s.name + " " + s.short_description).toLowerCase().includes(q.toLowerCase());
    const matchTag = !tag || s.tags.includes(tag);
    const matchScope =
      scope === "all" ||
      (scope === "central" && !s.state) ||
      (scope === "state" && !!s.state && (!stateFilter || s.state === stateFilter));
    return matchQ && matchTag && matchScope;
  });

  const central = filtered.filter((s) => !s.state);
  const stateSchemes = filtered.filter((s) => s.state);

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Browse all schemes</h1>
        <p className="mt-2 text-muted-foreground">
          Search across {schemes.length} Central & State government welfare programs.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search schemes…"
            className="w-full rounded-full border border-input bg-background py-3 pl-11 pr-4 text-sm outline-none focus:border-ring"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip active={scope === "all"} onClick={() => { setScope("all"); setStateFilter(null); }}>All</FilterChip>
        <FilterChip active={scope === "central"} onClick={() => { setScope("central"); setStateFilter(null); }}>Central</FilterChip>
        <FilterChip active={scope === "state"} onClick={() => setScope("state")}>State</FilterChip>
      </div>

      {scope === "state" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterChip active={stateFilter === null} onClick={() => setStateFilter(null)}>All states</FilterChip>
          {allStates.map((st) => (
            <FilterChip key={st} active={stateFilter === st} onClick={() => setStateFilter(st)}>{st}</FilterChip>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterChip active={tag === null} onClick={() => setTag(null)}>All categories</FilterChip>
        {allTags.map((t) => (
          <FilterChip key={t} active={tag === t} onClick={() => setTag(t)}>{t}</FilterChip>
        ))}
      </div>

      {scope === "all" ? (
        <div className="mt-10 space-y-12">
          {central.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-bold">Central Government <span className="text-sm font-normal text-muted-foreground">({central.length})</span></h2>
              <SchemeGrid schemes={central} />
            </div>
          )}
          {stateSchemes.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-bold">State Government <span className="text-sm font-normal text-muted-foreground">({stateSchemes.length})</span></h2>
              <SchemeGrid schemes={stateSchemes} />
            </div>
          )}
        </div>
      ) : (
        <SchemeGrid schemes={filtered} />
      )}

      {filtered.length === 0 && (
        <p className="mt-16 text-center text-muted-foreground">No schemes match your search.</p>
      )}
    </section>
  );
}

function SchemeGrid({ schemes }: { schemes: Scheme[] }) {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  async function onSave(s: Scheme) {
    if (!user) return;
    await saveScheme(user.uid, s.id, s.name);
    setSavedIds((prev) => new Set(prev).add(s.id));
  }
  function onView(s: Scheme) {
    if (user) trackRecentScheme(user.uid, s.id, s.name);
  }

  return (
    <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {schemes.map((s) => {
        const mySchemeUrl = `https://www.myscheme.gov.in/search?q=${encodeURIComponent(s.name)}`;
        const saved = savedIds.has(s.id);
        return (
          <article key={s.id} className="card-elevated flex flex-col p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{s.category}</span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                {s.state ? `State · ${s.state}` : "Central"}
              </span>
            </div>
            {s.ministry && <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{s.ministry}</p>}
            <h3 className="mt-2 font-display text-lg font-bold">{s.name}</h3>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.short_description}</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <a
                href={mySchemeUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => onView(s)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Learn more <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={() => onSave(s)}
                disabled={saved}
                className="inline-flex items-center gap-1 rounded-full border border-input px-3 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-60"
              >
                {saved ? <><Check className="h-3 w-3" /> Saved</> : <><Bookmark className="h-3 w-3" /> Save</>}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}
