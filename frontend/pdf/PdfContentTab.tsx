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
import PdfThreats from "./highlight/PdfThreats";

// ========================================
// MAIN COMPONENT
// ========================================

/**
 * PdfContentTab Component
 *
 * Renders a collapsible sidebar that displays PDF-related content panels.
 * Currently supports:
 * - Highlights panel: Shows all PDF highlights with management capabilities
 * - Threats panel: Shows security threats detected in the PDF
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
          className="p-2 overflow-hidden w-max bg-card border-r border-border shadow-md"
          initial={{ width: 0 }}
          animate={{ width: "auto" }}
          exit={{ width: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="flex flex-col h-full w-max">
            {/* Header Section */}
            <div className="w-full flex flex-row justify-between items-center gap-4">
              <span className="text-lg">
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
              >
                <XIcon />
              </Button>
            </div>
            {/* Content Section */}
            <div className="flex-1 overflow-auto">
              {currentContent === "highlights" && <PdfHighlights />}
              {currentContent === "threats" && <PdfThreats />}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
