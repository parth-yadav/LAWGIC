import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  SearchIcon,
  AlertTriangleIcon,
  ShieldAlertIcon,
  AlertCircleIcon,
  InfoIcon,
  EyeIcon,
  ScanIcon,
} from "lucide-react";
import { Threat, PageThreats, DEFAULT_HIGHLIGHT_COLOR, THREAT_COLORS, HighlightColor, Highlight } from "./types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePDF } from "../PdfProvider";

/**
 * PdfThreats Component
 *
 * Renders a sidebar panel for PDF threat detection with the following features:
 * - Extracts PDF text using Selection API
 * - Sends page-wise content to backend for analysis
 * - Converts threat responses to Highlight objects
 * - Stores threats as highlights in localStorage
 * - Displays threats with severity-based filtering
 *
 * @component
 * @returns {JSX.Element} The PDF threats panel
 */
export default function PdfThreats() {
  // ========================================
  // CONTEXT & STATE
  // ========================================

  const {
    pdfUrl,
    numPages,
    textLayerRef,
    highlights,
    setHighlights,
    jumpToHighlight,
    updateHighlightById,
    removeHighlightById,
  } = usePDF();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 });

  // ========================================
  // COMPUTED VALUES
  // ========================================

  /**
   * Filter highlights to show only threats (those with threat-related tags)
   */
  const threatHighlights = highlights.filter(highlight => 
    highlight.metadata.tags?.some(tag => 
      ['threat', 'security', 'critical', 'high', 'medium', 'low'].includes(tag.toLowerCase())
    )
  );

  /**
   * Filter threat highlights based on search query and severity
   */
  const filteredThreats = threatHighlights.filter(highlight => {
    const matchesSearch = 
      highlight.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      highlight.metadata.note?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const severity = highlight.metadata.tags?.find(tag => 
      ['critical', 'high', 'medium', 'low'].includes(tag.toLowerCase())
    );
    const matchesSeverity = !selectedSeverity || severity === selectedSeverity;
    
    return matchesSearch && matchesSeverity;
  });

  /**
   * Group threats by page number
   */
  const threatsByPage = filteredThreats.reduce((acc, threat) => {
    const pageNum = threat.position.pageNumber;
    if (!acc[pageNum]) {
      acc[pageNum] = [];
    }
    acc[pageNum].push(threat);
    return acc;
  }, {} as Record<number, Highlight[]>);

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Extracts text content from a specific page using Selection API
   */
  const extractPageText = (pageNumber: number): string => {
    console.log(`🔍 THREATS: Extracting text from page ${pageNumber}`);
    
    if (!textLayerRef.current) {
      console.log('🔍 THREATS: No text layer available');
      return '';
    }

    // Find the page element
    const pageElement = textLayerRef.current.querySelector(`[data-page-number="${pageNumber}"]`);
    if (!pageElement) {
      console.log(`🔍 THREATS: Page ${pageNumber} element not found`);
      return '';
    }

    // Extract all text content from the page
    const textContent = pageElement.textContent || '';
    console.log(`🔍 THREATS: Extracted ${textContent.length} characters from page ${pageNumber}`);
    
    return textContent.trim();
  };

  /**
   * Extracts text from all pages using Selection API
   */
  const extractAllPagesText = (): Array<{page: number, selectionApiContent: string}> => {
    console.log(`🔍 THREATS: Extracting text from all ${numPages} pages`);
    
    const pagesContent = [];
    
    for (let pageNum = 1; pageNum <= (numPages || 0); pageNum++) {
      const pageText = extractPageText(pageNum);
      if (pageText.length > 0) {
        pagesContent.push({
          page: pageNum,
          selectionApiContent: pageText
        });
        console.log(`🔍 THREATS: Page ${pageNum}: ${pageText.length} characters`);
      } else {
        console.log(`🔍 THREATS: Page ${pageNum}: No text content`);
      }
    }
    
    console.log(`🔍 THREATS: Total pages with content: ${pagesContent.length}`);
    return pagesContent;
  };

  /**
   * Converts threat response to Highlight object
   */
  const createHighlightFromThreat = (
    threatText: string, 
    explanation: string, 
    pageNumber: number, 
    threatNumber: number
  ): Highlight | null => {
    console.log(`🔍 THREATS: Creating highlight for threat: "${threatText}" on page ${pageNumber}`);
    
    if (!textLayerRef.current) {
      console.log('🔍 THREATS: No text layer available for highlight creation');
      return null;
    }

    // Find the page element
    const pageElement = textLayerRef.current.querySelector(`[data-page-number="${pageNumber}"]`);
    if (!pageElement) {
      console.log(`🔍 THREATS: Page ${pageNumber} element not found`);
      return null;
    }

    // Use Selection API to find the exact text
    const selection = window.getSelection();
    if (!selection) {
      console.log('🔍 THREATS: No selection API available');
      return null;
    }

    // Clear any existing selection
    selection.removeAllRanges();

    // Search for the threat text in the page
    const range = document.createRange();
    const walker = document.createTreeWalker(
      pageElement,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    let found = false;
    let startOffset = 0;
    let totalOffset = 0;

    while ((node = walker.nextNode()) && !found) {
      const textContent = node.textContent || '';
      const threatIndex = textContent.toLowerCase().indexOf(threatText.toLowerCase());
      
      if (threatIndex !== -1) {
        // Found the threat text
        try {
          range.setStart(node, threatIndex);
          range.setEnd(node, threatIndex + threatText.length);
          
          const id = `threat-${Date.now()}-${threatNumber}`;
          const timestamp = new Date().toISOString();
          
          // Determine threat severity and color
          const severity = determineThreatSeverity(explanation);
          const color = getThreatColor(severity);
          
          const highlight: Highlight = {
            id,
            text: threatText,
            position: {
              startOffset: totalOffset + threatIndex,
              endOffset: totalOffset + threatIndex + threatText.length,
              pageNumber,
              startPageOffset: threatIndex,
              endPageOffset: threatIndex + threatText.length,
            },
            color,
            metadata: {
              id,
              text: threatText,
              note: explanation,
              tags: ['threat', 'security', severity],
              createdAt: timestamp,
              author: 'threat-analyzer'
            },
            isActive: false,
            isTemporary: false,
          };
          
          console.log(`✅ THREATS: Created highlight for "${threatText}" with severity ${severity}`);
          found = true;
          return highlight;
          
        } catch (error) {
          console.log(`🔍 THREATS: Error creating range for "${threatText}":`, error);
        }
      }
      
      totalOffset += textContent.length;
    }

    if (!found) {
      console.log(`⚠️ THREATS: Could not locate threat text "${threatText}" on page ${pageNumber}`);
      return null;
    }

    return null;
  };

  /**
   * Determines threat severity based on explanation text
   */
  const determineThreatSeverity = (explanation: string): string => {
    const lowerExplanation = explanation.toLowerCase();
    
    if (lowerExplanation.includes('critical') || lowerExplanation.includes('severe') || 
        lowerExplanation.includes('dangerous') || lowerExplanation.includes('malicious')) {
      return 'critical';
    } else if (lowerExplanation.includes('high') || lowerExplanation.includes('serious') ||
               lowerExplanation.includes('vulnerability') || lowerExplanation.includes('injection')) {
      return 'high';
    } else if (lowerExplanation.includes('medium') || lowerExplanation.includes('moderate') ||
               lowerExplanation.includes('suspicious') || lowerExplanation.includes('potential')) {
      return 'medium';
    } else {
      return 'low';
    }
  };

  /**
   * Gets the appropriate color for threat severity
   */
  const getThreatColor = (severity: string): HighlightColor => {
    switch (severity) {
      case 'critical':
        return THREAT_COLORS[0]; // Critical threat color
      case 'high':
        return THREAT_COLORS[1]; // High threat color
      case 'medium':
        return THREAT_COLORS[2]; // Medium threat color
      case 'low':
        return THREAT_COLORS[3]; // Low threat color
      default:
        return THREAT_COLORS[1]; // Default to high threat
    }
  };

  /**
   * Main threat analysis function
   */
  const handleAnalyzePdf = async () => {
    console.log('🔍 THREATS: Starting PDF threat analysis');
    
    if (!numPages || numPages === 0) {
      console.log('🔍 THREATS: No pages available for analysis');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress({ current: 0, total: numPages });

    try {
      // Step 1: Extract text from all pages
      console.log('🔍 THREATS: Step 1 - Extracting text from all pages');
      const pagesContent = extractAllPagesText();
      
      if (pagesContent.length === 0) {
        console.log('🔍 THREATS: No text content found in PDF');
        setIsAnalyzing(false);
        return;
      }

      // Step 2: Send to backend for analysis
      console.log('🔍 THREATS: Step 2 - Sending content to backend for analysis');
      console.log('🚀 THREATS: EXACT DATA being sent to backend:');
      console.log(JSON.stringify({ pagesContent }, null, 2));
      console.log('📊 THREATS: Raw pagesContent array:');
      console.log(pagesContent);
      
      const response = await fetch('http://localhost:4000/analyze-pdf-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pagesContent }),
      });

      if (!response.ok) {
        throw new Error(`Backend analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🔍 THREATS: Backend analysis result:', result);

      if (!result.success || !result.threats) {
        throw new Error('Invalid response from backend');
      }

      // Step 3: Convert threats to highlights
      console.log('🔍 THREATS: Step 3 - Converting threats to highlights');
      const newThreatHighlights: Highlight[] = [];
      
      for (const threat of result.threats) {
        setAnalysisProgress({ current: threat.number, total: result.threats.length });
        
        const highlight = createHighlightFromThreat(
          threat.exactStringThreat,
          threat.explanation,
          threat.page,
          threat.number
        );
        
        if (highlight) {
          newThreatHighlights.push(highlight);
        }
      }

      // Step 4: Add threat highlights to existing highlights
      console.log(`🔍 THREATS: Step 4 - Adding ${newThreatHighlights.length} threat highlights`);
      
      // Remove existing threat highlights first
      const nonThreatHighlights = highlights.filter(h => 
        !h.metadata.tags?.some(tag => 
          ['threat', 'security'].includes(tag.toLowerCase())
        )
      );
      
      // Combine with new threat highlights
      const updatedHighlights = [...nonThreatHighlights, ...newThreatHighlights];
      setHighlights(updatedHighlights);
      
      console.log(`✅ THREATS: Analysis complete - Found ${newThreatHighlights.length} threats`);
      
    } catch (error) {
      console.error('❌ THREATS: Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress({ current: 0, total: 0 });
    }
  };

  /**
   * Gets the appropriate icon for threat severity
   */
  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return <ShieldAlertIcon className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangleIcon className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <AlertCircleIcon className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <InfoIcon className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangleIcon className="h-4 w-4 text-orange-600" />;
    }
  };

  /**
   * Gets the appropriate color class for threat severity
   */
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-600 bg-red-50 text-red-800';
      case 'high':
        return 'border-orange-600 bg-orange-50 text-orange-800';
      case 'medium':
        return 'border-yellow-600 bg-yellow-50 text-yellow-800';
      case 'low':
        return 'border-blue-600 bg-blue-50 text-blue-800';
      default:
        return 'border-orange-600 bg-orange-50 text-orange-800';
    }
  };

  // ========================================
  // RENDER HELPERS
  // ========================================

  /**
   * Renders the search and control section
   */
  const renderControlSection = () => (
    <div className="flex flex-col gap-4 p-4 shrink-0">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search threats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedSeverity === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedSeverity(null)}
        >
          All
        </Button>
        {['critical', 'high', 'medium', 'low'].map(severity => (
          <Button
            key={severity}
            variant={selectedSeverity === severity ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSeverity(severity)}
            className="capitalize"
          >
            {severity}
          </Button>
        ))}
      </div>

      <Button
        onClick={handleAnalyzePdf}
        disabled={isAnalyzing || !numPages}
        className="w-full"
      >
        {isAnalyzing ? (
          <div className="flex items-center gap-2">
            <ScanIcon className="h-4 w-4 animate-spin" />
            {analysisProgress.total > 0 ? 
              `Analyzing... (${analysisProgress.current}/${analysisProgress.total})` : 
              "Analyzing..."
            }
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ScanIcon className="h-4 w-4" />
            Detect Threats
          </div>
        )}
      </Button>
      
      {isAnalyzing && analysisProgress.total > 0 && (
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(analysisProgress.current / analysisProgress.total) * 100}%` 
            }}
          />
        </div>
      )}
    </div>
  );

  /**
   * Renders threat summary statistics based on highlight data
   */
  const renderSummary = () => {
    if (threatHighlights.length === 0) return null;

    const severityCounts = threatHighlights.reduce((acc, highlight) => {
      const severity = highlight.metadata.tags?.find(tag => 
        ['critical', 'high', 'medium', 'low'].includes(tag.toLowerCase())
      ) || 'high';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="px-4 pb-4">
        <div className="text-sm font-medium mb-2">Threat Summary</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            Critical: {severityCounts.critical || 0}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
            High: {severityCounts.high || 0}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
            Medium: {severityCounts.medium || 0}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            Low: {severityCounts.low || 0}
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // MAIN RENDER
  // ========================================

  return (
    <div className="flex flex-col h-full w-full max-w-sm">
      {/* Control Section */}
      {renderControlSection()}

      {/* Summary Section */}
      {renderSummary()}

      {/* Threats List */}
      <div className="flex-1 px-4 overflow-y-auto min-h-0">
        <div className="space-y-3">
          {isAnalyzing && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p>Analyzing PDF for security threats...</p>
              {analysisProgress.total > 0 && (
                <p className="text-xs mt-1">
                  Processing {analysisProgress.current} of {analysisProgress.total} threats
                </p>
              )}
            </div>
          )}

          {!isAnalyzing && threatHighlights.length > 0 && (
            <AnimatePresence>
              {Object.entries(threatsByPage).map(([pageNum, pageThreats]) => (
                <motion.div
                  key={pageNum}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-2"
                >
                  <div className="font-medium text-sm text-muted-foreground">
                    Page {pageNum} ({pageThreats.length} threat{pageThreats.length !== 1 ? 's' : ''})
                  </div>
                  
                  {pageThreats.map((threat, index) => {
                    const severity = threat.metadata.tags?.find(tag => 
                      ['critical', 'high', 'medium', 'low'].includes(tag.toLowerCase())
                    ) || 'high';
                    
                    return (
                      <motion.div
                        key={threat.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer",
                          getSeverityColor(severity)
                        )}
                        onClick={() => jumpToHighlight(threat)}
                      >
                        {/* Threat Header */}
                        <div className="flex items-start gap-2">
                          {getSeverityIcon(severity)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              "{threat.text}"
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs capitalize", getSeverityColor(severity))}
                              >
                                {severity}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title="Jump to threat"
                            onClick={(e) => {
                              e.stopPropagation();
                              jumpToHighlight(threat);
                            }}
                          >
                            <EyeIcon className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Threat Explanation */}
                        {threat.metadata.note && (
                          <div className="text-xs text-muted-foreground leading-relaxed">
                            {threat.metadata.note}
                          </div>
                        )}

                        {/* Threat Tags */}
                        {threat.metadata.tags && threat.metadata.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {threat.metadata.tags
                              .filter(tag => !['critical', 'high', 'medium', 'low'].includes(tag.toLowerCase()))
                              .map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))
                            }
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(threat.metadata.createdAt).toLocaleString()}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Empty State */}
          {!isAnalyzing && filteredThreats.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {threatHighlights.length === 0 ? (
                <div>
                  <ShieldAlertIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No threat analysis yet</p>
                  <p className="text-xs">Click "Detect Threats" to scan for security threats</p>
                </div>
              ) : searchQuery || selectedSeverity ? (
                "No threats match your filters"
              ) : (
                <div>
                  <ShieldAlertIcon className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No threats detected</p>
                  <p className="text-xs">This PDF appears to be safe</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
