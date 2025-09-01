import { Request, Response } from 'express';
import { sendResponse } from '../utils/ResponseHelpers.js';
import { AugmentedLeanDocument } from '../types/document.js';
import { DocumentProcessor } from '../services/document/index.js';
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

// Create a single instance of the document processor
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
