// ========================================
// EXPLANATION DATA TYPES
// ========================================

/**
 * Represents explanation data returned from AI
 */
export interface ExplanationData {
  term: string;
  meaning: string;
  page: number;
}

/**
 * Position information for stored explanations (reuses highlight position structure)
 */
export interface ExplanationPosition {
  startOffset: number;
  endOffset: number;
  pageNumber: number;
}

/**
 * Represents a stored explanation with metadata
 */
export interface StoredExplanation {
  id: string;
  selectedText: string;
  explanation: ExplanationData;
  position: ExplanationPosition;
  createdAt: string;
  pageNumber: number;
}