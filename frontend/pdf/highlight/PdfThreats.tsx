import { useState, useEffect } from "react";
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
  DownloadIcon,
} from "lucide-react";
import { THREAT_COLORS, HighlightColor, Highlight } from "./types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePDF } from "../PdfProvider";
import { generateThreatsPDF } from "@/utils/pdfThreatGenerator";
import ApiClient from "@/utils/ApiClient";

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
    documentId,
    numPages,
    textLayerRef,
    jumpToHighlight,
    setStoredThreats,
    addThreatToStorage,
  } = usePDF();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({
    current: 0,
    total: 0,
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [backendThreats, setBackendThreats] = useState<any[]>([]);
  const [threatHighlights, setThreatHighlights] = useState<Highlight[]>([]);
  const [threatsExist, setThreatsExist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ========================================
  // EFFECTS
  // ========================================

  // Load existing threats from backend when component mounts
  useEffect(() => {
    const loadExistingThreats = async () => {
      if (!documentId || documentId === "test") {
        setIsLoading(false);
        return;
      }

      try {
        console.log(
          "🔍 THREATS: Loading existing threats for document:",
          documentId,
        );
        const response = await ApiClient.get(`/threats?docId=${documentId}`);

        if (response.data.success && response.data.data?.threats) {
          const threats = response.data.data.threats;
          console.log("✅ THREATS: Loaded existing threats:", threats);

          setBackendThreats(threats);
          setThreatsExist(true);

          // Convert backend threats to highlight format for display
          const highlights = threats.map((threat: any) =>
            convertBackendThreatToHighlight(threat),
          );
          setThreatHighlights(highlights);

          // Also add to PDFProvider's stored threats for highlighting in PDF
          setStoredThreats(highlights);
        } else {
          console.log("📝 THREATS: No existing threats found");
          setThreatsExist(false);
        }
      } catch (error) {
        console.log("⚠️ THREATS: Error loading existing threats:", error);
        setThreatsExist(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingThreats();
  }, [documentId]);

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Convert backend threat data to frontend highlight format
   */
  const convertBackendThreatToHighlight = (threat: any): Highlight => {
    return {
      id: threat.id,
      text: threat.exactStringThreat,
      position: {
        startOffset: 0, // Will be calculated when needed
        endOffset: 0,
        pageNumber: threat.page,
        startPageOffset: 0,
        endPageOffset: 0,
      },
      color: getThreatColor(),
      metadata: {
        id: threat.id,
        text: threat.exactStringThreat,
        note: threat.explanation,
        tags: ["threat", "security", threat.severity?.toLowerCase() || "high"],
        createdAt: new Date().toISOString(),
        author: "threat-analyzer",
      },
      isActive: false,
      isTemporary: false,
    };
  };

  // ========================================
  // COMPUTED VALUES
  // ========================================

  /**
   * Filter threat highlights based on search query and severity
   */
  const filteredThreats = threatHighlights.filter((highlight) => {
    const matchesSearch =
      highlight.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      highlight.metadata.note
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const severity = highlight.metadata.tags?.find((tag) =>
      ["critical", "high", "medium", "low"].includes(tag.toLowerCase()),
    );
    const matchesSeverity = !selectedSeverity || severity === selectedSeverity;

    return matchesSearch && matchesSeverity;
  });

  /**
   * Group threats by page number
   */
  const threatsByPage = filteredThreats.reduce(
    (acc, threat) => {
      const pageNum = threat.position.pageNumber;
      if (!acc[pageNum]) {
        acc[pageNum] = [];
      }
      acc[pageNum].push(threat);
      return acc;
    },
    {} as Record<number, Highlight[]>,
  );

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Extracts text content from a specific page using Selection API
   */
  const extractPageText = (pageNumber: number): string => {
    console.log(`🔍 THREATS: Extracting text from page ${pageNumber}`);

    if (!textLayerRef.current) {
      console.log("🔍 THREATS: No text layer available");
      return "";
    }

    // Find the page element
    const pageElement = textLayerRef.current.querySelector(
      `[data-page-number="${pageNumber}"]`,
    );
    if (!pageElement) {
      console.log(`🔍 THREATS: Page ${pageNumber} element not found`);
      return "";
    }

    // Extract all text content from the page
    const textContent = pageElement.textContent || "";
    console.log(
      `🔍 THREATS: Extracted ${textContent.length} characters from page ${pageNumber}`,
    );

    return textContent.trim();
  };

  /**
   * Extracts text from all pages using Selection API
   */
  const extractAllPagesText = (): Array<{
    page: number;
    selectionApiContent: string;
  }> => {
    console.log(`🔍 THREATS: Extracting text from all ${numPages} pages`);

    const pagesContent = [];

    for (let pageNum = 1; pageNum <= (numPages || 0); pageNum++) {
      const pageText = extractPageText(pageNum);
      if (pageText.length > 0) {
        pagesContent.push({
          page: pageNum,
          selectionApiContent: pageText,
        });
        console.log(
          `🔍 THREATS: Page ${pageNum}: ${pageText.length} characters`,
        );
      } else {
        console.log(`🔍 THREATS: Page ${pageNum}: No text content`);
      }
    }

    console.log(`🔍 THREATS: Total pages with content: ${pagesContent.length}`);
    return pagesContent;
  };

  /**
   * Helper interface for text node position mapping
   */
  interface TextNodeRange {
    node: Node;
    start: number;
    end: number;
  }

  /**
   * Finds and selects text that may span multiple text nodes/divs
   */
  const selectTextWordByWord = (
    root: Node | null,
    searchText: string,
  ): boolean => {
    if (!root) return false;

    // Split search text into words, preserving original spacing
    const words = searchText.split(/(\s+)/); // This keeps whitespace as separate elements
    if (words.length === 0) return false;

    // Collect all text nodes
    const walker: TreeWalker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
    );
    const textNodes: Node[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.textContent && node.textContent.trim()) {
        textNodes.push(node);
      }
    }

    if (textNodes.length === 0) return false;

    // Build full text with position mapping
    let fullText = "";
    const nodeRanges: TextNodeRange[] = [];
    for (const n of textNodes) {
      nodeRanges.push({
        node: n,
        start: fullText.length,
        end: fullText.length + (n.textContent?.length ?? 0),
      });
      fullText += n.textContent ?? "";
    }

    // Find all possible starting positions for the first word
    const firstWord = words[0].trim();
    const startPositions: number[] = [];
    let searchFrom = 0;

    while (true) {
      const pos = fullText
        .toLowerCase()
        .indexOf(firstWord.toLowerCase(), searchFrom);
      if (pos === -1) break;
      startPositions.push(pos);
      searchFrom = pos + 1;
    }

    // Try each starting position
    for (const startPos of startPositions) {
      const matchResult = findWordsFromPosition(fullText, words, startPos);
      if (matchResult) {
        // Convert positions to node+offset
        const startNodeInfo = getNodeFromPosition(
          nodeRanges,
          matchResult.start,
        );
        const endNodeInfo = getNodeFromPosition(nodeRanges, matchResult.end);

        if (startNodeInfo && endNodeInfo) {
          const range = document.createRange();
          range.setStart(startNodeInfo.node, startNodeInfo.offset);
          range.setEnd(endNodeInfo.node, endNodeInfo.offset);

          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
            return true;
          }
        }
      }
    }

    return false;
  };

  const findWordsFromPosition = (
    fullText: string,
    words: string[],
    startPos: number,
  ): { start: number; end: number } | null => {
    let currentPos = startPos;
    const textLower = fullText.toLowerCase();

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      if (word.trim() === "") {
        // It's whitespace, skip over any whitespace in the text
        while (
          currentPos < fullText.length &&
          /\s/.test(fullText[currentPos])
        ) {
          currentPos++;
        }
        continue;
      }

      // Look for the word at current position
      const wordLower = word.toLowerCase();
      const foundAt = textLower.indexOf(wordLower, currentPos);

      if (foundAt === -1) {
        return null; // Word not found
      }

      // Check if this word is reasonably close to where we expect it
      // Allow some whitespace/punctuation between words
      const gap = foundAt - currentPos;
      if (gap > 50) {
        return null; // Too much gap, probably not the right sequence
      }

      // Skip to after this word
      currentPos = foundAt + word.length;
    }

    return { start: startPos, end: currentPos };
  };

  const getNodeFromPosition = (
    nodeRanges: TextNodeRange[],
    position: number,
  ): { node: Node; offset: number } | null => {
    for (const { node, start, end } of nodeRanges) {
      if (position >= start && position <= end) {
        return { node, offset: position - start };
      }
    }
    return null;
  };

  /**
   * Converts threat response to Highlight object
   */
  const createHighlightFromThreat = (
    threatText: string,
    explanation: string,
    pageNumber: number,
    threatNumber: number,
  ): Highlight | null => {
    console.log(
      `🔍 THREATS: Creating highlight for threat: "${threatText}" on page ${pageNumber}`,
    );

    if (!textLayerRef.current) {
      console.log("🔍 THREATS: No text layer available for highlight creation");
      return null;
    }

    // Find the page element
    const pageElement = textLayerRef.current.querySelector(
      `[data-page-number="${pageNumber}"]`,
    );
    if (!pageElement) {
      console.log(`🔍 THREATS: Page ${pageNumber} element not found`);
      return null;
    }

    // Use Selection API to find the exact text
    const selection = window.getSelection();
    if (!selection) {
      console.log("🔍 THREATS: No selection API available");
      return null;
    }

    // Clear any existing selection
    selection.removeAllRanges();

    try {
      // Use the improved word-by-word selection for multi-div text
      const found = selectTextWordByWord(pageElement, threatText);

      if (found) {
        console.log(
          `🔍 THREATS: Found threat text using word-by-word selection`,
        );

        // Get the current selection that was just applied
        const currentSelection = window.getSelection();
        if (!currentSelection || currentSelection.rangeCount === 0) {
          console.log(
            "🔍 THREATS: No active selection found after text selection",
          );
          return null;
        }

        const range = currentSelection.getRangeAt(0);

        // Calculate DOCUMENT-ABSOLUTE offsets using the entire text layer
        const startOffset = getTextOffsetInDocument(
          range.startContainer,
          range.startOffset,
        );
        const endOffset = getTextOffsetInDocument(
          range.endContainer,
          range.endOffset,
        );

        console.log(
          `🔍 THREATS: Document offsets - start: ${startOffset}, end: ${endOffset}`,
        );

        const id = `threat-${Date.now()}-${threatNumber}`;
        const timestamp = new Date().toISOString();

        // Determine threat severity and color
        const severity = determineThreatSeverity(explanation);
        const color = getThreatColor();

        const highlight: Highlight = {
          id,
          text: threatText,
          position: {
            startOffset,
            endOffset,
            pageNumber,
            startPageOffset: startOffset, // Use document offset for consistency
            endPageOffset: endOffset,
          },
          color,
          metadata: {
            id,
            text: threatText,
            note: explanation,
            tags: ["threat", "security", severity],
            createdAt: timestamp,
            author: "threat-analyzer",
          },
          isActive: false,
          isTemporary: false,
        };

        console.log(
          `✅ THREATS: Created highlight for "${threatText}" with severity ${severity}`,
        );
        return highlight;
      } else {
        console.log(
          `⚠️ THREATS: Could not locate threat text "${threatText}" on page ${pageNumber} using word-by-word selection`,
        );
        return null;
      }
    } catch (error) {
      console.log(
        `🔍 THREATS: Error creating highlight for "${threatText}":`,
        error,
      );
      return null;
    }
  };

  /**
   * Calculate text offset within the entire document (document-absolute)
   */
  const getTextOffsetInDocument = (
    targetNode: Node,
    targetOffset: number,
  ): number => {
    if (!textLayerRef.current) return 0;

    const walker = document.createTreeWalker(
      textLayerRef.current, // Walk through entire text layer, not just the page
      NodeFilter.SHOW_TEXT,
      null,
    );

    let totalOffset = 0;
    let node;

    while ((node = walker.nextNode())) {
      if (node === targetNode) {
        return totalOffset + targetOffset;
      }
      totalOffset += node.textContent?.length || 0;
    }

    return totalOffset;
  };

  /**
   * Convert page-relative offset to document-absolute offset
   */
  const convertToDocumentOffset = (
    pageNumber: number,
    pageRelativeOffset: number,
  ): number => {
    if (!textLayerRef.current) return pageRelativeOffset;

    let documentOffset = 0;

    // Add text from all previous pages
    for (let pageNum = 1; pageNum < pageNumber; pageNum++) {
      const pageElement = textLayerRef.current.querySelector(
        `[data-page-number="${pageNum}"]`,
      );
      if (pageElement) {
        const pageText = pageElement.textContent || "";
        documentOffset += pageText.length;
      }
    }

    // Add the page-relative offset
    documentOffset += pageRelativeOffset;

    return documentOffset;
  };

  /**
   * Determines threat severity based on explanation text
   */
  const determineThreatSeverity = (explanation: string): string => {
    const lowerExplanation = explanation.toLowerCase();

    if (
      lowerExplanation.includes("critical") ||
      lowerExplanation.includes("severe") ||
      lowerExplanation.includes("dangerous") ||
      lowerExplanation.includes("malicious")
    ) {
      return "critical";
    } else if (
      lowerExplanation.includes("high") ||
      lowerExplanation.includes("serious") ||
      lowerExplanation.includes("vulnerability") ||
      lowerExplanation.includes("injection")
    ) {
      return "high";
    } else if (
      lowerExplanation.includes("medium") ||
      lowerExplanation.includes("moderate") ||
      lowerExplanation.includes("suspicious") ||
      lowerExplanation.includes("potential")
    ) {
      return "medium";
    } else {
      return "low";
    }
  };

  /**
   * Gets the appropriate color for threat severity - all threats use red
   */
  const getThreatColor = (): HighlightColor => {
    // All threats use the same red color regardless of severity
    return THREAT_COLORS[0];
  };

  /**
   * Main threat analysis function
   */
  const handleAnalyzePdf = async () => {
    console.log("🔍 THREATS: Starting PDF threat analysis");

    if (!documentId || documentId === "test") {
      console.log("🔍 THREATS: No document ID available for analysis");
      return;
    }

    if (!numPages || numPages === 0) {
      console.log("🔍 THREATS: No pages available for analysis");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress({ current: 0, total: numPages });

    try {
      // Step 1: Extract text from all pages
      console.log("🔍 THREATS: Step 1 - Extracting text from all pages");
      const pagesContent = extractAllPagesText();

      if (pagesContent.length === 0) {
        console.log("🔍 THREATS: No text content found in PDF");
        setIsAnalyzing(false);
        return;
      }

      // Step 2: Send to backend for analysis
      console.log(
        "🔍 THREATS: Step 2 - Sending content to backend for analysis",
      );
      console.log("🚀 THREATS: EXACT DATA being sent to backend:");
      console.log(JSON.stringify({ documentId, pagesContent }, null, 2));

      const response = await ApiClient.post("/threats", {
        documentId,
        pagesContent,
      });

      if (!response.data.success || !response.data.data?.threats) {
        throw new Error("Invalid response from backend");
      }

      const threats = response.data.data.threats;
      console.log("🔍 THREATS: Backend analysis result:", threats);

      // Step 3: Update state with new threats
      setBackendThreats(threats);
      setThreatsExist(true);

      // Convert to highlight format for display
      const highlights = threats.map((threat: any) =>
        convertBackendThreatToHighlight(threat),
      );
      setThreatHighlights(highlights);

      // Also add to PDFProvider's stored threats for highlighting in PDF
      setStoredThreats(highlights);

      console.log(
        `✅ THREATS: Analysis complete - Found ${threats.length} threats`,
      );
    } catch (error) {
      console.error("❌ THREATS: Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress({ current: 0, total: 0 });
    }
  };

  /**
   * Handles downloading threats as PDF
   */
  const handleDownloadThreats = async () => {
    console.log("📄 Starting threats PDF download...");

    if (threatHighlights.length === 0) {
      console.log("⚠️ No threats to download");
      return;
    }

    setIsDownloading(true);

    try {
      // Extract document name from PDF URL or use default
      const documentName = pdfUrl
        ? pdfUrl.split("/").pop()?.replace(".pdf", "") || "Document"
        : "Document";

      generateThreatsPDF(threatHighlights, documentName);
      console.log("✅ Threats PDF downloaded successfully");
    } catch (error) {
      console.error("❌ Error downloading threats PDF:", error);
      // You could add a toast notification here if available
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Gets the appropriate icon for threat severity
   */
  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case "critical":
        return <ShieldAlertIcon className="h-4 w-4 text-red-600" />;
      case "high":
        return <AlertTriangleIcon className="h-4 w-4 text-orange-600" />;
      case "medium":
        return <AlertCircleIcon className="h-4 w-4 text-yellow-600" />;
      case "low":
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
      case "critical":
        return "border-red-600 bg-red-50 text-red-800";
      case "high":
        return "border-orange-600 bg-orange-50 text-orange-800";
      case "medium":
        return "border-yellow-600 bg-yellow-50 text-yellow-800";
      case "low":
        return "border-blue-600 bg-blue-50 text-blue-800";
      default:
        return "border-orange-600 bg-orange-50 text-orange-800";
    }
  };

  // ========================================
  // RENDER HELPERS
  // ========================================

  /**
   * Renders the search and control section
   */
  const renderControlSection = () => (
    <div className="flex shrink-0 flex-col gap-4 p-4">
      <div className="relative">
        <SearchIcon className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
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
        {["critical", "high", "medium", "low"].map((severity) => (
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

      {/* Only show analyze button if threats don't exist yet */}
      {!threatsExist && !isLoading && (
        <Button
          onClick={handleAnalyzePdf}
          disabled={
            isAnalyzing || !numPages || !documentId || documentId === "test"
          }
          className="w-full"
        >
          {isAnalyzing ? (
            <div className="flex items-center gap-2">
              <ScanIcon className="h-4 w-4 animate-spin" />
              {analysisProgress.total > 0
                ? `Analyzing... (${analysisProgress.current}/${analysisProgress.total})`
                : "Analyzing..."}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ScanIcon className="h-4 w-4" />
              Detect Threats
            </div>
          )}
        </Button>
      )}

      {/* Show loading state */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-4">
          <ScanIcon className="h-4 w-4 animate-spin" />
          Loading threats...
        </div>
      )}

      {/* Show download button only if threats exist */}
      {threatsExist && threatHighlights.length > 0 && (
        <Button
          onClick={handleDownloadThreats}
          disabled={isDownloading}
          variant="outline"
          className="w-full"
        >
          {isDownloading ? (
            <div className="flex items-center gap-2">
              <DownloadIcon className="h-4 w-4 animate-spin" />
              Generating PDF...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <DownloadIcon className="h-4 w-4" />
              Download Threats ({threatHighlights.length})
            </div>
          )}
        </Button>
      )}

      {isAnalyzing && analysisProgress.total > 0 && (
        <div className="bg-muted h-2 w-full rounded-full">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(analysisProgress.current / analysisProgress.total) * 100}%`,
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

    const severityCounts = threatHighlights.reduce(
      (acc, highlight) => {
        const severity =
          highlight.metadata.tags?.find((tag) =>
            ["critical", "high", "medium", "low"].includes(tag.toLowerCase()),
          ) || "high";
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return (
      <div className="px-4 pb-4">
        <div className="mb-2 text-sm font-medium">Threat Summary</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-red-600"></div>
            Critical: {severityCounts.critical || 0}
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-orange-600"></div>
            High: {severityCounts.high || 0}
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-yellow-600"></div>
            Medium: {severityCounts.medium || 0}
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-blue-600"></div>
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
    <div className="flex h-full w-full max-w-sm flex-col">
      {/* Control Section */}
      {renderControlSection()}

      {/* Summary Section */}
      {renderSummary()}

      {/* Threats List */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        <div className="space-y-3">
          {isAnalyzing && (
            <div className="text-muted-foreground py-8 text-center">
              <div className="border-primary mx-auto mb-2 h-8 w-8 animate-spin border-b-2"></div>
              <p>Analyzing PDF for security threats...</p>
              {analysisProgress.total > 0 && (
                <p className="mt-1 text-xs">
                  Processing {analysisProgress.current} of{" "}
                  {analysisProgress.total} threats
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
                  <div className="text-muted-foreground text-sm font-medium">
                    Page {pageNum} ({pageThreats.length} threat
                    {pageThreats.length !== 1 ? "s" : ""})
                  </div>

                  {pageThreats.map((threat) => {
                    const severity =
                      threat.metadata.tags?.find((tag) =>
                        ["critical", "high", "medium", "low"].includes(
                          tag.toLowerCase(),
                        ),
                      ) || "high";

                    return (
                      <motion.div
                        key={threat.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "hover:bg-muted/50 cursor-pointer space-y-2 rounded-lg border p-3 transition-colors",
                          getSeverityColor(severity),
                        )}
                        onClick={() => jumpToHighlight(threat)}
                      >
                        {/* Threat Header */}
                        <div className="flex items-start gap-2">
                          {getSeverityIcon(severity)}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">
                              &quot;{threat.text}&quot;
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs capitalize",
                                  getSeverityColor(severity),
                                )}
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
                          <div className="text-muted-foreground text-xs leading-relaxed">
                            {threat.metadata.note}
                          </div>
                        )}

                        {/* Threat Tags */}
                        {threat.metadata.tags &&
                          threat.metadata.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {threat.metadata.tags
                                .filter(
                                  (tag) =>
                                    ![
                                      "critical",
                                      "high",
                                      "medium",
                                      "low",
                                    ].includes(tag.toLowerCase()),
                                )
                                .map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                            </div>
                          )}

                        {/* Metadata */}
                        <div className="text-muted-foreground text-xs">
                          Created:{" "}
                          {new Date(threat.metadata.createdAt).toLocaleString()}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Empty State */}
          {!isAnalyzing && !isLoading && filteredThreats.length === 0 && (
            <div className="text-muted-foreground py-8 text-center">
              {!threatsExist ? (
                <div>
                  <ShieldAlertIcon className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>No threat analysis yet</p>
                  <p className="text-xs">
                    {documentId && documentId !== "test"
                      ? 'Click "Detect Threats" to scan for security threats'
                      : "Threat analysis not available for test documents"}
                  </p>
                </div>
              ) : searchQuery || selectedSeverity ? (
                "No threats match your filters"
              ) : (
                <div>
                  <ShieldAlertIcon className="mx-auto mb-2 h-12 w-12 text-green-500" />
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
