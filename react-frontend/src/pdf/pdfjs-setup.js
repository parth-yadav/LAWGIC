import { pdfjs } from "react-pdf";

let isConfigured = false;

export function configurePdfWorker() {
  if (typeof window === "undefined") return;
  if (isConfigured) return;
  if (pdfjs.GlobalWorkerOptions.workerSrc) { isConfigured = true; return; }

  try {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    isConfigured = true;
    console.log("PDF.js worker configured successfully");
  } catch (error) {
    console.warn("Failed to configure PDF.js worker with bundled file, using CDN fallback:", error);
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    isConfigured = true;
  }
}

// Auto-configure on import
configurePdfWorker();
