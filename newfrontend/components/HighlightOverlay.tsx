import React from 'react';
import { HighlightData, ThreatData } from '../types/highlight';

interface HighlightOverlayProps {
  highlights?: HighlightData[];
  threats?: ThreatData[];
  selectedThreat?: ThreatData | null;
  onRemove?: (id: string) => void;
  onThreatClick?: (threat: ThreatData) => void;
}

export function HighlightOverlay({ 
  highlights = [], 
  threats = [], 
  selectedThreat, 
  onRemove, 
  onThreatClick 
}: HighlightOverlayProps) {
  return (
    <>
      {/* User highlights */}
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
      
      {/* Threat highlights */}
      {threats.map((threat, index) => {
        if (!threat.bbox) return null;
        
        const isSelected = selectedThreat === threat;
        
        return (
          <div
            key={`threat-${index}`}
            className={`absolute border-2 transition-all cursor-pointer ${
              isSelected 
                ? 'bg-red-500 bg-opacity-40 border-red-600 z-10' 
                : 'bg-red-500 bg-opacity-20 border-red-500 hover:bg-opacity-30'
            }`}
            style={{
              left: `${threat.bbox.x}px`,
              top: `${threat.bbox.y}px`,
              width: `${threat.bbox.width}px`,
              height: `${threat.bbox.height}px`,
              zIndex: isSelected ? 10 : 6
            }}
            title={`Threat: ${threat.text} - ${threat.reason}`}
            onClick={() => onThreatClick?.(threat)}
          />
        );
      })}
    </>
  );
}
