import React from 'react';
import { HighlightData } from '../types/highlight';

interface HighlightOverlayProps {
  highlights: HighlightData[];
  onRemove?: (id: string) => void;
}

export function HighlightOverlay({ highlights, onRemove }: HighlightOverlayProps) {
  return (
    <>
      {highlights.map((highlight) => (
        <div
          key={highlight.id}
          className="absolute pointer-events-none"
          style={{
            left: `${highlight.bbox.x}px`,
            top: `${highlight.bbox.y}px`,
            width: `${highlight.bbox.width}px`,
            height: `${highlight.bbox.height}px`,
            backgroundColor: highlight.color,
            zIndex: 5
          }}
          title={`Highlight: ${highlight.text}`}
        />
      ))}
    </>
  );
}
