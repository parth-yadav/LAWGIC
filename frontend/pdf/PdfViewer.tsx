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
  Highlight,
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
      DEFAULT_HIGHLIGHT_COLOR,
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
    (e: MouseEvent) => {
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
      const isStartBelowViewport = selectionRect.bottom > containerRect.bottom;

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
    [pageNumber, textLayerRef, checkSelection],
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
          const explanationData = response.data.data;
          console.log("Explanation received:", explanationData);
          setExplanation(explanationData);
        } else {
          console.error("Failed to get explanation:", response.data.error);
        }
      } catch (error) {
        console.error("Error explaining text:", error);
      } finally {
        toast.success("Explanation complete !!");
      }
    });
  }, [
    selection,
    pageNumber,
    pdfUrl,
    isExplaining,
    clearSelection,
    textLayerRef,
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
          { color },
        );
        if (highlight) {
          setHighlights((prev) => [...prev, highlight]);
        }
        clearSelection();
      }
    },
    [selection, textLayerRef, pageNumber, currentHighlightColor],
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
  }, [handleMouseUp, handleClickOutside]);

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
      className={`pdf-container bg-background relative flex h-screen w-full flex-1 flex-col justify-start overflow-scroll p-4 ${className}`}
    >
      <Document
        file={pdfUrl}
        onLoadSuccess={onLoadSuccess}
        className={cn(
          "flex flex-col",
          toolbarPosition === "top" ? "pt-10" : "pb-10",
        )}
        rotate={rotation}
        scale={zoomLevel}
        loading={
          <div>
            <LoaderCircleIcon className="mx-auto size-10 h-full animate-spin" />
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
                onRenderTextLayerSuccess={applyHighlightsToTextLayer}
                className="border-border border bg-white shadow-lg"
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
              "bg-card border-border fixed z-100000 rounded-md border p-2 px-3 shadow-lg",
              "flex flex-col gap-2",
            )}
            style={{
              left: Math.min(
                Math.max(selection.x - 60, 10), // Center the menu and prevent left overflow
                window.innerWidth - 130, // Prevent right overflow (menu width ~120px + margin)
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

              <div className="border-border flex h-full flex-row items-center gap-2 border-l pl-2">
                <span>Highlight</span>
                <div className="flex flex-row items-center">
                  <Button
                    type="button"
                    variant={"outline"}
                    size="sm"
                    onClick={() => highlightSelectedText()}
                    className="flex items-center gap-2 rounded-r-none text-sm text-black"
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
                        className={"rounded-l-none px-0"}
                      >
                        <ChevronDownIcon />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="flex w-max translate-y-2 flex-row gap-1">
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
                  className="bg-muted text-muted-foreground mt-2 overflow-y-auto rounded-md p-2 text-sm"
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
              "bg-card border-border rounded-2xl border p-2 shadow-md",
              "absolute top-0 left-0 z-[100000]",
              "flex w-40 flex-col items-stretch gap-2",
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
