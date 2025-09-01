import { GlobalWorkerOptions } from 'pdfjs-dist';

/**
 * PDF.js Worker Configuration
 * 
 * This module provides functions to configure the PDF.js worker for rendering PDF files.
 * The bundled worker approach is recommended for better reliability and performance.
 * 
 * Usage:
 * ```typescript
 * import { setupPDFWorker } from '@/lib/pdfWorker';
 * 
 * // In a React component useEffect:
 * useEffect(() => {
 *   setupPDFWorker().then(() => {
 *     console.log('PDF worker ready');
 *   });
 * }, []);
 * ```
 */

// Configure PDF.js worker using the bundled worker (recommended approach)
export const setupPDFWorker = async () => {
  if (typeof window !== 'undefined' && !GlobalWorkerOptions.workerSrc) {
    try {
      // Use dynamic import to get the worker URL - this works better with TypeScript
      const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
      GlobalWorkerOptions.workerSrc = workerModule.default;
      console.log('PDF.js worker configured with bundled worker');
      return true;
    } catch (error) {
      console.warn('Failed to load bundled worker, falling back to CDN:', error);
      return await setupPDFWorkerCDN();
    }
  }
  return true;
};

// Synchronous version for immediate setup
export const setupPDFWorkerSync = () => {
  if (typeof window !== 'undefined' && !GlobalWorkerOptions.workerSrc) {
    // For sync setup, use the corrected CDN URL as fallback
    GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.mjs';
    console.log('PDF.js worker configured (sync) with CDN worker');
  }
};

// CDN fallback function with correct file extension (.mjs)
export const setupPDFWorkerCDN = async () => {
  if (typeof window !== 'undefined' && !GlobalWorkerOptions.workerSrc) {
    // Corrected CDN sources with proper .mjs extension
    const workerSources = [
      // UNPKG CDN with correct file extension
      'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.mjs',
      // jsDelivr CDN with correct file extension
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.mjs',
      // Mozilla CDN (may have CORS issues)
      'https://mozilla.github.io/pdf.js/build/pdf.worker.mjs',
      // Latest version
      'https://unpkg.com/pdfjs-dist/build/pdf.worker.mjs'
    ];
    
    // Try each worker source until one works
    for (const workerSrc of workerSources) {
      try {
        // Test if the worker URL is accessible
        const response = await fetch(workerSrc, { method: 'HEAD' });
        if (response.ok) {
          GlobalWorkerOptions.workerSrc = workerSrc;
          console.log(`PDF.js worker configured successfully with CDN: ${workerSrc}`);
          return true;
        }
      } catch (error) {
        console.warn(`Failed to load worker from ${workerSrc}:`, error);
        continue;
      }
    }
    
    console.error('All CDN worker sources failed');
    return false;
  }
  return true;
};
