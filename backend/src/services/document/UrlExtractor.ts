import puppeteer from 'puppeteer';
import { PdfTextExtractor } from './PdfTextExtractor.js';

export class UrlExtractor {
  private pdfExtractor: PdfTextExtractor;

  constructor() {
    this.pdfExtractor = new PdfTextExtractor();
  }

  // Extract text from web page or download document from URL
  async extractTextFromURL(url: string): Promise<string> {
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
          const pdfData = await this.pdfExtractor.extractTextFromPDF(buffer);
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
}
