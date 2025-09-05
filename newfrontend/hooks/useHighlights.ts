import { useState, useCallback, useRef } from 'react';
import { HighlightData } from '../types/highlight';
import { HighlightUtils } from '../utils/highlightUtils';

export function useHighlights() {
  const [highlights, setHighlights] = useState<HighlightData[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');

  const addHighlight = useCallback((
    currentPage: number,
    scale: number,
    containerRef: React.RefObject<HTMLDivElement>,
    color: string = '#ffff00'
  ) => {
    if (!containerRef.current) return;

    const newHighlight = HighlightUtils.createHighlightFromSelection(
      selectedText,
      currentPage,
      scale,
      containerRef.current,
      color
    );

    if (newHighlight) {
      setHighlights(prev => [...prev, newHighlight]);
      setSelectedText(''); // Clear selection after adding highlight
      HighlightUtils.clearSelection();
    }
  }, [selectedText]);

  const removeHighlight = useCallback((id: string) => {
    setHighlights(prev => HighlightUtils.removeHighlight(prev, id));
  }, []);

  const clearPageHighlights = useCallback((page: number) => {
    setHighlights(prev => HighlightUtils.clearPageHighlights(prev, page));
  }, []);

  const handleTextSelection = useCallback(() => {
    // Use a small timeout to allow the browser to finalize the selection
    setTimeout(() => {
      const text = HighlightUtils.getSelectedText();
      setSelectedText(text);
    }, 10);
  }, []);

  const getPageHighlights = useCallback((page: number) => {
    return HighlightUtils.getPageHighlights(highlights, page);
  }, [highlights]);

  const resetHighlights = useCallback(() => {
    setHighlights([]);
    setSelectedText('');
  }, []);

  return {
    highlights,
    selectedText,
    addHighlight,
    removeHighlight,
    clearPageHighlights,
    handleTextSelection,
    getPageHighlights,
    resetHighlights,
  };
}
