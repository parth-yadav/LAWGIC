import { Word, Sentence, Page } from '../../types/document.js';

export class TextParser {
  // Generate unique IDs
  generateId(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}_${parts.join('_')}`;
  }

  // Split text into sentences using more sophisticated regex
  splitIntoSentences(text: string): string[] {
    // Clean the text first
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // Split on sentence endings but preserve abbreviations
    const sentences = cleanText.split(/(?<=[.!?])\s+(?=[A-Z])/);
    
    return sentences.filter(sentence => sentence.trim().length > 0);
  }

  // Split sentence into words
  splitIntoWords(sentence: string, sentenceId: string): Word[] {
    const words = sentence.split(/\s+/).filter(word => word.trim().length > 0);
    
    return words.map((word, index) => ({
      id: this.generateId(sentenceId, 'w', index + 1),
      text: word
    }));
  }

  // Process text content from actual PDF pages into augmented lean structure
  processTextContentFromPages(pageTexts: string[]): Page[] {
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
  processTextContent(text: string): Page[] {
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
}
