import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Database as DatabaseIcon, AlertTriangle, Download, RefreshCw, Link2 } from "lucide-react";
import { schemesQueryOptions, INDIAN_STATES, officialLink, type Scheme } from "@/lib/schemes";
import { isUnionTerritory, isCentral, schemeScope } from "@/lib/matching";
import { supabase } from "@/integrations/supabase/client";

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildReportCsv(schemes: Scheme[]): string {
  const seen = new Map<string, number>();
  for (const s of schemes) seen.set(s.slug, (seen.get(s.slug) ?? 0) + 1);

  const header = [
    "slug", "name", "government_level", "scheme_scope", "state", "category",
    "scheme_status", "verification_status", "official_url", "link_status",
    "link_http_status", "link_checked_at", "missing_eligibility_rules",
    "missing_benefits", "missing_documents", "missing_official_url", "inactive",
    "duplicate_slug",
  ];

  const rows = schemes.map((s) => {
    const anyS = s as unknown as Record<string, unknown>;
    const link = officialLink(s as never);
    const missingRules =
      s.min_age == null && s.max_age == null && s.max_annual_income == null &&
      (s.occupations ?? []).length === 0 && !anyS["eligibility_rules"];
    return [
      s.slug, s.name, anyS["government_level"], anyS["scheme_scope"], s.state, s.category,
      anyS["scheme_status"] ?? "Active", anyS["verification_status"],
      anyS["official_source_url"] || s.official_website || s.apply_url || "",
      anyS["link_status"] ?? "unchecked", anyS["link_http_status"] ?? "",
      anyS["link_checked_at"] ?? "",
      missingRules ? "yes" : "no",
      s.benefits?.trim() ? "no" : "yes",
      (s.documents ?? []).length === 0 ? "yes" : "no",
      link.state === "missing" ? "yes" : "no",
      ((anyS["scheme_status"] as string) ?? "Active") !== "Active" ? "yes" : "no",
      (seen.get(s.slug) ?? 0) > 1 ? "yes" : "no",
    ].map(csvCell).join(",");
  });

  return [header.join(","), ...rows].join("\n");
}

export const Route = createFileRoute("/database")({
  ssr: false,
  loader: ({ context }) => context.queryClient.ensureQueryData(schemesQueryOptions),
  head: () => ({
    meta: [
      { title: "Scheme Database Dashboard — Scheme Sathi AI" },
      {
        name: "description",
        content:
          "Live counts of every Central, State and Union Territory scheme stored in the Scheme Sathi AI database, with a data-quality report.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DatabaseDashboard,
});

function DatabaseDashboard() {
  const { data: schemes } = useSuspenseQuery(schemesQueryOptions);

  const stats = useMemo(() => {
    const central = schemes.filter((s) => isCentral(s));
    const states = new Map<string, number>();
    let utTotal = 0;

    for (const s of schemes) {
      const list = (s as { available_states?: string[] }).available_states ?? [];
      const names = list.length > 0 ? list : s.state ? [s.state] : [];
      for (const n of names) {
        states.set(n, (states.get(n) ?? 0) + 1);
        if (isUnionTerritory(n)) utTotal += 1;
      }
    }

    const categories = new Map<string, number>();
    for (const s of schemes) categories.set(s.category, (categories.get(s.category) ?? 0) + 1);

    const scopes = new Map<string, number>();
    for (const s of schemes) {
      const k = schemeScope(s);
      scopes.set(k, (scopes.get(k) ?? 0) + 1);
    }

    const quality = {
      verified: schemes.filter((s) => (s as { verification_status?: string }).verification_status === "Verified").length,
      needsVerification: schemes.filter(
        (s) => (s as { verification_status?: string }).verification_status !== "Verified",
      ).length,
      inactive: schemes.filter((s) => ((s as { scheme_status?: string }).scheme_status ?? "Active") !== "Active").length,
      missingOfficialUrl: schemes.filter(
        (s) => !(s as { official_source_url?: string }).official_source_url && !s.official_website,
      ).length,
      missingBenefits: schemes.filter((s) => !s.benefits?.trim()).length,
      missingDocuments: schemes.filter((s) => (s.documents ?? []).length === 0).length,
      missingRules: schemes.filter(
        (s) =>
          s.min_age == null &&
          s.max_age == null &&
          s.max_annual_income == null &&
          (s.occupations ?? []).length === 0 &&
          !(s as { eligibility_rules?: unknown }).eligibility_rules,
      ).length,
    };

    return { central: central.length, states, utTotal, categories, scopes, quality };
  }, [schemes]);

  const stateRows = INDIAN_STATES.filter((s) => !isUnionTerritory(s));
  const utRows = INDIAN_STATES.filter((s) => isUnionTerritory(s));

  return (
    <section className="mx-auto max-w-5xl px-4 py-14">
      <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary">
        <DatabaseIcon className="h-4 w-4" /> Database dashboard
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
        Total schemes in Scheme Sathi database: {schemes.length}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        All counts below are read live from the database. The official Government of India myScheme
        portal lists 4,700+ Central and State/UT schemes — this page only ever reports what is
        actually stored and verified here.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="card-elevated p-5">
          <h2 className="font-display text-lg font-bold">Government level</h2>
          <Row label="Central Government" value={stats.central} />
          <Row label="State Governments" value={schemes.length - stats.central} />
          <Row label="Union Territory records" value={stats.utTotal} />
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scope</h3>
          {[...stats.scopes.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => (
            <Row key={k} label={k.replace(/_/g, " ")} value={v} />
          ))}
        </div>

        <div className="card-elevated p-5">
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold">
            <AlertTriangle className="h-4 w-4 text-primary" /> Data quality
          </h2>
          <Row label="Verified schemes" value={stats.quality.verified} />
          <Row label="Needs verification" value={stats.quality.needsVerification} />
          <Row label="Inactive schemes" value={stats.quality.inactive} />
          <Row label="Missing official link" value={stats.quality.missingOfficialUrl} />
          <Row label="Missing benefits" value={stats.quality.missingBenefits} />
          <Row label="Missing documents" value={stats.quality.missingDocuments} />
          <Row label="Missing eligibility rules" value={stats.quality.missingRules} />
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="card-elevated p-5">
          <h2 className="font-display text-lg font-bold">State-wise</h2>
          {stateRows.map((s) => (
            <Row key={s} label={s} value={stats.states.get(s) ?? 0} />
          ))}
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Union Territories
          </h3>
          {utRows.map((s) => (
            <Row key={s} label={s} value={stats.states.get(s) ?? 0} />
          ))}
        </div>

        <div className="card-elevated p-5">
          <h2 className="font-display text-lg font-bold">Category-wise</h2>
          {[...stats.categories.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => (
            <Row key={k} label={k} value={v} />
          ))}
        </div>
      </div>

      <Link
        to="/schemes"
        className="mt-8 inline-flex rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary"
      >
        Browse all schemes
      </Link>
    </section>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 py-1.5 text-sm last:border-0">
      <span className="capitalize text-muted-foreground">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
