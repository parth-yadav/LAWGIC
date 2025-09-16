"use client";

import PdfToolbar from "@/pdf/PdfToolbar";
import { PDFProvider } from "../../pdf/PdfProvider";
import PdfViewer from "@/pdf/PdfViewer";
import PdfContentTab from "@/pdf/PdfContentTab";
import { usePDF } from "@/pdf/PdfProvider";

function TestButton() {
  const { analyzePdfForThreats, highlights, threats, pdfUrl } = usePDF();

  const handleTestAnalysis = async () => {
    console.log('📊 VIEWER: Test Threat Analysis clicked');
    console.log('📊 VIEWER: Current highlights:', highlights);
    console.log('📊 VIEWER: Current threats:', threats);
    console.log('📊 VIEWER: PDF URL:', pdfUrl);
    
    if (pdfUrl) {
      try {
        // Convert PDF URL to File object for analysis
        const response = await fetch(pdfUrl);
        const blob = await response.blob();
        const file = new File([blob], 'document.pdf', { type: 'application/pdf' });
        
        console.log('📊 VIEWER: Starting threat analysis...');
        await analyzePdfForThreats(file);
        console.log('📊 VIEWER: Threat analysis completed');
      } catch (error) {
        console.error('📊 VIEWER: Error during threat analysis:', error);
      }
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleTestAnalysis}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow-lg"
      >
        🔍 Test Threat Analysis
      </button>
    </div>
  );
}

export default function ViewerPage() {
  return (
    <PDFProvider pdfUrl={"/pdfs/sample2.pdf"}>
      <div className="flex flex-row">
        <PdfContentTab />
        <PdfViewer />
      </div>
      <PdfToolbar />
      
      {/* Console log button for testing */}
      <TestButton />
    </PDFProvider>
  );
}
