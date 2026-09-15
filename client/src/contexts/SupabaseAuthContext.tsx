import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";

type Ctx = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
};

const SupabaseAuthContext = createContext<Ctx | null>(null);

export function SupabaseAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const sb = getSupabase();
    let mounted = true;
    sb.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  const value = useMemo<Ctx>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      configured,
      signOut: async () => {
        if (!configured) return;
        await getSupabase().auth.signOut();
      },
    }),
    [session, loading, configured],
  );

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export function useSupabaseAuth(): Ctx {
  const ctx = useContext(SupabaseAuthContext);
  if (!ctx) {
    throw new Error("useSupabaseAuth must be used inside SupabaseAuthProvider");
  }
  return ctx;
}
