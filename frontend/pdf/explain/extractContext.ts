interface TextItem {
  str: string;
}

interface TextMarkedContent {
  type: string;
}

/**
 * Extracts text context from PDF pages for AI explanation
 * @param pdfUrl - URL of the PDF document
 * @param currentPage - Current page number
 * @returns Object containing text from previous, current, and next pages
 */
export async function extractContextText(pdfUrl: string, currentPage: number) {
  try {
    console.log("[extractContext] Starting context extraction for page:", currentPage);
    
    // Dynamic import to avoid SSR issues with pdfjs-dist
    const pdfjsLib = await import("pdfjs-dist");
    console.log("[extractContext] pdfjs-dist loaded successfully");
    
    // Configure worker if not already set
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      // Use unpkg CDN which is more reliable for ES modules
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      console.log("[extractContext] Worker configured:", pdfjsLib.GlobalWorkerOptions.workerSrc);
      console.log("[extractContext] PDF.js version:", pdfjsLib.version);
    }
    
    console.log("[extractContext] Getting document from URL:", pdfUrl.substring(0, 50) + "...");
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    console.log("[extractContext] Document loaded, total pages:", pdf.numPages);
    const totalPages = pdf.numPages;

    let prevPageText = "";
    let currentPageText = "";
    let nextPageText = "";

    const isTextItem = (
      item: TextItem | TextMarkedContent
    ): item is TextItem => {
      return "str" in item;
    };

    // Extract previous page text
    if (currentPage > 1) {
      console.log("[extractContext] Extracting previous page:", currentPage - 1);
      const prevPage = await pdf.getPage(currentPage - 1);
      const prevTextContent = await prevPage.getTextContent();
      prevPageText = prevTextContent.items
        .filter(isTextItem)
        .map((item) => (item as TextItem).str)
        .join(" ");
      console.log("[extractContext] Previous page text length:", prevPageText.length);
    }

    // Extract current page text
    console.log("[extractContext] Extracting current page:", currentPage);
    const currentPageObj = await pdf.getPage(currentPage);
    const currentTextContent = await currentPageObj.getTextContent();
    currentPageText = currentTextContent.items
      .filter(isTextItem)
      .map((item) => (item as TextItem).str)
      .join(" ");
    console.log("[extractContext] Current page text length:", currentPageText.length);

    // Extract next page text
    if (currentPage < totalPages) {
      console.log("[extractContext] Extracting next page:", currentPage + 1);
      const nextPage = await pdf.getPage(currentPage + 1);
      const nextTextContent = await nextPage.getTextContent();
      nextPageText = nextTextContent.items
        .filter(isTextItem)
        .map((item) => (item as TextItem).str)
        .join(" ");
      console.log("[extractContext] Next page text length:", nextPageText.length);
    }

    console.log("[extractContext] Context extraction completed successfully");
    return {
      prevPageText,
      currentPageText,
      nextPageText,
    };
  } catch (error) {
    console.error("[extractContext] Error extracting context text:", error);
    return {
      prevPageText: "",
      currentPageText: "",
      nextPageText: "",
    };
  }
}
