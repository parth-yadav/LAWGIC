import { HighlightData } from '../types/highlight';

export class HighlightUtils {
  /**
   * Creates a new highlight from the current text selection
   */
  static createHighlightFromSelection(
    selectedText: string,
    currentPage: number,
    scale: number,
    containerRef: HTMLDivElement,
    color: string = '#ffff00'
  ): HighlightData | null {
    const selection = window.getSelection();
    if (!selectedText || !selection || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const selectionRect = range.getBoundingClientRect();

    // Find the PDF page element to get its position and dimensions
    const pdfPageElement = containerRef.querySelector('.react-pdf__Page');
    if (!pdfPageElement) {
      console.error('PDF page element not found');
      return null;
    }

    const pageRect = pdfPageElement.getBoundingClientRect();

    // Calculate position relative to the PDF page (not the container)
    const relativeX = selectionRect.left - pageRect.left;
    const relativeY = selectionRect.top - pageRect.top;

    // Store coordinates normalized to scale=1 for consistency
    return {
      id: Date.now().toString(),
      text: selectedText,
      bbox: {
        x: relativeX / scale,
        y: relativeY / scale,
        width: selectionRect.width / scale,
        height: selectionRect.height / scale,
      },
      page: currentPage,
      color: color,
    };
  }

  /**
   * Filters highlights for a specific page
   */
  static getPageHighlights(highlights: HighlightData[], page: number): HighlightData[] {
    return highlights.filter(h => h.page === page);
  }

  /**
   * Removes a highlight by ID
   */
  static removeHighlight(highlights: HighlightData[], id: string): HighlightData[] {
    return highlights.filter(h => h.id !== id);
  }

  /**
   * Clears all highlights for a specific page
   */
  static clearPageHighlights(highlights: HighlightData[], page: number): HighlightData[] {
    return highlights.filter(h => h.page !== page);
  }

  /**
   * Gets the selected text from the current selection
   */
  static getSelectedText(): string {
    const selection = window.getSelection();
    return selection?.toString().trim() || '';
  }

  /**
   * Clears the current text selection
   */
  static clearSelection(): void {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }
}
