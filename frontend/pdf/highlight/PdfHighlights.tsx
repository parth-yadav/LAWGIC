import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  SearchIcon,
  TagIcon,
  EditIcon,
  TrashIcon,
  StickyNoteIcon,
} from "lucide-react";
import { Highlight, DEFAULT_HIGHLIGHT_COLORS } from "./types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePDF } from "../PdfProvider";

export default function PdfHighlights() {
  const {
    highlights,
    removeHighlightById,
    clearAllHighlights,
    updateHighlightById,
    jumpToHighlight,
  } = usePDF();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  // Filter highlights based on search query
  const filteredHighlights = highlights.filter(
    (highlight) =>
      highlight.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      highlight.metadata.note
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      highlight.metadata.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const handleEditNote = (highlight: Highlight) => {
    setEditingNote(highlight.id);
    setNoteText(highlight.metadata.note || "");
  };

  const handleSaveNote = (highlightId: string) => {
    updateHighlightById(highlightId, {
      metadata: {
        ...highlights.find((h) => h.id === highlightId)?.metadata!,
        note: noteText.trim() || undefined,
        updatedAt: new Date().toISOString(),
      },
    });
    setEditingNote(null);
    setNoteText("");
  };

  const handleChangeColor = (highlightId: string, colorId: string) => {
    const newColor = DEFAULT_HIGHLIGHT_COLORS.find((c) => c.id === colorId);
    if (newColor) {
      updateHighlightById(highlightId, { color: newColor });
    }
  };
  return (
    <div className="flex flex-col h-full w-full max-w-sm">
      {/* Search */}
      <div className="flex flex-col gap-4 p-4 shrink-0">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search highlights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={"destructive"}
          onClick={clearAllHighlights}
          className="w-full"
        >
          Clear All <TrashIcon />
        </Button>
      </div>

      {/* Highlights List */}
      <div className="flex-1 px-4 overflow-y-auto min-h-0">
        <div className="space-y-3">
          <AnimatePresence>
            {filteredHighlights.map((highlight) => (
              <motion.div
                key={highlight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border border-border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors"
              >
                {/* Highlight Text */}
                <div
                  className="text-sm leading-relaxed cursor-pointer"
                  style={{
                    backgroundColor: `${highlight.color.backgroundColor}20`,
                    borderLeft: `3px solid ${highlight.color.backgroundColor}`,
                    paddingLeft: "8px",
                  }}
                  onClick={() => jumpToHighlight(highlight)}
                >
                  "{highlight.text}"
                </div>

                {/* Note Section */}
                {editingNote === highlight.id ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Add a note..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveNote(highlight.id);
                        } else if (e.key === "Escape") {
                          setEditingNote(null);
                          setNoteText("");
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveNote(highlight.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingNote(null);
                          setNoteText("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  highlight.metadata.note && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <StickyNoteIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="flex-1">{highlight.metadata.note}</span>
                    </div>
                  )
                )}

                {/* Tags */}
                {highlight.metadata.tags &&
                  highlight.metadata.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <TagIcon className="h-3 w-3 text-muted-foreground" />
                      {highlight.metadata.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Page {highlight.position.pageNumber} •{" "}
                    {new Date(
                      highlight.metadata.createdAt
                    ).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {/* Color Picker */}
                  <div className="flex gap-1">
                    {DEFAULT_HIGHLIGHT_COLORS.map((color) => (
                      <button
                        key={color.id}
                        className={cn(
                          "w-4 h-4 rounded border transition-all hover:scale-110",
                          highlight.color.id === color.id
                            ? "border-foreground border-2"
                            : "border-border"
                        )}
                        style={{ backgroundColor: color.backgroundColor }}
                        onClick={() =>
                          handleChangeColor(highlight.id, color.id)
                        }
                        title={`Change to ${color.name}`}
                      />
                    ))}
                  </div>

                  <div className="flex-1" />

                  {/* Note Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditNote(highlight)}
                    className="h-6 w-6 p-0"
                  >
                    <EditIcon className="h-3 w-3" />
                  </Button>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHighlightById(highlight.id)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredHighlights.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No highlights found" : "No highlights yet"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
