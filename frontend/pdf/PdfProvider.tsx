"use client";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { pdfjs } from "react-pdf";

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
import { Highlight, Threat, ThreatAnalysisResult, getThreatColor } from "./highlight/types";
import {
  applyHighlights,
  debounce,
  removeHighlight,
  validateHighlight,
} from "./highlight/utils";

type PDFContextType = {
  pdfUrl: string;
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
  currentContent: "highlights" | "threats" | null;
  setCurrentContent: React.Dispatch<React.SetStateAction<"highlights" | "threats" | null>>;
  toggleHighlightsTab: () => void;
  toggleThreatsTab: () => void;
  toolbarPosition: "top" | "bottom";
  setToolbarPosition: React.Dispatch<React.SetStateAction<"top" | "bottom">>;
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
    newData: Partial<Highlight>
  ) => void;
  jumpToHighlight: (highlight: Highlight) => void;
  applyHighlightsToTextLayer: () => void;

  // Threat detection state and functions
  threats: ThreatAnalysisResult | null;
  setThreats: React.Dispatch<React.SetStateAction<ThreatAnalysisResult | null>>;
  isAnalyzing: boolean;
  setIsAnalyzing: React.Dispatch<React.SetStateAction<boolean>>;
  analyzePdfForThreats: (file: File) => Promise<void>;
  jumpToThreat: (threat: Threat, pageNumber: number) => void;
  applyThreatsToTextLayer: () => void;

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

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export const PDFProvider = ({
  pdfUrl,
  children,
}: {
  pdfUrl: string;
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
  const [currentContent, setCurrentContent] = useState<"highlights" | "threats" | null>(
    null
  );
  const [toolbarPosition, setToolbarPosition] = useLocalState<"top" | "bottom">(
    "pdf-toolbar-position",
    "bottom"
  );
  const [highlights, setHighlights] = useLocalState<Highlight[]>(
    "highlights",
    []
  );
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
              entry.target.getAttribute("data-page-number") || "0"
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
      }
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
    [numPages, pageNumber, scrollToPage]
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
    [zoomLevel]
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
    try {
      // Extract word data from PDF using react-pdf
      const wordsData: { [pageNumber: number]: any[] } = {};
      
      // This would need to be implemented to extract words from the current PDF
      // For now, we'll create a basic implementation
      for (let pageNum = 1; pageNum <= (numPages || 1); pageNum++) {
        const pageElement = pagesRefs.current?.get(pageNum);
        if (pageElement) {
          const textSpans = pageElement.querySelectorAll('.react-pdf__Page__textContent span');
          const words = Array.from(textSpans).map((span, index) => {
            const rect = span.getBoundingClientRect();
            return {
              text: span.textContent || '',
              bbox: {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height
              }
            };
          });
          wordsData[pageNum] = words;
        }
      }

      // Send to backend for analysis
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('wordsData', JSON.stringify(wordsData));

      const response = await fetch('http://localhost:4000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze PDF');
      }

      const result: ThreatAnalysisResult = await response.json();
      setThreats(result);
    } catch (error) {
      console.error('Error analyzing PDF:', error);
      // Set empty result on error
      setThreats({
        pages: [],
        totalPages: 0,
        totalThreats: 0
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const jumpToThreat = useCallback(
    (threat: Threat, pageNumber: number) => {
      // Scroll to page first
      scrollToPage(pageNumber, true);
      
      // Find the threat highlight element using the threat ID
      setTimeout(() => {
        const threatId = threat.id || `threat-${pageNumber}`;
        const threatElements = document.querySelectorAll(
          `[data-threat-id="${threatId}"], [data-threat-id*="${threatId}"]`
        );
        
        // Find the specific threat element
        let threatElement = threatElements[0];
        
        // If not found by ID, fallback to text matching
        if (!threatElement) {
          const allThreatElements = document.querySelectorAll('.pdf-threat-highlight');
          const foundElement = Array.from(allThreatElements).find(el => 
            el.textContent?.toLowerCase().includes(threat.text.toLowerCase())
          );
          if (foundElement) {
            threatElement = foundElement;
          }
        }
        
        if (threatElement) {
          threatElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
          
          // Add flash effect to highlight the threat
          const originalBoxShadow = (threatElement as HTMLElement).style.boxShadow;
          const originalTransition = (threatElement as HTMLElement).style.transition;
          
          const threatColor = getThreatColor(threat.severity);
          (threatElement as HTMLElement).style.boxShadow = `0 0 0 4px ${threatColor.borderColor}, 0 0 16px ${threatColor.borderColor}`;
          (threatElement as HTMLElement).style.transition = 'box-shadow 0.2s, transform 0.2s';
          
          // Animate the element
          threatElement.animate(
            [
              { transform: "translateX(0px)" },
              { transform: "translateX(-4px)" },
              { transform: "translateX(4px)" },
              { transform: "translateX(0px)" },
            ],
            { duration: 400, easing: "ease" }
          );
          
          setTimeout(() => {
            (threatElement as HTMLElement).style.boxShadow = originalBoxShadow;
            (threatElement as HTMLElement).style.transition = originalTransition;
          }, 1000);
        } else {
          console.warn(`Could not find threat element for "${threat.text}" on page ${pageNumber}`);
        }
      }, 500);
    },
    [scrollToPage]
  );

  const closeContentTab = () => {
    setIsContentVisible(false);
    setCurrentContent(null);
  };

  const removeHighlightById = useCallback(
    (highlightId: string) => {
      if (textLayerRef.current) {
        removeHighlight(textLayerRef.current, highlightId);
      }
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
    },
    [textLayerRef]
  );

  const clearAllHighlights = () => {
    highlights.forEach((highlight) => {
      if (textLayerRef.current) {
        removeHighlight(textLayerRef.current, highlight.id);
      }
    });
    setHighlights([]);
  };

  const applyHighlightsToTextLayer = useCallback(
    debounce(() => {
      if (!textLayerRef.current || highlights.length === 0) return;

      try {
        // Filter valid highlights - apply all highlights for now to debug the issue
        const validHighlights = highlights.filter((highlight) => {
          if (!validateHighlight(highlight)) {
            console.warn("Invalid highlight found:", highlight);
            return false;
          }
          return true; // Apply all highlights, remove page filtering for now
        });

        if (validHighlights.length > 0) {
          applyHighlights(textLayerRef.current, validHighlights);
        }

        setTimeout(() => {
          validHighlights.forEach((highlight) => {
            const highlightElements = document.querySelectorAll(
              `[data-highlight-id="${highlight.id}"]`
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
        console.error("Failed to apply highlights:", error);
      }
    }, 150),
    [textLayerRef, highlights]
  );

  const applyThreatsToTextLayer = useCallback(
    debounce(() => {
      if (!textLayerRef.current || !threats || threats.pages.length === 0) return;

      try {
        // Remove existing threat highlights first
        const existingThreatHighlights = document.querySelectorAll('.pdf-threat-highlight');
        existingThreatHighlights.forEach(el => {
          const parent = el.parentNode;
          if (parent) {
            // Replace the highlight with plain text
            parent.replaceChild(document.createTextNode(el.textContent || ''), el);
            // Normalize the parent to merge adjacent text nodes
            parent.normalize();
          }
        });

        // Find threats for the current page
        const currentPageThreats = threats.pages.find(page => page.page === pageNumber);
        if (!currentPageThreats || currentPageThreats.threats.length === 0) return;

        // Apply highlights for current page threats that have position information
        const pageElement = pagesRefs.current?.get(pageNumber);
        if (pageElement) {
          currentPageThreats.threats.forEach((threat, index) => {
            // Skip threats without position information
            if (!threat.position || !threat.wordIndices || threat.wordIndices.length === 0) {
              console.warn(`Skipping threat "${threat.text}" - no position information`);
              return;
            }

            const textSpans = pageElement.querySelectorAll('.react-pdf__Page__textContent span');
            
            // Use the word indices to find the exact spans to highlight
            threat.wordIndices?.forEach((wordIndex: number) => {
              if (wordIndex < textSpans.length) {
                const span = textSpans[wordIndex];
                if (span && span.textContent) {
                  const threatColor = getThreatColor(threat.severity);
                  
                  // Create highlight wrapper
                  const highlightWrapper = document.createElement('span');
                  highlightWrapper.className = 'pdf-threat-highlight';
                  highlightWrapper.setAttribute('data-threat-id', threat.id || `threat-${pageNumber}-${index}`);
                  highlightWrapper.style.backgroundColor = threatColor.backgroundColor;
                  highlightWrapper.style.borderBottom = `2px solid ${threatColor.borderColor}`;
                  highlightWrapper.style.cursor = 'pointer';
                  highlightWrapper.style.borderRadius = '2px';
                  highlightWrapper.style.padding = '1px 2px';
                  highlightWrapper.title = `${threat.severity?.toUpperCase() || 'HIGH'}: ${threat.reason}`;
                  
                  // Wrap the entire span content
                  highlightWrapper.textContent = span.textContent;
                  
                  // Replace the span content with the highlighted version
                  span.innerHTML = '';
                  span.appendChild(highlightWrapper);
                }
              }
            });
          });

          console.log(`✅ Applied ${currentPageThreats.threats.filter(t => t.position && t.wordIndices).length} threat highlights to page ${pageNumber}`);
        }
      } catch (error) {
        console.error("Failed to apply threat highlights:", error);
      }
    }, 150),
    [textLayerRef, threats, pageNumber, pagesRefs]
  );

  const updateHighlightById = (
    highlightId: string,
    newData: Partial<Highlight>
  ) => {
    setHighlights((prev) =>
      prev.map((highlight) =>
        highlight.id === highlightId ? { ...highlight, ...newData } : highlight
      )
    );
  };

  const jumpToHighlight = useCallback(
    (highlight: Highlight) => {
      const pageElement = pagesRefs.current?.get(highlight.position.pageNumber);
      if (pageElement) {
        // Find the highlight span by data-highlight-id
        const highlightElements = Array.from(
          pageElement.querySelectorAll(`[data-highlight-id="${highlight.id}"]`)
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
              { duration: 400, easing: "ease" }
            );
            setTimeout(() => {
              highlightElement.style.boxShadow = "none";
            }, 800);
          });
        }
      }
    },
    [pagesRefs]
  );

  useEffect(() => {
    applyHighlightsToTextLayer();
  }, [applyHighlightsToTextLayer, highlights, textLayerRef.current]);

  useEffect(() => {
    applyThreatsToTextLayer();
  }, [applyThreatsToTextLayer, threats, textLayerRef.current, pageNumber]);

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
    toggleThreatsTab,
    onLoadSuccess,
    toolbarPosition,
    setToolbarPosition,
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
    threats,
    setThreats,
    isAnalyzing,
    setIsAnalyzing,
    analyzePdfForThreats,
    jumpToThreat,
    applyThreatsToTextLayer,
    highlightContextMenu,
    setHighlightContextMenu,
  };

  return (
    <PDFContext.Provider value={PDFContextData}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-100000">
          <LoaderCircleIcon className="animate-spin size-20" />
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
