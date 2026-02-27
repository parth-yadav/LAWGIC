import { createContext, useContext, useState, useEffect } from "react";
import useLocalState from "@/hooks/useLocalState";
import { LoaderCircleIcon } from "lucide-react";

const DataContext = createContext(undefined);

export const DataProvider = ({ children }) => {
  const [expanded, setExpanded] = useLocalState("navbar_expanded", false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex h-dvh w-full items-center justify-center">
        <LoaderCircleIcon className="size-20 animate-spin" />
      </div>
    );
  }

  return (
    <DataContext.Provider value={{ expanded, setExpanded }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
