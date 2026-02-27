import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateThreatsPDF(threatHighlights, documentName = "Unknown Document") {
  if (!threatHighlights || threatHighlights.length === 0) {
    throw new Error("No threats found to generate PDF report.");
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Security Threat Analysis Report", margin, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Document: ${documentName}`, margin, 30);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 36);

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  const threats = threatHighlights
    .map((h) => {
      const severity =
        h.metadata.tags?.find((tag) =>
          ["critical", "high", "medium", "low"].includes(tag.toLowerCase())
        ) || "high";

      let pageNumber = 1;
      if (h.position?.pageNumber) pageNumber = h.position.pageNumber;
      else if (h.metadata && "page" in h.metadata) pageNumber = h.metadata.page;

      const createdAt = h.metadata?.createdAt || new Date().toISOString();

      return {
        id: 0,
        severity,
        pageNumber,
        text: h.text || "No text available",
        explanation: h.metadata?.note || "No explanation provided",
        createdAt,
      };
    })
    .sort((a, b) => {
      const sDiff = (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3);
      return sDiff !== 0 ? sDiff : a.pageNumber - b.pageNumber;
    })
    .map((threat, index) => ({ ...threat, id: index + 1 }));

  const head = [["#", "Severity", "Page", "Detected Text", "Analysis", "Detected At"]];
  const body = threats.map((t) => [
    t.id.toString(),
    t.severity.toUpperCase(),
    t.pageNumber.toString(),
    t.text,
    t.explanation,
    (() => {
      try {
        return new Date(t.createdAt).toLocaleString();
      } catch {
        return "Unknown";
      }
    })(),
  ]);

  autoTable(doc, {
    startY: 45,
    head,
    body,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 3, valign: "top", overflow: "linebreak" },
    headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 21 },
      2: { cellWidth: 14 },
      3: { cellWidth: 50 },
      4: { cellWidth: 65 },
      5: { cellWidth: 32 },
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      const footer = `Page ${data.pageNumber} of ${pageCount}`;
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      doc.text(footer, pageWidth - margin - doc.getTextWidth(footer), doc.internal.pageSize.getHeight() - 10);
    },
  });

  const timestamp = new Date().toISOString().split("T")[0];
  const sanitizedName = documentName.replace(/[^a-zA-Z0-9]/g, "-").substring(0, 30);
  doc.save(`security-analysis-${sanitizedName}-${timestamp}.pdf`);
}

export function extractThreatHighlights(highlights) {
  return highlights.filter((h) =>
    h.metadata.tags?.some((tag) =>
      ["threat", "security", "critical", "high", "medium", "low"].includes(tag.toLowerCase())
    )
  );
}
