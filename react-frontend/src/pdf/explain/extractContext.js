import { pdfjs } from "react-pdf";
import "@/pdf/pdfjs-setup";

const { getDocument } = pdfjs;

export async function extractContextText(pdfUrl, currentPage) {
  try {
    const pdf = await getDocument(pdfUrl).promise;
    const totalPages = pdf.numPages;
    let prevPageText = "";
    let currentPageText = "";
    let nextPageText = "";

    const isTextItem = (item) => "str" in item;

    if (currentPage > 1) {
      const prevPage = await pdf.getPage(currentPage - 1);
      const prevTextContent = await prevPage.getTextContent();
      prevPageText = prevTextContent.items.filter(isTextItem).map((item) => item.str).join(" ");
    }

    const currentPageObj = await pdf.getPage(currentPage);
    const currentTextContent = await currentPageObj.getTextContent();
    currentPageText = currentTextContent.items.filter(isTextItem).map((item) => item.str).join(" ");

    if (currentPage < totalPages) {
      const nextPage = await pdf.getPage(currentPage + 1);
      const nextTextContent = await nextPage.getTextContent();
      nextPageText = nextTextContent.items.filter(isTextItem).map((item) => item.str).join(" ");
    }

    return { prevPageText, currentPageText, nextPageText };
  } catch (error) {
    console.error("Error extracting context text:", error);
    return { prevPageText: "", currentPageText: "", nextPageText: "" };
  }
}
