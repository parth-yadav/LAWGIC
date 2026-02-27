import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "@/pdf/pdfjs-setup";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { LoaderCircleIcon } from "lucide-react";
import useLocalState from "@/hooks/useLocalState";
import ApiClient from "@/utils/ApiClient";
import { getThreatColor } from "./highlight/types";
import {
  applyHighlights,
  debounce,
  removeHighlight,
  validateHighlight,
} from "./highlight/utils";

const PDFContext = createContext(undefined);

export const PDFProvider = ({ pdfUrl, documentId, children }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfWidth, setPdfWidth] = useState(600);
  const [loading, setLoading] = useState(true);
  const [pageInputValue, setPageInputValue] = useState("1");
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [zoomInputValue, setZoomInputValue] = useState("100%");
  const [rotation, setRotation] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [currentContent, setCurrentContent] = useState(null);
  const [toolbarPosition, setToolbarPosition] = useLocalState("pdf-toolbar-position", "bottom");
  const [toolbarView, setToolbarView] = useLocalState("pdf-toolbar-view", "fixed");
  const [highlights, setHighlights] = useState([]);
  const [storedExplanations, setStoredExplanations] = useState([]);
  const [storedThreats, setStoredThreats] = useState([]);
  const [threats, setThreats] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [highlightContextMenu, setHighlightContextMenu] = useState(null);

  const textLayerRef = useRef(null);
  const pagesRefs = useRef(new Map());
  const scrollTimeoutRef = useRef(null);

  // Resize handler
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

  // Load existing explanations from backend
  useEffect(() => {
    const loadExistingExplanations = async () => {
      if (!documentId) return;
      const controller = new AbortController();
      try {
        const response = await ApiClient.get(`/explanations?docId=${documentId}`, { signal: controller.signal });
        if (response.data.success && response.data.data) {
          const explanations = response.data.data.map((explanation) => ({
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
      } catch (error) {
        if (error.name !== "AbortError") {
          console.log("Failed to load existing explanations:", error);
        }
      }
    };
    loadExistingExplanations();
  }, [documentId]);

  // Load existing highlights from backend
  useEffect(() => {
    const loadExistingHighlights = async () => {
      if (!documentId) return;
      const controller = new AbortController();
      try {
        const response = await ApiClient.get(`/highlights?documentId=${documentId}`, { signal: controller.signal });
        if (response.data.success && response.data.data) {
          const backendHighlights = response.data.data.map((highlight) => ({
            id: highlight.id,
            text: highlight.text,
            color: highlight.color,
            position: highlight.position,
            metadata: {
              note: highlight.note || "",
              tags: highlight.tags || [],
              explanation: highlight.explanation || "",
            },
          }));
          setHighlights(backendHighlights);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.log("Failed to load existing highlights:", error);
        }
      }
    };
    loadExistingHighlights();
  }, [documentId]);

  // Load existing threats from backend
  useEffect(() => {
    const loadExistingThreats = async () => {
      if (!documentId || documentId === "test") return;
      const controller = new AbortController();
      try {
        const response = await ApiClient.get(`/threats?docId=${documentId}`, { signal: controller.signal });
        if (response.data.success && response.data.data?.threats) {
          const threatsData = response.data.data.threats;
          const threatHighlights = threatsData.map((threat) => ({
            id: threat.id,
            text: threat.exactStringThreat || threat.text,
            page: threat.page,
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
          setStoredThreats(threatHighlights);
          setThreats({
            pages: threatsData.map((threat) => ({
              pageNumber: threat.page || 1,
              threats: [threat],
            })),
            totalPages: numPages || 1,
            totalThreats: threatsData.length,
          });
        } else {
          setStoredThreats([]);
          setThreats(null);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.log("Failed to load existing threats:", error);
        }
      }
    };
    loadExistingThreats();
  }, [documentId, numPages]);

  // Intersection Observer to track visible pages
  useEffect(() => {
    if (!textLayerRef.current || !numPages) return;
    const containerElement = textLayerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = [];
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute("data-page-number") || "0");
            if (pageNum > 0) visible.push(pageNum);
          }
        });
        if (visible.length > 0 && !isScrolling) {
          setPageNumber(Math.min(...visible));
        }
      },
      {
        root: containerElement,
        rootMargin: "-10% 0px -10% 0px",
        threshold: 0.3,
      }
    );
    pagesRefs.current.forEach((pageElement) => {
      observer.observe(pageElement);
    });
    return () => observer.disconnect();
  }, [numPages, isScrolling]);

  // Sync page input with page number
  useEffect(() => {
    setPageInputValue(pageNumber.toString());
  }, [pageNumber]);

  const scrollToPage = useCallback((pageNum, instant = false) => {
    const pageElement = pagesRefs.current.get(pageNum);
    if (pageElement && textLayerRef.current) {
      if (!instant) {
        setIsScrolling(true);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 800);
      }
      pageElement.scrollIntoView({
        behavior: instant ? "instant" : "smooth",
        block: "start",
        inline: "nearest",
      });
      setPageNumber(pageNum);
    }
  }, []);

  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    applyHighlightsToTextLayer();
  };

  const goToPrevPage = useCallback(() => {
    scrollToPage(Math.max(1, pageNumber - 1), false);
  }, [pageNumber, scrollToPage]);

  const goToNextPage = useCallback(() => {
    scrollToPage(Math.min(numPages || 1, pageNumber + 1), false);
  }, [pageNumber, numPages, scrollToPage]);

  const validateAndNavigateToPage = useCallback((value) => {
    const pageNum = parseInt(value);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= (numPages || 1)) {
      scrollToPage(pageNum, true);
      return true;
    } else {
      setPageInputValue(pageNumber.toString());
      return false;
    }
  }, [numPages, pageNumber, scrollToPage]);

  const handlePageInputChange = (e) => setPageInputValue(e.target.value);

  const handlePageInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      validateAndNavigateToPage(pageInputValue);
      e.target.blur();
    } else if (e.key === "Escape") {
      setPageInputValue(pageNumber.toString());
      e.target.blur();
    }
  };

  const handlePageInputBlur = () => validateAndNavigateToPage(pageInputValue);

  const handlePageInputFocus = (e) => e.target.select();

  // Zoom
  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.round(Math.min(prev + 0.1, 3.0) * 100) / 100);
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.round(Math.max(prev - 0.1, 0.25) * 100) / 100);
  }, []);

  const setZoomToFit = useCallback(() => {
    if (textLayerRef.current) {
      const containerWidth = textLayerRef.current.clientWidth - 80;
      setZoomLevel(Math.max(0.25, Math.min(3.0, containerWidth / pdfWidth)));
    }
  }, [pdfWidth]);

  const resetZoom = useCallback(() => setZoomLevel(1.0), []);

  const rotateClockwise = useCallback(() => setRotation((prev) => (prev + 90) % 360), []);

  const validateAndSetZoom = useCallback((value) => {
    const cleanValue = value.replace("%", "");
    const zoomPercent = parseInt(cleanValue);
    if (!isNaN(zoomPercent) && zoomPercent >= 25 && zoomPercent <= 300) {
      setZoomLevel(zoomPercent / 100);
      setZoomInputValue(`${zoomPercent}%`);
      return true;
    } else {
      setZoomInputValue(`${Math.round(zoomLevel * 100)}%`);
      return false;
    }
  }, [zoomLevel]);

  const handleZoomInputChange = (e) => setZoomInputValue(e.target.value);

  const handleZoomInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      validateAndSetZoom(zoomInputValue);
      e.target.blur();
    } else if (e.key === "Escape") {
      setZoomInputValue(`${Math.round(zoomLevel * 100)}%`);
      e.target.blur();
    }
  };

  const handleZoomInputBlur = () => validateAndSetZoom(zoomInputValue);
  const handleZoomInputFocus = (e) => e.target.select();

  // Content tab toggles
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

  // Analyze PDF for threats using highlight extraction
  const analyzePdfForThreats = async (file) => {
    setIsAnalyzing(true);
    try {
      const highlightData = await extractPdfTextAsHighlights();
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}analyze-highlights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ highlights: highlightData }),
      });
      if (!response.ok) throw new Error(`Backend analysis failed: ${response.status}`);
      const result = await response.json();
      if (result.success && result.threatHighlights) {
        const threatsByPage = {};
        result.threatHighlights.forEach((threatHighlight) => {
          const pn = threatHighlight.position?.pageNumber || 1;
          if (!threatsByPage[pn]) threatsByPage[pn] = [];
          threatsByPage[pn].push({
            id: threatHighlight.id,
            text: threatHighlight.text,
            reason: threatHighlight.reason || threatHighlight.metadata?.note || "Security threat detected",
            severity: threatHighlight.severity || "high",
            category: threatHighlight.category || "security",
            confidence: threatHighlight.confidence || 0.8,
            bbox: null,
            position: threatHighlight.position,
            _highlightData: threatHighlight,
          });
        });
        const pages = Object.entries(threatsByPage).map(([pageNum, threats]) => ({
          page: parseInt(pageNum),
          threats,
          totalWords: threats.length,
        }));
        const threatAnalysisResult = {
          pages,
          totalPages: pages.length,
          totalThreats: result.totalThreats,
        };
        setThreats(threatAnalysisResult);
        setTimeout(() => {
          setTimeout(() => {
            document.dispatchEvent(new CustomEvent("threats-ready"));
          }, 100);
        }, 500);
      }
    } catch (error) {
      console.log("Error analyzing PDF for threats:", error);
      setThreats({ pages: [], totalPages: 0, totalThreats: 0 });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate threats analysis for current document
  const generateThreatsAnalysis = async () => {
    if (!documentId || documentId === "test" || !numPages) return;
    setIsAnalyzing(true);
    try {
      const highlightData = await extractPdfTextAsHighlights();
      if (highlightData.length === 0) return;
      const pagesContent = highlightData.reduce((acc, highlight) => {
        const pn = highlight.position.pageNumber;
        let pageData = acc.find((p) => p.pageNumber === pn);
        if (!pageData) {
          pageData = { pageNumber: pn, content: "" };
          acc.push(pageData);
        }
        pageData.content += highlight.text + " ";
        return acc;
      }, []);
      const response = await ApiClient.post("/threats", { documentId, pagesContent });
      if (!response.data.success || !response.data.data?.threats) throw new Error("Invalid response");
      const threatsData = response.data.data.threats;
      const threatHighlights = threatsData.map((threat) => ({
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
      setStoredThreats(threatHighlights);
      setThreats({
        pages: threatsData.map((threat) => ({
          pageNumber: threat.page || 1,
          threats: [threat],
        })),
        totalPages: numPages || 1,
        totalThreats: threatsData.length,
      });
    } catch (error) {
      console.log("Analysis failed:", error);
      setStoredThreats([]);
      setThreats(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Extract PDF text content as highlight-like data structures
  const extractPdfTextAsHighlights = async () => {
    const extractedHighlights = [];
    if (!numPages || !pagesRefs.current) return extractedHighlights;
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const pageElement = pagesRefs.current.get(pageNum);
      if (!pageElement) continue;
      const textSpans = pageElement.querySelectorAll(".react-pdf__Page__textContent span");
      if (textSpans.length === 0) continue;
      const textBlocks = groupTextSpansIntoBlocks(Array.from(textSpans), pageNum);
      textBlocks.forEach((block, blockIndex) => {
        if (block.text.trim().length > 0) {
          extractedHighlights.push({
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
          });
        }
      });
    }
    return extractedHighlights;
  };

  const groupTextSpansIntoBlocks = (spans, pageNumber) => {
    const blocks = [];
    let currentBlock = { text: "", spans: [], startOffset: 0, endOffset: 0 };
    let totalOffset = 0;
    spans.forEach((span, spanIndex) => {
      const spanText = span.textContent || "";
      const trimmedText = spanText.trim();
      if (trimmedText.length === 0) { totalOffset += spanText.length; return; }
      if (currentBlock.spans.length === 0) {
        currentBlock = { text: spanText, spans: [span], startOffset: totalOffset, endOffset: totalOffset + spanText.length };
      } else {
        currentBlock.text += spanText;
        currentBlock.spans.push(span);
        currentBlock.endOffset = totalOffset + spanText.length;
      }
      totalOffset += spanText.length;
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
            endXPath: generateXPath(currentBlock.spans[currentBlock.spans.length - 1]),
          });
        }
        currentBlock = { text: "", spans: [], startOffset: 0, endOffset: 0 };
      }
    });
    if (currentBlock.text.trim().length > 0) {
      blocks.push({
        text: currentBlock.text,
        startOffset: currentBlock.startOffset,
        endOffset: currentBlock.endOffset,
        startXPath: generateXPath(currentBlock.spans[0]),
        endXPath: generateXPath(currentBlock.spans[currentBlock.spans.length - 1]),
      });
    }
    return blocks;
  };

  const generateXPath = (element) => {
    if (!element) return "";
    const path = [];
    let current = element;
    while (current && current !== document.body) {
      let index = 1;
      let sibling = current.previousElementSibling;
      while (sibling) {
        if (sibling.tagName === current.tagName) index++;
        sibling = sibling.previousElementSibling;
      }
      path.unshift(`${current.tagName.toLowerCase()}[${index}]`);
      current = current.parentElement;
    }
    return `/${path.join("/")}`;
  };

  const jumpToThreat = useCallback((threat, pageNumber) => {
    scrollToPage(pageNumber, true);
    const threatHighlight = threat._highlightData;
    if (threatHighlight && threatHighlight.position) {
      setTimeout(() => {
        const highlightElement = document.querySelector(`[data-highlight-id="${threatHighlight.id}"]`);
        if (highlightElement) {
          highlightElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
          highlightElement.style.boxShadow = "0 0 0 4px #f00, 0 0 16px #f00";
          highlightElement.style.transition = "box-shadow 0.2s, transform 0.2s";
          highlightElement.animate(
            [{ transform: "translateX(0px)" }, { transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(0px)" }],
            { duration: 400, easing: "ease" }
          );
          setTimeout(() => { highlightElement.style.boxShadow = "none"; }, 800);
        }
      }, 500);
      return;
    }
    setTimeout(() => {
      const threatId = threat.id || `threat-${pageNumber}`;
      let threatElement = document.querySelector(`[data-threat-id="${threatId}"]`);
      if (!threatElement) {
        const allThreatElements = document.querySelectorAll(".pdf-threat-highlight");
        const found = Array.from(allThreatElements).find((el) =>
          el.textContent?.toLowerCase().includes(threat.text.toLowerCase())
        );
        if (found) threatElement = found;
      }
      if (threatElement) {
        threatElement.scrollIntoView({ behavior: "smooth", block: "center" });
        const threatColor = getThreatColor(threat.severity);
        threatElement.style.boxShadow = `0 0 0 4px ${threatColor.borderColor}, 0 0 16px ${threatColor.borderColor}`;
        threatElement.style.transition = "box-shadow 0.2s, transform 0.2s";
        threatElement.animate(
          [{ transform: "translateX(0px)" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0px)" }],
          { duration: 400, easing: "ease" }
        );
        setTimeout(() => {
          threatElement.style.boxShadow = "";
          threatElement.style.transition = "";
        }, 1000);
      }
    }, 500);
  }, [scrollToPage]);

  const closeContentTab = () => {
    setIsContentVisible(false);
    setCurrentContent(null);
  };

  const removeHighlightById = useCallback(async (highlightId) => {
    try {
      if (documentId) await ApiClient.delete(`/highlights/${highlightId}`);
      if (textLayerRef.current) removeHighlight(textLayerRef.current, highlightId);
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
    } catch (error) {
      console.log("Failed to delete highlight:", error);
      if (textLayerRef.current) removeHighlight(textLayerRef.current, highlightId);
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
    }
  }, [documentId]);

  const clearAllHighlights = () => {
    highlights.forEach((highlight) => {
      if (textLayerRef.current) removeHighlight(textLayerRef.current, highlight.id);
    });
    setHighlights([]);
  };

  const removeExplanationById = useCallback((explanationId) => {
    setStoredExplanations((prev) => prev.filter((e) => e.id !== explanationId));
  }, []);

  const clearAllExplanations = () => setStoredExplanations([]);

  const removeThreatById = useCallback((threatId) => {
    if (textLayerRef.current) removeHighlight(textLayerRef.current, threatId);
    setStoredThreats((prev) => prev.filter((t) => t.id !== threatId));
  }, []);

  const clearAllThreats = () => {
    storedThreats.forEach((threat) => {
      if (textLayerRef.current) removeHighlight(textLayerRef.current, threat.id);
    });
    setStoredThreats([]);
  };

  const addThreatToStorage = useCallback((threat) => {
    setStoredThreats((prev) => [...prev, threat]);
  }, []);

  const jumpToExplanation = useCallback((explanation) => {
    scrollToPage(explanation.pageNumber, false);
    setTimeout(() => {
      const pageElement = pagesRefs.current?.get(explanation.pageNumber);
      if (!pageElement) return;
      const textLayer = pageElement.querySelector(".react-pdf__Page__textContent");
      if (!textLayer) return;
      const textSpans = Array.from(textLayer.querySelectorAll("span"));
      const explanationText = explanation.selectedText.toLowerCase();
      const matchingSpans = [];
      textSpans.forEach((span) => {
        const spanText = (span.textContent || "").toLowerCase();
        if (spanText.includes(explanationText)) matchingSpans.push(span);
      });
      if (matchingSpans.length > 0) {
        matchingSpans.forEach((span) => {
          const originalBorder = span.style.border;
          const originalBoxShadow = span.style.boxShadow;
          const originalTransition = span.style.transition;
          span.style.border = "2px solid #ff0000";
          span.style.boxShadow = "0 0 8px rgba(255, 0, 0, 0.6)";
          span.style.transition = "all 0.3s ease";
          span.animate(
            [{ transform: "scale(1)" }, { transform: "scale(1.02)" }, { transform: "scale(1)" }],
            { duration: 600, easing: "ease-in-out" }
          );
          setTimeout(() => {
            span.style.border = originalBorder;
            span.style.boxShadow = originalBoxShadow;
            span.style.transition = originalTransition;
          }, 2000);
        });
      }
    }, 800);
  }, [scrollToPage]);

  const applyHighlightsToTextLayer = useCallback(
    debounce(() => {
      if (!textLayerRef.current) return;
      const allHighlights = [...highlights, ...storedThreats];
      if (allHighlights.length === 0) return;
      try {
        const validHighlights = allHighlights.filter((highlight) => {
          if (!validateHighlight(highlight)) return false;
          return true;
        });
        if (validHighlights.length > 0) {
          applyHighlights(textLayerRef.current, validHighlights);
        }
        setTimeout(() => {
          validHighlights.forEach((highlight) => {
            const highlightElements = document.querySelectorAll(`[data-highlight-id="${highlight.id}"]`);
            if (!highlightElements.length) return;
            highlightElements.forEach((el) => {
              el.addEventListener("click", (e) => {
                setHighlightContextMenu({
                  highlight,
                  x: e.clientX,
                  y: e.clientY,
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
    [highlights, storedThreats]
  );

  const applyThreatsToTextLayer = useCallback(
    debounce(() => {
      if (!textLayerRef.current || !threats || threats.pages.length === 0) return;
      try {
        document.querySelectorAll(".pdf-threat-highlight").forEach((el) => {
          const parent = el.parentNode;
          if (parent) {
            parent.replaceChild(document.createTextNode(el.textContent || ""), el);
            parent.normalize();
          }
        });
        threats.pages.forEach((threatPage) => {
          const pageElement = pagesRefs.current?.get(threatPage.page);
          if (!pageElement || threatPage.threats.length === 0) return;
          const textLayer = pageElement.querySelector(".react-pdf__Page__textContent");
          if (!textLayer) return;
          threatPage.threats.forEach((threat, index) => {
            let highlightApplied = false;
            const textSpans = pageElement.querySelectorAll(".react-pdf__Page__textContent span");
            Array.from(textSpans).some((span) => {
              if (span.textContent && span.textContent.toLowerCase().includes(threat.text.toLowerCase())) {
                const threatColor = getThreatColor(threat.severity);
                const highlightWrapper = document.createElement("span");
                highlightWrapper.className = "text-highlight pdf-threat-highlight";
                highlightWrapper.setAttribute("data-threat-id", threat.id || `threat-${threatPage.page}-${index}`);
                highlightWrapper.style.backgroundColor = threatColor.backgroundColor;
                highlightWrapper.style.transition = "all 0.2s ease";
                highlightWrapper.style.position = "relative";
                highlightWrapper.style.zIndex = "1";
                highlightWrapper.style.cursor = "pointer";
                highlightWrapper.style.color = "black";
                highlightWrapper.style.fontWeight = "inherit";
                if (threatColor.borderColor) highlightWrapper.style.borderBottom = `1px solid ${threatColor.borderColor}`;
                highlightWrapper.title = `${(threat.severity || "HIGH").toUpperCase()}: ${threat.reason}`;
                const originalText = span.textContent || "";
                const threatTextIndex = originalText.toLowerCase().indexOf(threat.text.toLowerCase());
                if (threatTextIndex !== -1) {
                  const beforeText = originalText.substring(0, threatTextIndex);
                  const threatTextActual = originalText.substring(threatTextIndex, threatTextIndex + threat.text.length);
                  const afterText = originalText.substring(threatTextIndex + threat.text.length);
                  span.innerHTML = "";
                  if (beforeText) span.appendChild(document.createTextNode(beforeText));
                  highlightWrapper.textContent = threatTextActual;
                  span.appendChild(highlightWrapper);
                  if (afterText) span.appendChild(document.createTextNode(afterText));
                  highlightApplied = true;
                  return true;
                }
              }
              return false;
            });
          });
        });
      } catch (error) {
        console.log("Failed to apply threat highlights:", error);
      }
    }, 150),
    [threats]
  );

  const updateHighlightById = async (highlightId, newData) => {
    try {
      if (documentId) {
        const updateData = {};
        if (newData.color) updateData.color = newData.color;
        if (newData.metadata?.note !== undefined) updateData.note = newData.metadata.note;
        if (newData.metadata?.tags !== undefined) updateData.tags = newData.metadata.tags;
        await ApiClient.put(`/highlights/${highlightId}`, updateData);
      }
      setHighlights((prev) =>
        prev.map((h) => (h.id === highlightId ? { ...h, ...newData } : h))
      );
    } catch (error) {
      console.log("Failed to update highlight:", error);
      setHighlights((prev) =>
        prev.map((h) => (h.id === highlightId ? { ...h, ...newData } : h))
      );
    }
  };

  const jumpToHighlight = useCallback((highlight) => {
    const pageElement = pagesRefs.current?.get(highlight.position.pageNumber);
    if (pageElement) {
      const highlightElements = Array.from(
        pageElement.querySelectorAll(`[data-highlight-id="${highlight.id}"]`)
      );
      if (highlightElements.length > 0) {
        highlightElements.forEach((el) => {
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
          el.style.boxShadow = "0 0 0 4px #f00, 0 0 16px #f00";
          el.style.transition = "box-shadow 0.2s, transform 0.2s";
          el.animate(
            [{ transform: "translateX(0px)" }, { transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(0px)" }],
            { duration: 400, easing: "ease" }
          );
          setTimeout(() => { el.style.boxShadow = "none"; }, 800);
        });
      }
    }
  }, []);

  // Apply highlights when they change
  useEffect(() => {
    applyHighlightsToTextLayer();
  }, [applyHighlightsToTextLayer, highlights, storedThreats]);

  // Listen for threats-ready event
  useEffect(() => {
    const handleThreatsReady = () => {
      setTimeout(() => applyHighlightsToTextLayer(), 100);
    };
    document.addEventListener("threats-ready", handleThreatsReady);
    return () => document.removeEventListener("threats-ready", handleThreatsReady);
  }, [applyThreatsToTextLayer, applyHighlightsToTextLayer]);

  // Sync zoom input
  useEffect(() => {
    setZoomInputValue(`${Math.round(zoomLevel * 100)}%`);
  }, [zoomLevel]);

  // Mouse wheel zoom with Ctrl
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (Math.abs(e.deltaY) < 50) return;
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
      containerElement.addEventListener("wheel", handleWheel, { passive: false });
      return () => containerElement.removeEventListener("wheel", handleWheel);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "=": case "+": event.preventDefault(); zoomIn(); break;
          case "-": event.preventDefault(); zoomOut(); break;
          case "0": event.preventDefault(); setZoomLevel(1.0); setZoomInputValue("100%"); break;
        }
      } else {
        switch (event.key) {
          case "ArrowLeft": event.preventDefault(); goToPrevPage(); break;
          case "ArrowRight": event.preventDefault(); goToNextPage(); break;
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevPage, goToNextPage, zoomIn, zoomOut]);

  const onSelection = ({ selectedText, currentPage }) => {
    console.log("Selected text:", selectedText, "Current page:", currentPage);
  };

  const PDFContextData = {
    pdfUrl, documentId, numPages, setNumPages, pageNumber, setPageNumber,
    pdfWidth, setPdfWidth, zoomLevel, setZoomLevel, rotation, setRotation,
    textLayerRef, pagesRefs, pageInputValue, setPageInputValue,
    zoomInputValue, setZoomInputValue, isScrolling,
    isContentVisible, setIsContentVisible, currentContent, setCurrentContent,
    toggleHighlightsTab, toggleExplanationsTab, toggleThreatsTab,
    onLoadSuccess, toolbarPosition, setToolbarPosition,
    toolbarView, setToolbarView,
    goToPrevPage, goToNextPage, scrollToPage, zoomIn, zoomOut,
    setZoomToFit, resetZoom, rotateClockwise,
    handlePageInputChange, handlePageInputKeyDown, handlePageInputBlur, handlePageInputFocus,
    handleZoomInputChange, handleZoomInputKeyDown, handleZoomInputBlur, handleZoomInputFocus,
    validateAndNavigateToPage, validateAndSetZoom,
    onSelection, closeContentTab,
    highlights, setHighlights, removeHighlightById, clearAllHighlights,
    updateHighlightById, jumpToHighlight, applyHighlightsToTextLayer,
    storedExplanations, setStoredExplanations, removeExplanationById,
    clearAllExplanations, jumpToExplanation,
    storedThreats, setStoredThreats, removeThreatById, clearAllThreats, addThreatToStorage,
    threats, setThreats, isAnalyzing, setIsAnalyzing,
    analyzePdfForThreats, generateThreatsAnalysis, jumpToThreat,
    highlightContextMenu, setHighlightContextMenu,
  };

  return (
    <PDFContext.Provider value={PDFContextData}>
      {loading && (
        <div className="bg-background absolute inset-0 z-[100000] flex items-center justify-center">
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
