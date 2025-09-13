"use client";
import { Button } from "@/components/ui/button";
import { usePDF } from "./PdfProvider";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import PdfHighlights from "./highlight/PdfHighlights";

export default function PdfContentTab() {
  const { isContentVisible, closeContentTab, currentContent } = usePDF();

  return (
    <AnimatePresence>
      {isContentVisible && currentContent && (
        <motion.div
          className="p-2 overflow-hidden w-max bg-card border-r border-border shadow-md"
          initial={{ width: 0 }}
          animate={{ width: "auto" }}
          exit={{ width: 0 }}
        >
          <div className="flex flex-col h-full w-max">
            <div className="w-full flex flex-row justify-between items-center gap-4">
              <span className="text-lg">
                PDF content:
                <span className="font-bold ml-2">
                  {currentContent.charAt(0).toUpperCase() +
                    currentContent.slice(1)}
                </span>
              </span>
              <Button
                size={"sm"}
                variant={"destructive"}
                onClick={closeContentTab}
              >
                <XIcon />
              </Button>
            </div>
            <Separator className="my-2" />
            {currentContent === "highlights" && <PdfHighlights />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
