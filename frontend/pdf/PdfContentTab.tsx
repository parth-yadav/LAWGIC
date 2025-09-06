"use client";
import { Button } from "@/components/ui/button";
import { usePDF } from "./PdfProvider";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function PdfContentTab() {
  const { isContentVisible, setIsContentVisible } = usePDF();

  return (
    <AnimatePresence>
      {isContentVisible && (
        <motion.div
          className="p-2 overflow-hidden w-max bg-card border-r border-border shadow-md"
          initial={{ width: 0 }}
          animate={{ width: "auto" }}
          exit={{ width: 0 }}
        >
          <div className="flex flex-col h-full w-max">
            <div className="w-full flex flex-row justify-between items-center gap-4">
              <span className="font-bold text-2xl">PDF content</span>
              <Button
                size={"sm"}
                variant={"destructive"}
                onClick={() => setIsContentVisible(false)}
              >
                <XIcon />
              </Button>
            </div>
            <Separator className="my-2" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
