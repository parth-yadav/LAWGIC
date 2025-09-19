"use client";

import PdfToolbar from "@/pdf/PdfToolbar";
import { PDFProvider } from "../../pdf/PdfProvider";
import PdfViewer from "@/pdf/PdfViewer";
import PdfContentTab from "@/pdf/PdfContentTab";

export default function ViewerPage() {
  return (
    <PDFProvider pdfUrl={"/pdfs/sample2.pdf"}>
      <div className="flex flex-row">
        <PdfContentTab />
        <PdfViewer />
      </div>
      <PdfToolbar />
    </PDFProvider>
  );
}
