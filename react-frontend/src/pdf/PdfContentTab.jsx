import { Button } from "@/components/ui/button";
import { usePDF } from "./PdfProvider";
import { AnimatePresence, motion } from "motion/react";
import { XIcon } from "lucide-react";
import PdfHighlights from "./highlight/PdfHighlights";
import ExplanationsPanel from "./explanation/ExplanationsPanel";
import PdfThreats from "./highlight/PdfThreats";

export default function PdfContentTab() {
  const { isContentVisible, closeContentTab, currentContent } = usePDF();

  const formatContentTitle = (content) => {
    return content.charAt(0).toUpperCase() + content.slice(1);
  };

  return (
    <AnimatePresence>
      {isContentVisible && currentContent && (
        <motion.div
          className="bg-card border-border flex h-full flex-col overflow-hidden border-r shadow-md"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 420, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {/* Header Section */}
          <div className="bg-card border-border sticky top-0 z-10 flex min-w-0 shrink-0 flex-row items-center justify-between gap-4 border-b p-4">
            <span className="min-w-0 truncate text-lg">
              PDF content:
              <span className="ml-2 font-bold">{formatContentTitle(currentContent)}</span>
            </span>
            <Button size="sm" variant="destructive" onClick={closeContentTab} title="Close content panel" className="shrink-0">
              <XIcon />
            </Button>
          </div>
          {/* Content Section */}
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
            {currentContent === "highlights" && <PdfHighlights />}
            {currentContent === "explanations" && <ExplanationsPanel />}
            {currentContent === "threats" && <PdfThreats />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
