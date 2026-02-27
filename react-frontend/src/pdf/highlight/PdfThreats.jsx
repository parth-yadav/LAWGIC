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
import { THREAT_COLORS } from "./types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { usePDF } from "../PdfProvider";
import { generateThreatsPDF } from "@/utils/pdfThreatGenerator";

export default function PdfThreats() {
  const {
    pdfUrl,
    documentId,
    numPages,
    textLayerRef,
    pagesRefs,
    jumpToHighlight,
    setStoredThreats,
    addThreatToStorage,
    threats,
    isAnalyzing,
    generateThreatsAnalysis,
  } = usePDF();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 });
  const [isDownloading, setIsDownloading] = useState(false);
  const [backendThreats, setBackendThreats] = useState([]);
  const [threatHighlights, setThreatHighlights] = useState([]);
  const [threatsExist, setThreatsExist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sync provider threats data with local state
  useEffect(() => {
    if (threats && threats.totalThreats > 0) {
      setThreatsExist(true);
      setIsLoading(false);
      const threatList = threats.pages.flatMap((page, pageIndex) => {
        const actualPageNumber = page.page || (pageIndex + 1);
        return page.threats.map((threat) => ({
          ...threat,
          page: threat.page && threat.page > 0 ? threat.page : actualPageNumber,
        }));
      });
      setBackendThreats(threatList);
      const pagesReady = pagesRefs?.current?.size > 0 && textLayerRef?.current;
      if (!pagesReady) {
        setTimeout(() => {
          const retryHighlights = threatList.map((threat) => convertBackendThreatToHighlight(threat));
          setThreatHighlights(retryHighlights);
          setStoredThreats(retryHighlights);
        }, 1000);
        return;
      }
      const highlights = threatList.map((threat) => convertBackendThreatToHighlight(threat));
      setThreatHighlights(highlights);
      setStoredThreats(highlights);
    } else {
      setThreatsExist(false);
      setIsLoading(false);
      setBackendThreats([]);
      setThreatHighlights([]);
      setStoredThreats([]);
    }
  }, [threats]);

  // Calculate positions for threats that need it
  useEffect(() => {
    const calculateMissingPositions = async () => {
      if (!textLayerRef.current || threatHighlights.length === 0) return;
      const threatsNeedingPosition = threatHighlights.filter((h) => h.metadata.needsPositionCalculation);
      if (threatsNeedingPosition.length === 0) return;
      for (const highlight of threatsNeedingPosition) {
        try {
          const calculatedHighlight = await calculateThreatPosition(highlight);
          if (calculatedHighlight && !calculatedHighlight.metadata.needsPositionCalculation) {
            setThreatHighlights((prev) => prev.map((h) => (h.id === highlight.id ? calculatedHighlight : h)));
            setStoredThreats((prev) => {
              const existingIndex = prev.findIndex((t) => t.id === highlight.id);
              if (existingIndex !== -1) {
                const updated = [...prev];
                updated[existingIndex] = calculatedHighlight;
                return updated;
              }
              return [...prev, calculatedHighlight];
            });
          }
        } catch (error) {
          console.error(`Error calculating position for threat ${highlight.id}:`, error);
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    };
    const needsCalculation = threatHighlights.some((h) => h.metadata.needsPositionCalculation);
    if (needsCalculation && textLayerRef.current) {
      const timeoutId = setTimeout(calculateMissingPositions, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [threatHighlights]);

  const convertBackendThreatToHighlight = (threat) => {
    const pageNumber = threat.page || 1;
    let calculatedPosition = {
      startOffset: 0,
      endOffset: 0,
      pageNumber,
      startPageOffset: 0,
      endPageOffset: 0,
    };
    if (threat.position && typeof threat.position === "object" && threat.position.startOffset !== undefined) {
      calculatedPosition = {
        startOffset: Number(threat.position.startOffset) || 0,
        endOffset: Number(threat.position.endOffset) || 0,
        pageNumber: Number(threat.position.pageNumber) || Number(threat.page) || 1,
        startPageOffset: Number(threat.position.startPageOffset) || 0,
        endPageOffset: Number(threat.position.endPageOffset) || 0,
      };
    }
    return {
      id: threat.id,
      text: threat.exactStringThreat || threat.text || "",
      position: calculatedPosition,
      color: getLocalThreatColor(),
      metadata: {
        id: threat.id,
        text: threat.exactStringThreat || threat.text || "",
        note: threat.explanation,
        tags: ["threat", "security", threat.severity?.toLowerCase() || "high"],
        createdAt: new Date().toISOString(),
        author: "threat-analyzer",
        needsPositionCalculation: !threat.position || threat.position.startOffset === undefined,
      },
      isActive: false,
      isTemporary: false,
    };
  };

  const calculateThreatPosition = async (highlight) => {
    if (!textLayerRef.current) return highlight;
    const pageNumber = highlight.position.pageNumber;
    const threatText = highlight.text;
    if (!pageNumber || pageNumber < 1) return highlight;
    const pageElement = pagesRefs?.current?.get(pageNumber);
    if (!pageElement) {
      if (!textLayerRef?.current) return highlight;
      const allPages = textLayerRef.current.querySelectorAll(".react-pdf__Page");
      const targetPage = Array.from(allPages)[pageNumber - 1];
      if (!targetPage) return highlight;
      return await calculatePositionFromPageElement(targetPage, highlight, threatText);
    }
    return await calculatePositionFromPageElement(pageElement, highlight, threatText);
  };

  const calculatePositionFromPageElement = async (pageElement, highlight, threatText) => {
    const textLayer = pageElement.querySelector(".react-pdf__Page__textContent");
    if (!textLayer) return highlight;
    let success = selectTextWordByWord(textLayer, threatText);
    if (!success) success = selectTextDirectly(textLayer, threatText);
    if (!success && threatText.length > 20) {
      success = selectTextDirectly(textLayer, threatText.substring(0, 30).trim());
    }
    if (success) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const pageStartOffset = getTextOffsetInPage(textLayer, range.startContainer, range.startOffset);
        const pageEndOffset = getTextOffsetInPage(textLayer, range.endContainer, range.endOffset);
        const documentStartOffset = convertPageOffsetToDocumentOffset(highlight.position.pageNumber, pageStartOffset);
        const documentEndOffset = convertPageOffsetToDocumentOffset(highlight.position.pageNumber, pageEndOffset);
        sel.removeAllRanges();
        return {
          ...highlight,
          position: {
            pageNumber: highlight.position.pageNumber,
            startOffset: documentStartOffset,
            endOffset: documentEndOffset,
            startPageOffset: pageStartOffset,
            endPageOffset: pageEndOffset,
          },
          metadata: { ...highlight.metadata, needsPositionCalculation: false },
        };
      }
    }
    const fuzzyResult = await tryFuzzyTextMatch(textLayer, threatText, highlight);
    if (fuzzyResult) return fuzzyResult;
    return highlight;
  };

  const tryFuzzyTextMatch = async (textLayer, threatText, highlight) => {
    try {
      const pageText = textLayer.textContent || "";
      const normalizedPageText = pageText.toLowerCase().replace(/\s+/g, " ").trim();
      const normalizedThreatText = threatText.toLowerCase().replace(/\s+/g, " ").trim();
      const index = normalizedPageText.indexOf(normalizedThreatText);
      if (index !== -1) {
        const docStart = convertPageOffsetToDocumentOffset(highlight.position.pageNumber, index);
        const docEnd = convertPageOffsetToDocumentOffset(highlight.position.pageNumber, index + threatText.length);
        return {
          ...highlight,
          position: { pageNumber: highlight.position.pageNumber, startOffset: docStart, endOffset: docEnd, startPageOffset: index, endPageOffset: index + threatText.length },
          metadata: { ...highlight.metadata, needsPositionCalculation: false, matchType: "fuzzy" },
        };
      }
    } catch (error) {
      console.error("Error in fuzzy text matching:", error);
    }
    return null;
  };

  const selectTextDirectly = (root, searchText) => {
    if (!root) return false;
    const fullText = root.textContent || "";
    const normalizedFullText = fullText.replace(/\s+/g, " ").trim().toLowerCase();
    const normalizedSearchText = searchText.replace(/\s+/g, " ").trim().toLowerCase();
    const position = normalizedFullText.indexOf(normalizedSearchText);
    if (position === -1) return false;
    return selectTextByPosition(root, searchText, position);
  };

  const selectTextByPosition = (root, targetText, approximatePosition) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let currentPosition = 0;
    let foundNode = null;
    let nodeStartPosition = 0;
    let node;
    while ((node = walker.nextNode())) {
      const nodeText = node.textContent || "";
      const nodeEndPosition = currentPosition + nodeText.length;
      if (approximatePosition >= currentPosition && approximatePosition < nodeEndPosition) {
        foundNode = node;
        nodeStartPosition = currentPosition;
        break;
      }
      currentPosition = nodeEndPosition;
    }
    if (!foundNode) return false;
    const range = document.createRange();
    const nodeOffset = approximatePosition - nodeStartPosition;
    try {
      range.setStart(foundNode, Math.max(0, nodeOffset));
      range.setEnd(foundNode, Math.min(foundNode.textContent?.length || 0, nodeOffset + targetText.length));
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
        return true;
      }
    } catch (error) {
      // ignore
    }
    return false;
  };

  const selectTextWordByWord = (root, searchText) => {
    if (!root) return false;
    const words = searchText.split(/(\s+)/);
    if (words.length === 0) return false;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let n;
    while ((n = walker.nextNode())) {
      if (n.textContent && n.textContent.trim()) textNodes.push(n);
    }
    if (textNodes.length === 0) return false;
    let fullText = "";
    const nodeRanges = [];
    for (const nd of textNodes) {
      nodeRanges.push({ node: nd, start: fullText.length, end: fullText.length + (nd.textContent?.length ?? 0) });
      fullText += nd.textContent ?? "";
    }
    const firstWord = words[0].trim();
    const startPositions = [];
    let searchFrom = 0;
    while (true) {
      const pos = fullText.toLowerCase().indexOf(firstWord.toLowerCase(), searchFrom);
      if (pos === -1) break;
      startPositions.push(pos);
      searchFrom = pos + 1;
    }
    for (const startPos of startPositions) {
      const matchResult = findWordsFromPosition(fullText, words, startPos);
      if (matchResult) {
        const startNodeInfo = getNodeFromPosition(nodeRanges, matchResult.start);
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

  const findWordsFromPosition = (fullText, words, startPos) => {
    let currentPos = startPos;
    const textLower = fullText.toLowerCase();
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (word.trim() === "") {
        while (currentPos < fullText.length && /\s/.test(fullText[currentPos])) currentPos++;
        continue;
      }
      const foundAt = textLower.indexOf(word.toLowerCase(), currentPos);
      if (foundAt === -1) return null;
      if (foundAt - currentPos > 50) return null;
      currentPos = foundAt + word.length;
    }
    return { start: startPos, end: currentPos };
  };

  const getNodeFromPosition = (nodeRanges, position) => {
    for (const { node, start, end } of nodeRanges) {
      if (position >= start && position <= end) return { node, offset: position - start };
    }
    return null;
  };

  const getTextOffsetInPage = (pageTextLayer, targetNode, targetOffset) => {
    let textOffset = 0;
    const walker = document.createTreeWalker(pageTextLayer, NodeFilter.SHOW_TEXT, null);
    let currentNode;
    while ((currentNode = walker.nextNode())) {
      if (currentNode === targetNode) return textOffset + targetOffset;
      textOffset += currentNode.textContent?.length || 0;
    }
    return textOffset;
  };

  const convertPageOffsetToDocumentOffset = (pageNumber, pageRelativeOffset) => {
    if (!textLayerRef?.current) return pageRelativeOffset;
    let documentOffset = 0;
    for (let pageNum = 1; pageNum < pageNumber; pageNum++) {
      const pageElement = textLayerRef.current.querySelector(`[data-page-number="${pageNum}"] .react-pdf__Page__textContent`);
      if (pageElement) documentOffset += (pageElement.textContent || "").length;
    }
    return documentOffset + pageRelativeOffset;
  };

  const getLocalThreatColor = () => THREAT_COLORS[0];

  const filteredThreats = threatHighlights.filter((highlight) => {
    const matchesSearch =
      highlight.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      highlight.metadata.note?.toLowerCase().includes(searchQuery.toLowerCase());
    const severity = highlight.metadata.tags?.find((tag) => ["critical", "high", "medium", "low"].includes(tag.toLowerCase()));
    const matchesSeverity = !selectedSeverity || severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  });

  const threatsByPage = filteredThreats.reduce((acc, threat) => {
    const pageNum = threat.position.pageNumber;
    if (!acc[pageNum]) acc[pageNum] = [];
    acc[pageNum].push(threat);
    return acc;
  }, {});

  const handleAnalyzePdf = async () => {
    if (!documentId || documentId === "test" || !numPages) return;
    await generateThreatsAnalysis();
  };

  const handleDownloadThreats = async () => {
    if (threatHighlights.length === 0) return;
    setIsDownloading(true);
    try {
      const documentName = pdfUrl ? pdfUrl.split("/").pop()?.replace(".pdf", "") || "Document" : "Document";
      generateThreatsPDF(threatHighlights, documentName);
    } catch (error) {
      console.error("Error downloading threats PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "critical": return <ShieldAlertIcon className="h-4 w-4 text-red-600" />;
      case "high": return <AlertTriangleIcon className="h-4 w-4 text-orange-600" />;
      case "medium": return <AlertCircleIcon className="h-4 w-4 text-yellow-600" />;
      case "low": return <InfoIcon className="h-4 w-4 text-blue-600" />;
      default: return <AlertTriangleIcon className="h-4 w-4 text-orange-600" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical": return "border-red-600 bg-red-50 text-red-800";
      case "high": return "border-orange-600 bg-orange-50 text-orange-800";
      case "medium": return "border-yellow-600 bg-yellow-50 text-yellow-800";
      case "low": return "border-blue-600 bg-blue-50 text-blue-800";
      default: return "border-orange-600 bg-orange-50 text-orange-800";
    }
  };

  const renderControlSection = () => (
    <div className="flex shrink-0 flex-col gap-4 p-4">
      <div className="relative">
        <SearchIcon className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
        <Input placeholder="Search threats..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant={selectedSeverity === null ? "default" : "outline"} size="sm" onClick={() => setSelectedSeverity(null)}>All</Button>
        {["critical", "high", "medium", "low"].map((severity) => (
          <Button key={severity} variant={selectedSeverity === severity ? "default" : "outline"} size="sm" onClick={() => setSelectedSeverity(severity)} className="capitalize">
            {severity}
          </Button>
        ))}
      </div>
      {!threatsExist && !isLoading && (
        <Button onClick={handleAnalyzePdf} disabled={isAnalyzing || !numPages || !documentId || documentId === "test"} className="w-full">
          {isAnalyzing ? (
            <div className="flex items-center gap-2">
              <ScanIcon className="h-4 w-4 animate-spin" />
              {analysisProgress.total > 0 ? `Analyzing... (${analysisProgress.current}/${analysisProgress.total})` : "Analyzing..."}
            </div>
          ) : (
            <div className="flex items-center gap-2"><ScanIcon className="h-4 w-4" /> Detect Threats</div>
          )}
        </Button>
      )}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-4">
          <ScanIcon className="h-4 w-4 animate-spin" /> Loading threats...
        </div>
      )}
      {threatsExist && threatHighlights.length > 0 && (
        <Button onClick={handleDownloadThreats} disabled={isDownloading} variant="outline" className="w-full">
          {isDownloading ? (
            <div className="flex items-center gap-2"><DownloadIcon className="h-4 w-4 animate-spin" /> Generating PDF...</div>
          ) : (
            <div className="flex items-center gap-2"><DownloadIcon className="h-4 w-4" /> Download Threats ({threatHighlights.length})</div>
          )}
        </Button>
      )}
      {isAnalyzing && analysisProgress.total > 0 && (
        <div className="bg-muted h-2 w-full rounded-full">
          <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${(analysisProgress.current / analysisProgress.total) * 100}%` }} />
        </div>
      )}
    </div>
  );

  const renderSummary = () => {
    if (threatHighlights.length === 0) return null;
    const severityCounts = threatHighlights.reduce((acc, highlight) => {
      const severity = highlight.metadata.tags?.find((tag) => ["critical", "high", "medium", "low"].includes(tag.toLowerCase())) || "high";
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});
    return (
      <div className="px-4 pb-4">
        <div className="mb-2 text-sm font-medium">Threat Summary</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-red-600"></div>Critical: {severityCounts.critical || 0}</div>
          <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-orange-600"></div>High: {severityCounts.high || 0}</div>
          <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-yellow-600"></div>Medium: {severityCounts.medium || 0}</div>
          <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-blue-600"></div>Low: {severityCounts.low || 0}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full w-full max-w-sm flex-col">
      {renderControlSection()}
      {renderSummary()}
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        <div className="space-y-3">
          {isAnalyzing && (
            <div className="text-muted-foreground py-8 text-center">
              <div className="border-primary mx-auto mb-2 h-8 w-8 animate-spin border-b-2"></div>
              <p>Analyzing PDF for security threats...</p>
              {analysisProgress.total > 0 && (
                <p className="mt-1 text-xs">Processing {analysisProgress.current} of {analysisProgress.total} threats</p>
              )}
            </div>
          )}
          {!isAnalyzing && threatHighlights.length > 0 && (
            <AnimatePresence>
              {Object.entries(threatsByPage).map(([pageNum, pageThreats]) => (
                <motion.div key={pageNum} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-2">
                  <div className="text-muted-foreground text-sm font-medium">
                    Page {pageNum} ({pageThreats.length} threat{pageThreats.length !== 1 ? "s" : ""})
                  </div>
                  {pageThreats.map((threat) => {
                    const severity = threat.metadata.tags?.find((tag) => ["critical", "high", "medium", "low"].includes(tag.toLowerCase())) || "high";
                    return (
                      <motion.div
                        key={threat.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn("hover:bg-muted/50 cursor-pointer space-y-2 rounded-lg border p-3 transition-colors", getSeverityColor(severity))}
                        onClick={() => jumpToHighlight(threat)}
                      >
                        <div className="flex items-start gap-2">
                          {getSeverityIcon(severity)}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">&quot;{threat.text}&quot;</div>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="outline" className={cn("text-xs capitalize", getSeverityColor(severity))}>{severity}</Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="Jump to threat" onClick={(e) => { e.stopPropagation(); jumpToHighlight(threat); }}>
                            <EyeIcon className="h-3 w-3" />
                          </Button>
                        </div>
                        {threat.metadata.note && (
                          <div className="text-muted-foreground text-xs leading-relaxed">{threat.metadata.note}</div>
                        )}
                        {threat.metadata.tags && threat.metadata.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {threat.metadata.tags
                              .filter((tag) => !["critical", "high", "medium", "low"].includes(tag.toLowerCase()))
                              .map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                              ))}
                          </div>
                        )}
                        <div className="text-muted-foreground text-xs">
                          Created: {new Date(threat.metadata.createdAt).toLocaleString()}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
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
