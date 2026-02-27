import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile, UserRole } from "../../types";
import { supabase } from "../../lib/supabaseClient";
import { Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;

  // ✅ los dos (para que no falle dependiendo de qué use tu Navbar)
  logout: () => Promise<void>;
  signOut: () => Promise<void>;

  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  isAuthenticated: boolean;
  isInitialLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const fetchProfile = async (userId: string, authEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
      }

      const profileData = data || {};

      const mappedUser: UserProfile = {
        id: userId,
        email: authEmail || profileData.email || "",
        username: profileData.username || (authEmail ? authEmail.split("@")[0] : "User"),
        role: (profileData.role as UserRole) || UserRole.EXPLORER,
        avatarUrl: profileData.avatar_url || undefined,
      };

      setUser(mappedUser);
    } catch (error) {
      console.error("Unexpected error fetching profile:", error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      }
      setIsInitialLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
      }

      setIsInitialLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
  };

  // ✅ alias por si tu UI usa signOut()
  const signOut = logout;

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !session) return;

    const dbUpdates: any = {};
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

    setUser({ ...user, ...updates });

    const { error } = await supabase.from("profiles").update(dbUpdates).eq("id", user.id);

    if (error) {
      console.error("Error updating profile:", error);
      await fetchProfile(user.id, user.email);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        login,
        signUp,
        logout,
        signOut,
        updateProfile,
        isAuthenticated: !!user,
        isInitialLoading,
      }}
    >
      {!isInitialLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
