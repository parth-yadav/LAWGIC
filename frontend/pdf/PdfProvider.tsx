"use client";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { LoaderCircleIcon } from "lucide-react";
import useLocalState from "@/hooks/useLocalState";
import ApiClient from "@/utils/ApiClient";
import {
  Highlight,
  Threat,
  ThreatAnalysisResult,
  getThreatColor,
} from "./highlight/types";
import { StoredExplanation } from "./explanation/types";
import {
  applyHighlights,
  debounce,
  removeHighlight,
  validateHighlight,
} from "./highlight/utils";

type PDFContextType = {
  pdfUrl: string;
  documentId?: string;
  numPages: number | null;
  setNumPages: React.Dispatch<React.SetStateAction<number | null>>;
  pageNumber: number;
  setPageNumber: React.Dispatch<React.SetStateAction<number>>;
  pdfWidth: number;
  setPdfWidth: React.Dispatch<React.SetStateAction<number>>;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  rotation: number;
  setRotation: React.Dispatch<React.SetStateAction<number>>;
  textLayerRef: React.RefObject<HTMLDivElement | null>;
  pagesRefs: React.RefObject<Map<number, HTMLDivElement>>;
  pageInputValue: string;
  setPageInputValue: React.Dispatch<React.SetStateAction<string>>;
  zoomInputValue: string;
  setZoomInputValue: React.Dispatch<React.SetStateAction<string>>;
  isScrolling: boolean;
  isContentVisible: boolean;
  setIsContentVisible: React.Dispatch<React.SetStateAction<boolean>>;
  currentContent: "highlights" | "explanations" | "threats" | null;
  setCurrentContent: React.Dispatch<
    React.SetStateAction<"highlights" | "explanations" | "threats" | null>
  >;
  toggleHighlightsTab: () => void;
  toggleExplanationsTab: () => void;
  toggleThreatsTab: () => void;
  toolbarPosition: "top" | "bottom";
  setToolbarPosition: React.Dispatch<React.SetStateAction<"top" | "bottom">>;
  toolbarView: "floating" | "fixed";
  setToolbarView: React.Dispatch<React.SetStateAction<"floating" | "fixed">>;
  onLoadSuccess: ({ numPages }: { numPages: number }) => void;
  goToPrevPage: () => void;
  goToNextPage: () => void;
  scrollToPage: (pageNum: number, instant?: boolean) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoomToFit: () => void;
  resetZoom: () => void;
  rotateClockwise: () => void;
  handlePageInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePageInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handlePageInputBlur: () => void;
  handlePageInputFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleZoomInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleZoomInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleZoomInputBlur: () => void;
  handleZoomInputFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  validateAndNavigateToPage: (value: string) => boolean;
  validateAndSetZoom: (value: string) => boolean;
  onSelection: (args: { selectedText: string; currentPage: number }) => void;
  closeContentTab: () => void;

  highlights: Highlight[];
  setHighlights: React.Dispatch<React.SetStateAction<Highlight[]>>;
  removeHighlightById: (highlightId: string) => void;
  clearAllHighlights: () => void;
  updateHighlightById: (
    highlightId: string,
    newData: Partial<Highlight>,
  ) => void;
  jumpToHighlight: (highlight: Highlight) => void;
  applyHighlightsToTextLayer: () => void;

  storedExplanations: StoredExplanation[];
  setStoredExplanations: React.Dispatch<
    React.SetStateAction<StoredExplanation[]>
  >;
  removeExplanationById: (explanationId: string) => void;
  clearAllExplanations: () => void;
  jumpToExplanation: (explanation: StoredExplanation) => void;

  // Stored threats from localStorage
  storedThreats: Highlight[];
  setStoredThreats: React.Dispatch<React.SetStateAction<Highlight[]>>;
  removeThreatById: (threatId: string) => void;
  clearAllThreats: () => void;
  addThreatToStorage: (threat: Highlight) => void;

  // Threat detection state and functions
  threats: ThreatAnalysisResult | null;
  setThreats: React.Dispatch<React.SetStateAction<ThreatAnalysisResult | null>>;
  isAnalyzing: boolean;
  setIsAnalyzing: React.Dispatch<React.SetStateAction<boolean>>;
  analyzePdfForThreats: (file: File) => Promise<void>;
  generateThreatsAnalysis: () => Promise<void>;
  jumpToThreat: (threat: Threat, pageNumber: number) => void;

  highlightContextMenu: {
    highlight: Highlight;
    x: number;
    y: number;
    showColorPicker: boolean;
    editingNote: boolean;
    noteText: string;
  } | null;
  setHighlightContextMenu: React.Dispatch<
    React.SetStateAction<{
      highlight: Highlight;
      x: number;
      y: number;
      showColorPicker: boolean;
      editingNote: boolean;
      noteText: string;
    } | null>
  >;
};
const PDFContext = createContext<PDFContextType | undefined>(undefined);

export const PDFProvider = ({
  pdfUrl,
  documentId,
  children,
}: {
  pdfUrl: string;
  documentId?: string;
  children: ReactNode;
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfWidth, setPdfWidth] = useState<number>(600);
  const [loading, setLoading] = useState<boolean>(true);
  const [pageInputValue, setPageInputValue] = useState<string>("1");
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [zoomInputValue, setZoomInputValue] = useState<string>("100%");
  const [rotation, setRotation] = useState<number>(0);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [isContentVisible, setIsContentVisible] = useState<boolean>(false);
  const [currentContent, setCurrentContent] = useState<
    "highlights" | "explanations" | "threats" | null
  >(null);
  const [toolbarPosition, setToolbarPosition] = useLocalState<"top" | "bottom">(
    "pdf-toolbar-position",
    "bottom",
  );
  const [toolbarView, setToolbarView] = useLocalState<"floating" | "fixed">(
    "pdf-toolbar-view",
    "fixed",
  );
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [storedExplanations, setStoredExplanations] = useState<
    StoredExplanation[]
  >([]);
  const [storedThreats, setStoredThreats] = useState<Highlight[]>([]);
  const [threats, setThreats] = useState<ThreatAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [highlightContextMenu, setHighlightContextMenu] = useState<{
    highlight: Highlight;
    x: number;
    y: number;
    showColorPicker: boolean;
    editingNote: boolean;
    noteText: string;
  } | null>(null);

  const textLayerRef = useRef<HTMLDivElement>(null);
  const pagesRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updatePdfWidth = () => {
      setPdfWidth(Math.min(800, window.innerWidth - 100));
    };

    updatePdfWidth();
    window.addEventListener("resize", updatePdfWidth);
    return () => window.removeEventListener("resize", updatePdfWidth);
  }, []);

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Load existing explanations from backend when document is available
  useEffect(() => {
    const loadExistingExplanations = async () => {
      if (!documentId) return;

      // Create new AbortController for this request
      const controller = new AbortController();

      try {
        const response = await ApiClient.get(
          `/explanations?docId=${documentId}`,
          { signal: controller.signal },
        );
        if (response.data.success && response.data.data) {
          // Convert backend explanations to frontend format
          const explanations = response.data.data.map((explanation: any) => ({
            id: explanation.id,
            selectedText: explanation.term,
            explanation: {
              term: explanation.term,
              meaning: explanation.meaning,
              page: explanation.page,
            },
            pageNumber: explanation.page,
            startOffset: explanation.startOffset,
            endOffset: explanation.endOffset,
            position: explanation.position,
            createdAt: explanation.createdAt,
          }));
          setStoredExplanations(explanations);
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.log("Failed to load existing explanations:", error);
        }
      }
    };

    loadExistingExplanations();
  }, [documentId]);

  // Load existing highlights from backend when document is available
  useEffect(() => {
    const loadExistingHighlights = async () => {
      if (!documentId) return;

      // Create new AbortController for this request
      const controller = new AbortController();

      try {
        const response = await ApiClient.get(
          `/highlights?documentId=${documentId}`,
          { signal: controller.signal },
        );
        if (response.data.success && response.data.data) {
          // Convert backend highlights to frontend format
          const backendHighlights = response.data.data.map(
            (highlight: any) => ({
              id: highlight.id,
              text: highlight.text,
              color: highlight.color,
              position: highlight.position,
              metadata: {
                note: highlight.note || "",
                tags: highlight.tags || [],
                explanation: highlight.explanation || "",
              },
            }),
          );
          setHighlights(backendHighlights);
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.log("Failed to load existing highlights:", error);
        }
      }
    };

    loadExistingHighlights();
  }, [documentId]);

  // Load existing threats from backend when document is available
  useEffect(() => {
    const loadExistingThreats = async () => {
      if (!documentId || documentId === "test") return;

      // Create new AbortController for this request
      const controller = new AbortController();

      try {
        console.log(
          "🔍 THREATS: Loading existing threats for document:",
          documentId,
        );
        const response = await ApiClient.get(`/threats?docId=${documentId}`, {
          signal: controller.signal,
        });

        if (response.data.success && response.data.data?.threats) {
          const threats = response.data.data.threats;
          console.log("✅ THREATS: Loaded existing threats:", threats);

          // Convert backend threats to highlight format for display
          const threatHighlights = threats.map((threat: any) => ({
            id: threat.id,
            text: threat.exactStringThreat || threat.text,
            page: threat.page, // ✅ CRITICAL: Include page number from backend
            color: getThreatColor(),
            position: threat.position,
            metadata: {
              note: threat.explanation || "",
              tags: [threat.severity || "medium"],
              explanation: threat.explanation || "",
              threatSeverity: threat.severity,
              threatType: "detected",
            },
          }));

          // Add to stored threats for highlighting in PDF
          setStoredThreats(threatHighlights);

          // Set threats analysis result for count display
          setThreats({
            pages: threats.map((threat: any) => ({
              pageNumber: threat.page || 1,
              threats: [threat],
            })),
            totalPages: numPages || 1,
            totalThreats: threats.length,
          });
        } else {
          console.log("📝 THREATS: No existing threats found");
          setStoredThreats([]);
          setThreats(null);
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.log("Failed to load existing threats:", error);
        }
      }
    };

    loadExistingThreats();
  }, [documentId,numPages]);

  // Intersection Observer to track visible pages
  useEffect(() => {
    if (!textLayerRef.current || !numPages) return;

    const containerElement = textLayerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible: number[] = [];
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(
              entry.target.getAttribute("data-page-number") || "0",
            );
            if (pageNum > 0) {
              visible.push(pageNum);
            }
          }
        });

        // Update current page to the first visible page, but only if not actively scrolling
        if (visible.length > 0 && !isScrolling) {
          const firstVisiblePage = Math.min(...visible);
          setPageNumber(firstVisiblePage);
        }
      },
      {
        root: containerElement,
        rootMargin: "-10% 0px -10% 0px", // Only consider pages that are significantly visible
        threshold: 0.3, // Page must be at least 30% visible
      },
    );

    // Observe all page elements
    pagesRefs.current.forEach((pageElement) => {
      observer.observe(pageElement);
    });

    return () => {
      observer.disconnect();
    };
  }, [numPages, isScrolling]);

  // Sync input value with page number when page changes programmatically
  useEffect(() => {
    setPageInputValue(pageNumber.toString());
  }, [pageNumber]);

  const scrollToPage = useCallback((pageNum: number, instant = false) => {
    const pageElement = pagesRefs.current.get(pageNum);
    if (pageElement && textLayerRef.current) {
      // Set scrolling state only for smooth scrolling (buttons)
      if (!instant) {
        console.log("Setting isScrolling to true");
        setIsScrolling(true);

        // Clear any existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        // Set timeout to detect when scrolling is finished
        scrollTimeoutRef.current = setTimeout(() => {
          console.log("Setting isScrolling to false");
          setIsScrolling(false);
        }, 800); // 800ms should be enough for smooth scroll to complete
      }

      pageElement.scrollIntoView({
        behavior: instant ? "instant" : "smooth",
        block: "start",
        inline: "nearest",
      });
      setPageNumber(pageNum);
    }
  }, []);

  const onLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    applyHighlightsToTextLayer();
  };

  const goToPrevPage = useCallback(() => {
    const newPage = Math.max(1, pageNumber - 1);
    scrollToPage(newPage, false); // smooth scrolling for buttons
  }, [pageNumber, scrollToPage]);

  const goToNextPage = useCallback(() => {
    const newPage = Math.min(numPages || 1, pageNumber + 1);
    scrollToPage(newPage, false); // smooth scrolling for buttons
  }, [pageNumber, numPages, scrollToPage]);

  // Chrome-like page input behavior
  const validateAndNavigateToPage = useCallback(
    (value: string) => {
      const pageNum = parseInt(value);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= (numPages || 1)) {
        scrollToPage(pageNum, true); // instant scrolling for input
        return true;
      } else {
        // Reset to current page if invalid
        setPageInputValue(pageNumber.toString());
        return false;
      }
    },
    [numPages, pageNumber, scrollToPage],
  );

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow any text input, don't validate immediately
    setPageInputValue(e.target.value);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      validateAndNavigateToPage(pageInputValue);
      (e.target as HTMLInputElement).blur(); // Remove focus after Enter
    } else if (e.key === "Escape") {
      // Reset to current page and blur
      setPageInputValue(pageNumber.toString());
      (e.target as HTMLInputElement).blur();
    }
  };

  const handlePageInputBlur = () => {
    // Validate and navigate when losing focus
    validateAndNavigateToPage(pageInputValue);
  };

  const handlePageInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text when focusing, like Chrome
    e.target.select();
  };

  // Zoom functionality with smoother transitions
  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => {
      const newZoom = Math.min(prev + 0.1, 3.0);
      return Math.round(newZoom * 100) / 100; // Round to 2 decimal places
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev - 0.1, 0.25);
      return Math.round(newZoom * 100) / 100; // Round to 2 decimal places
    });
  }, []);

  const setZoomToFit = useCallback(() => {
    // Calculate zoom to fit page width
    if (textLayerRef.current) {
      const containerWidth = textLayerRef.current.clientWidth - 80; // Account for padding
      const zoomToFit = containerWidth / pdfWidth;
      setZoomLevel(Math.max(0.25, Math.min(3.0, zoomToFit)));
    }
  }, [pdfWidth]);

  const resetZoom = useCallback(() => {
    setZoomLevel(1.0);
  }, []);

  // Rotation functionality
  const rotateClockwise = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Zoom input behavior
  const validateAndSetZoom = useCallback(
    (value: string) => {
      const cleanValue = value.replace("%", "");
      const zoomPercent = parseInt(cleanValue);
      if (!isNaN(zoomPercent) && zoomPercent >= 25 && zoomPercent <= 300) {
        const newZoom = zoomPercent / 100;
        setZoomLevel(newZoom);
        setZoomInputValue(`${zoomPercent}%`);
        return true;
      } else {
        // Reset to current zoom if invalid
        setZoomInputValue(`${Math.round(zoomLevel * 100)}%`);
        return false;
      }
    },
    [zoomLevel],
  );

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomInputValue(e.target.value);
  };

  const handleZoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      validateAndSetZoom(zoomInputValue);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setZoomInputValue(`${Math.round(zoomLevel * 100)}%`);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleZoomInputBlur = () => {
    validateAndSetZoom(zoomInputValue);
  };

  const handleZoomInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const toggleHighlightsTab = () => {
    if (currentContent === "highlights" && isContentVisible) {
      setIsContentVisible(false);
      setCurrentContent(null);
    } else {
      setCurrentContent("highlights");
      setIsContentVisible(true);
    }
  };

  const toggleExplanationsTab = () => {
    if (currentContent === "explanations" && isContentVisible) {
      setIsContentVisible(false);
      setCurrentContent(null);
    } else {
      setCurrentContent("explanations");
      setIsContentVisible(true);
    }
  };

  const toggleThreatsTab = () => {
    if (currentContent === "threats" && isContentVisible) {
      setIsContentVisible(false);
      setCurrentContent(null);
    } else {
      setCurrentContent("threats");
      setIsContentVisible(true);
    }
  };

  const analyzePdfForThreats = async (file: File) => {
    setIsAnalyzing(true);
    console.log("🔍 FRONTEND: Starting PDF threat analysis...");

    try {
      // Extract all text content from PDF as highlight-like objects
      const highlightData = await extractPdfTextAsHighlights();

      console.log("📄 FRONTEND: Extracted highlight data:", {
        totalHighlights: highlightData.length,
        pages: [...new Set(highlightData.map((h) => h.position.pageNumber))],
        sampleHighlights: highlightData.slice(0, 3).map((h) => ({
          id: h.id,
          text: h.text.substring(0, 50) + "...",
          pageNumber: h.position.pageNumber,
        })),
      });

      // Send highlight data to backend for threat analysis
      console.log("📤 FRONTEND: Sending highlight data to backend...");
      console.log("📤 FRONTEND: COMPLETE DATA BEING SENT:");
      console.log("📤 FRONTEND: - Total highlights:", highlightData.length);
      console.log("📤 FRONTEND: - Pages covered:", [
        ...new Set(highlightData.map((h) => h.position.pageNumber)),
      ]);

      // Log detailed structure of first few highlights
      console.log("📤 FRONTEND: DETAILED SAMPLE HIGHLIGHTS:");
      highlightData.slice(0, 3).forEach((highlight, index) => {
        console.log(`📤 FRONTEND: Highlight ${index + 1}:`, {
          id: highlight.id,
          text: highlight.text,
          textLength: highlight.text.length,
          position: highlight.position,
          color: highlight.color,
          metadata: highlight.metadata,
          isActive: highlight.isActive,
          isTemporary: highlight.isTemporary,
        });
      });

      // Log full JSON payload structure
      const payloadStructure = {
        highlights: highlightData.map((h) => ({
          id: h.id,
          textPreview:
            h.text.substring(0, 100) + (h.text.length > 100 ? "..." : ""),
          textLength: h.text.length,
          pageNumber: h.position.pageNumber,
          hasValidPosition: !!(
            h.position.startOffset !== undefined &&
            h.position.endOffset !== undefined
          ),
        })),
      };
      console.log(
        "📤 FRONTEND: PAYLOAD STRUCTURE:",
        JSON.stringify(payloadStructure, null, 2),
      );

      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}analyze-highlights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          highlights: highlightData,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Backend analysis failed: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();
      console.log("📥 FRONTEND: Received threat analysis result:", {
        success: result.success,
        totalThreats: result.totalThreats,
        processedPages: result.processedPages,
        threatHighlights: result.threatHighlights?.slice(0, 3),
      });

      if (result.success && result.threatHighlights) {
        // Convert threat highlights to the format expected by PdfThreats component
        const threatsByPage: { [pageNumber: number]: any[] } = {};
        result.threatHighlights.forEach((threatHighlight: any) => {
          const pageNumber = threatHighlight.position?.pageNumber || 1;
          if (!threatsByPage[pageNumber]) {
            threatsByPage[pageNumber] = [];
          }

          // Convert to the threat format expected by the component
          const threat = {
            id: threatHighlight.id,
            text: threatHighlight.text,
            reason:
              threatHighlight.reason ||
              threatHighlight.metadata?.note ||
              "Security threat detected",
            severity: threatHighlight.severity || "high",
            category: threatHighlight.category || "security",
            confidence: threatHighlight.confidence || 0.8,
            bbox: null, // We'll use position instead
            position: threatHighlight.position,
            // Store the full highlight for rendering
            _highlightData: threatHighlight,
          };

          threatsByPage[pageNumber].push(threat);
        });

        // Convert to the format expected by threats state
        const pages = Object.entries(threatsByPage).map(
          ([pageNum, threats]) => ({
            page: parseInt(pageNum),
            threats: threats,
            totalWords: threats.length, // Approximation
          }),
        );

        const threatAnalysisResult = {
          pages: pages,
          totalPages: pages.length,
          totalThreats: result.totalThreats,
        };

        console.log(
          "✅ FRONTEND: Setting threats state:",
          threatAnalysisResult,
        );
        setThreats(threatAnalysisResult);

        // Wait a bit for pages to render, then apply threat highlights
        setTimeout(() => {
          console.log(
            "🎯 FRONTEND: Triggering threat highlighting after delay...",
          );
          // Force re-application of threat highlights
          if (threatAnalysisResult.pages.length > 0) {
            // Manually trigger applyThreatsToTextLayer since threats state change might not be immediately reflected
            setTimeout(() => {
              const event = new CustomEvent("threats-ready");
              document.dispatchEvent(event);
            }, 100);
          }
        }, 500);
      } else {
        throw new Error("Backend returned invalid result format");
      }
    } catch (error) {
      console.log("❌ FRONTEND: Error analyzing PDF for threats:", error);
      // Set empty result on error
      setThreats({
        pages: [],
        totalPages: 0,
        totalThreats: 0,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate threats analysis for current document
  const generateThreatsAnalysis = async () => {
    if (!documentId || documentId === "test") {
      console.log("🔍 THREATS: No document ID available for analysis");
      return;
    }

    if (!numPages || numPages === 0) {
      console.log("🔍 THREATS: No pages available for analysis");
      return;
    }

    setIsAnalyzing(true);

    try {
      // Extract text from all pages using the existing PDF parsing
      console.log("🔍 THREATS: Step 1 - Extracting text from all pages");
      const highlightData = await extractPdfTextAsHighlights();

      if (highlightData.length === 0) {
        console.log("🔍 THREATS: No text content found in PDF");
        return;
      }

      // Step 2: Send to backend for analysis
      console.log(
        "🔍 THREATS: Step 2 - Sending content to backend for analysis",
      );

      const pagesContent = highlightData.reduce((acc: any[], highlight) => {
        const pageNumber = highlight.position.pageNumber;
        let pageData = acc.find((p) => p.pageNumber === pageNumber);

        if (!pageData) {
          pageData = { pageNumber, content: "" };
          acc.push(pageData);
        }

        pageData.content += highlight.text + " ";
        return acc;
      }, []);

      const response = await ApiClient.post("/threats", {
        documentId,
        pagesContent,
      });

      if (!response.data.success || !response.data.data?.threats) {
        throw new Error("Invalid response from backend");
      }

      const threats = response.data.data.threats;
      console.log("🔍 THREATS: Backend analysis result:", threats);

      // Convert backend threats to highlight format for display
      const threatHighlights = threats.map((threat: any) => ({
        id: threat.id,
        text: threat.text,
        color: getThreatColor(),
        position: threat.position,
        metadata: {
          note: threat.explanation || "",
          tags: [threat.severity || "medium"],
          explanation: threat.explanation || "",
          threatSeverity: threat.severity,
          threatType: "detected",
        },
      }));

      // Add to stored threats for highlighting in PDF
      setStoredThreats(threatHighlights);

      // Set threats analysis result for count display
      setThreats({
        pages: threats.map((threat: any) => ({
          pageNumber: threat.page || 1,
          threats: [threat],
        })),
        totalPages: numPages || 1,
        totalThreats: threats.length,
      });

      console.log(
        `✅ THREATS: Analysis complete - Found ${threats.length} threats`,
      );
    } catch (error) {
      console.log("❌ THREATS: Analysis failed:", error);
      setStoredThreats([]);
      setThreats(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Extract PDF text content as highlight-like data structures
  const extractPdfTextAsHighlights = async (): Promise<Highlight[]> => {
    const extractedHighlights: Highlight[] = [];

    console.log("📄 FRONTEND: Extracting text from PDF as highlights...");
    console.log("📄 FRONTEND: Total pages to process:", numPages);

    if (!numPages || !pagesRefs.current) {
      console.log("⚠ FRONTEND: No pages or page refs available");
      return extractedHighlights;
    }

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      console.log(`📄 FRONTEND: Processing page ${pageNum}...`);

      const pageElement = pagesRefs.current.get(pageNum);
      if (!pageElement) {
        console.log(`⚠ FRONTEND: Page ${pageNum} element not found`);
        continue;
      }

      // Get all text spans from the page
      const textSpans = pageElement.querySelectorAll(
        ".react-pdf__Page__textContent span",
      );
      console.log(
        `📄 FRONTEND: Found ${textSpans.length} text spans on page ${pageNum}`,
      );

      if (textSpans.length === 0) {
        console.log(`⚠ FRONTEND: No text spans found on page ${pageNum}`);
        continue;
      }

      // Group consecutive spans into logical text blocks (sentences/paragraphs)
      const textBlocks = groupTextSpansIntoBlocks(
        Array.from(textSpans),
        pageNum,
      );
      console.log(
        `📄 FRONTEND: Created ${textBlocks.length} text blocks for page ${pageNum}`,
      );

      // Convert each text block to a highlight-like object
      textBlocks.forEach((block, blockIndex) => {
        if (block.text.trim().length > 0) {
          const highlight: Highlight = {
            id: `extracted_${Date.now()}_${pageNum}_${blockIndex}`,
            text: block.text,
            position: {
              startOffset: block.startOffset,
              endOffset: block.endOffset,
              pageNumber: pageNum,
              startXPath: block.startXPath,
              endXPath: block.endXPath,
              startPageOffset: 0,
              endPageOffset: block.text.length,
            },
            color: {
              id: "extracted",
              name: "Extracted Text",
              backgroundColor: "transparent",
              borderColor: "transparent",
              textColor: "inherit",
            },
            metadata: {
              id: `extracted_${Date.now()}_${pageNum}_${blockIndex}`,
              text: block.text,
              createdAt: new Date().toISOString(),
              author: "pdf-extractor",
            },
            isActive: false,
            isTemporary: true,
          };

          extractedHighlights.push(highlight);
        }
      });
    }

    console.log(
      `✅ FRONTEND: Extracted ${extractedHighlights.length} highlight objects from PDF`,
    );
    return extractedHighlights;
  };

  // Group text spans into logical blocks (sentences, paragraphs, etc.)
  const groupTextSpansIntoBlocks = (spans: Element[], pageNumber: number) => {
    const blocks: Array<{
      text: string;
      startOffset: number;
      endOffset: number;
      startXPath: string;
      endXPath: string;
    }> = [];

    let currentBlock = {
      text: "",
      spans: [] as Element[],
      startOffset: 0,
      endOffset: 0,
    };

    let totalOffset = 0;

    spans.forEach((span, spanIndex) => {
      const spanText = span.textContent || "";
      const trimmedText = spanText.trim();

      if (trimmedText.length === 0) {
        totalOffset += spanText.length;
        return;
      }

      // Start a new block if this is the first span or if we detect a logical break
      if (currentBlock.spans.length === 0) {
        currentBlock = {
          text: spanText,
          spans: [span],
          startOffset: totalOffset,
          endOffset: totalOffset + spanText.length,
        };
      } else {
        // Add to current block
        currentBlock.text += spanText;
        currentBlock.spans.push(span);
        currentBlock.endOffset = totalOffset + spanText.length;
      }

      totalOffset += spanText.length;

      // End block on sentence boundaries or after reaching a reasonable length
      const endsWithPunctuation = /[.!?]\s*$/.test(spanText);
      const isLongEnough = currentBlock.text.length > 100;
      const isLastSpan = spanIndex === spans.length - 1;

      if (endsWithPunctuation || isLongEnough || isLastSpan) {
        if (currentBlock.text.trim().length > 0) {
          blocks.push({
            text: currentBlock.text,
            startOffset: currentBlock.startOffset,
            endOffset: currentBlock.endOffset,
            startXPath: generateXPath(currentBlock.spans[0]),
            endXPath: generateXPath(
              currentBlock.spans[currentBlock.spans.length - 1],
            ),
          });
        }

        currentBlock = {
          text: "",
          spans: [],
          startOffset: 0,
          endOffset: 0,
        };
      }
    });

    // Add any remaining block
    if (currentBlock.text.trim().length > 0) {
      blocks.push({
        text: currentBlock.text,
        startOffset: currentBlock.startOffset,
        endOffset: currentBlock.endOffset,
        startXPath: generateXPath(currentBlock.spans[0]),
        endXPath: generateXPath(
          currentBlock.spans[currentBlock.spans.length - 1],
        ),
      });
    }

    return blocks;
  };

  // Generate XPath for an element
  const generateXPath = (element: Element): string => {
    if (!element) return "";

    const path = [];
    let current = element;

    while (current && current !== document.body) {
      let index = 1;
      let sibling = current.previousElementSibling;

      while (sibling) {
        if (sibling.tagName === current.tagName) {
          index++;
        }
        sibling = sibling.previousElementSibling;
      }

      const tagName = current.tagName.toLowerCase();
      path.unshift(`${tagName}[${index}]`);
      current = current.parentElement!;
    }

    return `/${path.join("/")}`;
  };

  const jumpToThreat = useCallback(
    (threat: Threat, pageNumber: number) => {
      console.log("🎯 FRONTEND: Jumping to threat:", {
        id: threat.id,
        text: threat.text,
        pageNumber,
      });

      // Scroll to page first
      scrollToPage(pageNumber, true);

      // Check if threat has highlight data for precise positioning
      const threatHighlight = (threat as any)._highlightData;

      if (threatHighlight && threatHighlight.position) {
        console.log(
          "🎯 FRONTEND: Using precise positioning from highlight data",
        );

        // Use the jumpToHighlight function for precise positioning
        setTimeout(() => {
          // Manually call the highlight jumping logic
          const highlightElement = document.querySelector(
            `[data-highlight-id="${threatHighlight.id}"]`,
          );
          if (highlightElement) {
            highlightElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "center",
            });

            // Flash effect
            (highlightElement as HTMLElement).style.boxShadow =
              "0 0 0 4px #f00, 0 0 16px #f00";
            (highlightElement as HTMLElement).style.transition =
              "box-shadow 0.2s, transform 0.2s";
            highlightElement.animate(
              [
                { transform: "translateX(0px)" },
                { transform: "translateX(-8px)" },
                { transform: "translateX(8px)" },
                { transform: "translateX(0px)" },
              ],
              { duration: 400, easing: "ease" },
            );
            setTimeout(() => {
              (highlightElement as HTMLElement).style.boxShadow = "none";
            }, 800);
          }
        }, 500);
        return;
      }

      // Fallback to legacy threat finding
      setTimeout(() => {
        console.log("🎯 FRONTEND: Using fallback threat finding method");

        const threatId = threat.id || `threat-${pageNumber}`;
        const threatElements = document.querySelectorAll(
          `[data-threat-id="${threatId}"], [data-threat-id*="${threatId}"]`,
        );

        // Find the specific threat element
        let threatElement = threatElements[0];

        // If not found by ID, fallback to text matching
        if (!threatElement) {
          const allThreatElements = document.querySelectorAll(
            ".pdf-threat-highlight",
          );
          const foundElement = Array.from(allThreatElements).find((el) =>
            el.textContent?.toLowerCase().includes(threat.text.toLowerCase()),
          );
          if (foundElement) {
            threatElement = foundElement;
          }
        }

        if (threatElement) {
          threatElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          // Add flash effect to highlight the threat
          const originalBoxShadow = (threatElement as HTMLElement).style
            .boxShadow;
          const originalTransition = (threatElement as HTMLElement).style
            .transition;

          const threatColor = getThreatColor(threat.severity);
          (threatElement as HTMLElement).style.boxShadow =
            `0 0 0 4px ${threatColor.borderColor}, 0 0 16px ${threatColor.borderColor}`;
          (threatElement as HTMLElement).style.transition =
            "box-shadow 0.2s, transform 0.2s";

          // Animate the element
          threatElement.animate(
            [
              { transform: "translateX(0px)" },
              { transform: "translateX(-4px)" },
              { transform: "translateX(4px)" },
              { transform: "translateX(0px)" },
            ],
            { duration: 400, easing: "ease" },
          );

          setTimeout(() => {
            (threatElement as HTMLElement).style.boxShadow = originalBoxShadow;
            (threatElement as HTMLElement).style.transition =
              originalTransition;
          }, 1000);
        } else {
          console.log(
            "⚠ FRONTEND: Threat element not found for:",
            threat.text,
          );
        }
      }, 500);
    },
    [scrollToPage],
  );

  const closeContentTab = () => {
    setIsContentVisible(false);
    setCurrentContent(null);
  };

  const removeHighlightById = useCallback(
    async (highlightId: string) => {
      try {
        // Remove from backend first
        if (documentId) {
          await ApiClient.delete(`/highlights/${highlightId}`);
        }

        // Remove from UI
        if (textLayerRef.current) {
          removeHighlight(textLayerRef.current, highlightId);
        }
        setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
      } catch (error) {
        console.log("Failed to delete highlight from backend:", error);
        // Still remove from UI as fallback
        if (textLayerRef.current) {
          removeHighlight(textLayerRef.current, highlightId);
        }
        setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
      }
    },
    [textLayerRef, setHighlights, documentId],
  );

  const clearAllHighlights = () => {
    highlights.forEach((highlight) => {
      if (textLayerRef.current) {
        removeHighlight(textLayerRef.current, highlight.id);
      }
    });
    setHighlights([]);
  };

  const removeExplanationById = useCallback(
    (explanationId: string) => {
      setStoredExplanations((prev) =>
        prev.filter((e) => e.id !== explanationId),
      );
    },
    [setStoredExplanations],
  );

  const clearAllExplanations = () => {
    setStoredExplanations([]);
  };

  // Threat management functions
  const removeThreatById = useCallback(
    (threatId: string) => {
      if (textLayerRef.current) {
        removeHighlight(textLayerRef.current, threatId);
      }
      setStoredThreats((prev) => prev.filter((t) => t.id !== threatId));
    },
    [textLayerRef, setStoredThreats],
  );

  const clearAllThreats = () => {
    storedThreats.forEach((threat) => {
      if (textLayerRef.current) {
        removeHighlight(textLayerRef.current, threat.id);
      }
    });
    setStoredThreats([]);
  };

  const addThreatToStorage = useCallback(
    (threat: Highlight) => {
      setStoredThreats((prev) => [...prev, threat]);
    },
    [setStoredThreats],
  );

  const jumpToExplanation = useCallback(
    (explanation: StoredExplanation) => {
      console.log("jumpToExplanation called with:", explanation);

      // Scroll to the correct page and show the full page
      scrollToPage(explanation.pageNumber, false);

      // Wait for page to render and scroll to complete, then apply visual effects
      setTimeout(() => {
        const pageElement = pagesRefs.current?.get(explanation.pageNumber);
        if (!pageElement) {
          console.warn(
            "Page element not found for page:",
            explanation.pageNumber,
          );
          return;
        }

        // Find the text layer
        const textLayer = pageElement.querySelector(
          ".react-pdf__Page__textContent",
        );
        if (!textLayer) {
          console.warn(
            "Text layer not found for page:",
            explanation.pageNumber,
          );
          return;
        }

        // Find text spans containing the explanation text
        const textSpans = Array.from(textLayer.querySelectorAll("span"));
        const explanationText = explanation.selectedText.toLowerCase();

        // Find spans that contain the explanation text
        const matchingSpans: HTMLElement[] = [];
        textSpans.forEach((span) => {
          const spanText = (span.textContent || "").toLowerCase();
          if (spanText.includes(explanationText)) {
            matchingSpans.push(span as HTMLElement);
          }
        });

        if (matchingSpans.length > 0) {
          console.log(
            `Found ${matchingSpans.length} spans containing explanation text`,
          );

          // Apply temporary border effect to all matching spans (no scrolling to specific text)
          matchingSpans.forEach((span) => {
            // Store original styles
            const originalBorder = span.style.border;
            const originalBoxShadow = span.style.boxShadow;
            const originalTransition = span.style.transition;

            // Apply temporary border effect
            span.style.border = "2px solid #ff0000";
            span.style.boxShadow = "0 0 8px rgba(255, 0, 0, 0.6)";
            span.style.transition = "all 0.3s ease";

            // Animate the span
            span.animate(
              [
                { transform: "scale(1)" },
                { transform: "scale(1.02)" },
                { transform: "scale(1)" },
              ],
              { duration: 600, easing: "ease-in-out" },
            );

            // Remove the border effect after 2 seconds
            setTimeout(() => {
              span.style.border = originalBorder;
              span.style.boxShadow = originalBoxShadow;
              span.style.transition = originalTransition;
            }, 2000);
          });

          console.log("Applied temporary border effect to explanation text");
        } else {
          console.warn(
            "No spans found containing explanation text:",
            explanation.selectedText,
          );
        }
      }, 800);
    },
    [pagesRefs, scrollToPage],
  );

  const applyHighlightsToTextLayer = useCallback(
    debounce(() => {
      if (!textLayerRef.current) return;

      // Combine regular highlights with stored threats for rendering
      const allHighlights = [...highlights, ...storedThreats];

      if (allHighlights.length === 0) return;

      try {
        // Filter valid highlights - apply all highlights including threats
        const validHighlights = allHighlights.filter((highlight) => {
          if (!validateHighlight(highlight)) {
            console.warn("Invalid highlight found:", highlight);
            return false;
          }
          return true;
        });

        if (validHighlights.length > 0) {
          applyHighlights(textLayerRef.current, validHighlights);
        }

        setTimeout(() => {
          validHighlights.forEach((highlight) => {
            const highlightElements = document.querySelectorAll(
              `[data-highlight-id="${highlight.id}"]`,
            );

            if (!highlightElements.length) return;

            highlightElements.forEach((el) => {
              el.addEventListener("click", (e) => {
                setHighlightContextMenu({
                  highlight,
                  x: (e as MouseEvent).clientX,
                  y: (e as MouseEvent).clientY,
                  showColorPicker: false,
                  editingNote: false,
                  noteText: "",
                });
              });
            });
          });
        }, 500);
      } catch (error) {
        console.log("Failed to apply highlights:", error);
      }
    }, 150),
    [textLayerRef, highlights, storedThreats],
  );

  const applyThreatsToTextLayer = useCallback(
    debounce(() => {
      console.log("🎯 FRONTEND: applyThreatsToTextLayer called");

      if (!textLayerRef.current || !threats || threats.pages.length === 0) {
        console.log("🎯 FRONTEND: Early exit - missing requirements:", {
          textLayerRef: !!textLayerRef.current,
          threats: !!threats,
          threatsPages: threats?.pages?.length || 0,
        });
        return;
      }

      try {
        // Remove existing threat highlights first
        const existingThreatHighlights = document.querySelectorAll(
          ".pdf-threat-highlight",
        );
        console.log(
          `🎯 FRONTEND: Removing ${existingThreatHighlights.length} existing threat highlights`,
        );
        existingThreatHighlights.forEach((el) => {
          const parent = el.parentNode;
          if (parent) {
            // Replace the highlight with plain text
            parent.replaceChild(
              document.createTextNode(el.textContent || ""),
              el,
            );
            // Normalize the parent to merge adjacent text nodes
            parent.normalize();
          }
        });

        // 🔧 FIX: Apply threats to ALL pages, not just current page
        console.log(
          `🎯 FRONTEND: Total threat pages to process:`,
          threats.pages.length,
        );
        console.log(
          `🎯 FRONTEND: Threat pages:`,
          threats.pages.map((p) => ({
            page: p.page,
            threats: p.threats.length,
          })),
        );

        // Check if all required pages are loaded
        const missingPages = threats.pages.filter((threatPage) => {
          const pageElement = pagesRefs.current?.get(threatPage.page);
          return !pageElement;
        });

        if (missingPages.length > 0) {
          console.warn(
            `🎯 FRONTEND: Missing page elements for pages: ${missingPages.map((p) => p.page).join(", ")}. Retrying in 1 second...`,
          );
          setTimeout(() => {
            applyThreatsToTextLayer();
          }, 1000);
          return;
        }

        threats.pages.forEach((threatPage) => {
          console.log(`🎯 FRONTEND: Processing page ${threatPage.page}...`);

          const pageElement = pagesRefs.current?.get(threatPage.page);
          if (!pageElement) {
            console.log(
              `🎯 FRONTEND: Page element for page ${threatPage.page} NOT FOUND in pagesRefs`,
            );
            console.log(
              `🎯 FRONTEND: Available page refs:`,
              Array.from(pagesRefs.current?.keys() || []),
            );
            return;
          }

          if (threatPage.threats.length === 0) {
            console.log(`🎯 FRONTEND: No threats for page ${threatPage.page}`);
            return;
          }

          console.log(
            `🎯 FRONTEND: Applying threats to page ${threatPage.page}:`,
            threatPage.threats.length,
          );

          // Check if page element has text content
          const textLayer = pageElement.querySelector(
            ".react-pdf__Page__textContent",
          );
          if (!textLayer) {
            console.log(
              `🎯 FRONTEND: Text layer not found for page ${threatPage.page}`,
            );
            return;
          }

          const textSpansInPage = textLayer.querySelectorAll("span");
          console.log(
            `🎯 FRONTEND: Page ${threatPage.page} has ${textSpansInPage.length} text spans`,
          );

          if (textSpansInPage.length === 0) {
            console.log(
              `🎯 FRONTEND: No text spans found in page ${threatPage.page}`,
            );
            return;
          }

          threatPage.threats.forEach((threat, index) => {
            console.log(
              `🎯 FRONTEND: Processing threat ${index + 1}/${threatPage.threats.length} for page ${threatPage.page}:`,
              {
                id: threat.id,
                text: threat.text.substring(0, 100) + "...",
                textLength: threat.text.length,
                position: threat.position,
                hasHighlightData: !!threat._highlightData,
              },
            );

            // Try multiple approaches to find the threat text in the PDF
            let highlightApplied = false;

            // Approach 1: Use the _highlightData if available (from backend)
            if (threat._highlightData && threat._highlightData.position) {
              console.log(
                `🎯 FRONTEND: Using _highlightData position:`,
                threat._highlightData.position,
              );

              // Try to find the text span that matches the position
              const textSpans = pageElement.querySelectorAll(
                ".react-pdf__Page__textContent span",
              );
              console.log(
                `🎯 FRONTEND: Page ${threatPage.page} has ${textSpans.length} spans to search`,
              );

              let foundSpan = false;
              Array.from(textSpans).forEach((span, spanIndex) => {
                const spanText = span.textContent || "";
                const containsThreat = spanText
                  .toLowerCase()
                  .includes(threat.text.toLowerCase());

                if (spanIndex < 5) {
                  console.log(
                    `🎯 FRONTEND: Span ${spanIndex}: "${spanText.substring(0, 50)}..." contains threat: ${containsThreat}`,
                  );
                }

                if (containsThreat) {
                  foundSpan = true;
                  console.log(
                    `🎯 FRONTEND: FOUND THREAT in span ${spanIndex} on page ${threatPage.page}`,
                  );

                  const threatColor = getThreatColor(threat.severity);

                  // Create highlight wrapper using normal highlight styling
                  const highlightWrapper = document.createElement("span");
                  highlightWrapper.className =
                    "text-highlight pdf-threat-highlight";
                  highlightWrapper.setAttribute(
                    "data-threat-id",
                    threat.id || `threat-${threatPage.page}-${index}`,
                  );
                  highlightWrapper.style.backgroundColor =
                    threatColor.backgroundColor;
                  highlightWrapper.style.transition = "all 0.2s ease";
                  highlightWrapper.style.position = "relative";
                  highlightWrapper.style.zIndex = "1";
                  highlightWrapper.style.cursor = "pointer";
                  highlightWrapper.style.color = "black";
                  highlightWrapper.style.fontWeight = "inherit";
                  if (threatColor.borderColor) {
                    highlightWrapper.style.borderBottom = `1px solid ${threatColor.borderColor}`;
                  }
                  highlightWrapper.title = `${threat.severity?.toUpperCase() || "HIGH"}: ${threat.reason}`;

                  // Replace only the matching part of the text
                  const originalText = span.textContent || "";
                  const threatTextIndex = originalText
                    .toLowerCase()
                    .indexOf(threat.text.toLowerCase());

                  if (threatTextIndex !== -1) {
                    const beforeText = originalText.substring(
                      0,
                      threatTextIndex,
                    );
                    const threatTextActual = originalText.substring(
                      threatTextIndex,
                      threatTextIndex + threat.text.length,
                    );
                    const afterText = originalText.substring(
                      threatTextIndex + threat.text.length,
                    );

                    // Clear the span and rebuild it
                    span.innerHTML = "";

                    if (beforeText) {
                      span.appendChild(document.createTextNode(beforeText));
                    }

                    highlightWrapper.textContent = threatTextActual;
                    span.appendChild(highlightWrapper);

                    if (afterText) {
                      span.appendChild(document.createTextNode(afterText));
                    }

                    highlightApplied = true;
                    console.log(
                      `✅ FRONTEND: Applied threat highlight "${threat.text.substring(0, 50)}..." to page ${threatPage.page} span ${spanIndex}`,
                    );
                  }
                }
              });

              if (!foundSpan) {
                console.warn(
                  `⚠️ FRONTEND: No span found containing threat text "${threat.text.substring(0, 100)}..." on page ${threatPage.page}`,
                );
              }
            }

            // Approach 2: Fallback to simple text search if highlight data approach didn't work
            if (!highlightApplied) {
              console.log(
                `🎯 FRONTEND: Fallback to text search for "${threat.text}" on page ${threatPage.page}`,
              );

              const textSpans = pageElement.querySelectorAll(
                ".react-pdf__Page__textContent span",
              );
              Array.from(textSpans).some((span, spanIndex) => {
                if (
                  span.textContent &&
                  span.textContent
                    .toLowerCase()
                    .includes(threat.text.toLowerCase())
                ) {
                  const threatColor = getThreatColor(threat.severity);

                  // Create highlight wrapper using normal highlight styling
                  const highlightWrapper = document.createElement("span");
                  highlightWrapper.className =
                    "text-highlight pdf-threat-highlight";
                  highlightWrapper.setAttribute(
                    "data-threat-id",
                    threat.id || `threat-${threatPage.page}-${index}`,
                  );
                  highlightWrapper.style.backgroundColor =
                    threatColor.backgroundColor;
                  highlightWrapper.style.transition = "all 0.2s ease";
                  highlightWrapper.style.position = "relative";
                  highlightWrapper.style.zIndex = "1";
                  highlightWrapper.style.cursor = "pointer";
                  highlightWrapper.style.color = "black";
                  highlightWrapper.style.fontWeight = "inherit";
                  if (threatColor.borderColor) {
                    highlightWrapper.style.borderBottom = `1px solid ${threatColor.borderColor}`;
                  }
                  highlightWrapper.title = `${threat.severity?.toUpperCase() || "HIGH"}: ${threat.reason}`;

                  // Replace only the matching part of the text
                  const originalText = span.textContent || "";
                  const threatTextIndex = originalText
                    .toLowerCase()
                    .indexOf(threat.text.toLowerCase());
                  if (threatTextIndex !== -1) {
                    const beforeText = originalText.substring(
                      0,
                      threatTextIndex,
                    );
                    const threatTextActual = originalText.substring(
                      threatTextIndex,
                      threatTextIndex + threat.text.length,
                    );
                    const afterText = originalText.substring(
                      threatTextIndex + threat.text.length,
                    );

                    // Clear the span and rebuild it
                    span.innerHTML = "";

                    if (beforeText) {
                      span.appendChild(document.createTextNode(beforeText));
                    }

                    highlightWrapper.textContent = threatTextActual;
                    span.appendChild(highlightWrapper);

                    if (afterText) {
                      span.appendChild(document.createTextNode(afterText));
                    }

                    highlightApplied = true;
                    console.log(
                      `✅ FRONTEND: Applied fallback threat highlight "${threat.text}" to page ${threatPage.page} span ${spanIndex}`,
                    );
                    return true; // Break out of the some() loop
                  } else {
                    // If partial match fails, wrap the entire span for simplicity
                    highlightWrapper.textContent = span.textContent;
                    span.innerHTML = "";
                    span.appendChild(highlightWrapper);

                    highlightApplied = true;
                    console.log(
                      `✅ FRONTEND: Applied fallback threat highlight (full span) "${threat.text}" to page ${threatPage.page} span ${spanIndex}`,
                    );
                    return true; // Break out of the some() loop
                  }
                }
                return false;
              });
            }

            if (!highlightApplied) {
              console.warn(
                `⚠️ FRONTEND: Could not apply highlight for threat "${threat.text}" on page ${threatPage.page} - text not found`,
              );
            }
          });

          console.log(
            `✅ Applied threat highlighting for ${threatPage.threats.length} threats on page ${threatPage.page}`,
          );
        });
      } catch (error) {
        console.log("Failed to apply threat highlights:", error);
      }
    }, 150),
    [textLayerRef, threats, pagesRefs], // 🔧 FIX: Remove pageNumber dependency
  );

  const updateHighlightById = async (
    highlightId: string,
    newData: Partial<Highlight>,
  ) => {
    try {
      // Update in backend first
      if (documentId) {
        const updateData: any = {};
        if (newData.color) updateData.color = newData.color;
        if (newData.metadata?.note !== undefined)
          updateData.note = newData.metadata.note;
        if (newData.metadata?.tags !== undefined)
          updateData.tags = newData.metadata.tags;

        await ApiClient.put(`/highlights/${highlightId}`, updateData);
      }

      // Update in frontend state
      setHighlights((prev) =>
        prev.map((highlight) =>
          highlight.id === highlightId
            ? { ...highlight, ...newData }
            : highlight,
        ),
      );
    } catch (error) {
      console.log("Failed to update highlight in backend:", error);
      // Still update in frontend as fallback
      setHighlights((prev) =>
        prev.map((highlight) =>
          highlight.id === highlightId
            ? { ...highlight, ...newData }
            : highlight,
        ),
      );
    }
  };

  const jumpToHighlight = useCallback(
    (highlight: Highlight) => {
      const pageElement = pagesRefs.current?.get(highlight.position.pageNumber);
      if (pageElement) {
        // Find the highlight span by data-highlight-id
        const highlightElements = Array.from(
          pageElement.querySelectorAll(`[data-highlight-id="${highlight.id}"]`),
        ) as HTMLElement[];

        if (highlightElements && highlightElements.length > 0) {
          // Scroll the highlight span into the center of the viewport
          highlightElements.forEach((highlightElement) => {
            highlightElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "center",
            });

            // Optionally flash the highlight
            highlightElement.style.boxShadow = "0 0 0 4px #f00, 0 0 16px #f00";
            highlightElement.style.transition =
              "box-shadow 0.2s, transform 0.2s";
            highlightElement.animate(
              [
                { transform: "translateX(0px)" },
                { transform: "translateX(-8px)" },
                { transform: "translateX(8px)" },
                { transform: "translateX(0px)" },
              ],
              { duration: 400, easing: "ease" },
            );
            setTimeout(() => {
              highlightElement.style.boxShadow = "none";
            }, 800);
          });
        }
      }
    },
    [pagesRefs],
  );

  useEffect(() => {
    applyHighlightsToTextLayer();
  }, [applyHighlightsToTextLayer, highlights, storedThreats]);

  // Add event listener for custom threats-ready event
  useEffect(() => {
    const handleThreatsReady = () => {
      console.log(
        "🎯 FRONTEND: Received threats-ready event, applying highlights...",
      );
      setTimeout(() => {
        applyHighlightsToTextLayer();
      }, 100);
    };

    document.addEventListener("threats-ready", handleThreatsReady);
    return () => {
      document.removeEventListener("threats-ready", handleThreatsReady);
    };
  }, [applyThreatsToTextLayer,applyHighlightsToTextLayer]);

  // Sync zoom input with zoom level changes
  useEffect(() => {
    setZoomInputValue(`${Math.round(zoomLevel * 100)}%`);
  }, [zoomLevel]);

  // Mouse wheel zoom with Ctrl key (Chrome-like behavior)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Only respond to mouse wheel events, ignore touchpad/touchscreen
        const isTouchpad = Math.abs(e.deltaY) < 50;
        if (isTouchpad) return; // Exit early for touchpad events

        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;

        setZoomLevel((prev) => {
          const newZoom = Math.max(0.25, Math.min(3.0, prev + delta));
          setZoomInputValue(`${Math.round(newZoom * 100)}%`);
          return newZoom;
        });
      }
    };

    const containerElement = textLayerRef.current;
    if (containerElement) {
      containerElement.addEventListener("wheel", handleWheel, {
        passive: false,
      });
      return () => containerElement.removeEventListener("wheel", handleWheel);
    }
  }, []);

  // Keyboard shortcuts (Chrome-like)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "=":
          case "+":
            event.preventDefault();
            zoomIn();
            break;
          case "-":
            event.preventDefault();
            zoomOut();
            break;
          case "0":
            event.preventDefault();
            setZoomLevel(1.0);
            setZoomInputValue("100%");
            break;
        }
      } else {
        switch (event.key) {
          case "ArrowLeft":
            event.preventDefault();
            goToPrevPage();
            break;
          case "ArrowRight":
            event.preventDefault();
            goToNextPage();
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevPage, goToNextPage, zoomIn, zoomOut]);

  const onSelection = ({
    selectedText,
    currentPage,
  }: {
    selectedText: string;
    currentPage: number;
  }) => {
    console.log("Selected text:", selectedText);
    console.log("Current page:", currentPage);
  };

  const PDFContextData: PDFContextType = {
    pdfUrl,
    documentId,
    numPages,
    setNumPages,
    pageNumber,
    setPageNumber,
    pdfWidth,
    setPdfWidth,
    zoomLevel,
    setZoomLevel,
    rotation,
    setRotation,
    textLayerRef,
    pagesRefs,
    pageInputValue,
    setPageInputValue,
    zoomInputValue,
    setZoomInputValue,
    isScrolling,
    isContentVisible,
    setIsContentVisible,
    currentContent,
    setCurrentContent,
    toggleHighlightsTab,
    toggleExplanationsTab,
    toggleThreatsTab,
    onLoadSuccess,
    toolbarPosition,
    setToolbarPosition,
    toolbarView,
    setToolbarView,
    goToPrevPage,
    goToNextPage,
    scrollToPage,
    zoomIn,
    zoomOut,
    setZoomToFit,
    resetZoom,
    rotateClockwise,
    handlePageInputChange,
    handlePageInputKeyDown,
    handlePageInputBlur,
    handlePageInputFocus,
    handleZoomInputChange,
    handleZoomInputKeyDown,
    handleZoomInputBlur,
    handleZoomInputFocus,
    validateAndNavigateToPage,
    validateAndSetZoom,
    onSelection,
    closeContentTab,
    highlights,
    setHighlights,
    removeHighlightById,
    clearAllHighlights,
    updateHighlightById,
    jumpToHighlight,
    applyHighlightsToTextLayer,
    storedExplanations,
    setStoredExplanations,
    removeExplanationById,
    clearAllExplanations,
    jumpToExplanation,
    storedThreats,
    setStoredThreats,
    removeThreatById,
    clearAllThreats,
    addThreatToStorage,
    threats,
    setThreats,
    isAnalyzing,
    setIsAnalyzing,
    analyzePdfForThreats,
    generateThreatsAnalysis,
    jumpToThreat,
    highlightContextMenu,
    setHighlightContextMenu,
  };

  return (
    <PDFContext.Provider value={PDFContextData}>
      {loading && (
        <div className="bg-background absolute inset-0 z-100000 flex items-center justify-center">
          <LoaderCircleIcon className="size-20 animate-spin" />
        </div>
      )}
      <div></div>
      {children}
    </PDFContext.Provider>
  );
};

export const usePDF = () => {
  const context = useContext(PDFContext);
  if (!context) {
    throw new Error("usePDF must be used within a PDFProvider");
  }
  return context;
};
