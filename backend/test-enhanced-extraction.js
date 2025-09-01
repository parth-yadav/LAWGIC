const fs = require('fs');
const path = require('path');

// Import the DocumentProcessor class
class TestDocumentProcessor {
  constructor() {
    this.testFilePath = path.join(__dirname, 'test', 'data', '05-versions-space.pdf');
  }

  async testPDFExtraction() {
    try {
      console.log('Testing PDF extraction with enhanced method...');
      
      // Read the PDF file
      const buffer = fs.readFileSync(this.testFilePath);
      console.log(`Loaded PDF file: ${this.testFilePath} (${buffer.length} bytes)`);
      
      // Use the DocumentProcessor to extract text
      const { processDocument } = require('./src/controllers/docProcessor.js');
      const processor = new (require('./src/controllers/docProcessor.js')).DocumentProcessor();
      
      const result = await processor.processDocument(buffer, 'pdf', 'test-doc-001');
      
      console.log('\n=== EXTRACTION RESULTS ===');
      console.log(`Total pages extracted: ${result.pages.length}`);
      console.log(`Total threats found: ${result.threats.length}`);
      console.log(`Total complex terms found: ${result.complex_terms.length}`);
      
      // Show first few pages
      result.pages.slice(0, 3).forEach((page, index) => {
        console.log(`\n--- Page ${page.page_number} ---`);
        console.log(`Sentences: ${page.content.length}`);
        if (page.content.length > 0) {
          const firstSentence = page.content[0];
          console.log(`First sentence: "${firstSentence.text.substring(0, 100)}..."`);
          console.log(`First word: "${firstSentence.words[0]?.text}"`);
        }
      });
      
      return result;
      
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  }
}

// Run the test
if (require.main === module) {
  const tester = new TestDocumentProcessor();
  tester.testPDFExtraction()
    .then(result => {
      console.log('\nTest completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = TestDocumentProcessor;
