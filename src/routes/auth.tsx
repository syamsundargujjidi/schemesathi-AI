import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Mail, Lock } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirebaseAuth, googleProvider } from "@/integrations/firebase/client";

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
      if (u) navigate({ to: "/saved" });
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
      if (mode === "sign_in") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate({ to: "/saved" });
    } catch (err: any) {
      setError(prettyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setBusy(true);
    try {
      const auth = getFirebaseAuth();
      await signInWithPopup(auth, googleProvider);
      navigate({ to: "/saved" });
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
          "radial-gradient(ellipse at top left, oklch(0.85 0.12 55) 0%, transparent 55%), radial-gradient(ellipse at bottom right, oklch(0.9 0.09 90) 0%, transparent 55%), oklch(0.97 0.02 85)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full opacity-60 blur-3xl"
        style={{ background: "oklch(0.8 0.18 55)", animation: "blob-drift 14s ease-in-out infinite" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-3/4 h-96 w-96 rounded-full opacity-40 blur-3xl"
        style={{ background: "oklch(0.75 0.15 25)", animation: "blob-drift 18s ease-in-out infinite reverse" }}
      />

      <div className="perspective-1000 relative w-full max-w-md">
        <div
          ref={cardRef}
          onMouseMove={handleTilt}
          onMouseLeave={resetTilt}
          className="preserve-3d relative h-[620px] w-full transition-transform duration-500 ease-out"
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
              <GoogleButton onClick={onGoogle} busy={busy} />
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
              <GoogleButton onClick={onGoogle} busy={busy} />
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
  if (code === "auth/popup-closed-by-user") return "Google sign-in was cancelled.";
  if (code === "auth/operation-not-allowed") return "This sign-in method isn't enabled in Firebase yet.";
  return err?.message ?? "Something went wrong";
}

function GoogleButton({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="flex w-full items-center justify-center gap-2 rounded-full border border-input bg-white/80 px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:bg-white disabled:opacity-60"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.09-1.93 3.28-4.77 3.28-8.07z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
      </svg>
      Continue with Google
    </button>
  );
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
        boxShadow: "0 30px 80px -30px oklch(0.5 0.18 55 / 0.5), 0 10px 30px -15px oklch(0.3 0.1 45 / 0.3)",
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
