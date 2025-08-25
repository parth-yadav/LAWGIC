"use client";

import getUser from "@/auth/getUser";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface SessionContextType {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  error: string | null;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  status: "loading",
  error: null,
  refreshSession: async () => {},
});

export default function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionContextType["user"]>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionContextType["status"]>("loading");

  const fetchSession = async () => {
    try {
      const user = await getUser();
      if (user) {
        setUser(user);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("unauthenticated");
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
      setError("Failed to fetch session");
      setUser(null);
      setStatus("unauthenticated");
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const contextValue: SessionContextType = {
    user,
    status,
    error,
    refreshSession: fetchSession,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
