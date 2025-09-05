import { getDocument } from 'pdfjs-dist';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

export async function fetchContextText(currentPage: number) {
    try {
        const pdf = await getDocument('/dummy.pdf').promise;
        const totalPages = pdf.numPages;
        
        let prevPageText = '';
        let currentPageText = '';
        let nextPageText = '';
        
        const isTextItem = (item: TextItem | TextMarkedContent): item is TextItem => {
            return 'str' in item;
        };
        
        if (currentPage > 1) {
            const prevPage = await pdf.getPage(currentPage - 1);
            const prevTextContent = await prevPage.getTextContent();
            prevPageText = prevTextContent.items
                .filter(isTextItem)
                .map((item: TextItem) => item.str)
                .join(' ');
        }
        
        const currentPageObj = await pdf.getPage(currentPage);
        const currentTextContent = await currentPageObj.getTextContent();
        currentPageText = currentTextContent.items
            .filter(isTextItem)
            .map((item: TextItem) => item.str)
            .join(' ');
        
        if (currentPage < totalPages) {
            const nextPage = await pdf.getPage(currentPage + 1);
            const nextTextContent = await nextPage.getTextContent();
            nextPageText = nextTextContent.items
                .filter(isTextItem)
                .map((item: TextItem) => item.str)
                .join(' ');
        }
        
        return {
            prevPageText,
            currentPageText,
            nextPageText
        };
    } catch (error) {
        console.error('Error fetching context text:', error);
        return {
            prevPageText: '',
            currentPageText: '',
            nextPageText: ''
        };
    }
}
