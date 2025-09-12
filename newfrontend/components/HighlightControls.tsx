import React from 'react';

interface HighlightControlsProps {
  selectedText: string;
  onAddHighlight: (color: string) => void;
  className?: string;
}

export function HighlightControls({ selectedText, onAddHighlight, className = '' }: HighlightControlsProps) {
  if (!selectedText) return null;

  const highlightColors = [
    { color: '#FFDE5980', label: 'Yellow', bgClass: 'bg-yellow-300', hoverClass: 'hover:bg-yellow-400', textClass: 'text-yellow-900' },
    { color: '#90EE9080', label: 'Green', bgClass: 'bg-green-300', hoverClass: 'hover:bg-green-400', textClass: 'text-green-900' },
    { color: '#FFB6C180', label: 'Pink', bgClass: 'bg-pink-300', hoverClass: 'hover:bg-pink-400', textClass: 'text-pink-900' },
  ];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-600 hidden md:inline">Highlight:</span>
      {highlightColors.map(({ color, label, bgClass, hoverClass, textClass }) => (
        <button
          key={color}
          onClick={() => onAddHighlight(color)}
          className={`px-3 py-1 ${bgClass} ${textClass} rounded text-sm ${hoverClass}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
