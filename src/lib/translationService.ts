import { getDocument } from 'pdfjs-dist';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

export interface PageTranslation {
    pageNumber: number;
    originalText: string;
    translatedText: string;
}

export async function extractTextFromPDF(pdfUrl: string): Promise<PageTranslation[]> {
    console.log('🔍 Starting PDF text extraction from:', pdfUrl);
    
    try {
        const pdf = await getDocument(pdfUrl).promise;
        const totalPages = pdf.numPages;
        console.log('📄 PDF loaded successfully. Total pages:', totalPages);
        
        const pageTranslations: PageTranslation[] = [];
        
        const isTextItem = (item: TextItem | TextMarkedContent): item is TextItem => {
            return 'str' in item && 'transform' in item;
        };
        
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            console.log(`📖 Processing page ${pageNum}/${totalPages}`);
            
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Get all text from the page as one complete text
            const pageText = textContent.items
                .filter(isTextItem)
                .map((item: TextItem) => item.str)
                .join(' ')
                .trim();
            
            console.log(`📝 Extracted text from page ${pageNum}, length: ${pageText.length} characters`);
            
            pageTranslations.push({
                pageNumber: pageNum,
                originalText: pageText,
                translatedText: '' // Will be filled after translation
            });
        }
        
        console.log('✅ Text extraction completed. Total pages:', pageTranslations.length);
        return pageTranslations;
        
    } catch (error) {
        console.error('❌ Error extracting text from PDF:', error);
        throw error;
    }
}

export async function translatePageBlocks(pageTranslations: PageTranslation[], targetLanguage: string = 'English'): Promise<PageTranslation[]> {
    console.log('🌐 Starting translation to', targetLanguage);
    console.log('📊 Pages to translate:', pageTranslations.length);
    
    try {
        const translatedPages: PageTranslation[] = [];
        
        for (const pageTranslation of pageTranslations) {
            console.log(`🔄 Translating page ${pageTranslation.pageNumber}`);
            
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: pageTranslation.originalText,
                    targetLanguage,
                    pageNumber: pageTranslation.pageNumber,
                    isDocumentTranslation: true
                })
            });
            
            if (!response.ok) {
                throw new Error(`Translation API error: ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`✅ Received translation for page ${pageTranslation.pageNumber}`);
            
            translatedPages.push({
                ...pageTranslation,
                translatedText: result.translatedText || pageTranslation.originalText
            });
        }
        
        console.log('🎉 Translation completed successfully');
        return translatedPages;
        
    } catch (error) {
        console.error('❌ Translation error:', error);
        throw error;
    }
}