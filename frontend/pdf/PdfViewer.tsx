"use client";
import { cn } from "@/lib/utils";
import { usePDF } from "@/pdf/PdfProvider";
import {
  ChevronDownIcon,
  CopyIcon,
  HighlighterIcon,
  LoaderCircleIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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

export default function PdfViewer({ className = "" }: { className?: string }) {
  const [selection, setSelection] = useState<{
    selectedText: string;
    currentPage: number;
    x: number;
    y: number;
    selectionRect: DOMRect;
    shouldShowBelow: boolean;
  } | null>(null);

  const [currentHighlightColor, setCurrentHighlightColor] =
    useLocalState<HighlightColor>(
      "current-highlight-color",
      DEFAULT_HIGHLIGHT_COLOR
    );

  const contextMenuRef = useRef<HTMLDivElement>(null);
  const selectionCheckInterval = useRef<NodeJS.Timeout | null>(null);

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
    highlights,
    setHighlights,
  } = usePDF();

  // Clear text selection
  const clearSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
    setSelection(null);
  }, []);

  // Check if text is still selected
  const checkSelection = useCallback(() => {
    const currentSelection = window.getSelection();
    const selectedText = currentSelection?.toString();

    if (!selectedText?.trim()) {
      setSelection(null);
      if (selectionCheckInterval.current) {
        clearInterval(selectionCheckInterval.current);
        selectionCheckInterval.current = null;
      }
    }
  }, []);

  // Handle text selection
  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      console.log(e);
      const browserSelection = window.getSelection();
      const selectedText = browserSelection?.toString();

      if (
        !selectedText?.trim() ||
        !textLayerRef.current ||
        !browserSelection?.rangeCount
      ) {
        setSelection(null);
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
    [pageNumber, textLayerRef, checkSelection]
  );

  // Handle clicks outside context menu
  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as Node;

    // If clicking outside the context menu and not on selected text
    if (contextMenuRef.current && !contextMenuRef.current.contains(target)) {
      const selectedText = window.getSelection()?.toString();
      if (!selectedText?.trim()) {
        setSelection(null);
      }
    }
  }, []);

  // Handle copy action
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

  // Helper function to set page ref
  const setPageRef =
    (pageNumber: number) => (element: HTMLDivElement | null) => {
      if (element) {
        pagesRefs.current?.set(pageNumber, element);
      } else {
        pagesRefs.current?.delete(pageNumber);
      }
    };

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
    [selection, textLayerRef, pageNumber, currentHighlightColor]
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
              "flex flex-row items-center gap-2"
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
