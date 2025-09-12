// Test script to verify word extraction from frontend
import { analyzeWithWordData, extractWordsFromPDF } from '../utils/pdfAnalysis';

// This function can be called from browser console for testing
(window as any).testWordExtraction = async (file: File) => {
  console.log('🧪 Testing word extraction...');
  
  try {
    // Test word extraction only
    const words = await extractWordsFromPDF(file);
    console.log('📊 Extracted words data:', words);
    
    // Show first 10 words from page 1
    if (words[1]) {
      console.log('📝 First 10 words from page 1:', 
        words[1].slice(0, 10).map((w, i) => `${i}: "${w.text}"`)
      );
    }
    
    return words;
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Export for development use
export const testWordExtraction = (window as any).testWordExtraction;
