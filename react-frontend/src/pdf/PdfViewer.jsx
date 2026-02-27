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
import "@/pdf/pdfjs-setup";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { DEFAULT_HIGHLIGHT_COLORS } from "./highlight/types";
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

const DEFAULT_HIGHLIGHT_COLOR = DEFAULT_HIGHLIGHT_COLORS[0];

export default function PdfViewer({ className = "" }) {
  const [selection, setSelection] = useState(null);
  const [isExplaining, startExplaining] = useTransition();
  const [currentHighlightColor, setCurrentHighlightColor] = useLocalState(
    "current-highlight-color",
    DEFAULT_HIGHLIGHT_COLOR
  );
  const [explanation, setExplanation] = useState(null);

  const contextMenuRef = useRef(null);
  const selectionCheckInterval = useRef(null);
  const highlightContextMenuRef = useRef(null);

  const {
    pdfUrl,
    documentId,
    numPages,
    pageNumber,
    pdfWidth,
    zoomLevel,
    rotation,
    textLayerRef,
    pagesRefs,
    onLoadSuccess,
    toolbarPosition,
    toolbarView,
    setHighlights,
    applyHighlightsToTextLayer,
    highlightContextMenu,
    setHighlightContextMenu,
    removeHighlightById,
    setStoredExplanations,
  } = usePDF();

  const clearSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
    setSelection(null);
    setExplanation(null);
  }, []);

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

  const handleMouseUp = useCallback(() => {
    const browserSelection = window.getSelection();
    const selectedText = browserSelection?.toString();
    if (!selectedText?.trim() || !textLayerRef.current || !browserSelection?.rangeCount) {
      setSelection(null);
      setExplanation(null);
      return;
    }
    const range = browserSelection.getRangeAt(0);
    const selectionRect = range.getBoundingClientRect();
    const containerRect = textLayerRef.current.getBoundingClientRect();
    const isStartAboveViewport = selectionRect.top < containerRect.top;
    const shouldShowBelow = isStartAboveViewport || selectionRect.top < 80;
    const centerX = selectionRect.left + selectionRect.width / 2;
    const x = centerX;
    const y = shouldShowBelow ? selectionRect.bottom : selectionRect.top;
    setSelection({ selectedText, currentPage: pageNumber, x, y, selectionRect, shouldShowBelow });
    if (selectionCheckInterval.current) clearInterval(selectionCheckInterval.current);
    selectionCheckInterval.current = setInterval(checkSelection, 100);
  }, [pageNumber, textLayerRef, checkSelection]);

  const handleClickOutside = useCallback((e) => {
    const target = e.target;
    if (contextMenuRef.current && !contextMenuRef.current.contains(target)) {
      const selectedText = window.getSelection()?.toString();
      if (!selectedText?.trim()) {
        setSelection(null);
        setExplanation(null);
      }
    }
  }, []);

  const handleCopy = useCallback(async () => {
    if (selection?.selectedText) {
      try {
        await navigator.clipboard.writeText(selection.selectedText);
        clearSelection();
      } catch (error) {
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

  const handleExplainText = useCallback(async () => {
    startExplaining(async () => {
      if (!selection?.selectedText || isExplaining) return;
      if (!documentId) {
        toast.error("Document ID is missing");
        return;
      }
      try {
        const context = await extractContextText(pdfUrl, pageNumber);
        const payload = {
          selectionText: selection.selectedText,
          currentPageText: context.currentPageText,
          prevPageText: context.prevPageText,
          nextPageText: context.nextPageText,
          page: pageNumber,
          documentId,
        };
        const response = await ApiClient.post("/explanations/text", payload);
        if (response.data.success) {
          const explanationData = response.data.data;
          setExplanation(explanationData);
          if (selection) {
            const currentPageElement = pagesRefs.current?.get(pageNumber);
            let startOffset = 0;
            let endOffset = selection.selectedText.length;
            if (currentPageElement) {
              const pageTextLayer = currentPageElement.querySelector(".react-pdf__Page__textContent");
              if (pageTextLayer) {
                const pageTextContent = pageTextLayer.textContent || "";
                const foundOffset = pageTextContent.indexOf(selection.selectedText);
                if (foundOffset !== -1) {
                  startOffset = foundOffset;
                  endOffset = foundOffset + selection.selectedText.length;
                }
              }
            }
            const storedExplanation = {
              id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              selectedText: selection.selectedText,
              explanation: explanationData,
              position: { startOffset, endOffset, pageNumber },
              createdAt: new Date().toISOString(),
              pageNumber,
            };
            setStoredExplanations((prev) => [...prev, storedExplanation]);
          }
          toast.success("Explanation complete!");
        } else {
          throw new Error(response.data.error?.message || "Failed to get explanation");
        }
      } catch (error) {
        if (error?.response?.status === 503) {
          toast.error("AI service is busy", { description: "Please try again in a few moments." });
        } else if (error?.response?.status === 429) {
          toast.error("Rate limit exceeded");
        } else {
          toast.error("Failed to explain text", {
            description: error?.response?.data?.error?.message || error?.message || "Please try again later.",
          });
        }
      }
    });
  }, [selection, pageNumber, pdfUrl, isExplaining, setStoredExplanations, pagesRefs, documentId]);

  const setPageRef = (pageNumber) => (element) => {
    if (element) {
      pagesRefs.current?.set(pageNumber, element);
    } else {
      pagesRefs.current?.delete(pageNumber);
    }
  };

  const highlightSelectedText = useCallback(
    async (color = currentHighlightColor) => {
      if (selection?.selectedText.trim() && textLayerRef.current && documentId) {
        setCurrentHighlightColor(color);
        const highlight = createHighlightFromSelection(textLayerRef.current, pageNumber, { color });
        if (highlight) {
          try {
            const highlightData = {
              documentId,
              pageNumber: highlight.position.pageNumber,
              position: highlight.position,
              text: highlight.text,
              color: highlight.color,
              note: highlight.metadata?.note || "",
              explanation: "",
              tags: highlight.metadata?.tags || [],
            };
            const response = await ApiClient.post("/highlights", highlightData);
            if (response.data.success) {
              setHighlights((prev) => [...prev, { ...highlight, id: response.data.data.id }]);
            } else {
              throw new Error(response.data.error?.message || "Failed to save highlight");
            }
          } catch (error) {
            console.error("Failed to save highlight:", error);
            setHighlights((prev) => [...prev, highlight]);
          }
        }
        clearSelection();
      }
    },
    [selection, textLayerRef, pageNumber, currentHighlightColor, documentId, clearSelection, setCurrentHighlightColor, setHighlights]
  );

  useEffect(() => {
    if (!textLayerRef.current) return;
    const textLayer = textLayerRef.current;
    textLayer.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("click", handleClickOutside);
    return () => {
      textLayer.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("click", handleClickOutside);
      if (selectionCheckInterval.current) {
        clearInterval(selectionCheckInterval.current);
        selectionCheckInterval.current = null;
      }
    };
  }, [handleMouseUp, handleClickOutside, textLayerRef]);

  const onTextLayerSuccess = useCallback(() => {
    applyHighlightsToTextLayer();
  }, [applyHighlightsToTextLayer]);

  useEffect(() => {
    return () => {
      if (selectionCheckInterval.current) clearInterval(selectionCheckInterval.current);
    };
  }, []);

  if (!pdfUrl) {
    return (
      <div className={cn("flex-1 overflow-auto", className)}>
        <div className="flex h-full items-center justify-center">
          <LoaderCircleIcon className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={textLayerRef}
      className={cn(
        "pdf-container bg-background relative flex w-full flex-col justify-start overflow-scroll p-4",
        toolbarView === "floating" && "h-screen flex-1",
        toolbarView === "fixed" && "flex-1",
        className
      )}
    >
      <Document
        file={pdfUrl}
        onLoadSuccess={onLoadSuccess}
        onLoadError={(error) => console.error("PDF load error:", error)}
        className={cn(
          "flex flex-col",
          toolbarView === "floating" && [toolbarPosition === "top" ? "pt-10" : "pb-10"],
          toolbarView === "fixed" && "p-0"
        )}
        rotate={rotation}
        scale={zoomLevel}
        loading={
          <div>
            <LoaderCircleIcon className="mx-auto size-10 h-full animate-spin" />
          </div>
        }
        error={
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-red-500">Failed to load PDF</p>
            </div>
          </div>
        }
      >
        {numPages &&
          Array.from({ length: numPages }, (_, i) => {
            try {
              return (
                <div
                  key={i + 1}
                  ref={setPageRef(i + 1)}
                  data-page-number={i + 1}
                  className="mx-auto flex justify-center p-10"
                >
                  <div className="border-border relative overflow-hidden border bg-white shadow-lg">
                    <Page
                      pageIndex={i}
                      width={pdfWidth}
                      renderAnnotationLayer={false}
                      renderTextLayer={true}
                      onRenderTextLayerSuccess={applyHighlightsToTextLayer}
                      onRenderError={(error) => console.error(`Error rendering page ${i + 1}:`, error)}
                      className="[&_.react-pdf__Page__textContent]:!leading-[1.0] [&_.react-pdf__Page__textContent>span]:!leading-[1.0] [&_.react-pdf__Page__textContent]:!tracking-normal"
                    />
                  </div>
                </div>
              );
            } catch (error) {
              console.error(`Failed to create page ${i + 1}:`, error);
              return null;
            }
          })}
      </Document>

      <AnimatePresence>
        {selection && (
          <motion.div
            ref={contextMenuRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            className={cn(
              "bg-card border-border fixed z-[100000] rounded-md border p-2 px-3 shadow-lg",
              "flex flex-col gap-2"
            )}
            style={{
              left: Math.min(Math.max(selection.x - 60, 10), window.innerWidth - 130),
              top: selection.shouldShowBelow
                ? Math.min(selection.y + 10, window.innerHeight - 80)
                : Math.max(selection.y - 60, 10),
              transform: selection.shouldShowBelow ? "translateY(0)" : "translateY(-100%)",
            }}
          >
            <div className="flex flex-row items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="flex items-center gap-2 text-sm">
                <CopyIcon /> Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleExplainText} disabled={isExplaining || !!explanation} className="flex items-center gap-2 text-sm">
                {isExplaining ? <LoaderCircleIcon className="animate-spin" /> : <MessageCircleQuestionIcon />}
                Explain
              </Button>
              <div className="border-border flex h-full flex-row items-center gap-2 border-l pl-2">
                <span>Highlight</span>
                <div className="flex flex-row items-center">
                  <Button
                    type="button"
                    variant="outline"
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
                      <Button size="sm" variant="outline" className="rounded-l-none px-0">
                        <ChevronDownIcon />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="flex w-max translate-y-2 flex-row gap-1">
                      {DEFAULT_HIGHLIGHT_COLORS.map((color, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => highlightSelectedText(color)}
                          className="flex items-center gap-2 text-sm text-black"
                          style={{ backgroundColor: color.backgroundColor, borderColor: color.borderColor }}
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
            transition={{ duration: 0.15, type: "spring", stiffness: 500, damping: 30 }}
            style={{ left: highlightContextMenu.x, top: highlightContextMenu.y, pointerEvents: "auto" }}
            onMouseLeave={() => setHighlightContextMenu(null)}
            className={cn(
              "bg-card border-border rounded-2xl border p-2 shadow-md",
              "absolute top-0 left-0 z-[100000]",
              "flex w-40 flex-col items-stretch gap-2"
            )}
            onClick={(e) => { setHighlightContextMenu(null); e.stopPropagation(); e.preventDefault(); }}
          >
            <span>Note: {highlightContextMenu.highlight.metadata.note ?? "No note"}</span>
            <Separator />
            <Button variant="destructive" onClick={() => removeHighlightById(highlightContextMenu.highlight.id)}>
              <Trash2Icon /> Delete
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
