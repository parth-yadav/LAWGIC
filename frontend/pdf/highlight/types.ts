export interface HighlightColor {
  id: string;
  name: string;
  backgroundColor: string;
  borderColor?: string;
  textColor?: string;
}

export interface HighlightPosition {
  startOffset: number;
  endOffset: number;
  startXPath?: string;
  endXPath?: string;
  pageNumber: number;
  startPageOffset?: number;
  endPageOffset?: number;
}

export interface HighlightMetadata {
  id: string;
  text: string;
  note?: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  author?: string;
}

export interface Highlight {
  id: string;
  text: string;
  position: HighlightPosition;
  color: HighlightColor;
  metadata: HighlightMetadata;
  isActive?: boolean;
  isTemporary?: boolean;
}

export interface HighlightSelection {
  selectedText: string;
  currentPage: number;
  x: number;
  y: number;
  selectionRect: DOMRect;
  shouldShowBelow: boolean;
  range?: Range;
}

export interface HighlightState {
  highlights: Highlight[];
  activeHighlight?: string;
  selectedHighlight?: string;
  highlightColors: HighlightColor[];
  defaultColor: HighlightColor;
}

export interface HighlightOptions {
  color?: HighlightColor;
  note?: string;
  tags?: string[];
  temporary?: boolean;
}

// Default highlight colors with transparency
export const DEFAULT_HIGHLIGHT_COLORS: HighlightColor[] = [
  {
    id: "yellow",
    name: "Yellow",
    backgroundColor: "rgba(255, 255, 0, 1)",
    borderColor: "rgba(230, 230, 0, 1)",
  },
  {
    id: "green",
    name: "Green",
    backgroundColor: "rgba(144, 238, 144, 1)",
    borderColor: "rgba(125, 216, 125, 1)",
  },
  {
    id: "blue",
    name: "Blue",
    backgroundColor: "rgba(135, 206, 235, 1)",
    borderColor: "rgba(107, 182, 212, 1)",
  },
  {
    id: "pink",
    name: "Pink",
    backgroundColor: "rgba(255, 182, 193, 1)",
    borderColor: "rgba(255, 158, 181, 1)",
  },
  {
    id: "orange",
    name: "Orange",
    backgroundColor: "rgba(255, 165, 0, 1)",
    borderColor: "rgba(230, 149, 0, 1)",
  },
];

export const DEFAULT_HIGHLIGHT_COLOR = DEFAULT_HIGHLIGHT_COLORS[0];
