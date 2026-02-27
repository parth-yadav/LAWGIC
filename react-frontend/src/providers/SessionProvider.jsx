import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApiClient from "@/utils/ApiClient";
import { toast } from "sonner";

const SessionContext = createContext({
  user: null,
  status: "loading",
  error: null,
  refreshSession: async () => {},
  setUser: () => {},
  logOut: async () => {},
});

export default function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("loading");
  const navigate = useNavigate();

  const fetchSession = async () => {
    setUser(null);
    setStatus("loading");
    setError(null);

    try {
      const response = await ApiClient.get("/auth/user");
      const success = response.data.success;
      const userData = response.data.data?.user;

      if (success && userData) {
        setUser(userData);
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

  const logOut = async (redirect = false) => {
    const { data } = await ApiClient.post("/auth/logout");
    if (data.success) {
      setUser(null);
      setError(null);
      setStatus("unauthenticated");
      toast.success("Signed out !!");
      if (redirect) {
        navigate("/login");
      }
    } else {
      toast.error("Error signing out");
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const contextValue = {
    user,
    status,
    error,
    refreshSession: fetchSession,
    setUser,
    logOut,
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
