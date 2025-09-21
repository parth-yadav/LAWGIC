// ========================================
// PDF HIGHLIGHT TYPES
// ========================================

declare global {
  namespace PDF {
    // Highlight Colors
    interface HighlightColor {
      id: string;
      name: string;
      backgroundColor: string;
      borderColor?: string;
      textColor?: string;
    }

    // Highlight Position
    interface HighlightPosition {
      startOffset: number;
      endOffset: number;
      startXPath?: string;
      endXPath?: string;
      pageNumber: number;
      startPageOffset?: number;
      endPageOffset?: number;
    }

    // Highlight Metadata
    interface HighlightMetadata {
      id: string;
      text: string;
      note?: string;
      tags?: string[];
      createdAt: string;
      updatedAt?: string;
      author?: string;
    }

    // Main Highlight Interface
    interface Highlight {
      id: string;
      text: string;
      position: HighlightPosition;
      color: HighlightColor;
      metadata: HighlightMetadata;
      isActive?: boolean;
      isTemporary?: boolean;
    }

    // Highlight Selection
    interface HighlightSelection {
      selectedText: string;
      currentPage: number;
      x: number;
      y: number;
      selectionRect: DOMRect;
      shouldShowBelow: boolean;
      range?: Range;
    }

    // Text Selection (simpler version)
    interface TextSelection {
      text: string;
      pageNumber: number;
      startOffset: number;
      endOffset: number;
      range: Range;
    }

    // Threat Types
    interface ThreatBoundingBox {
      x: number;
      y: number;
      width: number;
      height: number;
    }

    interface ThreatPosition {
      startOffset: number;
      endOffset: number;
      pageNumber: number;
    }

    interface Threat {
      id?: string;
      text: string;
      reason: string;
      bbox: ThreatBoundingBox | null;
      confidence: number;
      severity?: "low" | "medium" | "high" | "critical";
      category?: string;
      position?: ThreatPosition | null;
      wordIndices?: number[];
      _highlightData?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    interface ThreatPage {
      page: number;
      threats: Threat[];
    }

    interface ThreatAnalysisResult {
      pages: ThreatPage[];
      summary: {
        totalPages: number;
        totalThreats: number;
        analysisTimestamp: string;
        isFromCache?: boolean;
      };
    }

    // ========================================
    // EXPLANATION TYPES
    // ========================================

    /**
     * Represents explanation data returned from AI
     */
    interface ExplanationData {
      term: string;
      meaning: string;
      page: number;
    }

    /**
     * Position information for stored explanations (reuses highlight position structure)
     */
    interface ExplanationPosition {
      startOffset: number;
      endOffset: number;
      pageNumber: number;
    }

    /**
     * Represents a stored explanation with metadata
     */
    interface StoredExplanation {
      id: string;
      selectedText: string;
      explanation: ExplanationData;
      position: ExplanationPosition;
      createdAt: string;
      pageNumber: number;
    }
  }
}

export {};
