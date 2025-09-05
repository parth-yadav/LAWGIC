"use client";

import { useState, useEffect } from "react";
import { Document, Page } from "react-pdf";
import type { PageTranslation } from "../lib/translationService";

interface SideBySidePDFViewerProps {
    pageTranslations: PageTranslation[];
    numPages: number;
    pageNumber: number;
    onPageChange: (page: number) => void;
    pdfUrl: string;
}

export const SideBySidePDFViewer = ({ 
    pageTranslations, 
    numPages, 
    pageNumber, 
    onPageChange,
    pdfUrl
}: SideBySidePDFViewerProps) => {
    const [pageScale, setPageScale] = useState(1.2); // Increased default size
    
    console.log('🎨 Rendering side-by-side PDF viewer');
    console.log(`📄 Current page: ${pageNumber}, Total pages: ${numPages}`);
    
    // Get current page translation
    const currentPageTranslation = pageTranslations.find(pt => pt.pageNumber === pageNumber);
    console.log(`📝 Translation found for current page: ${!!currentPageTranslation?.translatedText}`);
    
    useEffect(() => {
        console.log('📊 Page translations updated:', pageTranslations.length);
    }, [pageTranslations]);

    // Format translated text with proper line breaks and structure
    const formatTranslatedText = (text: string) => {
        return text.split('\n').map((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return <br key={index} />;
            
            // Check if it's a heading/article/section
            if (trimmedLine.match(/^(Article|Section|Chapter|\d+\.|\([a-z]\)|\([0-9]+\))/i)) {
                return (
                    <div key={index} style={{ 
                        fontWeight: 'bold', 
                        fontSize: '16px', 
                        marginTop: index > 0 ? '20px' : '0',
                        marginBottom: '10px',
                        color: '#2e7d32'
                    }}>
                        {trimmedLine}
                    </div>
                );
            }
            
            return (
                <div key={index} style={{ 
                    marginBottom: '8px',
                    lineHeight: '1.6'
                }}>
                    {trimmedLine}
                </div>
            );
        });
    };

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100vh',
            padding: '0 20px'
        }}>
            {/* Navigation */}
            <nav style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '15px 0',
                borderBottom: '2px solid #e0e0e0',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button 
                        onClick={() => onPageChange(Math.max(1, pageNumber - 1))} 
                        disabled={pageNumber <= 1}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: pageNumber <= 1 ? '#ccc' : '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        ← Previous
                    </button>
                    
                    <span style={{ 
                        fontSize: '16px', 
                        fontWeight: 'bold',
                        padding: '8px 16px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '5px',
                        color: '#333' // Fixed color
                    }}>
                        Page {pageNumber} of {numPages}
                    </span>
                    
                    <button 
                        onClick={() => onPageChange(Math.min(numPages, pageNumber + 1))} 
                        disabled={pageNumber >= numPages}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: pageNumber >= numPages ? '#ccc' : '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: pageNumber >= numPages ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Next →
                    </button>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontWeight: '500', color: '#333' }}>Zoom:</label>
                    <select 
                        value={pageScale} 
                        onChange={(e) => setPageScale(Number(e.target.value))}
                        style={{ 
                            padding: '5px 10px',
                            borderRadius: '3px',
                            border: '1px solid #ddd'
                        }}
                    >
                        <option value={0.8}>80%</option>
                        <option value={1}>100%</option>
                        <option value={1.2}>120%</option>
                        <option value={1.4}>140%</option>
                        <option value={1.6}>160%</option>
                        <option value={1.8}>180%</option>
                    </select>
                </div>
            </nav>
            
            {/* Main Content - Side by Side */}
            <div style={{ 
                display: 'flex', 
                flex: 1,
                gap: '20px',
                overflow: 'hidden'
            }}>
                {/* Original PDF - Left Side (40%) */}
                <div style={{ 
                    flex: '0 0 40%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <h3 style={{ 
                        margin: '0 0 15px 0', 
                        padding: '10px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '5px',
                        textAlign: 'center',
                        color: '#495057'
                    }}>
                        📄 Original Document
                    </h3>
                    
                    <div style={{ 
                        flex: 1,
                        overflow: 'auto',
                        border: '2px solid #dee2e6',
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        display: 'flex',
                        justifyContent: 'center',
                        padding: '20px'
                    }}>
                        <Document file={pdfUrl}>
                            <Page 
                                pageNumber={pageNumber} 
                                width={400 * pageScale} // Increased base size from 300 to 400
                                renderTextLayer={true}
                                renderAnnotationLayer={false}
                            />
                        </Document>
                    </div>
                </div>
                
                {/* Translation - Right Side (40%) */}
                <div style={{ 
                    flex: '0 0 40%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <h3 style={{ 
                        margin: '0 0 15px 0', 
                        padding: '10px',
                        backgroundColor: '#e8f5e8',
                        borderRadius: '5px',
                        textAlign: 'center',
                        color: '#2e7d32'
                    }}>
                        🌐 Translated Content
                    </h3>
                    
                    <div style={{ 
                        flex: 1,
                        overflow: 'auto',
                        border: '2px solid #4caf50',
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        padding: '20px'
                    }}>
                        {currentPageTranslation?.translatedText ? (
                            <div style={{ 
                                fontSize: '14px',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                color: '#212529'
                            }}>
                                {formatTranslatedText(currentPageTranslation.translatedText)}
                            </div>
                        ) : (
                            <div style={{ 
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                color: '#6c757d',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                                <h4 style={{ margin: '0 0 8px 0' }}>No Translation Available</h4>
                                <p style={{ margin: 0, fontSize: '14px' }}>
                                    Translation data not found for this page
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Help Text */}
            <div style={{ 
                marginTop: '15px', 
                padding: '10px 15px', 
                backgroundColor: '#e3f2fd', 
                borderRadius: '5px',
                fontSize: '13px',
                color: '#1565c0',
                textAlign: 'center'
            }}>
                <strong>💡 Tip:</strong> The translation preserves document structure with proper headings and formatting.
            </div>
        </div>
    );
};