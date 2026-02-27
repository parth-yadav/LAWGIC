// Highlight Color type
// { id, name, backgroundColor, borderColor?, textColor? }

// Highlight Position type
// { startOffset, endOffset, startXPath?, endXPath?, pageNumber, startPageOffset?, endPageOffset? }

// Highlight Metadata type
// { id, text, note?, tags?, createdAt, updatedAt?, author?, needsPositionCalculation?, matchType?, threatSeverity?, threatType?, explanation? }

// Highlight type
// { id, text, position, color, metadata, isActive?, isTemporary? }

export const DEFAULT_HIGHLIGHT_COLORS = [
  { id: "yellow", name: "Yellow", backgroundColor: "rgba(255, 255, 0, 1)", borderColor: "rgba(230, 230, 0, 1)" },
  { id: "green", name: "Green", backgroundColor: "rgba(144, 238, 144, 1)", borderColor: "rgba(125, 216, 125, 1)" },
  { id: "blue", name: "Blue", backgroundColor: "rgba(135, 206, 235, 1)", borderColor: "rgba(107, 182, 212, 1)" },
  { id: "pink", name: "Pink", backgroundColor: "rgba(255, 182, 193, 1)", borderColor: "rgba(255, 158, 181, 1)" },
  { id: "orange", name: "Orange", backgroundColor: "rgba(255, 165, 0, 1)", borderColor: "rgba(230, 149, 0, 1)" },
];

export const THREAT_COLORS = [
  { id: "threat-critical", name: "Critical Threat", backgroundColor: "rgba(255, 0, 0, 1)", borderColor: "rgba(255, 0, 0, 1)" },
  { id: "threat-high", name: "High Threat", backgroundColor: "rgba(0, 0, 255, 1)", borderColor: "rgba(0, 0, 255, 1)" },
  { id: "threat-medium", name: "Medium Threat", backgroundColor: "rgba(255, 0, 0, 1)", borderColor: "rgba(255, 0, 0, 1)" },
  { id: "threat-low", name: "Low Threat", backgroundColor: "rgba(255, 0, 0, 1)", borderColor: "rgba(255, 0, 0, 1)" },
];

export const DEFAULT_HIGHLIGHT_COLOR = DEFAULT_HIGHLIGHT_COLORS[0];

export const getThreatColor = (severity) => {
  return THREAT_COLORS[0];
};
