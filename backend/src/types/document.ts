// Document structure types for augmented lean document format

export interface Word {
  id: string;
  text: string;
}

export interface Sentence {
  id: string;
  text: string;
  words: Word[];
}

export interface Page {
  page_number: number;
  content: Sentence[];
}

export interface Threat {
  threat_id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  reference: string;
  recommendation?: string;
}

export interface ComplexTerm {
  term_id: string;
  term: string;
  definition: string;
  reference: string;
}

export interface AugmentedLeanDocument {
  document_id: string;
  pages: Page[];
  threats: Threat[];
  complex_terms: ComplexTerm[];
}