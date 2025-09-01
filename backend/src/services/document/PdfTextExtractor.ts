export class PdfTextExtractor {
  // Extract text from PDF using page marker extraction method
  async extractTextFromPDF(buffer: Buffer): Promise<{ pages: string[], totalPages: number }> {
    try {
      console.log('Extracting text from PDF, buffer size:', buffer.length);
      console.log('Buffer is valid:', Buffer.isBuffer(buffer));
      
      // Use page marker extraction method
      const pageTexts = await this.extractPagesWithPageMarkers(buffer);
      console.log(`Successfully extracted text from ${pageTexts.length} pages using page marker method`);
      
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

  // Extract pages using page markers method
  private async extractPagesWithPageMarkers(buffer: Buffer): Promise<string[]> {
    const result = await this.extractTextWithPageMarkers(buffer);
    console.log(`Successfully extracted ${result.pages.length} pages using page marker method`);
    return result.pages;
  }

  // Method: Extract text and split by page markers (accurate page boundaries)
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
    } else {
      // If no page markers found, split by form feed characters
      console.log('No page markers found, trying form feed splitting...');
      const formFeedPages = text.split('\f').filter(page => page.trim().length > 0);
      if (formFeedPages.length > 0) {
        pages = formFeedPages;
      } else {
        // Use content-based splitting as last resort
        console.log('No form feeds found, using content-based page splitting...');
        pages = this.splitByContentLength(text, expectedPages);
      }
    }
    
    console.log(`Split text into ${pages.length} pages`);
    return pages;
  }

  // Split text by approximate content length
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
}
