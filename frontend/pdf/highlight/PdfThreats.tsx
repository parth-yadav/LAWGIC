import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  SearchIcon,
  AlertTriangleIcon,
  ShieldAlertIcon,
  AlertCircleIcon,
  InfoIcon,
  EyeIcon,
} from "lucide-react";
import { Threat, PageThreats } from "./types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePDF } from "../PdfProvider";

/**
 * PdfThreats Component
 *
 * Renders a sidebar panel that displays all PDF threats with the following features:
 * - Search functionality across threat text and reasons
 * - Severity-based filtering and display
 * - Navigation to specific threats
 * - Threat analysis controls
 *
 * @component
 * @returns {JSX.Element} The PDF threats panel
 */
export default function PdfThreats() {
  // ========================================
  // CONTEXT & STATE
  // ========================================

  const {
    threats,
    isAnalyzing,
    analyzePdfForThreats,
    jumpToThreat,
    pdfUrl,
  } = usePDF();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);

  // ========================================
  // COMPUTED VALUES
  // ========================================

  /**
   * Filters threats based on search query and severity
   */
  const filteredPages = threats?.pages.map(page => ({
    ...page,
    threats: page.threats.filter(threat => {
      const matchesSearch = threat.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        threat.reason.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeverity = !selectedSeverity || threat.severity === selectedSeverity;
      return matchesSearch && matchesSeverity;
    })
  })).filter(page => page.threats.length > 0) || [];

  const totalFilteredThreats = filteredPages.reduce((sum, page) => sum + page.threats.length, 0);

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Handles PDF analysis trigger
   */
  const handleAnalyzePdf = async () => {
    if (pdfUrl) {
      try {
        // Convert PDF URL to File object for analysis
        const response = await fetch(pdfUrl);
        const blob = await response.blob();
        const file = new File([blob], 'document.pdf', { type: 'application/pdf' });
        await analyzePdfForThreats(file);
      } catch (error) {
        console.error('Error converting PDF URL to file:', error);
      }
    }
  };

  /**
   * Gets the appropriate icon for threat severity
   */
  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return <ShieldAlertIcon className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangleIcon className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <AlertCircleIcon className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <InfoIcon className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangleIcon className="h-4 w-4 text-orange-600" />;
    }
  };

  /**
   * Gets the appropriate color class for threat severity
   */
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-600 bg-red-50 text-red-800';
      case 'high':
        return 'border-orange-600 bg-orange-50 text-orange-800';
      case 'medium':
        return 'border-yellow-600 bg-yellow-50 text-yellow-800';
      case 'low':
        return 'border-blue-600 bg-blue-50 text-blue-800';
      default:
        return 'border-orange-600 bg-orange-50 text-orange-800';
    }
  };

  // ========================================
  // RENDER HELPERS
  // ========================================

  /**
   * Renders the search and control section
   */
  const renderControlSection = () => (
    <div className="flex flex-col gap-4 p-4 shrink-0">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search threats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedSeverity === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedSeverity(null)}
        >
          All
        </Button>
        {['critical', 'high', 'medium', 'low'].map(severity => (
          <Button
            key={severity}
            variant={selectedSeverity === severity ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSeverity(severity)}
            className="capitalize"
          >
            {severity}
          </Button>
        ))}
      </div>

      <Button
        onClick={handleAnalyzePdf}
        disabled={isAnalyzing}
        className="w-full"
      >
        {isAnalyzing ? "Analyzing..." : "Analyze PDF for Threats"}
      </Button>
    </div>
  );

  /**
   * Renders threat summary statistics
   */
  const renderSummary = () => {
    if (!threats) return null;

    const severityCounts = threats.pages.reduce((acc, page) => {
      page.threats.forEach(threat => {
        const severity = threat.severity || 'high';
        acc[severity] = (acc[severity] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="px-4 pb-4">
        <div className="text-sm font-medium mb-2">Threat Summary</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            Critical: {severityCounts.critical || 0}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
            High: {severityCounts.high || 0}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
            Medium: {severityCounts.medium || 0}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            Low: {severityCounts.low || 0}
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // MAIN RENDER
  // ========================================

  return (
    <div className="flex flex-col h-full w-full max-w-sm">
      {/* Control Section */}
      {renderControlSection()}

      {/* Summary Section */}
      {renderSummary()}

      {/* Threats List */}
      <div className="flex-1 px-4 overflow-y-auto min-h-0">
        <div className="space-y-3">
          {isAnalyzing && (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              Analyzing PDF for security threats...
            </div>
          )}

          {!isAnalyzing && threats && (
            <AnimatePresence>
              {filteredPages.map((page) => (
                <motion.div
                  key={page.page}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-2"
                >
                  <div className="font-medium text-sm text-muted-foreground">
                    Page {page.page} ({page.threats.length} threat{page.threats.length !== 1 ? 's' : ''})
                  </div>
                  
                  {page.threats.map((threat, index) => (
                    <motion.div
                      key={`${page.page}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer",
                        getSeverityColor(threat.severity)
                      )}
                      onClick={() => jumpToThreat(threat, page.page)}
                    >
                      {/* Threat Header */}
                      <div className="flex items-start gap-2">
                        {getSeverityIcon(threat.severity)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            "{threat.text}"
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs capitalize", getSeverityColor(threat.severity))}
                            >
                              {threat.severity || 'high'}
                            </Badge>
                            {threat.confidence && (
                              <span className="text-xs text-muted-foreground">
                                {Math.round(threat.confidence * 100)}% confidence
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          title="Jump to threat"
                        >
                          <EyeIcon className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Threat Reason */}
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        {threat.reason}
                      </div>

                      {/* Threat Category */}
                      {threat.category && (
                        <div className="text-xs">
                          <Badge variant="secondary" className="text-xs">
                            {threat.category}
                          </Badge>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Empty State */}
          {!isAnalyzing && (!threats || totalFilteredThreats === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              {!threats ? (
                <div>
                  <ShieldAlertIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No threat analysis yet</p>
                  <p className="text-xs">Click "Analyze PDF" to scan for security threats</p>
                </div>
              ) : searchQuery ? (
                "No threats match your search"
              ) : (
                <div>
                  <ShieldAlertIcon className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No threats detected</p>
                  <p className="text-xs">This PDF appears to be safe</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
