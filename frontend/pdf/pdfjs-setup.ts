/**
 * Centralized PDF.js setup for Next.js
 * 
 * This file handles PDF.js worker configuration in a way that's compatible
 * with Next.js's module bundling and SSR.
 * 
 * IMPORTANT: Import this file before using any react-pdf components.
 */

import { pdfjs } from "react-pdf";

// Flag to ensure we only configure once
let isConfigured = false;

/**
 * Configure PDF.js worker. Safe to call multiple times.
 * Should be called on the client side only.
 */
export function configurePdfWorker(): void {
  // Only run on client side
  if (typeof window === "undefined") {
    return;
  }

  // Prevent multiple configurations
  if (isConfigured) {
    return;
  }

  // Check if already configured
  if (pdfjs.GlobalWorkerOptions.workerSrc) {
    isConfigured = true;
    return;
  }

  try {
    // Use the bundled worker from node_modules
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    isConfigured = true;
    console.log("PDF.js worker configured successfully");
  } catch (error) {
    console.warn("Failed to configure PDF.js worker with bundled file, using CDN fallback:", error);
    // Fallback to CDN
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    isConfigured = true;
  }
}

// Auto-configure on import (client-side only)
if (typeof window !== "undefined") {
  configurePdfWorker();
}

export { pdfjs };
