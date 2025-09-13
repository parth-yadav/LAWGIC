import {
  Highlight,
  HighlightPosition,
  HighlightColor,
  HighlightOptions,
  DEFAULT_HIGHLIGHT_COLOR,
} from "./types";

// ========================================
// XPATH AND DOM NAVIGATION UTILITIES
// ========================================

/**
 * Creates a unique XPath for a DOM node
 *
 * This function generates an XPath expression that uniquely identifies
 * a DOM node within its document. Used for persisting text selections.
 *
 * @param {Node} node - The DOM node to create an XPath for
 * @returns {string} The XPath expression
 */
export function getXPath(node: Node): string {
  if (node.nodeType === Node.DOCUMENT_NODE) {
    return "/";
  }

  const parent = node.parentNode;
  if (!parent) {
    return "";
  }

  const siblings = Array.from(parent.childNodes);
  const index = siblings.indexOf(node as ChildNode) + 1;
  const tagName =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as Element).tagName.toLowerCase()
      : "text()";

  return getXPath(parent) + "/" + tagName + "[" + index + "]";
}

/**
 * Finds a DOM node using XPath
 *
 * Safely evaluates an XPath expression to find a specific DOM node.
 * Returns null if the XPath is invalid or the node is not found.
 *
 * @param {string} xpath - The XPath expression to evaluate
 * @param {Element} container - The container element to search within
 * @returns {Node | null} The found node or null
 */
export function getNodeByXPath(xpath: string, container: Element): Node | null {
  try {
    const result = document.evaluate(
      xpath,
      container,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    return result.singleNodeValue;
  } catch (error) {
    console.warn("Failed to evaluate XPath:", xpath, error);
    return null;
  }
}

// ========================================
// TEXT OFFSET CALCULATION UTILITIES
// ========================================

/**
 * Calculates text offset from the beginning of the container
 *
 * This function walks through all text nodes in the container and
 * calculates the absolute text offset for a given node and position.
 *
 * @param {Element} container - The container element
 * @param {Node} node - The target text node
 * @param {number} offset - The offset within the node
 * @returns {number} The absolute text offset from container start
 */
export function getTextOffset(
  container: Element,
  node: Node,
  offset: number
): number {
  let textOffset = 0;
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  );

  let currentNode: Node | null;
  while ((currentNode = walker.nextNode())) {
    if (currentNode === node) {
      return textOffset + offset;
    }
    textOffset += currentNode.textContent?.length || 0;
  }
  return textOffset;
}

/**
 * Finds text node and offset from absolute text offset
 *
 * Given an absolute text offset, this function finds the corresponding
 * text node and the relative offset within that node.
 *
 * @param {Element} container - The container element
 * @param {number} targetOffset - The absolute text offset to find
 * @returns {Object | null} Object containing node and offset, or null
 */
export function findTextNodeAndOffset(
  container: Element,
  targetOffset: number
): { node: Node; offset: number } | null {
  let currentOffset = 0;
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  );

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const nodeLength = node.textContent?.length || 0;
    if (currentOffset + nodeLength >= targetOffset) {
      return {
        node: node,
        offset: targetOffset - currentOffset,
      };
    }
    currentOffset += nodeLength;
  }
  return null;
}

// ========================================
// HIGHLIGHT CREATION UTILITIES
// ========================================

/**
 * Creates a highlight from current selection
 *
 * This function takes the current browser selection and creates a
 * Highlight object with proper positioning and metadata.
 *
 * @param {Element} container - The container element containing the selection
 * @param {number} pageNumber - The current page number
 * @param {HighlightOptions} options - Additional options for the highlight
 * @returns {Highlight | null} The created highlight or null if invalid
 */
export function createHighlightFromSelection(
  container: Element,
  pageNumber: number,
  options: HighlightOptions = {}
): Highlight | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const selectedText = selection.toString().trim();

  if (!selectedText || !container.contains(range.commonAncestorContainer)) {
    return null;
  }

  const id = `highlight-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  const position: HighlightPosition = {
    startOffset: getTextOffset(
      container,
      range.startContainer,
      range.startOffset
    ),
    endOffset: getTextOffset(container, range.endContainer, range.endOffset),
    startXPath: getXPath(range.startContainer),
    endXPath: getXPath(range.endContainer),
    pageNumber,
    startPageOffset: range.startOffset,
    endPageOffset: range.endOffset,
  };

  const highlight: Highlight = {
    id,
    text: selectedText,
    position,
    color: options.color || DEFAULT_HIGHLIGHT_COLOR,
    metadata: {
      id,
      text: selectedText,
      note: options.note,
      tags: options.tags,
      createdAt: timestamp,
    },
    isTemporary: options.temporary,
  };

  return highlight;
}

// ========================================
// HIGHLIGHT APPLICATION UTILITIES
// ========================================

/**
 * Applies highlights to a container with performance optimizations
 *
 * This is the main function for rendering highlights in the DOM.
 * It handles performance optimization, error handling, and overlapping highlights.
 *
 * @param {Element} container - The container element to apply highlights to
 * @param {Highlight[]} highlights - Array of highlights to apply
 */
export function applyHighlights(
  container: Element,
  highlights: Highlight[]
): void {
  if (!container || highlights.length === 0) return;

  // Use requestAnimationFrame for better performance
  requestAnimationFrame(() => {
    try {
      // Remove existing highlights
      removeAllHighlights(container);

      // Sort highlights by start offset to handle overlapping highlights
      const sortedHighlights = [...highlights].sort(
        (a, b) => a.position.startOffset - b.position.startOffset
      );

      // Limit the number of highlights processed at once for performance
      const maxHighlights = 100;
      const highlightsToProcess = sortedHighlights.slice(0, maxHighlights);

      // Group overlapping highlights
      const highlightGroups = groupOverlappingHighlights(highlightsToProcess);

      // Apply each group with error handling
      highlightGroups.forEach((group) => {
        try {
          if (group.length === 1) {
            applySingleHighlight(container, group[0]);
          } else {
            applyOverlappingHighlights(container, group);
          }
        } catch (error) {
          console.warn("Failed to apply highlight group:", error);
        }
      });

      if (sortedHighlights.length > maxHighlights) {
        console.warn(
          `Limited highlight rendering to ${maxHighlights} highlights for performance`
        );
      }
    } catch (error) {
      console.error("Failed to apply highlights:", error);
    }
  });
}

/**
 * Applies a single highlight to the container
 *
 * Handles the DOM manipulation required to wrap text content
 * with highlight spans for a single highlight.
 *
 * @param {Element} container - The container element
 * @param {Highlight} highlight - The highlight to apply
 */
function applySingleHighlight(container: Element, highlight: Highlight): void {
  const startPos = findTextNodeAndOffset(
    container,
    highlight.position.startOffset
  );
  const endPos = findTextNodeAndOffset(container, highlight.position.endOffset);

  if (!startPos || !endPos) {
    console.warn("Could not find text positions for highlight:", highlight.id);
    return;
  }

  try {
    const range = document.createRange();
    range.setStart(startPos.node, startPos.offset);
    range.setEnd(endPos.node, endPos.offset);

    const span = createHighlightSpan(highlight);

    // Handle complex cases where range spans multiple elements
    if (range.startContainer === range.endContainer) {
      // Simple case: same text node
      wrapRangeInSpan(range, span);
    } else {
      // Complex case: multiple nodes
      wrapMultiNodeRange(range, span);
    }
  } catch (error) {
    console.warn("Failed to apply highlight:", highlight.id, error);
  }
}

/**
 * Creates a highlight span element
 *
 * Creates a styled span element that will wrap the highlighted text
 * with appropriate styling and data attributes.
 *
 * @param {Highlight} highlight - The highlight to create a span for
 * @returns {HTMLSpanElement} The configured span element
 */
function createHighlightSpan(highlight: Highlight): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = "text-highlight";
  span.style.backgroundColor = highlight.color.backgroundColor;
  span.style.transition = "all 0.2s ease";
  span.style.position = "relative";
  span.style.zIndex = "1";
  span.style.cursor = "pointer";
  span.style.color = "black";
  span.style.fontWeight = "inherit";

  if (highlight.color.borderColor) {
    span.style.borderBottom = `1px solid ${highlight.color.borderColor}`;
  }

  span.setAttribute("data-highlight-id", highlight.id);
  span.setAttribute("data-highlight-text", highlight.text);

  if (highlight.metadata.note) {
    span.title = highlight.metadata.note;
    span.setAttribute("data-has-note", "true");
  }

  return span;
}

/**
 * Wraps a range in a span (simple case)
 *
 * Handles the simple case where the selection range is contained
 * within a single text node.
 *
 * @param {Range} range - The range to wrap
 * @param {HTMLSpanElement} span - The span element to wrap with
 */
function wrapRangeInSpan(range: Range, span: HTMLSpanElement): void {
  try {
    range.surroundContents(span);
  } catch (error) {
    // Fallback: extract and wrap content
    const contents = range.extractContents();
    span.appendChild(contents);
    range.insertNode(span);
  }
}

/**
 * Wraps a multi-node range in spans
 *
 * Handles the complex case where the selection spans multiple
 * text nodes or elements.
 *
 * @param {Range} range - The range to wrap
 * @param {HTMLSpanElement} templateSpan - The template span to clone
 */
function wrapMultiNodeRange(range: Range, templateSpan: HTMLSpanElement): void {
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        return range.intersectsNode(node)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    }
  );

  const textNodes: Node[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  textNodes.forEach((textNode, index) => {
    const span = templateSpan.cloneNode(true) as HTMLSpanElement;
    span.setAttribute("data-highlight-part", index.toString());

    try {
      const parent = textNode.parentNode;
      if (parent) {
        parent.insertBefore(span, textNode);
        span.appendChild(textNode);
      }
    } catch (error) {
      console.warn("Failed to wrap text node:", error);
    }
  });
}

// ========================================
// HIGHLIGHT REMOVAL UTILITIES
// ========================================

/**
 * Removes all highlights from container
 *
 * Cleans up all highlight spans and normalizes the text content
 * back to its original state.
 *
 * @param {Element} container - The container to remove highlights from
 */
export function removeAllHighlights(container: Element): void {
  const highlights = container.querySelectorAll(".text-highlight");
  highlights.forEach((highlight) => {
    const parent = highlight.parentNode;
    if (parent) {
      // Replace highlight with its text content
      const textNode = document.createTextNode(highlight.textContent || "");
      parent.replaceChild(textNode, highlight);
    }
  });

  // Normalize text nodes
  normalizeTextNodes(container);
}

/**
 * Removes a specific highlight by ID
 *
 * Removes only the highlight with the specified ID while preserving
 * other highlights in the container.
 *
 * @param {Element} container - The container element
 * @param {string} highlightId - The ID of the highlight to remove
 */
export function removeHighlight(container: Element, highlightId: string): void {
  const highlights = container.querySelectorAll(
    `[data-highlight-id="${highlightId}"]`
  );
  highlights.forEach((highlight) => {
    const parent = highlight.parentNode;
    if (parent) {
      const textNode = document.createTextNode(highlight.textContent || "");
      parent.replaceChild(textNode, highlight);
    }
  });

  normalizeTextNodes(container);
}

// ========================================
// HIGHLIGHT OVERLAP UTILITIES
// ========================================

/**
 * Groups overlapping highlights
 *
 * Organizes highlights into groups based on whether they overlap
 * in their text positions. This helps handle complex rendering scenarios.
 *
 * @param {Highlight[]} highlights - Array of highlights to group
 * @returns {Highlight[][]} Array of highlight groups
 */
function groupOverlappingHighlights(highlights: Highlight[]): Highlight[][] {
  const groups: Highlight[][] = [];
  let currentGroup: Highlight[] = [];

  highlights.forEach((highlight) => {
    if (currentGroup.length === 0) {
      currentGroup.push(highlight);
    } else {
      // Check if current highlight overlaps with any in current group
      const overlaps = currentGroup.some((h) =>
        highlightsOverlap(h, highlight)
      );

      if (overlaps) {
        currentGroup.push(highlight);
      } else {
        groups.push(currentGroup);
        currentGroup = [highlight];
      }
    }
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Checks if two highlights overlap
 *
 * Determines whether two highlights have overlapping text positions.
 *
 * @param {Highlight} a - First highlight
 * @param {Highlight} b - Second highlight
 * @returns {boolean} True if highlights overlap
 */
function highlightsOverlap(a: Highlight, b: Highlight): boolean {
  return !(
    a.position.endOffset <= b.position.startOffset ||
    b.position.endOffset <= a.position.startOffset
  );
}

/**
 * Applies overlapping highlights with layered effect
 *
 * Handles the rendering of multiple overlapping highlights.
 * Currently uses a simplified approach that applies each highlight separately.
 *
 * @param {Element} container - The container element
 * @param {Highlight[]} highlights - Array of overlapping highlights
 */
function applyOverlappingHighlights(
  container: Element,
  highlights: Highlight[]
): void {
  // For overlapping highlights, we'll create nested spans or use CSS classes
  // This is a simplified approach - you might want to implement more sophisticated merging
  highlights.forEach((highlight) => {
    applySingleHighlight(container, highlight);
  });
}

// ========================================
// DOM MANIPULATION UTILITIES
// ========================================

/**
 * Normalizes text nodes to merge adjacent text nodes
 *
 * After removing highlights, adjacent text nodes may be created.
 * This function merges them back together for cleaner DOM structure.
 *
 * @param {Element} container - The container to normalize
 */
function normalizeTextNodes(container: Element): void {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  );

  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      textNodes.push(node as Text);
    }
  }

  // Group adjacent text nodes
  for (let i = 0; i < textNodes.length - 1; i++) {
    const current = textNodes[i];
    const next = textNodes[i + 1];

    if (
      current.parentNode === next.parentNode &&
      current.nextSibling === next
    ) {
      // Merge nodes
      current.textContent += next.textContent;
      next.parentNode?.removeChild(next);
    }
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Debounced function helper
 *
 * Creates a debounced version of a function that delays execution
 * until after a specified wait time has elapsed.
 *
 * @param {T} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Gets all highlights in a container
 *
 * Returns all highlight elements currently rendered in the container.
 *
 * @param {Element} container - The container to search in
 * @returns {Element[]} Array of highlight elements
 */
export function getHighlightsInContainer(container: Element): Element[] {
  return Array.from(container.querySelectorAll(".text-highlight"));
}

/**
 * Validates highlight data
 *
 * Type guard function that checks if an object conforms to the
 * Highlight interface structure.
 *
 * @param {any} highlight - Object to validate
 * @returns {boolean} True if object is a valid Highlight
 */
export function validateHighlight(highlight: any): highlight is Highlight {
  return (
    typeof highlight?.id === "string" &&
    typeof highlight?.text === "string" &&
    typeof highlight?.position === "object" &&
    typeof highlight?.position?.startOffset === "number" &&
    typeof highlight?.position?.endOffset === "number" &&
    typeof highlight?.position?.pageNumber === "number" &&
    typeof highlight?.color === "object" &&
    typeof highlight?.metadata === "object"
  );
}

// ========================================
// CLEANUP AND EVENT HANDLING
// ========================================

/**
 * Cleanup function to remove event listeners and observers
 *
 * Performs cleanup operations when highlights are no longer needed.
 * Removes all highlights and associated event listeners.
 *
 * @param {Element} container - The container to clean up
 */
export function cleanupHighlights(container: Element): void {
  try {
    removeAllHighlights(container);

    // Remove any mutation observers or event listeners if you add them
    const highlights = container.querySelectorAll("[data-highlight-id]");
    highlights.forEach((highlight) => {
      highlight.removeEventListener?.("click", handleHighlightClick);
    });
  } catch (error) {
    console.warn("Failed to cleanup highlights:", error);
  }
}

/**
 * Default highlight click handler
 *
 * Handles click events on highlight elements and emits custom events
 * for the application to respond to.
 *
 * @param {Event} event - The click event
 */
function handleHighlightClick(event: Event): void {
  const target = event.target as HTMLElement;
  const highlightId = target.getAttribute("data-highlight-id");
  if (highlightId) {
    // Emit custom event for highlight interaction
    const customEvent = new CustomEvent("highlightClick", {
      detail: { highlightId, element: target },
    });
    document.dispatchEvent(customEvent);
  }
}

/**
 * Batch highlight operations for better performance
 *
 * Allows multiple highlight operations to be batched together
 * for better performance when making many changes at once.
 *
 * @param {Element} container - The container element
 * @param {Array} operations - Array of operations to perform
 */
export function batchHighlightOperations(
  container: Element,
  operations: Array<{
    type: "add" | "remove" | "update";
    highlight?: Highlight;
    highlightId?: string;
    updates?: Partial<Highlight>;
  }>
): void {
  if (!container || operations.length === 0) return;

  try {
    operations.forEach((operation) => {
      switch (operation.type) {
        case "add":
          if (operation.highlight) {
            applySingleHighlight(container, operation.highlight);
          }
          break;
        case "remove":
          if (operation.highlightId) {
            removeHighlight(container, operation.highlightId);
          }
          break;
        case "update":
          // Handle update operations
          if (operation.highlightId && operation.updates) {
            removeHighlight(container, operation.highlightId);
            // Apply updated highlight would need the full highlight object
          }
          break;
      }
    });
  } catch (error) {
    console.error("Failed to batch highlight operations:", error);
  }
}
