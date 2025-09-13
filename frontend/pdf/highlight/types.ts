// ========================================
// HIGHLIGHT COLOR TYPES
// ========================================

/**
 * Represents a color scheme for highlighting text
 *
 * @interface HighlightColor
 * @property {string} id - Unique identifier for the color
 * @property {string} name - Human-readable name for the color
 * @property {string} backgroundColor - CSS background color value
 * @property {string} [borderColor] - Optional CSS border color value
 * @property {string} [textColor] - Optional CSS text color value
 */
export interface HighlightColor {
  id: string;
  name: string;
  backgroundColor: string;
  borderColor?: string;
  textColor?: string;
}

// ========================================
// HIGHLIGHT POSITION TYPES
// ========================================

/**
 * Represents the position of a highlight within a document
 *
 * Contains both absolute text offsets and XPath information for
 * reliable positioning and restoration of highlights.
 *
 * @interface HighlightPosition
 * @property {number} startOffset - Absolute start position in container text
 * @property {number} endOffset - Absolute end position in container text
 * @property {string} [startXPath] - XPath to the start node
 * @property {string} [endXPath] - XPath to the end node
 * @property {number} pageNumber - Page number where highlight appears
 * @property {number} [startPageOffset] - Relative start offset within start node
 * @property {number} [endPageOffset] - Relative end offset within end node
 */
export interface HighlightPosition {
  startOffset: number;
  endOffset: number;
  startXPath?: string;
  endXPath?: string;
  pageNumber: number;
  startPageOffset?: number;
  endPageOffset?: number;
}

// ========================================
// HIGHLIGHT METADATA TYPES
// ========================================

/**
 * Contains metadata and user-generated content for a highlight
 *
 * @interface HighlightMetadata
 * @property {string} id - Unique identifier matching the parent highlight
 * @property {string} text - The actual text content that was highlighted
 * @property {string} [note] - Optional user note attached to the highlight
 * @property {string[]} [tags] - Optional array of user-defined tags
 * @property {string} createdAt - ISO timestamp of when highlight was created
 * @property {string} [updatedAt] - ISO timestamp of last modification
 * @property {string} [author] - Optional author identifier
 */
export interface HighlightMetadata {
  id: string;
  text: string;
  note?: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
  author?: string;
}

// ========================================
// MAIN HIGHLIGHT TYPE
// ========================================

/**
 * Represents a complete highlight with all associated data
 *
 * This is the main data structure for storing and managing highlights
 * in the PDF viewer system.
 *
 * @interface Highlight
 * @property {string} id - Unique identifier for this highlight
 * @property {string} text - The highlighted text content
 * @property {HighlightPosition} position - Position data for rendering
 * @property {HighlightColor} color - Color scheme for visual rendering
 * @property {HighlightMetadata} metadata - Additional user data and metadata
 * @property {boolean} [isActive] - Whether this highlight is currently selected
 * @property {boolean} [isTemporary] - Whether this is a temporary highlight
 */
export interface Highlight {
  id: string;
  text: string;
  position: HighlightPosition;
  color: HighlightColor;
  metadata: HighlightMetadata;
  isActive?: boolean;
  isTemporary?: boolean;
}

// ========================================
// SELECTION TYPES
// ========================================

/**
 * Represents an active text selection that can become a highlight
 *
 * Contains information about the user's current text selection
 * and positioning data for rendering the highlight creation UI.
 *
 * @interface HighlightSelection
 * @property {string} selectedText - The text that is currently selected
 * @property {number} currentPage - Page number where selection occurred
 * @property {number} x - X coordinate for positioning UI elements
 * @property {number} y - Y coordinate for positioning UI elements
 * @property {DOMRect} selectionRect - Bounding rectangle of the selection
 * @property {boolean} shouldShowBelow - Whether UI should appear below selection
 * @property {Range} [range] - The DOM Range object of the selection
 */
export interface HighlightSelection {
  selectedText: string;
  currentPage: number;
  x: number;
  y: number;
  selectionRect: DOMRect;
  shouldShowBelow: boolean;
  range?: Range;
}

// ========================================
// STATE MANAGEMENT TYPES
// ========================================

/**
 * Represents the complete state of the highlighting system
 *
 * Used for managing the overall state of highlights in the application.
 *
 * @interface HighlightState
 * @property {Highlight[]} highlights - Array of all highlights
 * @property {string} [activeHighlight] - ID of currently active highlight
 * @property {string} [selectedHighlight] - ID of currently selected highlight
 * @property {HighlightColor[]} highlightColors - Available color options
 * @property {HighlightColor} defaultColor - Default color for new highlights
 */
export interface HighlightState {
  highlights: Highlight[];
  activeHighlight?: string;
  selectedHighlight?: string;
  highlightColors: HighlightColor[];
  defaultColor: HighlightColor;
}

// ========================================
// OPTIONS AND CONFIGURATION TYPES
// ========================================

/**
 * Options for creating new highlights
 *
 * @interface HighlightOptions
 * @property {HighlightColor} [color] - Color to use for the highlight
 * @property {string} [note] - Initial note to attach to the highlight
 * @property {string[]} [tags] - Initial tags to attach to the highlight
 * @property {boolean} [temporary] - Whether this should be a temporary highlight
 */
export interface HighlightOptions {
  color?: HighlightColor;
  note?: string;
  tags?: string[];
  temporary?: boolean;
}

// ========================================
// PREDEFINED COLOR CONSTANTS
// ========================================

/**
 * Default highlight colors available in the system
 *
 * These colors are optimized for readability and accessibility
 * across different themes and document types.
 */
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

/**
 * The default highlight color (yellow)
 *
 * This is used when no specific color is chosen for a new highlight.
 */
export const DEFAULT_HIGHLIGHT_COLOR = DEFAULT_HIGHLIGHT_COLORS[0];
