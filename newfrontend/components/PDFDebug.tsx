"use client";
import { useEffect, useState } from "react";
import { GlobalWorkerOptions } from "pdfjs-dist";

export default function PDFDebug() {
  const [workerStatus, setWorkerStatus] = useState<string>("Checking...");
  const [pdfJsVersion, setPdfJsVersion] = useState<string>("Unknown");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check PDF.js version
    import("pdfjs-dist/package.json").then((pkg) => {
      setPdfJsVersion(pkg.version);
    }).catch(() => {
      setPdfJsVersion("Could not detect");
    });

    // Check worker configuration
    const checkWorker = () => {
      const workerSrc = GlobalWorkerOptions.workerSrc;
      setWorkerStatus(`Worker configured: ${workerSrc || "Not set"}`);
      
      // Test worker URL
      if (workerSrc) {
        fetch(workerSrc, { method: 'HEAD' })
          .then(response => {
            if (response.ok) {
              setWorkerStatus(`✅ Worker accessible: ${workerSrc}`);
            } else {
              setWorkerStatus(`❌ Worker not accessible (${response.status}): ${workerSrc}`);
            }
          })
          .catch(error => {
            setWorkerStatus(`❌ Worker test failed: ${error.message}`);
          });
      }
    };

    checkWorker();
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-bold mb-4">PDF.js Debug Information</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Loading...</strong></p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">PDF.js Debug Information</h3>
      <div className="space-y-2 text-sm">
        <p><strong>PDF.js Version:</strong> {pdfJsVersion}</p>
        <p><strong>Worker Status:</strong> {workerStatus}</p>
        <p><strong>Browser:</strong> {navigator.userAgent.substring(0, 50)}...</p>
        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
      </div>
    </div>
  );
}
