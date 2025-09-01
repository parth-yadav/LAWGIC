import { Request, Response } from 'express';
import { sendResponse } from '../utils/ResponseHelpers.js';
import { 
  Word, 
  Sentence, 
  Page, 
  Threat, 
  ComplexTerm, 
  AugmentedLeanDocument
} from '../types/document.js';
import puppeteer from 'puppeteer';
import multer from 'multer';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

export const upload = multer({ 
  storage,
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOC/DOCX files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

class DocumentProcessor {
  // Generate unique IDs
  private generateId(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}_${parts.join('_')}`;
  }

  // Split text into sentences using more sophisticated regex
  private splitIntoSentences(text: string): string[] {
    // Clean the text first
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // Split on sentence endings but preserve abbreviations
    const sentences = cleanText.split(/(?<=[.!?])\s+(?=[A-Z])/);
    
    return sentences.filter(sentence => sentence.trim().length > 0);
  }

  // Split sentence into words
  private splitIntoWords(sentence: string, sentenceId: string): Word[] {
    const words = sentence.split(/\s+/).filter(word => word.trim().length > 0);
    
    return words.map((word, index) => ({
      id: this.generateId(sentenceId, 'w', index + 1),
      text: word
    }));
  }

  // Process text content from actual PDF pages into augmented lean structure
  private processTextContentFromPages(pageTexts: string[]): Page[] {
    const pages: Page[] = [];

    pageTexts.forEach((pageText, pageIndex) => {
      const pageNumber = pageIndex + 1;
      const sentences = this.splitIntoSentences(pageText);

      const content: Sentence[] = sentences.map((sentenceText, sentenceIndex) => {
        const sentenceId = this.generateId('p', pageNumber, 's', sentenceIndex + 1);
        const words = this.splitIntoWords(sentenceText, sentenceId);

        return {
          id: sentenceId,
          text: sentenceText,
          words
        };
      });

      pages.push({
        page_number: pageNumber,
        content
      });
    });

    return pages;
  }

  // Legacy method for backward compatibility (URLs and other text sources)
  private processTextContent(text: string): Page[] {
    const sentences = this.splitIntoSentences(text);
    const sentencesPerPage = 20; // Approximate sentences per page
    const pages: Page[] = [];

    for (let pageIndex = 0; pageIndex < Math.ceil(sentences.length / sentencesPerPage); pageIndex++) {
      const pageNumber = pageIndex + 1;
      const startIndex = pageIndex * sentencesPerPage;
      const endIndex = Math.min(startIndex + sentencesPerPage, sentences.length);
      const pageSentences = sentences.slice(startIndex, endIndex);

      const content: Sentence[] = pageSentences.map((sentenceText, sentenceIndex) => {
        const sentenceId = this.generateId('p', pageNumber, 's', sentenceIndex + 1);
        const words = this.splitIntoWords(sentenceText, sentenceId);

        return {
          id: sentenceId,
          text: sentenceText,
          words
        };
      });

      pages.push({
        page_number: pageNumber,
        content
      });
    }

    return pages;
  }

  // Analyze threats in the document (basic implementation - can be enhanced with AI)
  private analyzeThreats(pages: Page[]): Threat[] {
    const threats: Threat[] = [];
    const threatKeywords = {
      high: ['terminate', 'void', 'breach', 'penalty', 'forfeit', 'liable', 'damages'],
      medium: ['obligation', 'requirement', 'must', 'shall', 'mandatory'],
      low: ['should', 'recommend', 'suggest', 'prefer']
    };

    let threatCounter = 1;

    pages.forEach(page => {
      page.content.forEach((sentence: Sentence) => {
        const lowerText = sentence.text.toLowerCase();
        
        // Check for high severity threats
        for (const keyword of threatKeywords.high) {
          if (lowerText.includes(keyword)) {
            threats.push({
              threat_id: this.generateId('threat', threatCounter++),
              category: 'legal_risk',
              severity: 'high',
              description: `Contains potentially risky clause with "${keyword}"`,
              reference: sentence.id,
              recommendation: `Review this clause carefully as it may pose significant legal or financial risk.`
            });
            break;
          }
        }

        // Check for medium severity threats
        for (const keyword of threatKeywords.medium) {
          if (lowerText.includes(keyword)) {
            threats.push({
              threat_id: this.generateId('threat', threatCounter++),
              category: 'compliance',
              severity: 'medium',
              description: `Contains compliance requirement with "${keyword}"`,
              reference: sentence.id,
              recommendation: `Ensure all compliance requirements can be met.`
            });
            break;
          }
        }

        // Check for low severity threats
        for (const keyword of threatKeywords.low) {
          if (lowerText.includes(keyword)) {
            threats.push({
              threat_id: this.generateId('threat', threatCounter++),
              category: 'advisory',
              severity: 'low',
              description: `Contains advisory language with "${keyword}"`,
              reference: sentence.id
            });
            break;
          }
        }
      });
    });

    return threats;
  }

  // Identify complex terms (basic implementation - can be enhanced with AI)
  private identifyComplexTerms(pages: Page[]): ComplexTerm[] {
    const complexTerms: ComplexTerm[] = [];
    const legalTerms: { [key: string]: string } = {
      'indemnification': 'A legal principle where one party agrees to cover the losses of another.',
      'consideration': 'Something of value exchanged between parties in a contract.',
      'force majeure': 'Unforeseeable circumstances that prevent a party from fulfilling a contract.',
      'arbitration': 'A method of dispute resolution outside of court.',
      'confidentiality': 'The practice of keeping sensitive information secret.',
      'liability': 'Legal responsibility for damages or harm.',
      'warranty': 'A guarantee about the condition or quality of something.',
      'covenant': 'A formal agreement or promise in a contract.',
      'breach': 'Failure to fulfill the terms of a contract.',
      'liquidated damages': 'Predetermined compensation for contract breach.'
    };

    let termCounter = 1;

    pages.forEach(page => {
      page.content.forEach((sentence: Sentence) => {
        sentence.words.forEach((word: Word) => {
          const cleanWord = word.text.toLowerCase().replace(/[^\w]/g, '');
          
          if (legalTerms[cleanWord]) {
            complexTerms.push({
              term_id: this.generateId('term', termCounter++),
              term: cleanWord,
              definition: legalTerms[cleanWord],
              reference: word.id
            });
          }
        });
      });
    });

    return complexTerms;
  }

  // Extract text from PDF using enhanced page-by-page extraction
  private async extractTextFromPDF(buffer: Buffer): Promise<{ pages: string[], totalPages: number }> {
    try {
      console.log('Extracting text from PDF, buffer size:', buffer.length);
      console.log('Buffer is valid:', Buffer.isBuffer(buffer));
      
      // Use enhanced extraction method that preserves page boundaries
      const pageTexts = await this.extractPagesWithPdf2pic(buffer);
      console.log(`Successfully extracted text from ${pageTexts.length} pages using enhanced method`);
      
      // Log first few characters of each page for debugging
      pageTexts.forEach((pageText, index) => {
        const preview = pageText.substring(0, 100).replace(/\n/g, ' ');
        console.log(`Page ${index + 1} preview: "${preview}..."`);
      });
      
      return {
        pages: pageTexts,
        totalPages: pageTexts.length
      };
      
    } catch (error) {
      console.error('PDF extraction failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`PDF text extraction failed: ${errorMessage}`);
    }
  }

  // Method to extract pages using pdf2pic + OCR or better text extraction
  private async extractPagesWithPdf2pic(buffer: Buffer): Promise<string[]> {
    try {
      // First, try to extract all text and then split by page markers
      const result = await this.extractTextWithPageMarkers(buffer);
      if (result.pages.length > 0) {
        console.log(`Successfully extracted ${result.pages.length} pages using page marker method`);
        return result.pages;
      }
      
      // Fallback to the original method if page marker method fails
      return await this.extractPagesWithPdfLib(buffer);
      
    } catch (error) {
      console.error('Enhanced page extraction failed, falling back to pdf-lib method:', error);
      return await this.extractPagesWithPdfLib(buffer);
    }
  }

  // New method: Extract text and split by page markers (more accurate for page boundaries)
  private async extractTextWithPageMarkers(buffer: Buffer): Promise<{ pages: string[], totalPages: number }> {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      
      // Extract all text from PDF with page info
      const pdfData = await pdfParse(buffer, {
        // Custom page rendering to preserve page breaks
        pagerender: async (pageData: any) => {
          const textContent = await pageData.getTextContent();
          let pageText = '';
          
          // Sort text items by their position (y-coordinate, then x-coordinate)
          const sortedItems = textContent.items.sort((a: any, b: any) => {
            // Sort by Y position (top to bottom), then X position (left to right)
            const yDiff = b.transform[5] - a.transform[5]; // Y coordinate (inverted for PDF)
            if (Math.abs(yDiff) > 5) return yDiff > 0 ? 1 : -1; // If Y difference is significant
            return a.transform[4] - b.transform[4]; // X coordinate for same line
          });
          
          let currentY = null;
          for (const item of sortedItems) {
            const y = Math.round(item.transform[5]);
            
            // Add line break for new lines (when Y coordinate changes significantly)
            if (currentY !== null && Math.abs(y - currentY) > 5) {
              pageText += '\n';
            }
            
            // Add space if needed (when items are on the same line but separated)
            if (currentY === y && pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
              pageText += ' ';
            }
            
            pageText += item.str;
            currentY = y;
          }
          
          return pageText;
        }
      });
      
      const fullText = pdfData.text;
      const totalPages = pdfData.numpages;
      
      console.log(`PDF has ${totalPages} pages, splitting text by content...`);
      
      // Split text into pages - look for page indicators
      const pages = await this.splitTextIntoPages(fullText, totalPages);
      
      return {
        pages: pages,
        totalPages: pages.length
      };
      
    } catch (error) {
      console.error('Page marker extraction failed:', error);
      throw error;
    }
  }

  // Smart text splitting based on page indicators and content flow
  private async splitTextIntoPages(text: string, expectedPages: number): Promise<string[]> {
    let pages: string[] = [];
    
    // Try splitting by "Page X of Y" pattern first
    const pageMatches = Array.from(text.matchAll(/Page (\d+) of (\d+)/gi));
    
    if (pageMatches.length > 0) {
      console.log(`Found ${pageMatches.length} page markers`);
      
      for (let i = 0; i < pageMatches.length; i++) {
        const prevMatch = i > 0 ? pageMatches[i - 1] : null;
        const nextMatch = i < pageMatches.length - 1 ? pageMatches[i + 1] : null;
        
        const startIndex = prevMatch ? (prevMatch.index! + prevMatch[0].length) : 0;
        const endIndex = nextMatch ? nextMatch.index! : text.length;
        
        const pageText = text.substring(startIndex, endIndex).trim();
        if (pageText) {
          pages.push(pageText);
        }
      }
    }
    
    // If we don't have enough pages, try splitting by form feed characters
    if (pages.length === 0 || pages.length < expectedPages / 2) {
      console.log('Page marker method insufficient, trying form feed splitting...');
      const formFeedPages = text.split('\f').filter(page => page.trim().length > 0);
      if (formFeedPages.length > pages.length) {
        pages = formFeedPages;
      }
    }
    
    // If still not enough pages, use content-based splitting
    if (pages.length === 0 || pages.length < expectedPages / 2) {
      console.log('Trying content-based page splitting...');
      pages = this.splitByContentLength(text, expectedPages);
    }
    
    console.log(`Split text into ${pages.length} pages`);
    return pages;
  }

  // Fallback: Split text by approximate content length
  private splitByContentLength(text: string, expectedPages: number): string[] {
    const avgPageLength = Math.ceil(text.length / expectedPages);
    const pages: string[] = [];
    
    let currentPos = 0;
    for (let i = 0; i < expectedPages; i++) {
      const targetEnd = Math.min(currentPos + avgPageLength, text.length);
      
      // Try to find a good break point (end of sentence or paragraph)
      let breakPoint = targetEnd;
      if (i < expectedPages - 1) { // Don't adjust for the last page
        const searchEnd = Math.min(targetEnd + avgPageLength * 0.3, text.length);
        for (let j = targetEnd; j < searchEnd; j++) {
          if (text[j] === '\n' && text[j + 1] === '\n') {
            breakPoint = j;
            break;
          } else if (text[j] === '.' && text[j + 1] === ' ' && text[j + 2] && /[A-Z]/.test(text[j + 2]!)) {
            breakPoint = j + 1;
            break;
          }
        }
      }
      
      const pageText = text.substring(currentPos, breakPoint).trim();
      if (pageText) {
        pages.push(pageText);
      }
      
      currentPos = breakPoint;
      if (currentPos >= text.length) break;
    }
    
    return pages;
  }

  // Original pdf-lib method as fallback
  private async extractPagesWithPdfLib(buffer: Buffer): Promise<string[]> {
    try {
      const PDFDocument = (await import('pdf-lib')).PDFDocument;
      const pdfDoc = await PDFDocument.load(buffer);
      const pageCount = pdfDoc.getPageCount();
      
      console.log(`PDF has ${pageCount} pages, extracting each page individually with pdf-lib...`);
      
      const pageTexts: string[] = [];
      
      for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
        try {
          // Create a new PDF with just this page
          const singlePagePdf = await PDFDocument.create();
          const [page] = await singlePagePdf.copyPages(pdfDoc, [pageIndex]);
          singlePagePdf.addPage(page);
          
          const singlePageBuffer = Buffer.from(await singlePagePdf.save());
          
          // Extract text from this single page
          const pdfParse = (await import('pdf-parse')).default;
          const pageData = await pdfParse(singlePageBuffer);
          
          const pageText = pageData.text.trim();
          pageTexts.push(pageText);
          
          console.log(`Page ${pageIndex + 1} extracted: ${pageText.length} characters`);
          
        } catch (pageError) {
          console.warn(`Failed to extract page ${pageIndex + 1}:`, pageError);
          pageTexts.push(''); // Add empty string for failed pages but maintain page count
        }
      }
      
      console.log(`Successfully extracted ${pageTexts.length} pages with pdf-lib fallback method`);
      return pageTexts;
      
    } catch (error) {
      console.error('pdf-lib extraction failed:', error);
      throw error;
    }
  }

  // Extract text from web page or download document from URL
  private async extractTextFromURL(url: string): Promise<string> {
    try {
      console.log('Processing URL:', url);
      
      // Check if URL points to a document file
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      console.log('URL pathname:', pathname);
      
      const isDocumentFile = pathname.endsWith('.pdf') || 
                            pathname.endsWith('.doc') || 
                            pathname.endsWith('.docx');

      if (isDocumentFile) {
        console.log('Detected as document file, downloading...');
        // Download the document and process it
        const axios = (await import('axios')).default;
        const response = await axios.get(url, { 
          responseType: 'arraybuffer',
          timeout: 30000
        });
        
        console.log('Download successful, response size:', (response.data as ArrayBuffer).byteLength);
        const buffer = Buffer.from(response.data as ArrayBuffer);
        
        if (pathname.endsWith('.pdf')) {
          console.log('Processing as PDF...');
          const pdfData = await this.extractTextFromPDF(buffer);
          return pdfData.pages.join('\n\n'); // Join all pages with double newlines
        } else if (pathname.endsWith('.doc') || pathname.endsWith('.docx')) {
          // For now, throw an error for DOC files as we need additional libraries
          throw new Error('DOC/DOCX file processing from URL is not yet supported. Please upload the file directly.');
        } else {
          throw new Error('Unsupported document file type');
        }
      } else {
        // Regular web page - use Puppeteer
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Extract text content
        const text = await page.evaluate(() => {
          // @ts-ignore - document is available in browser context
          return document.body.innerText;
        });
        
        await browser.close();
        return text;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to extract text from URL: ${errorMessage}`);
    }
  }

  // Main processing method
  async processDocument(input: Buffer | string, type: 'pdf' | 'url', documentId?: string): Promise<AugmentedLeanDocument> {
    let pages: Page[];
    const docId = documentId || this.generateId('doc', Date.now());

    try {
      if (type === 'pdf') {
        const pdfData = await this.extractTextFromPDF(input as Buffer);
        pages = this.processTextContentFromPages(pdfData.pages);
        console.log(`Processed ${pdfData.totalPages} actual PDF pages`);
      } else if (type === 'url') {
        const text = await this.extractTextFromURL(input as string);
        pages = this.processTextContent(text);
      } else {
        throw new Error('Unsupported document type');
      }

      const threats = this.analyzeThreats(pages);
      const complexTerms = this.identifyComplexTerms(pages);

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
}

const processor = new DocumentProcessor();

// Controller for file upload
export const processUploadedDocument = async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.file) {
      return sendResponse({
        res,
        success: false,
        message: 'No file uploaded',
        statusCode: 400
      });
    }

    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    
    // Process the document
    const result = await processor.processDocument(buffer, 'pdf');
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);

    return sendResponse({
      res,
      success: true,
      message: 'Document processed successfully',
      data: result
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return sendResponse({
      res,
      success: false,
      message: 'Failed to process document',
      error: {
        message: errorMessage
      },
      statusCode: 500
    });
  }
};

// Controller for URL processing
export const processDocumentFromURL = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { url, documentId } = req.body;

    if (!url) {
      return sendResponse({
        res,
        success: false,
        message: 'URL is required',
        statusCode: 400
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return sendResponse({
        res,
        success: false,
        message: 'Invalid URL format',
        statusCode: 400
      });
    }

    const result = await processor.processDocument(url, 'url', documentId);

    return sendResponse({
      res,
      success: true,
      message: 'Document processed successfully from URL',
      data: result
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return sendResponse({
      res,
      success: false,
      message: 'Failed to process document from URL',
      error: {
        message: errorMessage
      },
      statusCode: 500
    });
  }
};

// Controller to get document analysis by ID (if you want to store/retrieve later)
export const getDocumentAnalysis = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return sendResponse({
        res,
        success: false,
        message: 'Document ID is required',
        statusCode: 400
      });
    }

    // This is a placeholder - you would typically retrieve from database
    // For now, return a message indicating the feature needs database integration
    return sendResponse({
      res,
      success: false,
      message: 'Document retrieval requires database integration',
      statusCode: 501
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return sendResponse({
      res,
      success: false,
      message: 'Failed to retrieve document analysis',
      error: {
        message: errorMessage
      },
      statusCode: 500
    });
  }
};

// Example endpoint to demonstrate the data structure
export const getExampleDocument = async (_req: Request, res: Response): Promise<Response> => {
  const exampleDocument: AugmentedLeanDocument = {
    document_id: "doc_example_123",
    pages: [
      {
        page_number: 1,
        content: [
          {
            id: "p1_s1",
            text: "The Employee agrees to full indemnification against all claims.",
            words: [
              { id: "p1_s1_w1", text: "The" },
              { id: "p1_s1_w2", text: "Employee" },
              { id: "p1_s1_w3", text: "agrees" },
              { id: "p1_s1_w4", text: "to" },
              { id: "p1_s1_w5", text: "full" },
              { id: "p1_s1_w6", text: "indemnification" },
              { id: "p1_s1_w7", text: "against" },
              { id: "p1_s1_w8", text: "all" },
              { id: "p1_s1_w9", text: "claims." }
            ]
          },
          {
            id: "p1_s2",
            text: "This contract shall terminate immediately upon breach of confidentiality.",
            words: [
              { id: "p1_s2_w1", text: "This" },
              { id: "p1_s2_w2", text: "contract" },
              { id: "p1_s2_w3", text: "shall" },
              { id: "p1_s2_w4", text: "terminate" },
              { id: "p1_s2_w5", text: "immediately" },
              { id: "p1_s2_w6", text: "upon" },
              { id: "p1_s2_w7", text: "breach" },
              { id: "p1_s2_w8", text: "of" },
              { id: "p1_s2_w9", text: "confidentiality." }
            ]
          }
        ]
      }
    ],
    threats: [
      {
        threat_id: "threat_001",
        category: "legal_risk",
        severity: "high",
        description: "Contains potentially risky indemnification clause",
        reference: "p1_s1",
        recommendation: "Review this clause carefully as it may pose significant legal or financial risk."
      },
      {
        threat_id: "threat_002",
        category: "termination_risk",
        severity: "critical",
        description: "Contains immediate termination clause",
        reference: "p1_s2",
        recommendation: "Ensure confidentiality requirements are clearly defined and achievable."
      }
    ],
    complex_terms: [
      {
        term_id: "term_001",
        term: "indemnification",
        definition: "A legal principle where one party agrees to cover the losses of another.",
        reference: "p1_s1_w6"
      },
      {
        term_id: "term_002",
        term: "confidentiality",
        definition: "The practice of keeping sensitive information secret.",
        reference: "p1_s2_w9"
      }
    ]
  };

  return sendResponse({
    res,
    success: true,
    message: 'Example document structure',
    data: exampleDocument
  });
};
