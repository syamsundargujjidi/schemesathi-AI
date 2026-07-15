import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight, Sparkles, ClipboardList, Zap, FileCheck2,
  ShieldCheck, Users, Landmark, HeartHandshake, BookOpen, Lightbulb,
} from "lucide-react";

import { schemesQueryOptions } from "@/lib/schemes";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(schemesQueryOptions),
  component: Home,
});

function Home() {
  const { data: schemes } = useSuspenseQuery(schemesQueryOptions);
  const popular = schemes.filter((s) => s.is_popular).slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden text-white">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, oklch(0.7 0.15 158 / 0.35), transparent 40%), radial-gradient(circle at 80% 60%, oklch(0.5 0.15 250 / 0.4), transparent 45%)",
        }} />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Trusted by citizens across India
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              Discover Government Schemes{" "}
              <span className="text-gradient-brand">You Deserve</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-white/80 sm:text-lg">
              Answer a few simple questions and instantly find Central & State
              welfare schemes you're eligible for. 100% free, always.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/questionnaire"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:brightness-110"
              >
                Check Your Eligibility <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/schemes"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/10"
              >
                Browse All Schemes
              </Link>
            </div>

            <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-6 text-center">
              {[
                { v: `${schemes.length}+`, l: "Schemes" },
                { v: "36", l: "States & UTs" },
                { v: "Free", l: "Forever" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-display text-3xl font-bold text-gradient-brand sm:text-4xl">{s.v}</div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-white/60">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">How Scheme Sathi AI works</h2>
          <p className="mt-3 text-muted-foreground">Three simple steps to find your eligible government schemes.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: ClipboardList, step: "Step 1", title: "Answer Questions", body: "Fill a quick questionnaire about your age, income, state, and occupation." },
            { icon: Zap, step: "Step 2", title: "Smart Matching", body: "Our engine matches your profile against every scheme in our catalog." },
            { icon: FileCheck2, step: "Step 3", title: "Get Results", body: "See eligible schemes with benefits, documents needed, and direct apply links." },
          ].map((s, i) => (
            <div key={i} className="card-elevated p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <s.icon className="h-6 w-6" />
              </div>
              <div className="mt-5 text-xs font-semibold uppercase tracking-widest text-primary">{s.step}</div>
              <h3 className="mt-1 font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular schemes */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Popular schemes</h2>
              <p className="mt-2 text-muted-foreground">India's most impactful government welfare programs.</p>
            </div>
            <Link to="/schemes" className="hidden shrink-0 text-sm font-semibold text-primary hover:underline sm:inline-flex">
              View all →
            </Link>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {popular.map((s) => (
              <article key={s.id} className="card-elevated flex flex-col p-6 transition hover:-translate-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {s.category}
                  </span>
                  {s.ministry && (
                    <span className="text-xs text-muted-foreground line-clamp-1">{s.ministry}</span>
                  )}
                </div>
                <h3 className="mt-3 font-display text-lg font-bold">{s.name}</h3>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{s.short_description}</p>
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
        </div>
      </section>

      {/* Did You Know — reading section */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground">
            <BookOpen className="h-3.5 w-3.5" /> Good to know
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Did you know?</h2>
          <p className="mt-3 text-muted-foreground">
            Interesting facts about India's welfare landscape — worth a minute of your time.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              tag: "PM-KISAN",
              title: "₹3.24 lakh crore disbursed",
              body: "Since 2019, over 11 crore small and marginal farmers have received direct cash transfers of ₹6,000 per year — one of the world's largest DBT programs.",
            },
            {
              tag: "Ayushman Bharat",
              title: "World's largest health scheme",
              body: "PM-JAY covers over 55 crore Indians with ₹5 lakh cashless hospitalization per family per year — bigger than the population of most countries.",
            },
            {
              tag: "MGNREGA",
              title: "100 days of guaranteed work",
              body: "Every rural household is legally entitled to 100 days of paid manual work per year — a right, not a favour. Over 15 crore active workers benefit annually.",
            },
            {
              tag: "Ujjwala",
              title: "10+ crore LPG connections",
              body: "PMUY has given free cooking gas connections to women from BPL households, cutting indoor smoke exposure that once killed lakhs each year.",
            },
            {
              tag: "Sukanya Samriddhi",
              title: "8.2% interest for daughters",
              body: "One of the highest sovereign-backed interest rates in India — reserved for girl-child savings accounts, fully tax-free under Section 80C.",
            },
            {
              tag: "Jan Dhan",
              title: "53+ crore bank accounts",
              body: "PMJDY turned India from largely unbanked to universally banked in under a decade, with more than half the accounts held by women.",
            },
          ].map((f, i) => (
            <article key={i} className="card-elevated group relative overflow-hidden p-6 transition hover:-translate-y-1">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">{f.tag}</span>
                </div>
                <h3 className="mt-3 font-display text-lg font-bold leading-snug">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Why us */}

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-8 md:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "100% Private", body: "Your answers stay on your device. We don't require sign-up." },
            { icon: Landmark, title: "Central + State", body: "Covers Central Government and state-level welfare programs." },
            { icon: Users, title: "For Every Citizen", body: "Farmers, students, women, workers, seniors — all covered." },
            { icon: HeartHandshake, title: "Zero Cost", body: "Free forever. No hidden charges. No paywalls." },
          ].map((v, i) => (
            <div key={i}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-base font-bold">{v.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="hero-gradient overflow-hidden rounded-3xl px-6 py-14 text-center text-white md:px-16 md:py-20">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Ready to find schemes for you?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            It takes less than a minute. No login required.
          </p>
          <Link
            to="/questionnaire"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:brightness-110"
          >
            Start Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
