import { pdfjs } from 'react-pdf';

// Extract word-level text data with bounding boxes from PDF
export async function extractWordsFromPDF(file: File): Promise<Record<number, Array<{text: string, bbox: {x: number, y: number, width: number, height: number}}>>> {
  try {
    console.log('📄 FRONTEND: Starting word extraction from PDF');
    console.log('📄 FRONTEND: File info:', { name: file.name, size: file.size, type: file.type });
    
    const fileUrl = URL.createObjectURL(file);
    console.log('📄 FRONTEND: Created blob URL for PDF processing');
    
    const pdf = await pdfjs.getDocument(fileUrl).promise;
    console.log('📄 FRONTEND: PDF loaded successfully, pages:', pdf.numPages);
    
    const wordsData: Record<number, Array<{text: string, bbox: {x: number, y: number, width: number, height: number}}>> = {};

    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`📄 FRONTEND: Processing page ${pageNum}/${pdf.numPages}`);
      
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });
      
      console.log(`📄 FRONTEND: Page ${pageNum} - raw text items:`, textContent.items.length);

      // Extract words with bounding boxes
      const pageWords = textContent.items
        .filter((item: any) => item.str && item.str.trim().length > 0)
        .map((item: any) => {
          const transform = item.transform;
          return {
            text: item.str.trim(),
            bbox: {
              x: transform[4],
              y: viewport.height - transform[5] - item.height, // Flip Y coordinate
              width: item.width,
              height: item.height,
            }
          };
        });

      wordsData[pageNum] = pageWords;
      console.log(`📄 FRONTEND: Page ${pageNum} - extracted ${pageWords.length} words`);
      
      if (pageWords.length > 0) {
        console.log(`📄 FRONTEND: Page ${pageNum} - first 5 words:`, pageWords.slice(0, 5).map(w => w.text));
        console.log(`📄 FRONTEND: Page ${pageNum} - sample word with bbox:`, pageWords[0]);
      }
    }

    // Clean up URL
    URL.revokeObjectURL(fileUrl);
    console.log('📄 FRONTEND: Cleaned up blob URL');
    
    console.log('📄 FRONTEND: Word extraction complete - total pages:', Object.keys(wordsData).length);
    return wordsData;
  } catch (error) {
    console.error('Error extracting words from PDF:', error);
    return {};
  }
}

// Enhanced upload function that sends word data to backend
export async function analyzeWithWordData(file: File): Promise<any> {
  try {
    // First extract word data from the PDF
    console.log('🔍 Extracting word data from PDF...');
    const wordsData = await extractWordsFromPDF(file);
    
    // Log detailed information about the words data being sent
    console.log('📊 FRONTEND: Word data extraction complete:');
    console.log('📊 FRONTEND: Total pages with word data:', Object.keys(wordsData).length);
    
    // Log details for each page
    Object.entries(wordsData).forEach(([pageNum, words]) => {
      console.log(`📊 FRONTEND: Page ${pageNum} - ${words.length} words extracted`);
      if (words.length > 0) {
        console.log(`📊 FRONTEND: Page ${pageNum} first 5 words:`, words.slice(0, 5).map(w => w.text));
        console.log(`📊 FRONTEND: Page ${pageNum} word bounding boxes sample:`, words.slice(0, 3).map(w => ({ text: w.text, bbox: w.bbox })));
      }
    });
    
    // Prepare form data
    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("wordsData", JSON.stringify(wordsData));
    
    // Log the data being sent to backend
    console.log('📡 FRONTEND: Sending data to backend:');
    console.log('📡 FRONTEND: File name:', file.name);
    console.log('📡 FRONTEND: File size:', file.size, 'bytes');
    console.log('📡 FRONTEND: File type:', file.type);
    console.log('📡 FRONTEND: Words data size:', JSON.stringify(wordsData).length, 'characters');
    console.log('📡 FRONTEND: FormData contents:', {
      pdf: file.name,
      wordsDataSize: JSON.stringify(wordsData).length
    });

    console.log('📡 Sending PDF and word data to backend...');
    const response = await fetch("http://localhost:4000/analyze", {
      method: "POST",
      body: formData,
    });

    console.log('📨 FRONTEND: Response received from backend:');
    console.log('📨 FRONTEND: Response status:', response.status);
    console.log('📨 FRONTEND: Response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ FRONTEND: Error response:', errorData);
      throw new Error(errorData.message || `Analysis failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ FRONTEND: Analysis complete - received data:');
    console.log('✅ FRONTEND: Total pages:', data.totalPages);
    console.log('✅ FRONTEND: Total threats:', data.totalThreats);
    console.log('✅ FRONTEND: Pages data:', data.pages.map((p: any) => ({ 
      page: p.page, 
      threats: p.threats.length,
      totalWords: p.totalWords 
    })));
    console.log('✅ FRONTEND: Full response data:', data);
    return data;
  } catch (error) {
    console.error('❌ Analysis error:', error);
    throw error;
  }
}
