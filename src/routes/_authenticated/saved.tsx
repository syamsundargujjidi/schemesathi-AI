import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, ArrowRight, Bookmark } from "lucide-react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { getDb, getFirebaseAuth } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/use-auth";
import type { UserProfile } from "@/lib/schemes";

type SavedRow = {
  id: string;
  label: string | null;
  profile: UserProfile;
  scheme_ids: string[];
  created_at: number; // ms
};

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({
    meta: [
      { title: "My saved schemes — Scheme Sathi AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<SavedRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const db = getDb();
    const q = query(
      collection(db, "users", user.uid, "savedResults"),
      orderBy("created_at", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: SavedRow[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            label: data.label ?? null,
            profile: data.profile,
            scheme_ids: data.scheme_ids ?? [],
            created_at:
              typeof data.created_at === "number"
                ? data.created_at
                : data.created_at?.toMillis?.() ?? Date.now(),
          };
        });
        setRows(list);
      },
      (err) => setError(err.message),
    );
    return () => unsub();
  }, [user]);

  async function remove(id: string) {
    if (!user) return;
    await deleteDoc(doc(getDb(), "users", user.uid, "savedResults", id));
  }

  async function doSignOut() {
    await signOut(getFirebaseAuth());
    window.location.href = "/";
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Your saved</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">My saved schemes</h1>
          {user?.email && (
            <p className="mt-1 text-xs text-muted-foreground">Signed in as {user.email}</p>
          )}
        </div>
        <button
          onClick={doSignOut}
          className="rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary"
        >
          Sign out
        </button>
      </div>

      {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

      {rows === null ? (
        <p className="mt-10 text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="card-elevated mt-10 p-10 text-center">
          <Bookmark className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-lg font-semibold">Nothing saved yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill the questionnaire and hit "Save results" to keep your matches here.
          </p>
          <Link
            to="/questionnaire"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Start questionnaire <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {rows.map((r) => (
            <article
              key={r.id}
              className="card-elevated flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-display font-semibold">
                  {r.label || `Saved on ${new Date(r.created_at).toLocaleDateString()}`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.scheme_ids.length} scheme{r.scheme_ids.length === 1 ? "" : "s"} · Age{" "}
                  {r.profile?.age} · {r.profile?.state} · {r.profile?.occupation}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => remove(r.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-input px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
