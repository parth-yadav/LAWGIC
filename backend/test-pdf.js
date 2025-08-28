// Quick test to see if pdf-parse works
import fs from 'fs';
import https from 'https';

async function testPdfParse() {
    try {
        console.log('Testing PDF parsing...');
        
        // Download the PDF
        const response = await fetch('http://localhost:3000/policy.pdf');
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log('Downloaded PDF, size:', buffer.length);
        
        // Try to parse with pdf-parse
        const pdfParse = await import('pdf-parse').then(m => m.default);
        console.log('pdf-parse imported successfully');
        
        const result = await pdfParse(buffer);
        console.log('PDF parsed successfully!');
        console.log('Text length:', result.text.length);
        console.log('Number of pages:', result.numpages);
        console.log('First 500 characters:', result.text.substring(0, 500));
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testPdfParse();
