"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Upload, AlertTriangle, FileText, Loader2, Eye, ZoomIn, ZoomOut, Download } from "lucide-react";
import { useHighlights } from '../hooks/useHighlights';
import { HighlightOverlay } from '../components/HighlightOverlay';
import { HighlightControls } from '../components/HighlightControls';
import { ThreatSidebar } from '../components/ThreatSidebar';
import { ThreatData } from '../types/highlight';
import { analyzeWithWordData } from '../utils/pdfAnalysis';
import { generateThreatsPDF } from '../utils/pdfGenerator';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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

  // Upload and analyze PDF with word data
  async function handleUpload() {
    if (!file) {
      console.log('⚠️ FRONTEND: No file selected for upload');
      return;
    }
    
    console.log('🚀 FRONTEND: Starting PDF analysis process');
    console.log('🚀 FRONTEND: File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Use the new function that extracts word data and sends it to backend
      console.log('🔄 FRONTEND: Calling analyzeWithWordData...');
      const data = await analyzeWithWordData(file);
      
      console.log('🎉 FRONTEND: Analysis successful, setting results');
      setAnalysisResult(data);
      setCurrentPage(1);
    } catch (err) {
      console.error(' FRONTEND: Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsAnalyzing(false);
    }
  }

  const handleDownloadThreats = useCallback(() => {
    if (!analysisResult || !file) {
      console.log('No analysis result or file available for download');
      return;
    }
    
    try {
      console.log(' Generating threats PDF...');
      generateThreatsPDF(analysisResult, file.name);
      console.log(' PDF generated and download started');
    } catch (error) {
      console.error(' Error generating PDF:', error);
      setError('Failed to generate PDF report');
    }
  }, [analysisResult, file]);

  //in-built react-pdf fxn, dont touch!
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setTotalPages(numPages);
    setIsLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    setError(`Failed to load PDF: ${error.message}. Please ensure it is a valid PDF file.`);
    setIsLoading(false);
  }, []);

  // helpers
  const currentPageThreats = analysisResult?.pages.find(p => p.page === currentPage)?.threats || [];
  const currentPageHighlights = getPageHighlights(currentPage);

  const handleThreatClick = useCallback((threat: ThreatData) => {
    setSelectedThreat(threat);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
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

      <main className="max-w-full mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - File Upload */}
          <aside className="w-80 bg-white rounded-lg shadow-sm border p-6 self-start">
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
                <div className="space-y-3 mt-3">
                  <button onClick={handleUpload} disabled={isAnalyzing} className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        <span>Detect Threats</span>
                      </>
                    )}
                  </button>
                  <button 
                    onClick={handleDownloadThreats}
                    disabled={!analysisResult || isAnalyzing}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Threats Report</span>
                  </button>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Analysis Results Summary */}
            {analysisResult && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Current Page Analysis</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Threats found:</span>
                    <span className={`font-semibold ${currentPageThreats.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {currentPageThreats.length}
                    </span>
                  </div>
                  {currentPageThreats.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Click threats in the sidebar to highlight them on the PDF.
                    </div>
                  )}
                </div>
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
                    <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} className="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-400">
                      ←
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-400">
                      →
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => setScale(Math.max(0.5, scale - 0.1))} className="p-1 text-gray-600 hover:text-gray-900">
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-700 min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(Math.min(3, scale + 0.1))} className="p-1 text-gray-600 hover:text-gray-900">
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div ref={containerRef} className="relative overflow-auto max-h-[calc(100vh-12rem)] bg-gray-100 flex justify-center p-4" onMouseUp={handleTextSelection}>
                {fileUrl ? (
                  <div className="relative">
                    <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} onLoadError={onDocumentLoadError} loading={<Loader2 className="w-8 h-8 animate-spin text-gray-500 my-24" />}>
                      <div className="relative" style={{ transform: `scale(${scale})`, transformOrigin: 'center top' }}>
                        <Page pageNumber={currentPage} scale={1} className="shadow-lg" />
                        
                        {/* Combined Highlights and Threats Overlay */}
                        <HighlightOverlay 
                          highlights={currentPageHighlights}
                          threats={currentPageThreats}
                          selectedThreat={selectedThreat}
                          onRemove={removeHighlight}
                          onThreatClick={handleThreatClick}
                        />
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

          {/* Right Sidebar - All Threats */}
          {analysisResult && (
            <aside className="w-96">
              <ThreatSidebar
                analysisResult={analysisResult}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                selectedThreat={selectedThreat}
                onThreatClick={handleThreatClick}
                onPageChange={handlePageChange}
              />
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}