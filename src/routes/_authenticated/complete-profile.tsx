import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UserCog, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { completeUserProfile, getUserDoc } from "@/integrations/firebase/user-store";
import { INDIAN_STATES, OCCUPATIONS } from "@/lib/schemes";

export const Route = createFileRoute("/_authenticated/complete-profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Complete your profile — Scheme Sathi AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CompleteProfilePage,
});

const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS", "Minority"];
const EDUCATION = ["Below 10th", "10th Pass", "12th Pass", "Diploma", "Graduate", "Post-graduate", "Doctorate"];

function CompleteProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    displayName: "",
    age: "",
    gender: "",
    state: "",
    district: "",
    occupation: "",
    annualIncome: "",
    category: "",
    disability: "no",
    area_type: "",
    education: "",
    phoneNumber: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const existing = await getUserDoc(user.uid);
      if (existing) {
        setForm((f) => ({
          ...f,
          displayName: existing.displayName || user.displayName || "",
          age: existing.age ? String(existing.age) : "",
          gender: existing.gender || "",
          state: existing.state || "",
          district: existing.district || "",
          occupation: existing.occupation || "",
          annualIncome: existing.annualIncome ? String(existing.annualIncome) : "",
          category: existing.category || "",
          disability: existing.disability === true ? "yes" : "no",
          area_type: existing.area_type || "",
          education: existing.education || "",
          phoneNumber: existing.phoneNumber || existing.phone || "",
        }));
      }
    })();
  }, [user]);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true); setError(null);
    try {
      await completeUserProfile(user.uid, {
        displayName: form.displayName,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender,
        state: form.state,
        district: form.district,
        occupation: form.occupation,
        annualIncome: form.annualIncome ? Number(form.annualIncome) : undefined,
        category: form.category,
        disability: form.disability === "yes",
        area_type: form.area_type,
        education: form.education,
        phoneNumber: form.phoneNumber,
        phone: form.phoneNumber,
      });
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err?.message ?? "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-14">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <UserCog className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Almost there</p>
          <h1 className="font-display text-2xl font-bold">Complete your profile</h1>
          <p className="text-sm text-muted-foreground">Helps us match schemes to you accurately.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="card-elevated space-y-5 p-6 md:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Full Name" value={form.displayName} onChange={(v) => set("displayName", v)} required />
          <Text label="Phone Number" value={form.phoneNumber} onChange={(v) => set("phoneNumber", v)} type="tel" />
          <Text label="Age" value={form.age} onChange={(v) => set("age", v)} type="number" required />
          <Select label="Gender" value={form.gender} onChange={(v) => set("gender", v)} options={["male","female","other"]} required />
          <Select label="State" value={form.state} onChange={(v) => set("state", v)} options={INDIAN_STATES} required />
          <Text label="District" value={form.district} onChange={(v) => set("district", v)} />
          <Select label="Occupation" value={form.occupation} onChange={(v) => set("occupation", v)}
            options={OCCUPATIONS.map((o) => o.value)} labels={Object.fromEntries(OCCUPATIONS.map((o) => [o.value, o.label]))} required />
          <Text label="Annual Income (₹)" value={form.annualIncome} onChange={(v) => set("annualIncome", v)} type="number" required />
          <Select label="Category" value={form.category} onChange={(v) => set("category", v)} options={CATEGORIES} />
          <Select label="Area Type" value={form.area_type} onChange={(v) => set("area_type", v)} options={["urban","rural"]} required />
          <Select label="Education" value={form.education} onChange={(v) => set("education", v)} options={EDUCATION} />
          <Select label="Disability" value={form.disability} onChange={(v) => set("disability", v)} options={["no","yes"]} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => navigate({ to: "/dashboard" })}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save & continue"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>

      <style>{`
        .input { width: 100%; border-radius: .75rem; border: 1px solid var(--color-input);
          background: var(--color-background); padding: .65rem .9rem; font-size: .9rem; outline: none; }
        .input:focus { border-color: var(--color-ring); box-shadow: 0 0 0 3px oklch(0.62 0.16 158 / 0.2); }
      `}</style>
    </section>
  );
}

function Text({ label, value, onChange, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="input" />
    </label>
  );
}

function Select({ label, value, onChange, options, labels, required }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; labels?: Record<string, string>; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} required={required} className="input">
        <option value="">Select…</option>
        {options.map((o) => <option key={o} value={o}>{labels?.[o] ?? o[0].toUpperCase() + o.slice(1)}</option>)}
      </select>
    </label>
  );
}
