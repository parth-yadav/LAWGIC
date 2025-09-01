"use client";
import { useState, useRef, useEffect } from "react";
import { getDocument } from "pdfjs-dist";
import { Upload, AlertTriangle, FileText, Loader2, Eye, Download } from "lucide-react";
import { setupPDFWorker } from "@/lib/pdfWorker";

interface ThreatData {
  text: string;
  reason: string;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  confidence: number;
}

interface PageData {
  page: number;
  threats: ThreatData[];
  totalWords: number;
}

interface AnalysisResult {
  pages: PageData[];
  totalPages: number;
  totalThreats: number;
}

export default function PdfAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [scale, setScale] = useState(1.2);
  const [selectedThreat, setSelectedThreat] = useState<ThreatData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize PDF worker on component mount
  useEffect(() => {
    const initWorker = async () => {
      try {
        await setupPDFWorker();
        console.log('PDF.js worker initialized successfully');
      } catch (error) {
        console.error('Failed to setup PDF worker:', error);
        setError('Failed to initialize PDF worker. Please refresh the page.');
      }
    };
    initWorker();
  }, []);

  // Upload and analyze PDF
  async function handleUpload() {
    if (!file) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const response = await fetch("http://localhost:4000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResult(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Store viewport for coordinate conversion
  const [viewport, setViewport] = useState<any>(null);

  // Convert PDF coordinates to HTML coordinates
  const convertPdfToHtmlCoords = (pdfBbox: any) => {
    if (!viewport) return null;
    
    // PDF coordinates are from bottom-left, HTML coordinates are from top-left
    const htmlX = pdfBbox.x;
    const htmlY = viewport.height - pdfBbox.y - pdfBbox.height; // Flip Y coordinate
    
    console.log('Coordinate conversion:', {
      original: pdfBbox,
      viewport: { width: viewport.width, height: viewport.height },
      converted: { x: htmlX, y: htmlY, width: pdfBbox.width, height: pdfBbox.height }
    });
    
    return {
      x: htmlX,
      y: htmlY,
      width: pdfBbox.width,
      height: pdfBbox.height
    };
  };

  // Render PDF page
  async function renderPdf(file: File, pageNum: number) {
    if (!canvasRef.current) return;
    
    setIsRendering(true);
    setError(null);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Simplified PDF loading - worker is already configured
      const loadingTask = getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
        isEvalSupported: false,
      });
      
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageNum);

      const currentViewport = page.getViewport({ scale });
      setViewport(currentViewport); // Store viewport for coordinate conversion
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      canvas.height = currentViewport.height;
      canvas.width = currentViewport.width;

      const renderContext = {
        canvasContext: ctx,
        viewport: currentViewport,
      };

      await page.render(renderContext).promise;
      console.log(`Page ${pageNum} rendered successfully`);
    } catch (err) {
      console.error("PDF rendering error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to render PDF page";
      
      // Provide more helpful error messages
      if (errorMessage.includes('worker') || errorMessage.includes('fetch')) {
        setError(`PDF Worker Error: Unable to load PDF.js worker. Please refresh the page and try again.`);
      } else if (errorMessage.includes('Invalid PDF')) {
        setError(`PDF File Error: The uploaded file appears to be corrupted or not a valid PDF. Please try a different PDF file.`);
      } else {
        setError(`PDF Rendering Error: ${errorMessage}`);
      }
    } finally {
      setIsRendering(false);
    }
  }

  // Get threats for current page
  const currentPageThreats = analysisResult?.pages.find(p => p.page === currentPage)?.threats || [];

  // Handle file selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setAnalysisResult(null);
      setError(null);
      setSelectedThreat(null);
    }
  }

  // Handle threat click - scroll to threat location
  function handleThreatClick(threat: ThreatData) {
    setSelectedThreat(threat);
    if (threat.bbox && containerRef.current) {
      // Scroll to threat location (simplified)
      console.log("Highlighting threat at:", threat.bbox);
    }
  }

  // Render PDF when file or page changes
  useEffect(() => {
    if (file) {
      renderPdf(file, currentPage);
    }
  }, [file, currentPage, scale]);

  const threatSeverity = (reason: string): 'high' | 'medium' | 'low' => {
    const highSeverity = ['injection', 'xss', 'command', 'malicious'];
    const mediumSeverity = ['suspicious', 'credential', 'exposure'];
    
    const lowerReason = reason.toLowerCase();
    if (highSeverity.some(keyword => lowerReason.includes(keyword))) return 'high';
    if (mediumSeverity.some(keyword => lowerReason.includes(keyword))) return 'medium';
    return 'low';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <h1 className="text-2xl font-bold text-gray-900">PDF Threat Analyzer</h1>
            </div>
            {analysisResult && (
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>{analysisResult.totalPages} pages</span>
                </span>
                <span className="flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>{analysisResult.totalThreats} threats</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-80 bg-white rounded-lg shadow-sm border p-6">
            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload PDF Document
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600">
                      {file ? file.name : "Choose PDF file"}
                    </span>
                  </div>
                </label>
              </div>
              
              {file && (
                <button
                  onClick={handleUpload}
                  disabled={isAnalyzing}
                  className="w-full mt-3 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Analyze Threats</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-1">Error</p>
                    <p className="text-sm text-red-600 mb-2">{error}</p>
                    {error.includes('PDF') && (
                      <div className="text-xs text-red-500">
                        <p>Troubleshooting tips:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Make sure you uploaded a valid PDF file</li>
                          <li>Try refreshing the page</li>
                          <li>Check your internet connection</li>
                          <li>The PDF.js worker library may be temporarily unavailable</li>
                          <li>Try using a different PDF file to test</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Page Navigation */}
            {analysisResult && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Navigation
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    ←
                  </button>
                  <span className="text-sm text-gray-600 px-3">
                    {currentPage} / {analysisResult.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(analysisResult.totalPages, currentPage + 1))}
                    disabled={currentPage === analysisResult.totalPages}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    →
                  </button>
                </div>
              </div>
            )}

            {/* Threats List */}
            {currentPageThreats.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Page {currentPage} Threats ({currentPageThreats.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {currentPageThreats.map((threat, index) => {
                    const severity = threatSeverity(threat.reason);
                    const severityColors = {
                      high: 'bg-red-50 border-red-200 text-red-800',
                      medium: 'bg-orange-50 border-orange-200 text-orange-800',
                      low: 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    };

                    return (
                      <div
                        key={index}
                        onClick={() => handleThreatClick(threat)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedThreat === threat ? 'ring-2 ring-red-500' : ''
                        } ${severityColors[severity]}`}
                      >
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            severity === 'high' ? 'text-red-600' :
                            severity === 'medium' ? 'text-orange-600' : 'text-yellow-600'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm break-words">
                              "{threat.text}"
                            </p>
                            <p className="text-xs mt-1 opacity-80">
                              {threat.reason}
                            </p>
                            {threat.bbox && (
                              <p className="text-xs mt-1 opacity-60">
                                Position: ({Math.round(threat.bbox.x)}, {Math.round(threat.bbox.y)})
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {analysisResult && currentPageThreats.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-600 font-medium">No threats detected on this page</p>
              </div>
            )}
          </div>

          {/* PDF Viewer */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* PDF Controls */}
              {file && (
                <div className="border-b p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">Zoom:</span>
                    <button
                      onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm"
                    >
                      -
                    </button>
                    <span className="text-sm text-gray-600 w-12 text-center">
                      {Math.round(scale * 100)}%
                    </span>
                    <button
                      onClick={() => setScale(Math.min(3, scale + 0.1))}
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm"
                    >
                      +
                    </button>
                  </div>
                  
                  {isRendering && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Rendering...</span>
                    </div>
                  )}
                </div>
              )}

              {/* PDF Canvas Container */}
              <div 
                ref={containerRef}
                className="relative overflow-auto max-h-[800px] bg-gray-100"
              >
                {file ? (
                  <>
                    <canvas 
                      ref={canvasRef} 
                      className="block mx-auto shadow-lg"
                      style={{ maxWidth: '100%' }}
                    />
                    
                    {/* Threat Overlays */}
                    {viewport && currentPageThreats.map((threat, index) => {
                      if (!threat.bbox) return null;
                      
                      const htmlCoords = convertPdfToHtmlCoords(threat.bbox);
                      if (!htmlCoords) return null;
                      
                      return (
                        <div
                          key={index}
                          className={`absolute border-2 pointer-events-none transition-all ${
                            selectedThreat === threat
                              ? 'bg-red-500 bg-opacity-40 border-red-600 z-10'
                              : 'bg-red-500 bg-opacity-20 border-red-500'
                          }`}
                          style={{
                            left: `${htmlCoords.x}px`,
                            top: `${htmlCoords.y}px`,
                            width: `${htmlCoords.width}px`,
                            height: `${htmlCoords.height}px`,
                          }}
                          title={`${threat.text} - ${threat.reason}`}
                        />
                      );
                    })}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-96 text-gray-500">
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Upload a PDF to start threat analysis</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
