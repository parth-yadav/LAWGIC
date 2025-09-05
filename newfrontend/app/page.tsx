"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Upload, AlertTriangle, FileText, Loader2, Eye, ZoomIn, ZoomOut } from "lucide-react";
import { useHighlights } from '../hooks/useHighlights';
import { HighlightOverlay } from '../components/HighlightOverlay';
import { HighlightControls } from '../components/HighlightControls';
import { ThreatData } from '../types/highlight';

// Configure PDF.js worker
// Using dynamic import to ensure compatibility with different bundler configurations
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
}

// --- TYPE DEFINITIONS ---
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
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scale, setScale] = useState(1.2);
  const [selectedThreat, setSelectedThreat] = useState<ThreatData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use the modularized highlight hook
  const {
    selectedText,
    addHighlight,
    removeHighlight,
    clearPageHighlights,
    handleTextSelection,
    getPageHighlights,
    resetHighlights,
  } = useHighlights();

  // Handle file selection and create URL
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      
      // Clean up previous URL
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
      
      // Create new URL for the file
      const url = URL.createObjectURL(selectedFile);
      setFileUrl(url);
      
      // Reset states for the new file
      setAnalysisResult(null);
      setError(null);
      setSelectedThreat(null);
      setCurrentPage(1);
      resetHighlights();
      setTotalPages(0); // Reset total pages until new PDF is loaded
    }
  }

  // Clean up file URL on component unmount
  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

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
        const errorData = await response.json();
        throw new Error(errorData.message || `Analysis failed: ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResult(data);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during analysis.");
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }

  // --- react-pdf Event Handlers ---
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setTotalPages(numPages);
    setIsLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    setError(`Failed to load PDF: ${error.message}. Please ensure it is a valid PDF file.`);
    setIsLoading(false);
  }, []);

  // --- Data & Helper Functions ---
  const currentPageThreats = analysisResult?.pages.find(p => p.page === currentPage)?.threats || [];
  const currentPageHighlights = getPageHighlights(currentPage);

  const handleThreatClick = useCallback((threat: ThreatData) => {
    setSelectedThreat(threat);
  }, []);

  const handleAddHighlight = useCallback((color: string) => {
    addHighlight(currentPage, scale, containerRef, color);
  }, [addHighlight, currentPage, scale]);

  const threatSeverity = useCallback((reason: string): 'high' | 'medium' | 'low' => {
    const highSeverity = ['injection', 'xss', 'command', 'malicious'];
    const mediumSeverity = ['suspicious', 'credential', 'exposure'];
    const lowerReason = reason.toLowerCase();
    if (highSeverity.some(keyword => lowerReason.includes(keyword))) return 'high';
    if (mediumSeverity.some(keyword => lowerReason.includes(keyword))) return 'medium';
    return 'low';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <h1 className="text-2xl font-bold text-gray-900">PDF Threat Analyzer</h1>
            </div>
            {analysisResult && (
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center space-x-1"><FileText className="w-4 h-4" /><span>{analysisResult.totalPages} pages</span></span>
                <span className="flex items-center space-x-1"><AlertTriangle className="w-4 h-4 text-red-500" /><span>{analysisResult.totalThreats} threats</span></span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full lg:w-96 bg-white rounded-lg shadow-sm border p-6 self-start">
            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload PDF Document</label>
              <div className="relative">
                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-400 transition-colors">
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600 truncate block max-w-full">{file ? file.name : "Choose PDF file"}</span>
                  </div>
                </label>
              </div>
              
              {file && (
                <button onClick={handleUpload} disabled={isAnalyzing} className="w-full mt-3 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                  {isAnalyzing ? (<><Loader2 className="w-4 h-4 animate-spin" /><span>Analyzing...</span></>) : (<><Eye className="w-4 h-4" /><span>Analyze Threats</span></>)}
                </button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
            )}

            {/* Page Navigation */}
            {totalPages > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Page Navigation</label>
                <div className="flex items-center justify-center space-x-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50">←</button>
                  <span className="text-sm text-gray-600 font-mono px-3"> {currentPage} / {totalPages} </span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50">→</button>
                </div>
              </div>
            )}

            {/* Threats List */}
            {analysisResult && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Threats on Page {currentPage} ({currentPageThreats.length})</h3>
                {currentPageThreats.length > 0 ? (
                  <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-2">
                    {currentPageThreats.map((threat, index) => {
                      const severity = threatSeverity(threat.reason);
                      const severityColors = {
                        high: 'bg-red-50 border-red-200 text-red-800',
                        medium: 'bg-orange-50 border-orange-200 text-orange-800',
                        low: 'bg-yellow-50 border-yellow-200 text-yellow-800'
                      };
                      return (
                        <div key={index} onClick={() => handleThreatClick(threat)} className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${selectedThreat === threat ? 'ring-2 ring-red-500' : ''} ${severityColors[severity]}`}>
                            <p className="font-medium text-sm break-words">"{threat.text}"</p>
                            <p className="text-xs mt-1 opacity-80">{threat.reason}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-gray-500">No threats detected on this page.</div>
                )}
              </div>
            )}

          </aside>

          {/* PDF Viewer */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow-sm border sticky top-24">
              {/* PDF Controls */}
              {fileUrl && (
                <div className="border-b p-2 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                    <span className="text-sm text-gray-600 w-16 text-center font-mono">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                  </div>
                  
                  <HighlightControls 
                    selectedText={selectedText}
                    onAddHighlight={handleAddHighlight}
                  />
                </div>
              )}

              {/* PDF Document Container */}
              <div ref={containerRef} className="relative overflow-auto max-h-[calc(100vh-12rem)] bg-gray-100 flex justify-center p-4" onMouseUp={handleTextSelection}>
                {fileUrl ? (
                  <div className="relative">
                    <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} onLoadError={onDocumentLoadError} loading={<Loader2 className="w-8 h-8 animate-spin text-gray-500 my-24" />}>
                      <div className="relative" style={{ transform: `scale(${scale})`, transformOrigin: 'center top' }}>
                        <Page pageNumber={currentPage} scale={1} className="shadow-lg" />
                        
                        {/* User Highlights */}
                        <HighlightOverlay 
                          highlights={currentPageHighlights}
                          onRemove={removeHighlight}
                        />
                        
                        {/* Threat Overlays */}
                        {currentPageThreats.map((threat, index) => {
                          if (!threat.bbox) return null;
                          return (
                            <div
                              key={index}
                              className={`absolute border-2 pointer-events-none transition-all ${selectedThreat === threat ? 'bg-red-500 bg-opacity-40 border-red-600 z-10' : 'bg-red-500 bg-opacity-20 border-red-500'}`}
                              style={{
                                left: `${threat.bbox.x}px`,
                                top: `${threat.bbox.y}px`,
                                width: `${threat.bbox.width}px`,
                                height: `${threat.bbox.height}px`,
                              }}
                              title={`${threat.text} - ${threat.reason}`}
                            />
                          );
                        })}
                      </div>
                    </Document>
                  </div>
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
      </main>
    </div>
  );
}