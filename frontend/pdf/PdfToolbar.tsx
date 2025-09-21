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
  ChevronUpIcon,
  MoreHorizontalIcon,
  CheckIcon,
  HighlighterIcon,
  MessageSquareIcon,
  ShieldAlertIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TbZoomReset } from "react-icons/tb";
import ThemeSwitch from "@/components/ThemeSwitch";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { RiExpandWidthFill } from "react-icons/ri";
import { Separator } from "@/components/ui/separator";

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
    toolbarPosition,
    setToolbarPosition,
    toggleHighlightsTab,
    toggleExplanationsTab,
    highlights,
    storedExplanations,
    toggleThreatsTab,
    threats,
    toolbarView,
    setToolbarView,
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
        "z-50 max-w-full overflow-auto transition-all duration-300",
        // View-based positioning
        toolbarView === "floating" && [
          "absolute left-1/2 -translate-x-1/2 transform",
          toolbarPosition === "top" ? "top-6" : "bottom-6",
        ],
        toolbarView === "fixed" && [
          "relative w-full",
          toolbarPosition === "top" ? "order-1" : "order-2",
        ],
        className,
      )}
    >
      <div
        className={cn(
          "bg-card text-card-foreground border-border flex items-center px-3 py-1.5",
          // Shape and spacing based on view
          toolbarView === "floating" && [
            "rounded-full border shadow-lg backdrop-blur-sm",
            "mx-auto max-w-fit", // Center the floating toolbar
            "flex-wrap gap-2 sm:flex-nowrap sm:gap-4", // Responsive wrapping
          ],
          toolbarView === "fixed" && [
            "w-full border-y shadow-sm",
            "justify-between px-4 py-2", // More padding for fixed mode
            "flex-wrap gap-2 sm:flex-nowrap", // Responsive wrapping
          ],
        )}
      >
        {/* Left Section - Navigation */}
        <div
          className={cn(
            "flex items-center",
            toolbarView === "floating" ? "gap-2" : "gap-3",
          )}
        >
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
          <span className="text-muted-foreground text-sm">
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

        {/* Center Section - Zoom Controls */}
        <div
          className={cn(
            "flex items-center",
            toolbarView === "floating" ? "gap-2" : "gap-3",
            "order-2 sm:order-none", // Move to second row on mobile
          )}
        >
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
            className="hidden h-8 w-8 rounded-full sm:flex" // Hide on mobile
          >
            <TbZoomReset className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={setZoomToFit}
            className="hidden h-8 w-8 rounded-full sm:flex" // Hide on mobile
          >
            <RiExpandWidthFill className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions Section - Tools */}
        <div
          className={cn(
            "flex items-center",
            toolbarView === "floating" ? "gap-2" : "gap-3",
          )}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={rotateClockwise}
            className="hidden h-8 w-8 rounded-full sm:flex" // Hide on mobile
          >
            <RotateCwIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleHighlightsTab}
            className="relative h-8 w-8 rounded-full"
          >
            <HighlighterIcon className="h-4 w-4" />
            <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-xs font-bold">
              {highlights.length}
            </span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleExplanationsTab}
            className="relative h-8 w-8 rounded-full"
          >
            <MessageSquareIcon className="h-4 w-4" />
            <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-xs font-bold">
              {storedExplanations.length}
            </span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleThreatsTab}
            className="relative h-8 w-8 rounded-full"
          >
            <ShieldAlertIcon className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
              {threats?.totalThreats || 0}
            </span>
          </Button>
        </div>

        {/* Right Section - Settings */}
        <div
          className={cn(
            "flex items-center",
            toolbarView === "floating" ? "gap-2" : "gap-3",
          )}
        >
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
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Toolbar View</DropdownMenuLabel>
                <Separator className="mb-2" />
                <DropdownMenuItem onClick={() => setToolbarView("floating")}>
                  <CheckIcon
                    className={
                      toolbarView === "floating" ? "opacity-100" : "opacity-0"
                    }
                  />
                  Floating
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setToolbarView("fixed")}>
                  <CheckIcon
                    className={
                      toolbarView === "fixed" ? "opacity-100" : "opacity-0"
                    }
                  />
                  Fixed
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
