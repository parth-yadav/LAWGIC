"use client";

import { Button } from "@/components/ui/button";
import { EditableSpan } from "@/components/ui/editable-span";
import { usePDF } from "./PdfProvider";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RotateCwIcon,
  FullscreenIcon,
  ChevronUpIcon,
  EyeOffIcon,
  EyeIcon,
  MoreHorizontalIcon,
  CheckIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TbZoomReset } from "react-icons/tb";
import ThemeSwitch from "@/components/ThemeSwitch";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { RiExpandWidthFill } from "react-icons/ri";

export default function PdfToolbar({ className = "" }: { className?: string }) {
  const {
    numPages,
    pageNumber,
    pageInputValue,
    zoomInputValue,
    zoomLevel,
    isScrolling,
    goToPrevPage,
    goToNextPage,
    zoomIn,
    zoomOut,
    setZoomToFit,
    resetZoom,
    rotateClockwise,
    validateAndNavigateToPage,
    validateAndSetZoom,
    scrollToPage,
    isContentVisible,
    setIsContentVisible,
    toolbarPosition,
    setToolbarPosition,
  } = usePDF();

  const handlePageSubmit = (value: string) => {
    validateAndNavigateToPage(value);
  };

  const handleZoomSubmit = (value: string) => {
    const cleanValue = value.replace("%", "");
    validateAndSetZoom(`${cleanValue}%`);
  };

  return (
    <div
      className={cn(
        "fixed left-1/2 transform -translate-x-1/2 z-50",
        "transition-all duration-300",
        toolbarPosition === "top" ? "top-6" : "bottom-6",
        className
      )}
    >
      <div className="flex items-center gap-6 px-3 py-1.5 bg-card backdrop-blur-sm text-card-foreground border border-border rounded-full shadow-lg">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1 || isScrolling}
            className="h-8 w-8 rounded-full"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>

          <EditableSpan
            value={pageInputValue}
            onSubmit={handlePageSubmit}
            className="min-w-[2rem] text-center font-mono text-sm"
          />
          <span className="text-sm text-muted-foreground">
            /&nbsp;{numPages ?? "..."}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNextPage}
            disabled={pageNumber >= (numPages || 1) || isScrolling}
            className="h-8 w-8 rounded-full"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={zoomOut}
            disabled={zoomLevel <= 0.25}
            className="h-8 w-8 rounded-full"
          >
            <ZoomOutIcon className="h-4 w-4" />
          </Button>

          <EditableSpan
            value={zoomInputValue}
            onSubmit={handleZoomSubmit}
            className="min-w-[3rem] text-center font-mono text-sm"
          />

          <Button
            variant="outline"
            size="icon"
            onClick={zoomIn}
            disabled={zoomLevel >= 3.0}
            className="h-8 w-8 rounded-full"
          >
            <ZoomInIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={resetZoom}
            disabled={zoomLevel === 1}
            className="h-8 w-8 rounded-full"
          >
            <TbZoomReset className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={setZoomToFit}
            className="h-8 w-8 rounded-full"
          >
            <RiExpandWidthFill className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={rotateClockwise}
            className="h-8 w-8 rounded-full"
          >
            <RotateCwIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {pageNumber > 1 && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scrollToPage(1)}
                  className="h-8 w-8 rounded-full"
                >
                  <ChevronUpIcon />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsContentVisible(!isContentVisible)}
            className="h-8 w-8 rounded-full"
          >
            {isContentVisible ? <EyeOffIcon /> : <EyeIcon />}
          </Button>

          <ThemeSwitch />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Toolbar Position</DropdownMenuLabel>
                <Separator className="mb-2" />
                <DropdownMenuItem onClick={() => setToolbarPosition("top")}>
                  <CheckIcon
                    className={
                      toolbarPosition === "top" ? "opacity-100" : "opacity-0"
                    }
                  />
                  Top
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setToolbarPosition("bottom")}>
                  <CheckIcon
                    className={
                      toolbarPosition === "bottom" ? "opacity-100" : "opacity-0"
                    }
                  />
                  Bottom
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
