import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  collection, doc, limit, onSnapshot, orderBy, query,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
  Bookmark, ClipboardCheck, Clock, Search, LogOut, ArrowRight, Sparkles, Bell, UserCog,
} from "lucide-react";
import { getDb, getFirebaseAuth } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import { tsToMs } from "@/integrations/firebase/user-store";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard — Scheme Sathi AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const PROFILE_FIELDS = [
  "displayName", "age", "gender", "state", "district", "occupation",
  "annualIncome", "category", "area_type", "education", "phoneNumber",
];

function completeness(profile: any): number {
  if (!profile) return 0;
  const filled = PROFILE_FIELDS.filter((f) => {
    const v = profile[f];
    return v !== undefined && v !== null && v !== "";
  }).length;
  return Math.round((filled / PROFILE_FIELDS.length) * 100);
}

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any | null>(null);
  const [saved, setSaved] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [recents, setRecents] = useState<any[]>([]);
  const [searches, setSearches] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const db = getDb();
    const uid = user.uid;
    const unsubs = [
      onSnapshot(doc(db, "users", uid), (s) => setProfile(s.exists() ? s.data() : null)),
      onSnapshot(query(collection(db, "users", uid, "savedSchemes"), orderBy("savedAt", "desc"), limit(6)),
        (s) => setSaved(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "users", uid, "eligibilityHistory"), orderBy("timestamp", "desc"), limit(5)),
        (s) => setHistory(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "users", uid, "recentSchemes"), orderBy("viewedAt", "desc"), limit(6)),
        (s) => setRecents(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
      onSnapshot(query(collection(db, "users", uid, "searchHistory"), orderBy("timestamp", "desc"), limit(5)),
        (s) => setSearches(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
    ];
    return () => unsubs.forEach((u) => u());
  }, [user]);

  async function doSignOut() {
    await signOut(getFirebaseAuth());
    navigate({ to: "/" });
  }

  const pct = completeness(profile);
  const name = profile?.displayName || user?.email?.split("@")[0] || "friend";

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Dashboard</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Welcome back, {name} 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your schemes, history and recommendations in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/complete-profile" className="inline-flex items-center gap-1.5 rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary">
            <UserCog className="h-4 w-4" /> Edit profile
          </Link>
          <button onClick={doSignOut} className="inline-flex items-center gap-1.5 rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>

      {/* Profile completion */}
      <div className="card-elevated mt-8 flex flex-wrap items-center gap-4 p-5">
        <div className="flex-1 min-w-[240px]">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Profile completion</span>
            <span className="text-primary">{pct}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-secondary">
            <div className="h-2 rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {pct < 100 && (
          <Link to="/complete-profile" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Finish setup <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Bookmark} label="Saved schemes" value={profile?.savedSchemesCount ?? saved.length} />
        <Stat icon={ClipboardCheck} label="Eligibility checks" value={profile?.eligibilityCount ?? history.length} />
        <Stat icon={Clock} label="Recently viewed" value={recents.length} />
        <Stat icon={Search} label="Recent searches" value={searches.length} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Panel title="Saved Schemes" icon={Bookmark} to="/saved" cta="View all">
          {saved.length === 0 ? (
            <Empty text="Nothing saved yet." linkText="Browse schemes →" to="/schemes" />
          ) : (
            <ul className="space-y-2">
              {saved.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-sm">
                  <span className="font-medium">{s.schemeName || s.schemeId}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.savedAt ? new Date(tsToMs(s.savedAt)).toLocaleDateString() : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Eligibility History" icon={ClipboardCheck} to="/questionnaire" cta="New check">
          {history.length === 0 ? (
            <Empty text="Run your first eligibility check." linkText="Check now →" to="/questionnaire" />
          ) : (
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id} className="rounded-lg border border-border/60 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{h.eligibleSchemes?.length ?? 0} eligible schemes</span>
                    <span className="text-xs text-muted-foreground">{h.timestamp ? new Date(tsToMs(h.timestamp)).toLocaleDateString() : ""}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Age {h.age} · {h.state} · {h.occupation}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recommended for you" icon={Sparkles} to="/questionnaire" cta="Re-check">
          <p className="text-sm text-muted-foreground">
            Based on your profile, run an eligibility check to see personalised recommendations.
          </p>
          <Link to="/questionnaire" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Get recommendations <ArrowRight className="h-4 w-4" />
          </Link>
        </Panel>

        <Panel title="Recently Viewed" icon={Clock} to="/schemes" cta="Browse">
          {recents.length === 0 ? (
            <Empty text="No recently viewed schemes." linkText="Explore schemes →" to="/schemes" />
          ) : (
            <ul className="space-y-2">
              {recents.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-sm">
                  <span className="font-medium">{r.schemeName || r.schemeId}</span>
                  <span className="text-xs text-muted-foreground">{r.viewedAt ? new Date(tsToMs(r.viewedAt)).toLocaleDateString() : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Search History" icon={Search} to="/schemes" cta="Search">
          {searches.length === 0 ? (
            <Empty text="You haven't searched yet." linkText="Search schemes →" to="/schemes" />
          ) : (
            <ul className="space-y-2">
              {searches.map((s) => (
                <li key={s.id} className="rounded-lg border border-border/60 p-3 text-sm">
                  <span className="font-medium">"{s.query || "(filters only)"}"</span>
                  <span className="ml-2 text-xs text-muted-foreground">{s.timestamp ? new Date(tsToMs(s.timestamp)).toLocaleString() : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Notifications" icon={Bell}>
          <p className="text-sm text-muted-foreground">You're all caught up 🎉 We'll notify you when new schemes matching your profile are added.</p>
        </Panel>
      </div>
    </section>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <div className="card-elevated p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-display text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, to, cta, children }: {
  title: string; icon: any; to?: string; cta?: string; children: React.ReactNode;
}) {
  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-bold">{title}</h2>
        </div>
        {to && cta && (
          <Link to={to} className="text-xs font-semibold text-primary hover:underline">{cta} →</Link>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Empty({ text, linkText, to }: { text: string; linkText: string; to: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-4 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link to={to} className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">{linkText}</Link>
    </div>
  );
}
