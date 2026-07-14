import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, HeartHandshake, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Scheme Sathi AI" },
      { name: "description", content: "Scheme Sathi AI is a free, independent tool helping Indian citizens discover eligible government welfare schemes." },
      { property: "og:title", content: "About — Scheme Sathi AI" },
      { property: "og:description", content: "Scheme Sathi AI is a free, independent tool helping Indian citizens discover eligible government welfare schemes." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">About</p>
      <h1 className="mt-3 font-display text-4xl font-bold">Every citizen deserves the schemes they qualify for.</h1>
      <p className="mt-5 text-lg text-muted-foreground">
        India runs hundreds of welfare programs — but most people never learn about the ones
        they're eligible for. Scheme Sathi AI is a simple, free tool that changes that.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, title: "Independent", body: "Not affiliated with any government body. We link only to official portals." },
          { icon: HeartHandshake, title: "For Everyone", body: "Farmers, students, women, seniors, workers, PwD — no one left behind." },
          { icon: Sparkles, title: "Always Free", body: "No sign-up, no ads, no upsell. Ever." },
        ].map((v, i) => (
          <div key={i} className="card-elevated p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <v.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-base font-bold">{v.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{v.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl font-bold">A word of caution</h2>
        <p className="mt-3 text-muted-foreground">
          Eligibility rules change often. Always cross-check on the official government portal
          linked from each scheme card, and never share your Aadhaar OTP or bank details with
          anyone claiming to help you apply.
        </p>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          to="/questionnaire"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
        >
          Check Your Eligibility <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/schemes"
          className="inline-flex items-center gap-2 rounded-full border border-input px-6 py-3 text-sm font-semibold"
        >
          Browse Schemes
        </Link>
      </div>
    </section>
  );
}
