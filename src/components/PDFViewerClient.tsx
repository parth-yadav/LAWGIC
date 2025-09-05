"use client";

import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { extractTextFromPDF, translatePageBlocks, type PageTranslation } from "../lib/translationService";
import { SideBySidePDFViewer } from "./SideBySidePDFViewer";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

type SelectionPayload = {
    selectedText: string;
    currentPage: number;
};

interface PDFViewerClientProps {
    onSelection: (payload: SelectionPayload) => Promise<string>;
}

export const PDFViewerClient = ({ onSelection }: PDFViewerClientProps) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [selectedText, setSelectedText] = useState<string>("");
    const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);
    const [explanationBox, setExplanationBox] = useState<{x: number, y: number, content: string | null, loading: boolean} | null>(null);
    
    // Translation states
    const [isTranslated, setIsTranslated] = useState<boolean>(false);
    const [isTranslating, setIsTranslating] = useState<boolean>(false);
    const [pageTranslations, setPageTranslations] = useState<PageTranslation[]>([]);
    const [targetLanguage, setTargetLanguage] = useState<string>('English');
    
    const textLayerRef = useRef<HTMLDivElement>(null);
    const pdfUrl = '/dummy.pdf';

    console.log('🔄 PDFViewerClient render state:', { 
        isTranslated, 
        isTranslating, 
        numPages, 
        pageNumber,
        pageTranslationsCount: pageTranslations.length
    });

    const onLoadSuccess = ({ numPages }: { numPages: number }) => {
        console.log('📄 PDF loaded successfully with', numPages, 'pages');
        setNumPages(numPages);
    };

    const handleTranslate = async () => {
        console.log('🌐 Starting document translation process...');
        setIsTranslating(true);
        
        try {
            console.log('🔍 Step 1: Extracting text blocks from PDF');
            const extractedPages = await extractTextFromPDF(pdfUrl);
            console.log('✅ Text extraction completed:', extractedPages.length, 'pages');
            
            console.log('🔄 Step 2: Translating document blocks to', targetLanguage);
            const translated = await translatePageBlocks(extractedPages, targetLanguage);
            console.log('✅ Document translation completed:', translated.length, 'pages');
            
            setPageTranslations(translated);
            setIsTranslated(true);
            console.log('🎉 Document translation process completed successfully');
            
        } catch (error) {
            console.error('❌ Document translation failed:', error);
            alert('Document translation failed. Please try again.');
        } finally {
            setIsTranslating(false);
        }
    };

    const handleBackToOriginal = () => {
        console.log('🔙 Switching back to original PDF');
        setIsTranslated(false);
        setPageTranslations([]);
    };

    // Selection handling (only for original PDF)
    useEffect(() => {
        if (isTranslated) return;
        
        function handleSelection() {
            const selection = window.getSelection();
            if (
                selection &&
                !selection.isCollapsed &&
                textLayerRef.current?.contains(selection.anchorNode)
            ) {
                const text = selection.toString().trim();
                console.log('📝 Text selected:', text);
                setSelectedText(text);
            } else {
                console.log('🔄 Selection cleared');
                setSelectedText("");
                setContextMenu(null);
                setExplanationBox(null);
            }
        }

        function handleContextMenu(e: MouseEvent) {
            console.log('🖱️ Right click detected, selectedText:', selectedText);
            if (selectedText && textLayerRef.current?.contains(e.target as Node)) {
                e.preventDefault();
                console.log('📋 Showing context menu at:', e.clientX, e.clientY);
                setContextMenu({ x: e.clientX, y: e.clientY });
                setExplanationBox(null);
            }
        }

        function handleClick(e: MouseEvent) {
            const target = e.target as HTMLElement;
            if (target.closest('.context-menu') || target.closest('.explanation-box')) {
                return;
            }
            console.log('👆 Click detected, closing menus');
            setContextMenu(null);
            setExplanationBox(null);
        }

        document.addEventListener("mouseup", handleSelection);
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("click", handleClick);
        
        return () => {
            document.removeEventListener("mouseup", handleSelection);
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("click", handleClick);
        };
    }, [selectedText, isTranslated]); 

    const handleExplain = async () => {
        console.log('💡 Explain clicked, selectedText:', selectedText, 'contextMenu:', contextMenu);
        if (selectedText && contextMenu) {
            setContextMenu(null);
            const loadingBox = {
                x: contextMenu.x,
                y: contextMenu.y,
                content: null,
                loading: true
            };
            console.log('⏳ Setting loading explanation box:', loadingBox);
            setExplanationBox(loadingBox);

            try {
                console.log('🔍 Calling onSelection with:', { selectedText, currentPage: pageNumber });
                const explanation = await onSelection({
                    selectedText,
                    currentPage: pageNumber,
                });

                console.log('✅ Got explanation:', explanation);
                setExplanationBox(prev => prev ? {
                    ...prev,
                    content: explanation,
                    loading: false
                } : null);
            } catch (error) {
                console.error('❌ Error getting explanation:', error);
                setExplanationBox(prev => prev ? {
                    ...prev,
                    content: 'Error: Unable to get explanation. Please try again.',
                    loading: false
                } : null);
            }
        } else {
            console.log('⚠️ Cannot explain: selectedText or contextMenu missing');
        }
    };

    const LoadingSpinner = () => (
        <div
            style={{
                width: '20px',
                height: '20px',
                border: '2px solid #f3f3f3',
                borderTop: '2px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }}
        />
    );

    const TranslationLoadingOverlay = () => (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            color: 'white'
        }}>
            <div style={{
                width: '80px',
                height: '80px',
                border: '6px solid #f3f3f3',
                borderTop: '6px solid #4CAF50',
                borderRadius: '50%',
                animation: 'spin 2s linear infinite',
                marginBottom: '30px'
            }} />
            <h2 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>
                🌐 Translating Document...
            </h2>
            <p style={{ margin: '0 0 20px 0', textAlign: 'center', fontSize: '16px' }}>
                Processing document structure and creating natural translation
            </p>
            <div style={{ 
                fontSize: '14px', 
                opacity: 0.8, 
                textAlign: 'center',
                lineHeight: '1.5'
            }}>
                📄 Extracting text blocks<br />
                🧠 Understanding context<br />
                🔄 Translating naturally<br />
                ✨ Preparing side-by-side view
            </div>
        </div>
    );

    if (isTranslated && pageTranslations.length > 0) {
        console.log('🎨 Rendering side-by-side translated view');
        return (
            <>
                <style jsx>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
                
                <div style={{
                    position: 'fixed',
                    top: '10px',
                    right: '20px',
                    zIndex: 1000
                }}>
                    <button 
                        onClick={handleBackToOriginal}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '25px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                            fontSize: '14px'
                        }}
                    >
                        🔙 Back to Original
                    </button>
                </div>
                
                <SideBySidePDFViewer 
                    pageTranslations={pageTranslations}
                    numPages={numPages}
                    pageNumber={pageNumber}
                    onPageChange={setPageNumber}
                    pdfUrl={pdfUrl}
                />
            </>
        );
    }

    return (
        <>
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            
            {isTranslating && <TranslationLoadingOverlay />}
            
            <div className="pdf-viewer" style={{ padding: '20px' }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '30px',
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button 
                            onClick={() => setPageNumber(p => Math.max(1, p - 1))} 
                            disabled={pageNumber <= 1}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: pageNumber <= 1 ? '#ccc' : '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Previous
                        </button>
                        <span style={{ 
                            margin: '0 20px', 
                            fontWeight: 'bold',
                            fontSize: '16px',
                            padding: '10px 20px',
                            backgroundColor: '#fff',
                            borderRadius: '5px',
                            border: '2px solid #e0e0e0',
                            color: '#333' // Fixed text color
                        }}>
                            Page {pageNumber} / {numPages}
                        </span>
                        <button 
                            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))} 
                            disabled={pageNumber >= numPages}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: pageNumber >= numPages ? '#ccc' : '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: pageNumber >= numPages ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Next
                        </button>
                    </nav>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <label style={{ fontWeight: '500', fontSize: '14px' }}>Translate to:</label>
                        <select 
                            value={targetLanguage} 
                            onChange={(e) => setTargetLanguage(e.target.value)}
                            style={{ 
                                padding: '8px 12px',
                                borderRadius: '5px',
                                border: '2px solid #ddd',
                                fontSize: '14px'
                            }}
                        >
                            <option value="English">English</option>
                            <option value="Spanish">Spanish</option>
                            <option value="French">French</option>
                            <option value="German">German</option>
                            <option value="Chinese">Chinese</option>
                            <option value="Japanese">Japanese</option>
                            <option value="Korean">Korean</option>
                            <option value="Portuguese">Portuguese</option>
                            <option value="Hindi">Hindi</option>
                            <option value="Arabic">Arabic</option>
                        </select>
                        <button 
                            onClick={handleTranslate}
                            disabled={isTranslating}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: isTranslating ? '#ccc' : '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '25px',
                                cursor: isTranslating ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                boxShadow: isTranslating ? 'none' : '0 4px 12px rgba(76, 175, 80, 0.3)'
                            }}
                        >
                            {isTranslating ? '⏳ Translating Document...' : '🌐 Translate Document'}
                        </button>
                    </div>
                </div>
                
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    padding: '20px',
                    backgroundColor: '#fff',
                    borderRadius: '10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <div ref={textLayerRef}>
                        <Document file={pdfUrl} onLoadSuccess={onLoadSuccess}>
                            <Page pageNumber={pageNumber} width={700} />
                        </Document>
                    </div>
                </div>
                
                {contextMenu && (
                    <div 
                        className="context-menu"
                        style={{
                            position: 'fixed',
                            left: contextMenu.x,
                            top: contextMenu.y,
                            backgroundColor: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            zIndex: 1000
                        }}
                    >
                        <button 
                            onClick={handleExplain}
                            className="context-menu-item"
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '8px 12px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                cursor: 'pointer',
                                textAlign: 'left',
                                color: '#333' // Fixed text color
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            Explain
                        </button>
                    </div>
                )}

                {explanationBox && (
                    <div
                        className="explanation-box"
                        style={{
                            position: 'fixed',
                            left: explanationBox.x,
                            top: explanationBox.y,
                            backgroundColor: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            padding: '16px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 1001,
                            maxWidth: '400px',
                            minWidth: '300px',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            fontSize: '14px',
                            lineHeight: '1.5'
                        }}
                    >
                        {explanationBox.loading ? (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '20px'
                            }}>
                                <LoadingSpinner />
                                <span style={{ color: '#666' }}>Getting explanation...</span>
                            </div>
                        ) : (
                            <div>
                                <div style={{
                                    fontWeight: 'bold',
                                    marginBottom: '8px',
                                    color: '#333',
                                    borderBottom: '1px solid #eee',
                                    paddingBottom: '8px'
                                }}>
                                    &ldquo;{selectedText}&rdquo;
                                </div>
                                <div style={{ color: '#555' }}>
                                    {explanationBox.content}
                                </div>
                                <button
                                    onClick={() => setExplanationBox(null)}
                                    style={{
                                        marginTop: '12px',
                                        padding: '4px 8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        backgroundColor: '#f8f9fa',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        float: 'right'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};
