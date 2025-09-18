import { getDocument } from "pdfjs-dist";

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
    const pdf = await getDocument(pdfUrl).promise;
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
      const prevPage = await pdf.getPage(currentPage - 1);
      const prevTextContent = await prevPage.getTextContent();
      prevPageText = prevTextContent.items
        .filter(isTextItem)
        .map((item) => (item as TextItem).str)
        .join(" ");
    }

    // Extract current page text
    const currentPageObj = await pdf.getPage(currentPage);
    const currentTextContent = await currentPageObj.getTextContent();
    currentPageText = currentTextContent.items
      .filter(isTextItem)
      .map((item) => (item as TextItem).str)
      .join(" ");

    // Extract next page text
    if (currentPage < totalPages) {
      const nextPage = await pdf.getPage(currentPage + 1);
      const nextTextContent = await nextPage.getTextContent();
      nextPageText = nextTextContent.items
        .filter(isTextItem)
        .map((item) => (item as TextItem).str)
        .join(" ");
    }

    return {
      prevPageText,
      currentPageText,
      nextPageText,
    };
  } catch (error) {
    console.error("Error extracting context text:", error);
    return {
      prevPageText: "",
      currentPageText: "",
      nextPageText: "",
    };
  }
}
