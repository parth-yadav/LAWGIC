import PdfContentTab from "./PdfContentTab";
import { PDFProvider } from "./PdfProvider";
import PdfToolbar from "./PdfToolbar";
import PdfViewer from "./PdfViewer";

export default function PDF({ pdfUrl }: { pdfUrl: string }) {
  return (
    <PDFProvider pdfUrl={pdfUrl}>
      <div className="flex flex-row h-screen">
        <PdfContentTab />
        <PdfViewer />
      </div>
      <PdfToolbar />
    </PDFProvider>
  );
}
