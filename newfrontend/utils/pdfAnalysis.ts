import { pdfjs } from 'react-pdf';

// Extract word-level text data with bounding boxes from PDF
export async function extractWordsFromPDF(file: File): Promise<Record<number, Array<{text: string, bbox: {x: number, y: number, width: number, height: number}}>>> {
  try {
    const fileUrl = URL.createObjectURL(file);
    const pdf = await pdfjs.getDocument(fileUrl).promise;
    const wordsData: Record<number, Array<{text: string, bbox: {x: number, y: number, width: number, height: number}}>> = {};

    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });

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
      console.log(`📄 Extracted ${pageWords.length} words from page ${pageNum}`);
    }

    // Clean up URL
    URL.revokeObjectURL(fileUrl);
    
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
    
    // Prepare form data
    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("wordsData", JSON.stringify(wordsData));

    console.log('📡 Sending PDF and word data to backend...');
    const response = await fetch("http://localhost:4000/analyze", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Analysis failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Analysis complete:', data);
    return data;
  } catch (error) {
    console.error('❌ Analysis error:', error);
    throw error;
  }
}
