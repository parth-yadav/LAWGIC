import { createContext, useContext, useState, useEffect } from "react";
import ApiClient from "@/utils/ApiClient";

const DocumentsContext = createContext(undefined);

export const DocumentsProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState(null);

  const getDocuments = async () => {
    try {
      const response = await ApiClient.get("/documents");
      const { data: docs, success } = response.data;

      if (!success) throw new Error("Failed to fetch documents");

      setDocuments(docs);
    } catch (error) {
      setError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDocuments();
  }, []);

  const providerData = {
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
