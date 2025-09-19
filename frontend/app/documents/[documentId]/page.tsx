"use client";
import PDF from "@/pdf";
import ApiClient from "@/utils/ApiClient";
import { getErrorMessage } from "@/utils/utils";
import { BanIcon, LoaderCircleIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const params = useParams<{ documentId: string }>();

  if (params.documentId === "test") {
    return <PDF pdfUrl={"/pdfs/sample.pdf"} className="flex-1" />;
  }
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const get = async () => {
      try {
        const response = await ApiClient.get(`/documents/${params.documentId}`);
        if (response.data.success === false) {
          throw new Error(response.data.error?.message || "Error Loading file");
        }
        const url = response.data.data.signedUrl;
        console.log("Document response:", url);
        setPdfUrl(url);
      } catch (error) {
        setError(getErrorMessage(error, "Error Loading file"));
      } finally {
        setLoading(false);
      }
    };

    get();
  }, []);

  if (loading)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoaderCircleIcon className="size-14 animate-spin" />
      </div>
    );

  if (error)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-red-500">{error}</span>
      </div>
    );

  if (!pdfUrl) {
    return (
      <div className="flex h-dvh w-full flex-col items-center justify-center">
        <BanIcon className="size-20 text-red-500" />
        <p className="text-muted-foreground text-lg">
          No PDF available for this document.
        </p>
      </div>
    );
  }

  return <PDF pdfUrl={pdfUrl} className="flex-1" />;
}
