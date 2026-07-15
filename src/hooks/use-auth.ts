import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/integrations/firebase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { user, loading };
}
