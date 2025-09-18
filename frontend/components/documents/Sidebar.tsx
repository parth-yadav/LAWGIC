"use client";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { LucideLayoutDashboard, PanelLeftOpenIcon } from "lucide-react";
import { Separator } from "../ui/separator";
import { motion, AnimatePresence } from "motion/react";
import useLocalState from "@/hooks/useLocalState";
import UserButton from "../auth/UserButton";

export default function DocumentSidebar({ className }: { className?: string }) {
  const [expanded, setExpanded] = useLocalState<boolean>(
    "expanded_doc_sidebar",
    false
  );

  return (
    <nav
      className={cn(
        "bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-md",
        "flex flex-col p-2 pb-4 h-full gap-2",
        className
      )}
    >
      <div className="flex items-center w-full">
        <AnimatePresence>
          {expanded && (
            <motion.h1
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
            >
              Documents
            </motion.h1>
          )}
        </AnimatePresence>
        <Button
          size={"icon"}
          variant={"ghost"}
          onClick={() => setExpanded((expanded) => !expanded)}
          className={cn(expanded ? "ml-auto" : "mx-auto")}
        >
          <PanelLeftOpenIcon className={cn(expanded && "rotate-180")} />
        </Button>
      </div>

      <Separator />

      <Button variant={"outline"}>
        <LucideLayoutDashboard />
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
            >
              Dashboard
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      <div className="flex-1" />

      <Separator />

      <UserButton variant={"expandable"} expanded={expanded} />
    </nav>
  );
}
