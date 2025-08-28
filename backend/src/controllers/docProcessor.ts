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

  // Process text content into augmented lean structure
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
      page.content.forEach(sentence => {
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
      page.content.forEach(sentence => {
        sentence.words.forEach(word => {
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

  // Extract text from PDF - direct approach
  private async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      console.log('Extracting text from PDF, buffer size:', buffer.length);
      console.log('Buffer is valid:', Buffer.isBuffer(buffer));
      
      console.log('Attempting direct PDF text extraction...');
      
      // Import and use pdf-parse directly
      const pdfParse = (await import('pdf-parse')).default;
      console.log('pdf-parse imported successfully');
      
      const data = await pdfParse(buffer);
      console.log('PDF parsed successfully!');
      console.log('Extracted text length:', data.text.length);
      console.log('Number of pages:', data.numpages);
      
      if (data.text && data.text.trim().length > 0) {
        console.log('Returning actual PDF text content');
        return data.text.trim();
      } else {
        console.log('PDF text extraction returned empty content');
        throw new Error('PDF contains no extractable text');
      }
      
    } catch (error) {
      console.error('PDF extraction failed:', error);
      
      // Instead of fallback analysis, throw the error so we know what went wrong
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`PDF text extraction failed: ${errorMessage}`);
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
          return await this.extractTextFromPDF(buffer);
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
    let text: string;
    const docId = documentId || this.generateId('doc', Date.now());

    try {
      if (type === 'pdf') {
        text = await this.extractTextFromPDF(input as Buffer);
      } else if (type === 'url') {
        text = await this.extractTextFromURL(input as string);
      } else {
        throw new Error('Unsupported document type');
      }

      const pages = this.processTextContent(text);
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
