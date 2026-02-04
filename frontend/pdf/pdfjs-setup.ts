"use client";

// This file sets up PDF.js worker configuration
// It should be imported before any react-pdf imports

// Note: Worker is configured dynamically in PdfViewer.tsx to avoid SSR issues
// This file is kept for reference but the actual configuration happens at runtime

export const configurePdfWorker = async () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { pdfjs } = await import("react-pdf");
    
    // Use unpkg CDN which is more reliable for ES modules
    const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    
    console.log("[pdfjs-setup] Worker configured:", workerUrl);
    console.log("[pdfjs-setup] PDF.js version:", pdfjs.version);
    
    return pdfjs;
  } catch (error) {
    console.error("[pdfjs-setup] Failed to configure worker:", error);
    return null;
  }
};
