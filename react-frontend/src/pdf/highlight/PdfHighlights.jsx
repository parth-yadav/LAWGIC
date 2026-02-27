import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchIcon, TagIcon, EditIcon, TrashIcon, StickyNoteIcon } from "lucide-react";
import { DEFAULT_HIGHLIGHT_COLORS } from "./types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
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
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState("");

  const filteredHighlights = highlights.filter(
    (highlight) =>
      highlight.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      highlight.metadata.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      highlight.metadata.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEditNote = (highlight) => {
    setEditingNote(highlight.id);
    setNoteText(highlight.metadata.note || "");
  };

  const handleSaveNote = (highlightId) => {
    const existingHighlight = highlights.find((h) => h.id === highlightId);
    if (existingHighlight?.metadata) {
      updateHighlightById(highlightId, {
        metadata: {
          ...existingHighlight.metadata,
          note: noteText.trim() || undefined,
          updatedAt: new Date().toISOString(),
        },
      });
    }
    setEditingNote(null);
    setNoteText("");
  };

  const handleCancelNote = () => {
    setEditingNote(null);
    setNoteText("");
  };

  const handleChangeColor = (highlightId, colorId) => {
    const newColor = DEFAULT_HIGHLIGHT_COLORS.find((c) => c.id === colorId);
    if (newColor) updateHighlightById(highlightId, { color: newColor });
  };

  const renderSearchSection = () => (
    <div className="flex shrink-0 flex-col gap-4 p-4">
      <div className="relative">
        <SearchIcon className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
        <Input placeholder="Search highlights..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>
      <Button variant="destructive" onClick={clearAllHighlights} className="w-full">
        Clear All <TrashIcon />
      </Button>
    </div>
  );

  const renderNoteEditor = (highlight) => (
    <div className="space-y-2">
      <Input
        placeholder="Add a note..."
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSaveNote(highlight.id);
          else if (e.key === "Escape") handleCancelNote();
        }}
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => handleSaveNote(highlight.id)}>Save</Button>
        <Button size="sm" variant="outline" onClick={handleCancelNote}>Cancel</Button>
      </div>
    </div>
  );

  const renderExistingNote = (highlight) =>
    highlight.metadata.note && (
      <div className="text-muted-foreground flex items-start gap-2 text-sm">
        <StickyNoteIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span className="flex-1">{highlight.metadata.note}</span>
      </div>
    );

  const renderColorPicker = (highlight) => (
    <div className="flex gap-1">
      {DEFAULT_HIGHLIGHT_COLORS.map((color) => (
        <button
          key={color.id}
          className={cn(
            "h-4 w-4 rounded border transition-all hover:scale-110",
            highlight.color.id === color.id ? "border-foreground border-2" : "border-border"
          )}
          style={{ backgroundColor: color.backgroundColor }}
          onClick={() => handleChangeColor(highlight.id, color.id)}
          title={`Change to ${color.name}`}
        />
      ))}
    </div>
  );

  const renderActionButtons = (highlight) => (
    <>
      <Button variant="ghost" size="sm" onClick={() => handleEditNote(highlight)} className="h-6 w-6 p-0" title="Edit note">
        <EditIcon className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => removeHighlightById(highlight.id)} className="text-destructive hover:text-destructive h-6 w-6 p-0" title="Delete highlight">
        <TrashIcon className="h-3 w-3" />
      </Button>
    </>
  );

  return (
    <div className="flex h-full w-full max-w-sm flex-col">
      {renderSearchSection()}
      <div className="min-h-0 flex-1 overflow-y-auto px-4">
        <div className="space-y-3">
          <AnimatePresence>
            {filteredHighlights.map((highlight) => (
              <motion.div
                key={highlight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border-border hover:bg-muted/50 space-y-2 rounded-lg border p-3 transition-colors"
              >
                <div
                  className="cursor-pointer text-sm leading-relaxed"
                  style={{
                    backgroundColor: `${highlight.color.backgroundColor}20`,
                    borderLeft: `3px solid ${highlight.color.backgroundColor}`,
                    paddingLeft: "8px",
                  }}
                  onClick={() => jumpToHighlight(highlight)}
                  title="Click to jump to highlight"
                >
                  &quot;{highlight.text}&quot;
                </div>
                {editingNote === highlight.id ? renderNoteEditor(highlight) : renderExistingNote(highlight)}
                {highlight.metadata.tags && highlight.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <TagIcon className="text-muted-foreground h-3 w-3" />
                    {highlight.metadata.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span>
                    Page {highlight.position.pageNumber} •{" "}
                    {new Date(highlight.metadata.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {renderColorPicker(highlight)}
                  <div className="flex-1" />
                  {renderActionButtons(highlight)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredHighlights.length === 0 && (
            <div className="text-muted-foreground py-8 text-center">
              {searchQuery ? "No highlights found" : "No highlights yet"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
