import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Search, ArrowRight } from "lucide-react";
import { schemesQueryOptions } from "@/lib/schemes";

export const Route = createFileRoute("/schemes")({
  loader: ({ context }) => context.queryClient.ensureQueryData(schemesQueryOptions),
  head: () => ({
    meta: [
      { title: "Browse All Schemes — YojanaMitra" },
      { name: "description", content: "Explore every Central & State government welfare scheme in our catalog." },
      { property: "og:title", content: "Browse All Schemes — YojanaMitra" },
      { property: "og:description", content: "Explore every Central & State government welfare scheme in our catalog." },
    ],
  }),
  component: SchemesPage,
});

function SchemesPage() {
  const { data: schemes } = useSuspenseQuery(schemesQueryOptions);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    schemes.forEach((s) => s.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [schemes]);

  const filtered = schemes.filter((s) => {
    const matchQ = !q || (s.name + " " + s.short_description).toLowerCase().includes(q.toLowerCase());
    const matchTag = !tag || s.tags.includes(tag);
    return matchQ && matchTag;
  });

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
        <FilterChip active={tag === null} onClick={() => setTag(null)}>All</FilterChip>
        {allTags.map((t) => (
          <FilterChip key={t} active={tag === t} onClick={() => setTag(t)}>{t}</FilterChip>
        ))}
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <article key={s.id} className="card-elevated flex flex-col p-6">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{s.category}</span>
              {s.ministry && <span className="line-clamp-1 text-xs text-muted-foreground">{s.ministry}</span>}
            </div>
            <h3 className="mt-3 font-display text-lg font-bold">{s.name}</h3>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.short_description}</p>
            <a
              href={s.apply_url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Learn more <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-16 text-center text-muted-foreground">No schemes match your search.</p>
      )}
    </section>
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
