import { DEFAULT_HIGHLIGHT_COLOR } from "./types";

// XPath utilities
export function getXPath(node) {
  if (node.nodeType === Node.DOCUMENT_NODE) return "/";
  const parent = node.parentNode;
  if (!parent) return "";
  const siblings = Array.from(parent.childNodes);
  const index = siblings.indexOf(node) + 1;
  const tagName = node.nodeType === Node.ELEMENT_NODE ? node.tagName.toLowerCase() : "text()";
  return getXPath(parent) + "/" + tagName + "[" + index + "]";
}

export function getNodeByXPath(xpath, container) {
  try {
    const result = document.evaluate(xpath, container, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue;
  } catch (error) {
    console.warn("Failed to evaluate XPath:", xpath, error);
    return null;
  }
}

export function getTextOffset(container, node, offset) {
  let textOffset = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  let currentNode;
  while ((currentNode = walker.nextNode())) {
    if (currentNode === node) return textOffset + offset;
    textOffset += currentNode.textContent?.length || 0;
  }
  return textOffset;
}

export function findTextNodeAndOffset(container, targetOffset) {
  let currentOffset = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  let node;
  while ((node = walker.nextNode())) {
    const nodeLength = node.textContent?.length || 0;
    if (currentOffset + nodeLength >= targetOffset) {
      return { node, offset: targetOffset - currentOffset };
    }
    currentOffset += nodeLength;
  }
  return null;
}

export function createHighlightFromSelection(container, pageNumber, options = {}) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;

  const range = selection.getRangeAt(0);
  const selectedText = selection.toString().trim();
  if (!selectedText || !container.contains(range.commonAncestorContainer)) return null;

  const id = `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  const position = {
    startOffset: getTextOffset(container, range.startContainer, range.startOffset),
    endOffset: getTextOffset(container, range.endContainer, range.endOffset),
    startXPath: getXPath(range.startContainer),
    endXPath: getXPath(range.endContainer),
    pageNumber,
    startPageOffset: range.startOffset,
    endPageOffset: range.endOffset,
  };

  return {
    id,
    text: selectedText,
    position,
    color: options.color || DEFAULT_HIGHLIGHT_COLOR,
    metadata: { id, text: selectedText, note: options.note, tags: options.tags, createdAt: timestamp },
    isTemporary: options.temporary,
  };
}

function createHighlightSpan(highlight) {
  const span = document.createElement("span");
  span.className = "text-highlight";
  span.style.backgroundColor = highlight.color.backgroundColor;
  span.style.transition = "all 0.2s ease";
  span.style.position = "relative";
  span.style.zIndex = "1";
  span.style.cursor = "pointer";
  span.style.color = "black";
  span.style.fontWeight = "inherit";
  if (highlight.color.borderColor) span.style.borderBottom = `1px solid ${highlight.color.borderColor}`;
  span.setAttribute("data-highlight-id", highlight.id);
  span.setAttribute("data-highlight-text", highlight.text);
  if (highlight.metadata.note) {
    span.title = highlight.metadata.note;
    span.setAttribute("data-has-note", "true");
  }
  return span;
}

function wrapRangeInSpan(range, span) {
  try {
    range.surroundContents(span);
  } catch {
    const contents = range.extractContents();
    span.appendChild(contents);
    range.insertNode(span);
  }
}

function wrapMultiNodeRange(range, templateSpan) {
  const walker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) textNodes.push(node);
  textNodes.forEach((textNode, index) => {
    const span = templateSpan.cloneNode(true);
    span.setAttribute("data-highlight-part", index.toString());
    try {
      const parent = textNode.parentNode;
      if (parent) { parent.insertBefore(span, textNode); span.appendChild(textNode); }
    } catch (error) {
      console.warn("Failed to wrap text node:", error);
    }
  });
}

function applySingleHighlight(container, highlight) {
  const startPos = findTextNodeAndOffset(container, highlight.position.startOffset);
  const endPos = findTextNodeAndOffset(container, highlight.position.endOffset);
  if (!startPos || !endPos) return;
  try {
    const range = document.createRange();
    range.setStart(startPos.node, startPos.offset);
    range.setEnd(endPos.node, endPos.offset);
    const span = createHighlightSpan(highlight);
    if (range.startContainer === range.endContainer) wrapRangeInSpan(range, span);
    else wrapMultiNodeRange(range, span);
  } catch (error) {
    console.warn("Failed to apply highlight:", highlight.id, error);
  }
}

export function removeAllHighlights(container) {
  const highlights = container.querySelectorAll(".text-highlight");
  highlights.forEach((hl) => {
    const parent = hl.parentNode;
    if (parent) parent.replaceChild(document.createTextNode(hl.textContent || ""), hl);
  });
  normalizeTextNodes(container);
}

export function removeHighlight(container, highlightId) {
  const highlights = container.querySelectorAll(`[data-highlight-id="${highlightId}"]`);
  highlights.forEach((hl) => {
    const parent = hl.parentNode;
    if (parent) parent.replaceChild(document.createTextNode(hl.textContent || ""), hl);
  });
  normalizeTextNodes(container);
}

function groupOverlappingHighlights(highlights) {
  const groups = [];
  let currentGroup = [];
  highlights.forEach((highlight) => {
    if (currentGroup.length === 0) { currentGroup.push(highlight); }
    else {
      const overlaps = currentGroup.some((h) => !(h.position.endOffset <= highlight.position.startOffset || highlight.position.endOffset <= h.position.startOffset));
      if (overlaps) currentGroup.push(highlight);
      else { groups.push(currentGroup); currentGroup = [highlight]; }
    }
  });
  if (currentGroup.length > 0) groups.push(currentGroup);
  return groups;
}

export function applyHighlights(container, highlights) {
  if (!container || highlights.length === 0) return;
  requestAnimationFrame(() => {
    try {
      removeAllHighlights(container);
      const sorted = [...highlights].sort((a, b) => a.position.startOffset - b.position.startOffset);
      const toProcess = sorted.slice(0, 100);
      const groups = groupOverlappingHighlights(toProcess);
      groups.forEach((group) => {
        try { group.forEach((h) => applySingleHighlight(container, h)); }
        catch (error) { console.warn("Failed to apply highlight group:", error); }
      });
    } catch (error) { console.error("Failed to apply highlights:", error); }
  });
}

function normalizeTextNodes(container) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) if (node.nodeType === Node.TEXT_NODE) textNodes.push(node);
  for (let i = 0; i < textNodes.length - 1; i++) {
    const current = textNodes[i];
    const next = textNodes[i + 1];
    if (current.parentNode === next.parentNode && current.nextSibling === next) {
      current.textContent += next.textContent;
      next.parentNode?.removeChild(next);
    }
  }
}

export function debounce(func, wait) {
  let timeout;
  return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), wait); };
}

export function validateHighlight(highlight) {
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
