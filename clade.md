# PDF Highlight & Threat Detection System Documentation (CLADE)

## Overview

This document provides a comprehensive analysis of the PDF highlight and threat detection system implementation in the GenAI project. The system provides sophisticated text highlighting, annotation, navigation capabilities, and AI-powered security threat detection built on top of React PDF viewer components.

## System Architecture

### Core Components

1. **PDFProvider** (`pdf/PdfProvider.tsx`)
   - Central state management for PDF viewing, highlighting, and threat detection
   - Context provider for all PDF-related functionality
   - Manages highlight persistence via localStorage
   - Integrates with backend threat analysis API

2. **PdfViewer** (`pdf/PdfViewer.tsx`)
   - Main PDF rendering component using react-pdf
   - Handles text selection and highlight creation
   - Manages context menus for text operations

3. **PdfContentTab** (`pdf/PdfContentTab.tsx`)
   - Collapsible sidebar for displaying PDF content panels
   - Houses both highlights and threats management interfaces

4. **PdfHighlights** (`pdf/highlight/PdfHighlights.tsx`)
   - Dedicated highlights management panel
   - Provides search, navigation, and editing capabilities

5. **PdfThreats** (`pdf/highlight/PdfThreats.tsx`)
   - NEW: Dedicated threats management panel
   - Displays AI-detected security threats with severity levels
   - Provides filtering, search, and navigation to threats

6. **PdfToolbar** (`pdf/PdfToolbar.tsx`)
   - PDF navigation and control toolbar
   - Includes highlights toggle with count indicator
   - NEW: Includes threats toggle with threat count indicator

## NEW: Threat Detection System

### Backend Integration (`simplebackend/server.js`)

The system now integrates with a Node.js backend that uses Google Gemini AI for threat detection:

#### API Endpoint
```
POST /analyze
- Accepts: multipart/form-data with PDF file and word position data
- Returns: ThreatAnalysisResult with detected threats and their locations
```

#### Threat Analysis Process
1. **Word Extraction**: Frontend extracts word positions from PDF using react-pdf
2. **Text Analysis**: Backend uses Gemini AI to analyze text for security threats
3. **Position Mapping**: Backend maps detected threats back to word bounding boxes
4. **Result Return**: Structured threat data with severity and confidence levels

### Threat Types and Detection

#### Security Focus Areas
- SQL Injection patterns (UNION, SELECT, DROP, etc.)
- Cross-Site Scripting (XSS) attempts
- Command injection patterns
- Path traversal attempts
- Malicious URLs and IP addresses
- Hardcoded credentials and API keys
- Security misconfigurations
- Suspicious code snippets
- Social engineering patterns
- Phishing indicators
- Malware signatures

#### Threat Severity Levels
- **Critical**: Immediate security risks requiring urgent attention
- **High**: Significant security concerns that should be addressed promptly
- **Medium**: Moderate security issues that need investigation
- **Low**: Minor security observations or best practice violations

### New Type System Extensions

### New Type System Extensions

#### Threat Detection Types (`pdf/highlight/types.ts`)

```typescript
interface ThreatBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Threat {
  text: string;                         // The threatening text content
  reason: string;                       // Explanation of why this is a threat
  bbox: ThreatBoundingBox | null;       // Bounding box for visual highlighting
  confidence: number;                   // AI confidence level (0-1)
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;                    // Threat category (SQL injection, XSS, etc.)
}

interface PageThreats {
  page: number;                         // Page number
  threats: Threat[];                    // Array of threats on this page
  totalWords: number;                   // Total words analyzed on page
}

interface ThreatAnalysisResult {
  pages: PageThreats[];                 // All page results
  totalPages: number;                   // Total pages analyzed
  totalThreats: number;                 // Total threats found
}
```

#### Threat-Specific Colors

```typescript
const THREAT_COLORS: HighlightColor[] = [
  { id: "threat-critical", backgroundColor: "rgba(239, 68, 68, 0.3)" },
  { id: "threat-high", backgroundColor: "rgba(249, 115, 22, 0.3)" },
  { id: "threat-medium", backgroundColor: "rgba(245, 158, 11, 0.3)" },
  { id: "threat-low", backgroundColor: "rgba(234, 179, 8, 0.3)" },
];
```

## Highlight Module Deep Dive

### Type System (`pdf/highlight/types.ts`)

#### Core Interfaces

```typescript
interface HighlightPosition {
  startOffset: number;          // Absolute start position in container text
  endOffset: number;            // Absolute end position in container text
  startXPath?: string;          // XPath to the start node
  endXPath?: string;            // XPath to the end node
  pageNumber: number;           // Page number where highlight appears
  startPageOffset?: number;     // Relative start offset within start node
  endPageOffset?: number;       // Relative end offset within end node
}

interface Highlight {
  id: string;                   // Unique identifier
  text: string;                 // The highlighted text content
  position: HighlightPosition;  // Position data for rendering
  color: HighlightColor;        // Color scheme for visual rendering
  metadata: HighlightMetadata;  // Additional user data and metadata
  isActive?: boolean;           // Whether highlight is currently selected
  isTemporary?: boolean;        // Whether this is a temporary highlight
}
```

#### Addressing System

The system uses a **dual addressing approach** for reliable highlight positioning:

1. **Absolute Text Offsets**
   - `startOffset` and `endOffset` provide character-based positioning
   - Calculated from the beginning of the container element
   - Used for primary positioning logic

2. **XPath-based Addressing**
   - `startXPath` and `endXPath` provide DOM node paths
   - Used for fallback positioning when text offsets fail
   - Enables recovery from DOM structure changes

3. **Relative Node Offsets**
   - `startPageOffset` and `endPageOffset` for within-node positioning
   - Used in conjunction with XPath for precise location

### Utility Functions (`pdf/highlight/utils.ts`)

#### Text Positioning Engine

```typescript
// Primary positioning functions
getTextOffset(container: Element, node: Node, offset: number): number
findTextNodeAndOffset(container: Element, targetOffset: number): {node: Node, offset: number} | null

// XPath-based addressing
getXPath(node: Node): string
getNodeByXPath(xpath: string, container: Element): Node | null
```

**How Text Addressing Works:**

1. **Text Offset Calculation**
   - Walks through all text nodes using TreeWalker
   - Accumulates character counts to find absolute positions
   - Handles complex DOM structures with nested elements

2. **XPath Generation**
   - Creates unique path expressions for DOM nodes
   - Format: `/tagname[index]/tagname[index]...`
   - Enables reliable node lookup across sessions

3. **Position Resolution**
   - Primary: Uses absolute text offsets for fast positioning
   - Fallback: Uses XPath when offsets fail due to DOM changes
   - Hybrid: Combines both methods for maximum reliability

#### Highlight Application Engine

```typescript
applyHighlights(container: Element, highlights: Highlight[]): void
```

**Rendering Pipeline:**

1. **Preprocessing**
   - Sort highlights by start offset
   - Group overlapping highlights
   - Validate highlight data

2. **DOM Manipulation**
   - Create highlight spans with styling
   - Handle single-node vs multi-node selections
   - Apply click event handlers

3. **Performance Optimization**
   - Uses `requestAnimationFrame` for smooth rendering
   - Limits concurrent highlights (max 100)
   - Debounced re-application (150ms)

#### Overlap Handling

The system handles overlapping highlights through:

1. **Detection**
   - `highlightsOverlap()` function checks position conflicts
   - Groups overlapping highlights for batch processing

2. **Resolution**
   - Simple approach: Apply each highlight separately
   - Creates nested spans for overlapping regions
   - Maintains individual highlight identity

### Scroll-to-View Implementation

#### Jump-to-Highlight Function

```typescript
jumpToHighlight(highlight: Highlight): void
```

**Navigation Process:**

1. **Page Location**
   - Uses `pagesRefs.current.get(highlight.position.pageNumber)`
   - Locates the specific page element in the DOM

2. **Element Finding**
   - Queries for `[data-highlight-id="${highlight.id}"]`
   - Finds all spans belonging to the highlight

3. **Smooth Scrolling**
   - Uses `scrollIntoView({ behavior: "smooth", block: "center" })`
   - Centers the highlight in the viewport

4. **Visual Feedback**
   - Applies temporary red glow effect
   - Wiggle animation for user attention
   - Auto-removes effects after 800ms

#### Page-Level Navigation

```typescript
scrollToPage(pageNum: number, instant = false): void
```

**Features:**

- Intersection Observer for automatic page detection
- Smooth vs instant scrolling modes
- Scroll state management to prevent navigation conflicts
- 30% visibility threshold for page activation

### State Management

#### Local Storage Persistence

```typescript
const [highlights, setHighlights] = useLocalState<Highlight[]>("highlights", []);
```

**Persistence Strategy:**

- Automatic serialization to localStorage
- Key-based storage (`"highlights"`)
- Maintains state across browser sessions
- Handles JSON serialization/deserialization

#### Context State Structure

The PDFProvider manages comprehensive state:

```typescript
interface PDFContextType {
  // Highlight-specific state
  highlights: Highlight[];
  setHighlights: React.Dispatch<React.SetStateAction<Highlight[]>>;
  removeHighlightById: (highlightId: string) => void;
  clearAllHighlights: () => void;
  updateHighlightById: (highlightId: string, newData: Partial<Highlight>) => void;
  jumpToHighlight: (highlight: Highlight) => void;
  applyHighlightsToTextLayer: () => void;
  
  // Context menu state
  highlightContextMenu: HighlightContextMenuState | null;
  setHighlightContextMenu: React.Dispatch<React.SetStateAction<HighlightContextMenuState | null>>;
}
```

### Text Selection System

#### Selection Detection

```typescript
handleMouseUp(e: MouseEvent): void
```

**Selection Process:**

1. **Browser Selection Capture**
   - Gets `window.getSelection()` and selected text
   - Validates selection within PDF container
   - Calculates bounding rectangles

2. **Context Menu Positioning**
   - Determines optimal menu placement (above/below)
   - Handles viewport boundary constraints
   - Centers menu horizontally on selection

3. **Selection Persistence**
   - Maintains selection state until action taken
   - Periodic checking for selection loss
   - Auto-cleanup when selection cleared

#### Highlight Creation

```typescript
createHighlightFromSelection(container: Element, pageNumber: number, options: HighlightOptions): Highlight | null
```

**Creation Pipeline:**

1. **Text Extraction**
   - Gets selected text and DOM range
   - Validates selection boundaries

2. **Position Calculation**
   - Calculates absolute text offsets
   - Generates XPath addresses
   - Records page and relative positions

3. **Metadata Generation**
   - Creates unique ID with timestamp
   - Records creation timestamp
   - Applies user-specified options (color, note)

### Search and Filtering

#### Multi-field Search

```typescript
const filteredHighlights = highlights.filter(
  (highlight) =>
    highlight.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    highlight.metadata.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    highlight.metadata.tags?.some((tag) =>
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    )
);
```

**Search Capabilities:**

- Text content search
- Note content search  
- Tag-based search
- Case-insensitive matching
- Real-time filtering

### Color System

#### Predefined Colors

```typescript
const DEFAULT_HIGHLIGHT_COLORS: HighlightColor[] = [
  { id: "yellow", name: "Yellow", backgroundColor: "rgba(255, 255, 0, 1)" },
  { id: "green", name: "Green", backgroundColor: "rgba(144, 238, 144, 1)" },
  { id: "blue", name: "Blue", backgroundColor: "rgba(135, 206, 235, 1)" },
  { id: "pink", name: "Pink", backgroundColor: "rgba(255, 182, 193, 1)" },
  { id: "orange", name: "Orange", backgroundColor: "rgba(255, 165, 0, 1)" },
];
```

**Color Features:**

- RGBA values for transparency support
- Border color variants for definition
- Dynamic color switching
- Persistent color preferences

### Performance Considerations

#### Optimization Strategies

1. **Rendering Optimization**
   - `requestAnimationFrame` for smooth updates
   - Debounced highlight application (150ms)
   - Maximum highlight limit (100 concurrent)

2. **Memory Management**
   - Cleanup functions for event listeners
   - Proper ref management
   - DOM normalization after highlight removal

3. **Event Handling**
   - Throttled scroll detection
   - Efficient intersection observers
   - Minimal re-renders through proper dependencies

#### Error Handling

```typescript
try {
  applyHighlights(textLayerRef.current, validHighlights);
} catch (error) {
  console.error("Failed to apply highlights:", error);
}
```

**Error Recovery:**

- Graceful degradation on highlight failures
- Console logging for debugging
- Validation before operations
- Fallback positioning methods

## Integration Points

### React PDF Integration

The system integrates with react-pdf through:

1. **Text Layer Events**
   - `onRenderTextLayerSuccess={applyHighlightsToTextLayer}`
   - Automatic highlight re-application on page renders

2. **Page Management**
   - Page refs for navigation
   - Intersection observers for page tracking
   - Zoom and rotation support

### Local Storage Integration

```typescript
const [highlights, setHighlights] = useLocalState<Highlight[]>("highlights", []);
```

**Persistence Features:**

- Automatic save on highlight changes
- Cross-session persistence
- JSON serialization
- Error-tolerant loading

## Usage Patterns

### Creating Highlights

1. User selects text in PDF
2. Context menu appears with highlight options
3. User chooses color or uses default
4. Highlight created and applied to DOM
5. State updated and persisted

### Navigating Highlights

1. User opens highlights panel
2. Clicks on desired highlight
3. Page scrolls to highlight location
4. Highlight temporarily animated for visibility

### Managing Highlights

1. Search/filter highlights by text, notes, tags
2. Edit notes inline
3. Change colors via color picker
4. Delete individual or all highlights

### NEW: Threat Detection Workflow

#### Analyzing PDF for Threats

1. User opens PDF in viewer
2. Clicks "Threats" button in toolbar
3. Threats panel opens with "Analyze PDF" button
4. System extracts word positions from PDF
5. Backend analyzes content using Gemini AI
6. Threats displayed with severity indicators
7. User can filter by severity level
8. Click threat to navigate to location

#### Threat Management Features

1. **Severity Filtering**: Filter threats by critical, high, medium, low
2. **Search Functionality**: Search through threat text and descriptions
3. **Jump to Threat**: Click any threat to navigate to its location in PDF
4. **Visual Indicators**: Color-coded severity levels with appropriate icons
5. **Summary Statistics**: Overview of threat distribution by severity
6. **Real-time Analysis**: Background processing with loading indicators

### Backend Configuration

#### Environment Setup (`simplebackend/.env.example`)

```bash
# Google Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration  
PORT=4000

# Upload Configuration
MAX_FILE_SIZE=50MB
UPLOAD_DIR=uploads
```

#### API Response Format

```json
{
  "pages": [
    {
      "page": 1,
      "threats": [
        {
          "text": "SELECT * FROM users",
          "reason": "Potential SQL injection pattern detected",
          "bbox": { "x": 100, "y": 200, "width": 150, "height": 20 },
          "confidence": 0.95,
          "severity": "high",
          "category": "SQL Injection"
        }
      ],
      "totalWords": 1500
    }
  ],
  "totalPages": 1,
  "totalThreats": 1
}
```

## Future Enhancement Opportunities

1. **Advanced Positioning**
   - PDF coordinate-based addressing
   - Text fingerprinting for robustness
   - Cross-document highlight portability

2. **Collaborative Features**
   - Multi-user highlighting
   - Comment threads on highlights
   - Real-time synchronization

3. **Export/Import**
   - PDF annotation export
   - JSON/CSV highlight exports
   - Annotation format compatibility

4. **AI Integration** ✅ **IMPLEMENTED**
   - ✅ Automatic threat detection using Gemini AI
   - ✅ Security vulnerability scanning
   - ✅ Content categorization by threat type
   - 🔄 Content summarization
   - 🔄 Semantic search capabilities

5. **Enhanced Threat Detection**
   - 🔄 Custom threat pattern definitions
   - 🔄 Machine learning model training on domain-specific threats
   - 🔄 Integration with security databases and CVE feeds
   - 🔄 Automated reporting and alerting
   - 🔄 Threat remediation suggestions

6. **Advanced Analytics**
   - 🔄 Threat trend analysis across documents
   - 🔄 Risk scoring algorithms
   - 🔄 Compliance checking against security standards
   - 🔄 Audit trail and reporting

## Technical Dependencies

- **react-pdf**: Core PDF rendering
- **framer-motion**: Animations and transitions
- **lucide-react**: Icons throughout the interface
- **localStorage**: Client-side persistence
- **DOM APIs**: TreeWalker, Range, Selection, XPath evaluation
- **NEW: Google Gemini AI**: Backend threat analysis and content understanding
- **NEW: Express.js**: Backend API server
- **NEW: Multer**: File upload handling
- **NEW: CORS**: Cross-origin resource sharing

## Performance Considerations

### Frontend Optimizations
- Debounced threat analysis requests
- Virtual scrolling for large threat lists
- Lazy loading of threat details
- Cached analysis results

### Backend Optimizations
- Rate limiting on analysis endpoints
- Request queuing for concurrent analysis
- Response caching for identical content
- Optimized text chunking for AI analysis

This comprehensive documentation captures both the sophisticated highlight system architecture and the new AI-powered threat detection capabilities, providing a foundation for future development and maintenance of the PDF security analysis platform.
