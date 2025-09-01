import { Page, Sentence, Word, ComplexTerm } from '../../types/document.js';

export class ComplexTermsIdentifier {
  private legalTerms: { [key: string]: string } = {
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

  // Generate unique IDs
  private generateId(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}_${parts.join('_')}`;
  }

  // Identify complex terms (basic implementation - can be enhanced with AI)
  identifyComplexTerms(pages: Page[]): ComplexTerm[] {
    const complexTerms: ComplexTerm[] = [];
    let termCounter = 1;

    pages.forEach(page => {
      page.content.forEach((sentence: Sentence) => {
        sentence.words.forEach((word: Word) => {
          const cleanWord = word.text.toLowerCase().replace(/[^\w]/g, '');
          
          if (this.legalTerms[cleanWord]) {
            complexTerms.push({
              term_id: this.generateId('term', termCounter++),
              term: cleanWord,
              definition: this.legalTerms[cleanWord],
              reference: word.id
            });
          }
        });
      });
    });

    return complexTerms;
  }

  // Method to add custom legal terms
  addLegalTerm(term: string, definition: string): void {
    this.legalTerms[term.toLowerCase()] = definition;
  }

  // Method to remove a legal term
  removeLegalTerm(term: string): void {
    delete this.legalTerms[term.toLowerCase()];
  }

  // Method to get all legal terms
  getAllLegalTerms(): { [key: string]: string } {
    return { ...this.legalTerms };
  }

  // Method to update a legal term definition
  updateLegalTerm(term: string, definition: string): void {
    if (this.legalTerms[term.toLowerCase()]) {
      this.legalTerms[term.toLowerCase()] = definition;
    }
  }
}
