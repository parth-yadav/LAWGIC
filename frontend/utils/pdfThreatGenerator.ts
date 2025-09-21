import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Highlight } from '@/pdf/highlight/types';

interface ThreatPDFData {
    id: number;
    severity: string;
    pageNumber: number;
    text: string;
    explanation: string;
    createdAt: string;
}

export function generateThreatsPDF(
    threatHighlights: Highlight[],
    documentName = 'Unknown Document'
): void {
    if (!threatHighlights || threatHighlights.length === 0) {
        throw new Error('No threats found to generate PDF report.');
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Security Threat Analysis Report', margin, 20);

    // Document info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Document: ${documentName}`, margin, 30);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 36);

    // table data
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const threats: ThreatPDFData[] = threatHighlights
        .map((h, i) => {
            const severity =
                h.metadata.tags?.find(tag =>
                    ['critical', 'high', 'medium', 'low'].includes(tag.toLowerCase())
                ) || 'high';
            return {
                id: i + 1,
                severity,
                pageNumber: h.position.pageNumber,
                text: h.text || '',
                explanation: h.metadata.note || 'No explanation provided',
                createdAt: h.metadata.createdAt,
            };
        })
        .sort((a, b) => {
            const sDiff =
                (severityOrder[a.severity as keyof typeof severityOrder] ?? 3) -
                (severityOrder[b.severity as keyof typeof severityOrder] ?? 3);
            return sDiff !== 0 ? sDiff : a.pageNumber - b.pageNumber;
        });

    const head = [
        ['#', 'Severity', 'Page', 'Detected Text', 'Analysis', 'Detected At'],
    ];
    const body = threats.map(t => [
        t.id.toString(),
        t.severity.toUpperCase(),
        t.pageNumber.toString(),
        t.text,
        t.explanation,
        new Date(t.createdAt).toLocaleString(),
    ]);

    // Table
    autoTable(doc, {
        startY: 45,
        head,
        body,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 3,
            valign: 'top',
            overflow: 'linebreak', 
        },
        headStyles: {
            fillColor: [60, 60, 60],
            textColor: 255,
            fontStyle: 'bold',
        },
        columnStyles: {
            0: { cellWidth: 8 },  
            1: { cellWidth: 21 },  
            2: { cellWidth: 14 },  
            3: { cellWidth: 50 },  
            4: { cellWidth: 65 },  
            5: { cellWidth: 32 },  
        },
        didDrawPage: (data) => {
            // Footer 
            doc.setFillColor(229, 224, 220);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pageCount = (doc as any).getNumberOfPages();
            const footer = `Page ${data.pageNumber} of ${pageCount}`;
            doc.setFontSize(8);
            doc.setTextColor(60, 60, 60);
            doc.text(
                footer,
                pageWidth - margin - doc.getTextWidth(footer),
                doc.internal.pageSize.getHeight() - 10
            );
        },
    });

    
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedName = documentName.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
    const filename = `security-analysis-${sanitizedName}-${timestamp}.pdf`;

    doc.save(filename);
}


export function extractThreatHighlights(highlights: Highlight[]): Highlight[] {
    return highlights.filter(h =>
        h.metadata.tags?.some(tag =>
            ['threat', 'security', 'critical', 'high', 'medium', 'low']
                .includes(tag.toLowerCase())
        )
    );
}
