import PdfToolbar from "@/pdf/PdfToolbar";
import { PDFProvider } from "../../pdf/PdfProvider";
import PdfViewer from "@/pdf/PdfViewer";
import PdfContentTab from "@/pdf/PdfContentTab";

export default async function ViewerPage() {
  return (
    <PDFProvider pdfUrl={"/pdfs/sample.pdf"}>
      <div className="flex flex-row">
        <PdfContentTab />
        <PdfViewer />
      </div>
      <PdfToolbar />
    </PDFProvider>
  );
}
