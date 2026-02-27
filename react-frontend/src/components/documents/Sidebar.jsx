import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { PanelLeftOpenIcon } from "lucide-react";
import { Separator } from "../ui/separator";
import { motion, AnimatePresence } from "motion/react";
import useLocalState from "@/hooks/useLocalState";
import UserButton from "../auth/UserButton";
import { useDocuments } from "@/providers/DocumentsProvider";
import { VscFilePdf } from "react-icons/vsc";
import { Link, useNavigate } from "react-router-dom";
import { NavBarLinks } from "@/utils/navLinks";
import AddDocument from "./AddDocument";

export default function DocumentSidebar({ className }) {
  const [expanded, setExpanded] = useLocalState("expanded_doc_sidebar", false);
  const { documents, loading: documentsLoading, error: documentsError, refreshDocuments } = useDocuments();
  const navigate = useNavigate();

  return (
    <nav
      className={cn(
        "bg-sidebar text-sidebar-foreground border-sidebar-border border-r shadow-md",
        "flex h-full max-w-80 flex-col gap-2 p-2 pb-4",
        className
      )}
    >
      <div className="flex w-full items-center">
        <AnimatePresence>
          {expanded && (
            <motion.h1
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="truncate"
            >
              Documents
            </motion.h1>
          )}
        </AnimatePresence>
        <Button
          size={"icon"}
          variant={"ghost"}
          onClick={() => setExpanded((prev) => !prev)}
          className={cn(expanded ? "ml-auto" : "mx-auto", "group relative")}
        >
          <PanelLeftOpenIcon className={cn(expanded && "rotate-180")} />
          <span className="bg-primary text-primary-foreground absolute left-full z-[100] max-w-0 origin-left scale-x-0 transform overflow-hidden rounded-lg px-2 py-0.5 font-light opacity-0 transition-all duration-150 ease-in-out group-hover:max-w-xs group-hover:scale-x-100 group-hover:opacity-100">
            {expanded ? "Collapse" : "Expand"}
          </span>
        </Button>
      </div>

      <Separator />

      {NavBarLinks.map((link, index) => (
        <Link to={link.href} key={index} className="w-full">
          <Button variant={"outline"} className="group relative w-full justify-start">
            <link.icon />
            <AnimatePresence>
              {expanded ? (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="truncate"
                >
                  {link.name}
                </motion.span>
              ) : (
                <span className="bg-primary text-primary-foreground absolute left-full z-50 max-w-0 origin-left scale-x-0 transform truncate overflow-hidden rounded-lg px-2 py-0.5 font-light opacity-0 transition-all duration-150 ease-in-out group-hover:max-w-xs group-hover:scale-x-100 group-hover:opacity-100">
                  {link.name}
                </span>
              )}
            </AnimatePresence>
          </Button>
        </Link>
      ))}

      <AddDocument
        onAdd={(docId) =>
          refreshDocuments().then(() => {
            if (docId) navigate(`/documents/${docId}`);
          })
        }
        expanded={expanded}
      />

      <Separator />

      <div className={cn("flex flex-1 flex-col", expanded ? "overflow-y-scroll" : "overflow-hidden")}>
        {documents.map((doc) => (
          <Link to={`/documents/${doc.id}`} key={doc.id} className="flex w-full justify-start">
            <Button variant={"ghost"} className="group relative w-full justify-start py-6">
              <VscFilePdf />
              <AnimatePresence>
                {expanded ? (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex w-full flex-col items-start overflow-hidden leading-tight font-light"
                  >
                    <span className="w-full truncate text-left">{doc.title}</span>
                    <span className="text-muted-foreground w-full truncate text-left text-xs">{doc.fileName}</span>
                  </motion.div>
                ) : (
                  <span className="bg-primary text-primary-foreground absolute left-full z-50 max-w-0 origin-left scale-x-0 transform truncate overflow-hidden rounded-lg px-2 py-0.5 font-light opacity-0 transition-all duration-150 ease-in-out group-hover:max-w-xs group-hover:scale-x-100 group-hover:opacity-100">
                    {doc.title}
                  </span>
                )}
              </AnimatePresence>
            </Button>
          </Link>
        ))}
      </div>

      <Separator />

      <UserButton variant={"expandable"} expanded={expanded} className="w-full" />
    </nav>
  );
}
