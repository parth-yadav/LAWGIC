"use client";

// ========================================
// IMPORTS
// ========================================

import { cn } from "@/lib/utils";
import { usePDF } from "@/pdf/PdfProvider";
import {
  ChevronDownIcon,
  CopyIcon,
  HighlighterIcon,
  LoaderCircleIcon,
  MessageCircleQuestionIcon,
  Trash2Icon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Document, Page } from "react-pdf";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_HIGHLIGHT_COLOR,
  DEFAULT_HIGHLIGHT_COLORS,
  HighlightColor,
} from "./highlight/types";
import useLocalState from "@/hooks/useLocalState";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createHighlightFromSelection } from "./highlight/utils";
import { Separator } from "@/components/ui/separator";
import ApiClient from "@/utils/ApiClient";
import { extractContextText } from "./explain/extractContext";
import { ExplanationData, StoredExplanation } from "./explanation/types";
import { toast } from "sonner";

// ========================================
// TYPES AND INTERFACES
// ========================================

/**
 * Represents an active text selection in the PDF viewer
 */
interface TextSelection {
  selectedText: string;
  currentPage: number;
  x: number;
  y: number;
  selectionRect: DOMRect;
  shouldShowBelow: boolean;
}

// ========================================
// MAIN COMPONENT
// ========================================

/**
 * PdfViewer Component
 *
 * Main PDF viewing component that handles:
 * - PDF document rendering with react-pdf
 * - Text selection and highlight creation
 * - Context menus for highlight actions
 * - Keyboard and mouse interactions
 *
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} The PDF viewer component
 */
export default function PdfViewer({ className = "" }: { className?: string }) {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [isExplaining, startExplaining] = useTransition();
  const [currentHighlightColor, setCurrentHighlightColor] =
    useLocalState<HighlightColor>(
      "current-highlight-color",
      DEFAULT_HIGHLIGHT_COLOR
    );
  const [explanation, setExplanation] = useState<ExplanationData | null>(null);

  // ========================================
  // REFS
  // ========================================

  const contextMenuRef = useRef<HTMLDivElement>(null);
  const selectionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const highlightContextMenuRef = useRef<HTMLDivElement | null>(null);

  // ========================================
  // CONTEXT VALUES
  // ========================================

  const {
    pdfUrl,
    numPages,
    pageNumber,
    pdfWidth,
    zoomLevel,
    rotation,
    textLayerRef,
    pagesRefs,
    onLoadSuccess,
    toolbarPosition,
    setHighlights,
    applyHighlightsToTextLayer,
    highlightContextMenu,
    setHighlightContextMenu,
    removeHighlightById,
    setStoredExplanations,
  } = usePDF();

  // ========================================
  // SELECTION MANAGEMENT FUNCTIONS
  // ========================================

  /**
   * Clears the current text selection and resets selection state
   */
  const clearSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
    setSelection(null);
    setExplanation(null);
  }, []);

  /**
   * Checks if text is still selected and updates state accordingly
   * Used to detect when selection is lost
   */
  const checkSelection = useCallback(() => {
    const currentSelection = window.getSelection();
    const selectedText = currentSelection?.toString();

    if (!selectedText?.trim()) {
      setSelection(null);
      setExplanation(null);
      if (selectionCheckInterval.current) {
        clearInterval(selectionCheckInterval.current);
        selectionCheckInterval.current = null;
      }
    }
  }, []);

  /**
   * Handles mouse up events to detect text selections
   * Creates selection state for context menu positioning
   */
  const handleMouseUp = useCallback(
    () => {
      const browserSelection = window.getSelection();
      const selectedText = browserSelection?.toString();

      if (
        !selectedText?.trim() ||
        !textLayerRef.current ||
        !browserSelection?.rangeCount
      ) {
        setSelection(null);
        setExplanation(null);
        return;
      }

      // Get the selection range and its bounding rectangle
      const range = browserSelection.getRangeAt(0);
      const selectionRect = range.getBoundingClientRect();

      // Get the container bounds to check if selection is visible
      const containerRect = textLayerRef.current.getBoundingClientRect();

      // Check if the start of the selection is above the visible area
      const isStartAboveViewport = selectionRect.top < containerRect.top;

      // Determine if we should show the menu below the selection
      const shouldShowBelow = isStartAboveViewport || selectionRect.top < 80; // 80px buffer for menu height

      // Calculate the center horizontal position of the selection
      const centerX = selectionRect.left + selectionRect.width / 2;

      // Use selection bounds instead of mouse position for more accurate positioning
      const x = centerX;
      const y = shouldShowBelow ? selectionRect.bottom : selectionRect.top;

      setSelection({
        selectedText,
        currentPage: pageNumber,
        x,
        y,
        selectionRect,
        shouldShowBelow,
      });

      // Start checking if selection still exists
      if (selectionCheckInterval.current) {
        clearInterval(selectionCheckInterval.current);
      }
      selectionCheckInterval.current = setInterval(checkSelection, 100);
    },
    [pageNumber, textLayerRef, checkSelection]
  );

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Handles clicks outside context menus to close them
   */
  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as Node;

    // If clicking outside the context menu and not on selected text
    if (contextMenuRef.current && !contextMenuRef.current.contains(target)) {
      const selectedText = window.getSelection()?.toString();
      if (!selectedText?.trim()) {
        setSelection(null);
        setExplanation(null);
      }
    }
  }, []);

  /**
   * Handles copy action for selected text
   * Supports both modern clipboard API and fallback for older browsers
   */
  const handleCopy = useCallback(async () => {
    if (selection?.selectedText) {
      try {
        await navigator.clipboard.writeText(selection.selectedText);
        clearSelection();
      } catch (error) {
        console.error("Failed to copy text:", error);
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = selection.selectedText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        clearSelection();
      }
    }
  }, [selection, clearSelection]);

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Handles the explain action for selected text
   * Extracts context and sends to AI for explanation
   */
  const handleExplainText = useCallback(async () => {
    startExplaining(async () => {
      if (!selection?.selectedText || isExplaining) return;

      try {
        // Extract context text from PDF
        const context = await extractContextText(pdfUrl, pageNumber);

        // Prepare payload for API
        const payload = {
          selectionText: selection.selectedText,
          currentPageText: context.currentPageText,
          prevPageText: context.prevPageText,
          nextPageText: context.nextPageText,
          page: pageNumber,
        };

        const response = await ApiClient.post("/explain/text", payload);

        if (response.data.success) {
          const explanationData: ExplanationData = response.data.data;
          console.log("Explanation received:", explanationData);
          setExplanation(explanationData);

          // Saving to localStorage
          if (selection) {
            // Get the current page element to ensure we're storing page-relative information
            const currentPageElement = pagesRefs.current?.get(pageNumber);
            let pageTextContent = "";
            let startOffset = -1;
            
            if (currentPageElement) {
              const pageTextLayer = currentPageElement.querySelector('.react-pdf__Page__textContent');
              if (pageTextLayer) {
                pageTextContent = pageTextLayer.textContent || "";
                startOffset = pageTextContent.indexOf(selection.selectedText);
                /* debug logs*/
                console.log('Saving explanation for page:', pageNumber);
                console.log('Page text length:', pageTextContent.length);
                console.log('Selected text:', `"${selection.selectedText}"`);
                console.log('Found at page offset:', startOffset);
              }
            }
            
            // Only save if we found the text on the current page....will work on this later DW
            if (startOffset !== -1) {
              const endOffset = startOffset + selection.selectedText.length;

              const storedExplanation: StoredExplanation = {
                id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                selectedText: selection.selectedText,
                explanation: explanationData,
                position: {
                  startOffset,
                  endOffset,
                  pageNumber
                },
                createdAt: new Date().toISOString(),
                pageNumber
              };

              setStoredExplanations(prev => [...prev, storedExplanation]);
              console.log('Saved explanation successfully:', storedExplanation);
            } else {
              console.warn('Could not find selected text on current page, not saving explanation');
            }
          }
          
          toast.success("Explanation complete!");
        } else {
          throw new Error(response.data.error?.message || "Failed to get explanation");
        }
      } catch (error: unknown) {
        console.error("Error explaining text:", error);

        //type gurading shit (dont mind)
        const isAxiosError = (err: unknown): err is { response?: { status: number; data?: { error?: { message: string } } } } => {
          return typeof err === 'object' && err !== null && 'response' in err;
        };

        // Type guarding shit..normal error
        const isError = (err: unknown): err is Error => {
          return err instanceof Error;
        };

        if(isAxiosError(error)){
          if (error.response?.status === 503) {
            toast.error("AI service is busy", {
              description: "The service is temporarily overloaded. Please try again in a few moments.",
              action: {
                label: "Retry",
                onClick: () => handleExplainText(),
              },
            });
          } else if (error.response?.status === 429) {
            toast.error("Rate limit exceeded", {
              description: "Please wait a moment before trying again.",
            });
          } else {
            toast.error("Failed to explain text", {
              description: error.response?.data?.error?.message || "Please try again later.",
              action: {
                label: "Retry",
                onClick: () => handleExplainText(),
              },
            });
          }
        }else if(isError(error)){
          toast.error("Failed to explain text",{
            description: error.message || "Please try again later.",
            action:{
              label: "Retry",
              onClick: () => handleExplainText(),
            },
          });
        }else{
          toast.error("failed to explain text",{
            description: "An unexpected error occurred. Please try again later.",
            action:{
              label: "Retry",
              onClick: () => handleExplainText(),
            },
          });
        }
      }
    });
  }, [
    selection,
    pageNumber,
    pdfUrl,
    isExplaining,
    setStoredExplanations,
    pagesRefs,
  ]);

  /**
   * Helper function to set page ref in the pages ref map
   * @param {number} pageNumber - The page number
   * @returns {Function} Function to set the element ref
   */
  const setPageRef =
    (pageNumber: number) => (element: HTMLDivElement | null) => {
      if (element) {
        pagesRefs.current?.set(pageNumber, element);
      } else {
        pagesRefs.current?.delete(pageNumber);
      }
    };

  // ========================================
  // HIGHLIGHT FUNCTIONS
  // ========================================

  /**
   * Creates a highlight from the current text selection
   * @param {HighlightColor} color - The color to use for the highlight
   */
  const highlightSelectedText = useCallback(
    (color: HighlightColor = currentHighlightColor) => {
      if (selection?.selectedText.trim() && textLayerRef.current) {
        setCurrentHighlightColor(color);

        const highlight = createHighlightFromSelection(
          textLayerRef.current,
          pageNumber,
          { color }
        );
        if (highlight) {
          setHighlights((prev) => [...prev, highlight]);
        }
        clearSelection();
      }
    },
    [selection, textLayerRef, pageNumber, currentHighlightColor, clearSelection, setCurrentHighlightColor, setHighlights]
  );

  // Set up event listeners
  useEffect(() => {
    if (!textLayerRef.current) return;

    const textLayer = textLayerRef.current;

    // Add mouseup listener for text selection
    textLayer.addEventListener("mouseup", handleMouseUp);

    // Add global click listener to handle clicks outside
    document.addEventListener("click", handleClickOutside);

    return () => {
      textLayer.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("click", handleClickOutside);

      // Clear selection check interval
      if (selectionCheckInterval.current) {
        clearInterval(selectionCheckInterval.current);
        selectionCheckInterval.current = null;
      }
    };
  }, [handleMouseUp, handleClickOutside, textLayerRef]);

  // ========================================
  // COMBINED CALLBACKS
  // ========================================

  /**
   * Combined callback that applies highlights (including threats) when text layer is rendered
   */
  const onTextLayerSuccess = useCallback(() => {
    applyHighlightsToTextLayer();
  }, [applyHighlightsToTextLayer]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (selectionCheckInterval.current) {
        clearInterval(selectionCheckInterval.current);
      }
    };
  }, []);

  return (
    <div
      ref={textLayerRef}
      className={`pdf-container relative w-full h-screen bg-background flex flex-col flex-1 justify-start p-4 overflow-scroll ${className}`}
    >
      <Document
        file={pdfUrl}
        onLoadSuccess={onLoadSuccess}
        className={cn(
          "flex flex-col",
          toolbarPosition === "top" ? "pt-10" : "pb-10"
        )}
        rotate={rotation}
        scale={zoomLevel}
        loading={
          <div>
            <LoaderCircleIcon className="animate-spin h-full mx-auto size-10" />
          </div>
        }
      >
        {numPages &&
          Array.from({ length: numPages }, (_, i) => (
            <div
              key={i + 1}
              ref={setPageRef(i + 1)}
              data-page-number={i + 1}
              className="mx-auto p-10"
            >
              <Page
                pageIndex={i}
                width={pdfWidth}
                renderAnnotationLayer={false}
                renderTextLayer={true}
                onRenderTextLayerSuccess={onTextLayerSuccess}
                className="border border-border shadow-lg bg-white"
              />
            </div>
          ))}
      </Document>

      <AnimatePresence>
        {selection && (
          <motion.div
            ref={contextMenuRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className={cn(
              "fixed bg-card p-2 px-3 rounded-md shadow-lg border-border border z-100000",
              "flex flex-col gap-2"
            )}
            style={{
              left: Math.min(
                Math.max(selection.x - 60, 10), // Center the menu and prevent left overflow
                window.innerWidth - 130 // Prevent right overflow (menu width ~120px + margin)
              ),
              top: selection.shouldShowBelow
                ? Math.min(selection.y + 10, window.innerHeight - 80) // Below selection with margin
                : Math.max(selection.y - 60, 10), // Above selection with margin
              transform: selection.shouldShowBelow
                ? "translateY(0)"
                : "translateY(-100%)",
            }}
          >
            <div className="flex flex-row items-center gap-2">
              <Button
                type="button"
                variant={"outline"}
                size="sm"
                onClick={handleCopy}
                className="flex items-center gap-2 text-sm"
              >
                <CopyIcon />
                Copy
              </Button>

              <Button
                variant={"outline"}
                size="sm"
                onClick={handleExplainText}
                disabled={isExplaining || !!explanation}
                className="flex items-center gap-2 text-sm"
              >
                {isExplaining ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  <MessageCircleQuestionIcon />
                )}
                Explain
              </Button>

              <div className="flex flex-row items-center gap-2 pl-2 h-full border-l border-border">
                <span>Highlight</span>
                <div className="flex flex-row items-center">
                  <Button
                    type="button"
                    variant={"outline"}
                    size="sm"
                    onClick={() => highlightSelectedText()}
                    className="flex items-center gap-2 text-sm rounded-r-none text-black"
                    style={{
                      backgroundColor: currentHighlightColor.backgroundColor,
                      borderColor: currentHighlightColor.borderColor,
                    }}
                  >
                    <HighlighterIcon />
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        size={"sm"}
                        variant={"outline"}
                        className={"px-0 rounded-l-none"}
                      >
                        <ChevronDownIcon />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="translate-y-2 flex flex-row gap-1 w-max">
                      {DEFAULT_HIGHLIGHT_COLORS.map((color, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant={"outline"}
                          size="sm"
                          onClick={() => highlightSelectedText(color)}
                          className="flex items-center gap-2 text-sm text-black"
                          style={{
                            backgroundColor: color.backgroundColor,
                            borderColor: color.borderColor,
                          }}
                        >
                          <HighlighterIcon />
                        </Button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <AnimatePresence>
              {explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-2 p-2 bg-muted text-sm rounded-md overflow-y-auto text-muted-foreground"
                >
                  {explanation.meaning}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {highlightContextMenu && (
          <motion.div
            ref={highlightContextMenuRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              duration: 0.15,
              type: "spring",
              stiffness: 500,
              damping: 30,
            }}
            style={{
              left: highlightContextMenu.x,
              top: highlightContextMenu.y,
              pointerEvents: "auto",
            }}
            onMouseLeave={() => setHighlightContextMenu(null)}
            className={cn(
              "bg-card border border-border rounded-2xl shadow-md p-2",
              "absolute top-0 left-0 z-[100000]",
              "flex flex-col items-stretch w-40 gap-2"
            )}
            onClick={(e) => {
              setHighlightContextMenu(null);
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <span>
              Note: {highlightContextMenu.highlight.metadata.note ?? "No note"}
            </span>
            <Separator />

            <Button
              variant={"destructive"}
              onClick={() =>
                removeHighlightById(highlightContextMenu.highlight.id)
              }
            >
              <Trash2Icon />
              Delete
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
