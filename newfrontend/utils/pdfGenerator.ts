import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ThreatData {
    text: string;
    reason: string;
    bbox: any;
    confidence?: number;
}

interface PageData {
    page: number;
    threats: ThreatData[];
    totalWords: number;
}

interface AnalysisResult {
    pages: PageData[];
    totalPages: number;
    totalThreats: number;
}

export function generateThreatsPDF(analysisResult: AnalysisResult, originalFileName: string): void {
    try {
        console.log(' Starting PDF generation...');
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Security Threat Analysis Report', 20, 20);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Original Document: ${originalFileName}`, 20, 35);
        doc.text(`Analysis Date: ${new Date().toLocaleDateString()}`, 20, 45);
        doc.text(`Total Pages Analyzed: ${analysisResult.totalPages}`, 20, 55);
        doc.text(`Total Threats Found: ${analysisResult.totalThreats}`, 20, 65);
        
        doc.setLineWidth(0.5);
        doc.line(20, 75, 190, 75);

        let yPosition = 85;

        const allThreats = analysisResult.pages.flatMap(p => p.threats);
        const highThreats = allThreats.filter(t => getSeverity(t.reason) === 'high').length;
        const mediumThreats = allThreats.filter(t => getSeverity(t.reason) === 'medium').length;
        const lowThreats = allThreats.filter(t => getSeverity(t.reason) === 'low').length;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Threat Summary by Severity:', 20, yPosition);
        yPosition += 15;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(220, 53, 69); 
        doc.text(`High Severity: ${highThreats}`, 30, yPosition);
        yPosition += 10;

        doc.setTextColor(255, 193, 7); 
        doc.text(`Medium Severity: ${mediumThreats}`, 30, yPosition);
        yPosition += 10;

        doc.setTextColor(255, 235, 59); 
        doc.text(`Low Severity: ${lowThreats}`, 30, yPosition);
        yPosition += 20;

        doc.setTextColor(0, 0, 0);//these are a bit different from original hex or rgb values

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Detailed Threat Analysis:', 20, yPosition);
        yPosition += 15;

        const tableData: any[] = [];

        analysisResult.pages.forEach(page => {
            if (page.threats.length > 0) {
                page.threats.forEach((threat, index) => {
                    const severity = getSeverity(threat.reason);
                    tableData.push([
                        page.page.toString(),
                        threat.text.substring(0, 50) + (threat.text.length > 50 ? '...' : ''),
                        severity.toUpperCase(),
                        threat.reason.substring(0, 80) + (threat.reason.length > 80 ? '...' : ''),
                        threat.bbox ? 'Yes' : 'No'
                    ]);
                });
            }
        });

        console.log('📄 Table data prepared:', tableData.length, 'rows');
        
        //do not touch this, contact krrish in case of any issues (dev)
        autoTable(doc, {
            startY: yPosition,
            head: [['Page', 'Threat Text', 'Severity', 'Description', 'Located']],
            body: tableData,
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [220, 53, 69],
                textColor: 255,
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 50 },
                2: { cellWidth: 25 },
                3: { cellWidth: 80 },
                4: { cellWidth: 25 }
            },
            didDrawCell: (data: any) => {//color coding (optional)
                if (data.column.index === 2 && data.section === 'body') {
                    const severity = data.cell.text[0]?.toLowerCase();
                    if (severity === 'h') { 
                        doc.setFillColor(220, 53, 69);
                        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                        doc.setTextColor(255, 255, 255);
                        doc.text(data.cell.text, data.cell.x + 2, data.cell.y + 7);
                        doc.setTextColor(0, 0, 0);
                    } else if (severity === 'm') { 
                        doc.setFillColor(255, 193, 7);
                        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                        doc.setTextColor(0, 0, 0);
                        doc.text(data.cell.text, data.cell.x + 2, data.cell.y + 7);
                    } else if (severity === 'l') { 
                        doc.setFillColor(255, 235, 59);
                        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                        doc.setTextColor(0, 0, 0);
                        doc.text(data.cell.text, data.cell.x + 2, data.cell.y + 7);
                    }
                }
            }
        });

        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(
                `Generated by PDF Threat Analyzer - Page ${i} of ${pageCount}`,
                20,
                doc.internal.pageSize.height - 10
            );
        }

        
        const fileName = `threat-analysis-${originalFileName.replace('.pdf', '')}-${new Date().toISOString().split('T')[0]}.pdf`;
        console.log('Saving PDF as:', fileName);
        doc.save(fileName);
        
        console.log(' PDF generated successfully');
    } catch (error) {
        console.error('PDF generation error:', error);
        throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

function getSeverity(reason: string): 'high' | 'medium' | 'low' {
    const highSeverity = ['injection', 'xss', 'command', 'malicious'];
    const mediumSeverity = ['suspicious', 'credential', 'exposure'];
    const lowerReason = reason.toLowerCase();
    
    if (highSeverity.some(keyword => lowerReason.includes(keyword))) return 'high';
    if (mediumSeverity.some(keyword => lowerReason.includes(keyword))) return 'medium';
    return 'low';
}