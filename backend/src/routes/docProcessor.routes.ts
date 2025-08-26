import { Router } from 'express';
import { 
  processUploadedDocument, 
  processDocumentFromURL, 
  getDocumentAnalysis,
  getExampleDocument,
  upload 
} from '../controllers/docProcessor.js';

const router = Router();

// Route for uploading and processing PDF/DOC files
router.post('/upload', upload.single('document'), processUploadedDocument);

// Route for processing documents from URL
router.post('/process-url', processDocumentFromURL);

// Route for retrieving document analysis by ID
router.get('/analysis/:documentId', getDocumentAnalysis);

// Route for getting example document structure
router.get('/example', getExampleDocument);

export default router;