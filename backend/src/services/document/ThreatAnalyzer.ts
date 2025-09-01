import { Page, Sentence, Threat } from '../../types/document.js';

export class ThreatAnalyzer {
  private threatKeywords = {
    high: ['terminate', 'void', 'breach', 'penalty', 'forfeit', 'liable', 'damages'],
    medium: ['obligation', 'requirement', 'must', 'shall', 'mandatory'],
    low: ['should', 'recommend', 'suggest', 'prefer']
  };

  // Generate unique IDs
  private generateId(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}_${parts.join('_')}`;
  }

  // Analyze threats in the document (basic implementation - can be enhanced with AI)
  analyzeThreats(pages: Page[]): Threat[] {
    const threats: Threat[] = [];
    let threatCounter = 1;

    pages.forEach(page => {
      page.content.forEach((sentence: Sentence) => {
        const lowerText = sentence.text.toLowerCase();
        
        // Check for high severity threats
        for (const keyword of this.threatKeywords.high) {
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
        for (const keyword of this.threatKeywords.medium) {
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
        for (const keyword of this.threatKeywords.low) {
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

  // Method to add custom threat keywords
  addThreatKeywords(severity: 'high' | 'medium' | 'low', keywords: string[]): void {
    this.threatKeywords[severity].push(...keywords);
  }

  // Method to get current threat keywords
  getThreatKeywords(): typeof this.threatKeywords {
    return { ...this.threatKeywords };
  }
}
