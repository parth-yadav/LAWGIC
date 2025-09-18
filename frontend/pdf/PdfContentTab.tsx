"use client";

// ========================================
// IMPORTS
// ========================================

import { Button } from "@/components/ui/button";
import { usePDF } from "./PdfProvider";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import PdfHighlights from "./highlight/PdfHighlights";

// ========================================
// MAIN COMPONENT
// ========================================

/**
 * PdfContentTab Component
 *
 * Renders a collapsible sidebar that displays PDF-related content panels.
 * Currently supports:
 * - Highlights panel: Shows all PDF highlights with management capabilities
 *
 * Features:
 * - Smooth slide-in/out animations
 * - Dynamic content based on selected tab
 * - Close button for easy dismissal
 *
 * @component
 * @returns {JSX.Element | null} The content tab panel or null if not visible
 */
export default function PdfContentTab() {
  // ========================================
  // CONTEXT VALUES
  // ========================================

  const { isContentVisible, closeContentTab, currentContent } = usePDF();

  /**
   * Formats the content title for display
   * @param {string} content - The content type
   * @returns {string} Formatted title
   */
  const formatContentTitle = (content: string) => {
    return content.charAt(0).toUpperCase() + content.slice(1);
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <AnimatePresence>
      {isContentVisible && currentContent && (
        <motion.div
          className="h-full bg-card border-r border-border shadow-md flex flex-col overflow-hidden"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 420, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {/* Header Section - Sticky within container */}
          <div className="flex flex-row justify-between items-center gap-4 p-4 bg-card border-b border-border flex-shrink-0 sticky top-0 z-10 min-w-0">
            <span className="text-lg truncate min-w-0">
              PDF content:
              <span className="font-bold ml-2">
                {formatContentTitle(currentContent)}
              </span>
            </span>
            <Button
              size={"sm"}
              variant={"destructive"}
              onClick={closeContentTab}
              title="Close content panel"
              className="flex-shrink-0"
            >
              <XIcon />
            </Button>
          </div>
          {/* Content Section - Scrollable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0 min-w-0">
            {currentContent === "highlights" && <PdfHighlights />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
