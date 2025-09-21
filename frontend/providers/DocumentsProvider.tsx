"use client";
import ApiClient from "@/utils/ApiClient";
import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";

type DocumentsContextType = {
  loading: boolean;
  documents: UserDocument[];
  error: string | null;
  getDocuments: () => Promise<void>;
  refreshDocuments: () => Promise<void>;
};

const DocumentsContext = createContext<DocumentsContextType | undefined>(
  undefined,
);

export const DocumentsProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getDocuments = async () => {
    try {
      const response = await ApiClient.get("/documents");
      const { data: documents, success } = response.data;

      if (!success) throw new Error("Failed to fetch documents");

      setDocuments(documents);
    } catch (error) {
      setError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDocuments();
  }, []);

  const providerData: DocumentsContextType = {
    loading,
    documents,
    error,
    getDocuments,
    refreshDocuments: getDocuments,
  };

  return (
    <DocumentsContext.Provider value={providerData}>
      {children}
    </DocumentsContext.Provider>
  );
};

export const useDocuments = () => {
  const context = useContext(DocumentsContext);
  if (!context) {
    throw new Error("useDocuments must be used within a DocumentsProvider");
  }
  return context;
};
