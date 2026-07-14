import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ClipboardCheck } from "lucide-react";
import { INDIAN_STATES, OCCUPATIONS, type UserProfile } from "@/lib/schemes";

export const Route = createFileRoute("/questionnaire")({
  head: () => ({
    meta: [
      { title: "Check Your Eligibility — Scheme Sathi AI" },
      { name: "description", content: "Answer 4 quick steps to instantly find Central & State schemes you qualify for." },
      { property: "og:title", content: "Check Your Eligibility — Scheme Sathi AI" },
      { property: "og:description", content: "Answer 4 quick steps to instantly find Central & State schemes you qualify for." },
    ],
  }),
  component: Questionnaire,
});

type Step = 0 | 1 | 2 | 3;
const STEPS = ["Personal", "Location", "Financial", "Occupation"];

function Questionnaire() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<UserProfile["gender"] | "">("");
  const [hasDisability, setHasDisability] = useState<boolean | null>(null);
  const [state, setState] = useState("");
  const [annualIncome, setAnnualIncome] = useState("");
  const [isBpl, setIsBpl] = useState<boolean | null>(null);
  const [occupation, setOccupation] = useState("");

  const canContinue =
    (step === 0 && age && Number(age) > 0 && gender && hasDisability !== null) ||
    (step === 1 && state) ||
    (step === 2 && annualIncome !== "" && isBpl !== null) ||
    (step === 3 && occupation);

  function next() {
    if (step < 3) setStep((step + 1) as Step);
    else submit();
  }
  function back() {
    if (step > 0) setStep((step - 1) as Step);
  }
  function submit() {
    const profile: UserProfile = {
      age: Number(age),
      gender: gender as UserProfile["gender"],
      hasDisability: !!hasDisability,
      state,
      annualIncome: Number(annualIncome),
      isBpl: !!isBpl,
      occupation,
    };
    try {
      sessionStorage.setItem("yojana:profile", JSON.stringify(profile));
    } catch {}
    navigate({ to: "/results" });
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-14">
      <div className="mb-8 flex items-center justify-between text-xs font-semibold uppercase tracking-widest">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1 text-center">
            <span
              className={
                i === step
                  ? "text-primary"
                  : i < step
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              {label}
            </span>
            <div className={`mt-2 h-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`} />
          </div>
        ))}
      </div>

      <div className="card-elevated p-6 md:p-10">
        {step === 0 && (
          <div>
            <h1 className="font-display text-2xl font-bold">Tell us about yourself</h1>
            <p className="mt-1 text-sm text-muted-foreground">These help us filter age & gender-specific schemes.</p>
            <div className="mt-6 space-y-6">
              <Field label="Age">
                <input
                  type="number" min={0} max={120} value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="input" placeholder="e.g. 32"
                />
              </Field>
              <Field label="Gender">
                <div className="grid grid-cols-3 gap-2">
                  {(["male", "female", "other"] as const).map((g) => (
                    <ChoiceBtn key={g} active={gender === g} onClick={() => setGender(g)}>
                      {g[0].toUpperCase() + g.slice(1)}
                    </ChoiceBtn>
                  ))}
                </div>
              </Field>
              <Field label="Do you have a disability?">
                <YesNo value={hasDisability} onChange={setHasDisability} />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="font-display text-2xl font-bold">Where do you live?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Some schemes are state-specific.</p>
            <div className="mt-6">
              <Field label="State / UT">
                <select value={state} onChange={(e) => setState(e.target.value)} className="input">
                  <option value="">Select your state…</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="font-display text-2xl font-bold">Financial details</h1>
            <p className="mt-1 text-sm text-muted-foreground">Used only for income-based eligibility. Never stored.</p>
            <div className="mt-6 space-y-6">
              <Field label="Annual household income (₹)">
                <input
                  type="number" min={0} value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                  className="input" placeholder="e.g. 180000"
                />
              </Field>
              <Field label="Do you hold a BPL (Below Poverty Line) card?">
                <YesNo value={isBpl} onChange={setIsBpl} />
              </Field>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="font-display text-2xl font-bold">Your occupation</h1>
            <p className="mt-1 text-sm text-muted-foreground">Pick the closest match.</p>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {OCCUPATIONS.map((o) => (
                <ChoiceBtn key={o.value} active={occupation === o.value} onClick={() => setOccupation(o.value)}>
                  {o.label}
                </ChoiceBtn>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={back}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-full border border-input px-5 py-2.5 text-sm font-semibold text-foreground disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={next}
            disabled={!canContinue}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 disabled:opacity-40"
          >
            {step === 3 ? (<>See Results <ClipboardCheck className="h-4 w-4" /></>) : (<>Next <ArrowRight className="h-4 w-4" /></>)}
          </button>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--color-input);
          background: var(--color-background);
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .input:focus {
          border-color: var(--color-ring);
          box-shadow: 0 0 0 3px oklch(0.62 0.16 158 / 0.2);
        }
      `}</style>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function ChoiceBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-input bg-background hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <ChoiceBtn active={value === true} onClick={() => onChange(true)}>Yes</ChoiceBtn>
      <ChoiceBtn active={value === false} onClick={() => onChange(false)}>No</ChoiceBtn>
    </div>
  );
}
