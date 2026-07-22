import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Mail, Lock } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirebaseAuth } from "@/integrations/firebase/client";
import { ensureUserDoc, getUserDoc } from "@/integrations/firebase/user-store";

async function routeAfterAuth(uid: string, navigate: ReturnType<typeof useNavigate>) {
  const doc = await getUserDoc(uid);
  if (!doc || doc.profileCompleted === false) {
    navigate({ to: "/complete-profile" });
  } else {
    navigate({ to: "/dashboard" });
  }
}


export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Scheme Sathi AI" },
      { name: "description", content: "Sign in to save your matched government schemes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [flipped, setFlipped] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) routeAfterAuth(u.uid, navigate);
    });
    return () => unsub();
  }, [navigate]);

  function handleTilt(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--tilt-x", `${-y * 8}deg`);
    el.style.setProperty("--tilt-y", `${x * 10}deg`);
  }
  function resetTilt() {
    cardRef.current?.style.setProperty("--tilt-x", "6deg");
    cardRef.current?.style.setProperty("--tilt-y", "-6deg");
  }

  async function onSubmit(e: React.FormEvent, mode: "sign_in" | "sign_up") {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const auth = getFirebaseAuth();
      let cred;
      if (mode === "sign_in") {
        cred = await signInWithEmailAndPassword(auth, email, password);
      } else {
        cred = await createUserWithEmailAndPassword(auth, email, password);
      }
      await ensureUserDoc(cred.user, mode === "sign_up");
      await routeAfterAuth(cred.user.uid, navigate);
    } catch (err: any) {
      setError(prettyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4 py-16"
      style={{
        background:
          "radial-gradient(ellipse at top left, oklch(0.85 0.09 220) 0%, transparent 55%), radial-gradient(ellipse at bottom right, oklch(0.9 0.06 180) 0%, transparent 55%), oklch(0.97 0.015 220)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full opacity-60 blur-3xl"
        style={{ background: "oklch(0.8 0.13 220)", animation: "blob-drift 14s ease-in-out infinite" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-3/4 h-96 w-96 rounded-full opacity-40 blur-3xl"
        style={{ background: "oklch(0.75 0.12 180)", animation: "blob-drift 18s ease-in-out infinite reverse" }}
      />

      <div className="perspective-1000 relative w-full max-w-md">
        <div
          ref={cardRef}
          onMouseMove={handleTilt}
          onMouseLeave={resetTilt}
          className="preserve-3d relative h-[560px] w-full transition-transform duration-500 ease-out"
          style={{
            transform: `rotateX(var(--tilt-x, 6deg)) rotateY(var(--tilt-y, -6deg)) ${flipped ? "rotateY(180deg)" : ""}`,
            transformStyle: "preserve-3d",
          }}
        >
          <FormFace hidden={flipped} title="Welcome back" subtitle="Sign in to access your saved schemes">
            <form onSubmit={(e) => onSubmit(e, "sign_in")} className="space-y-4">
              <FieldEmail value={email} onChange={setEmail} />
              <FieldPassword value={password} onChange={setPassword} />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:brightness-110 disabled:opacity-60"
              >
                {busy ? "Please wait…" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={() => { setError(null); setFlipped(true); }}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                New here? Create an account →
              </button>
            </form>
          </FormFace>

          <FormFace hidden={!flipped} back title="Create your account" subtitle="Just 6+ characters — nothing fancy">
            <form onSubmit={(e) => onSubmit(e, "sign_up")} className="space-y-4">
              <FieldEmail value={email} onChange={setEmail} />
              <FieldPassword value={password} onChange={setPassword} />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:brightness-110 disabled:opacity-60"
              >
                {busy ? "Please wait…" : "Create account"}
              </button>
              <button
                type="button"
                onClick={() => { setError(null); setFlipped(false); }}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                ← Already have an account? Sign in
              </button>
            </form>
          </FormFace>
        </div>

        <Link to="/" className="mt-8 block text-center text-sm text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </div>
    </section>
  );
}

function prettyError(err: any): string {
  const code: string = err?.code ?? "";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password") return "Wrong email or password.";
  if (code === "auth/user-not-found") return "No account found for that email.";
  if (code === "auth/email-already-in-use") return "That email is already registered — sign in instead.";
  if (code === "auth/weak-password") return "Password must be at least 6 characters.";
  if (code === "auth/invalid-email") return "That doesn't look like a valid email.";
  if (code === "auth/operation-not-allowed") return "This sign-in method isn't enabled in Firebase yet.";
  return err?.message ?? "Something went wrong";
}

function FormFace({
  children, title, subtitle, back = false, hidden,
}: { children: React.ReactNode; title: string; subtitle: string; back?: boolean; hidden: boolean }) {
  return (
    <div
      aria-hidden={hidden}
      className="backface-hidden absolute inset-0 rounded-3xl border border-white/40 bg-white/70 p-8 shadow-2xl backdrop-blur-xl"
      style={{
        transform: back ? "rotateY(180deg)" : undefined,
        boxShadow: "0 30px 80px -30px oklch(0.4 0.14 220 / 0.5), 0 10px 30px -15px oklch(0.3 0.08 220 / 0.3)",
      }}
    >
      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg"
          style={{ transform: "translateZ(30px)" }}
        >
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div style={{ transform: "translateZ(20px)" }}>
          <h1 className="font-display text-2xl font-bold leading-tight">{title}</h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div style={{ transform: "translateZ(15px)" }}>{children}</div>
    </div>
  );
}

function FieldEmail({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
      <div className="relative mt-1">
        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="email"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-input bg-white/80 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="you@example.com"
        />
      </div>
    </div>
  );
}

function FieldPassword({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
      <div className="relative mt-1">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="password"
          required
          minLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-input bg-white/80 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Min 6 characters"
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Any 6+ character password works.</p>
    </div>
  );
}
