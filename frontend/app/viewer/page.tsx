import PDF from "@/pdf";

export default async function ViewerPage() {
  const pdfUrl = "/pdfs/sample.pdf";

  return <PDF pdfUrl={pdfUrl} />;
}
