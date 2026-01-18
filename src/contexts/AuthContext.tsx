import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/* =======================
   TYPES
======================= */

interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  user_type: "dealer" | "retail";
  business_name: string | null;
  gst_number: string | null;
  address: string | null;
  referral_code: string | null;
  wallet_balance: number;
  is_verified: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;

  // ✅ NEW FLAGS
  isVerifiedDealer: boolean;
  isPendingDealer: boolean;

  signUp: (
    email: string,
    password: string,
    metadata: Record<string, string>
  ) => Promise<{ error: Error | null }>;

  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null }>;

  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

/* =======================
   CONTEXT
======================= */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* =======================
   PROVIDER
======================= */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // ✅ NEW COMPUTED FLAGS
  const isVerifiedDealer =
    profile?.user_type === "dealer" && profile?.is_verified === true;

  const isPendingDealer =
    profile?.user_type === "dealer" && profile?.is_verified === false;

  /* =======================
     HELPERS
  ======================= */

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data as Profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const checkAdminRole = async () => {
    try {
      const { data, error } = await supabase.rpc("is_admin");

      if (error) {
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  /* =======================
     AUTH LISTENERS
  ======================= */

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
          checkAdminRole();
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }

      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
        checkAdminRole();
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* =======================
     AUTH ACTIONS
  ======================= */

  const signUp = async (
    email: string,
    password: string,
    metadata: Record<string, string>
  ) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata,
      },
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
  };

  /* =======================
     PROVIDER VALUE
  ======================= */

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAdmin,

        // ✅ EXPOSED FLAGS
        isVerifiedDealer,
        isPendingDealer,

        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =======================
   HOOK
======================= */

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
