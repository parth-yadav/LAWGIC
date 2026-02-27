import { usePDF } from "../PdfProvider";
import { Button } from "@/components/ui/button";
import { Trash2, MousePointer, Calendar } from "lucide-react";

export default function ExplanationsPanel() {
  const { storedExplanations, removeExplanationById, clearAllExplanations, jumpToExplanation } = usePDF();

  const handleExplanationClick = (explanation) => jumpToExplanation(explanation);

  const handleDeleteExplanation = (explanationId, e) => {
    e.stopPropagation();
    removeExplanationById(explanationId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  if (storedExplanations.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">No explanations saved yet.</p>
        <p className="text-xs mt-1">Select text in the PDF and click &ldquo;Explain&rdquo; to save explanations.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Explanations ({storedExplanations.length})</h3>
          {storedExplanations.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAllExplanations} className="text-destructive hover:text-destructive">
              <Trash2 className="w-3 h-3 mr-1" />Clear All
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-2">
          {storedExplanations.map((explanation) => (
            <div key={explanation.id} className="group p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => handleExplanationClick(explanation)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <MousePointer className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Page {explanation.pageNumber}</span>
                  </div>
                  <div className="text-sm font-medium mb-2 line-clamp-2">&ldquo;{explanation.selectedText}&rdquo;</div>
                  <div className="text-xs text-muted-foreground mb-2 line-clamp-3">{explanation.explanation.meaning}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />{formatDate(explanation.createdAt)}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive" onClick={(e) => handleDeleteExplanation(explanation.id, e)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
