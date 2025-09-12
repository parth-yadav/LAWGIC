export interface HighlightData {
  id: string;
  text: string;
  bbox: { // Bbox stores NORMALIZED coordinates (independent of scale)
    x: number;
    y: number;
    width: number;
    height: number;
  };
  page: number;
  color: string;
  note?: string;
}

export interface ThreatData {
  text: string;
  reason: string;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  confidence: number;
}
