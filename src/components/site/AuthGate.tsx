import { useNavigate } from "@tanstack/react-router";
import { ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { ReactNode } from "react";

/**
 * Route-level guard. If not signed in, renders a blocking "Sign in required"
 * dialog. If signed in, renders children. Loading state shows a spinner.
 */
export function AuthGate({ children, feature }: { children: ReactNode; feature?: string }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        {/* Blurred placeholder so URL is not usable directly */}
        <div className="min-h-[60vh]" aria-hidden />
        <SignInRequiredDialog
          feature={feature}
          onCancel={() => navigate({ to: "/" })}
          onSignIn={() => navigate({ to: "/auth" })}
          onSignUp={() => navigate({ to: "/auth", search: { mode: "signup" } as never })}
        />
      </>
    );
  }

  return <>{children}</>;
}

export function SignInRequiredDialog({
  feature,
  onCancel,
  onSignIn,
  onSignUp,
}: {
  feature?: string;
  onCancel: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-required-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ animation: "fadeIn .2s ease-out" }}
    >
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-2xl"
        style={{ animation: "popIn .25s cubic-bezier(.2,.9,.3,1.2)" }}
      >
        <button
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 id="signin-required-title" className="mt-5 text-center font-display text-2xl font-bold">
          Sign in Required
        </h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
          Please sign in to access {feature ?? "government schemes, eligibility checking, AI recommendations"},
          and save your results securely.
        </p>
        <div className="mt-7 flex flex-col gap-2">
          <button
            onClick={onSignIn}
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110"
          >
            Sign In
          </button>
          <button
            onClick={onSignUp}
            className="w-full rounded-full border border-primary bg-primary/5 px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"
          >
            Create Account
          </button>
          <button
            onClick={onCancel}
            className="w-full rounded-full px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn { from { opacity: 0; transform: scale(.92) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
      `}</style>
    </div>
  );
}
