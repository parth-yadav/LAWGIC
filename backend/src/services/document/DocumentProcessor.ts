import { Page, AugmentedLeanDocument } from '../../types/document.js';
import { PdfTextExtractor } from './PdfTextExtractor.js';
import { TextParser } from './TextParser.js';
import { ThreatAnalyzer } from './ThreatAnalyzer.js';
import { ComplexTermsIdentifier } from './ComplexTermsIdentifier.js';
import { UrlExtractor } from './UrlExtractor.js';

export class DocumentProcessor {
  private pdfExtractor: PdfTextExtractor;
  private textParser: TextParser;
  private threatAnalyzer: ThreatAnalyzer;
  private complexTermsIdentifier: ComplexTermsIdentifier;
  private urlExtractor: UrlExtractor;

  constructor() {
    this.pdfExtractor = new PdfTextExtractor();
    this.textParser = new TextParser();
    this.threatAnalyzer = new ThreatAnalyzer();
    this.complexTermsIdentifier = new ComplexTermsIdentifier();
    this.urlExtractor = new UrlExtractor();
  }

  // Main processing method
  async processDocument(input: Buffer | string, type: 'pdf' | 'url', documentId?: string): Promise<AugmentedLeanDocument> {
    let pages: Page[];
    const docId = documentId || this.textParser.generateId('doc', Date.now());

    try {
      if (type === 'pdf') {
        const pdfData = await this.pdfExtractor.extractTextFromPDF(input as Buffer);
        pages = this.textParser.processTextContentFromPages(pdfData.pages);
        console.log(`Processed ${pdfData.totalPages} actual PDF pages`);
      } else if (type === 'url') {
        const text = await this.urlExtractor.extractTextFromURL(input as string);
        pages = this.textParser.processTextContent(text);
      } else {
        throw new Error('Unsupported document type');
      }

      const threats = this.threatAnalyzer.analyzeThreats(pages);
      const complexTerms = this.complexTermsIdentifier.identifyComplexTerms(pages);

      return {
        document_id: docId,
        pages,
        threats,
        complex_terms: complexTerms
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Document processing failed: ${errorMessage}`);
    }
  }

  // Get individual services for advanced usage
  getPdfExtractor(): PdfTextExtractor {
    return this.pdfExtractor;
  }

  getTextParser(): TextParser {
    return this.textParser;
  }

  getThreatAnalyzer(): ThreatAnalyzer {
    return this.threatAnalyzer;
  }

  getComplexTermsIdentifier(): ComplexTermsIdentifier {
    return this.complexTermsIdentifier;
  }

  getUrlExtractor(): UrlExtractor {
    return this.urlExtractor;
  }
}
