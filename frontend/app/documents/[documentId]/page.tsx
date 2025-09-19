import PDF from "@/pdf";
import { BanIcon } from "lucide-react";

export default function Page({ params }: { params: { documentId: string } }) {
  const pdfUrl = (function () {
    if (params.documentId === "test") {
      return "/pdfs/sample2.pdf";
    }
    return null;
  })();

  if (!pdfUrl) {
    return (
      <div className="flex flex-col  items-center justify-center h-screen">
        <BanIcon className="text-red-500 size-20" />
        <p className="text-lg text-muted-foreground">
          No PDF available for this document.
        </p>
      </div>
    );
  }

  return <PDF pdfUrl={pdfUrl} />;
}
