import PdfContentTab from "./PdfContentTab";
import { PDFProvider } from "./PdfProvider";
import PdfToolbar from "./PdfToolbar";
import PdfViewer from "./PdfViewer";

export default function PDF({
  pdfUrl,
  documentId,
  className = "",
}: {
  pdfUrl: string;
  documentId?: string;
  className?: string;
}) {
  return (
    <PDFProvider pdfUrl={pdfUrl} documentId={documentId}>
      <div className={`flex h-screen flex-row ${className}`}>
        <PdfContentTab />
        <PdfViewer />
      </div>
      <PdfToolbar />
    </PDFProvider>
  );
}
