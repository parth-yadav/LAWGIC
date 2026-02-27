import { cn } from "@/lib/utils";
import PdfContentTab from "./PdfContentTab";
import { PDFProvider, usePDF } from "./PdfProvider";
import PdfToolbar from "./PdfToolbar";
import PdfViewer from "./PdfViewer";

export default function PDF({ pdfUrl, documentId, className = "" }) {
  return (
    <PDFProvider pdfUrl={pdfUrl} documentId={documentId}>
      <PDFContent className={className} />
    </PDFProvider>
  );
}

function PDFContent({ className = "" }) {
  const { toolbarPosition, toolbarView } = usePDF();

  return (
    <div className={`flex h-screen flex-row ${className}`}>
      <PdfContentTab />
      <div
        className={cn(
          "relative flex flex-1",
          toolbarView === "floating" && "flex-col",
          toolbarView === "fixed" && [
            "flex-col",
            toolbarPosition === "top" ? "flex-col-reverse" : "flex-col",
          ]
        )}
      >
        <PdfToolbar />
        <PdfViewer />
      </div>
    </div>
  );
}
