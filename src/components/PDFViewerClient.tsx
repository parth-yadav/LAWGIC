"use client";

import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
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
    const textLayerRef = useRef<HTMLDivElement>(null);

    const onLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    useEffect(() => {
        function handleSelection() {
            const selection = window.getSelection();
            if (
                selection &&
                !selection.isCollapsed &&
                textLayerRef.current?.contains(selection.anchorNode)
            ) {
                const text = selection.toString().trim();
                console.log('Text selected:', text); // Debug log
                setSelectedText(text);
            } else {
                console.log('Selection cleared'); // Debug log
                setSelectedText("");
                setContextMenu(null);
                setExplanationBox(null);
            }
        }

        function handleContextMenu(e: MouseEvent) {
            console.log('Right click detected, selectedText:', selectedText); // Debug log
            if (selectedText && textLayerRef.current?.contains(e.target as Node)) {
                e.preventDefault();
                console.log('Showing context menu at:', e.clientX, e.clientY); // Debug log
                setContextMenu({ x: e.clientX, y: e.clientY });
                setExplanationBox(null);
            }
        }

        function handleClick(e: MouseEvent) {
            const target = e.target as HTMLElement;
            if (target.closest('.context-menu') || target.closest('.explanation-box')) {
                return;
            }
            console.log('Click detected, closing menus'); // Debug log
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
    }, [selectedText]); 

    const handleExplain = async () => {
        console.log('Explain clicked, selectedText:', selectedText, 'contextMenu:', contextMenu); // Debug log
        if (selectedText && contextMenu) {
            setContextMenu(null);
            const loadingBox = {
                x: contextMenu.x,
                y: contextMenu.y,
                content: null,
                loading: true
            };
            console.log('Setting loading explanation box:', loadingBox); // Debug log
            setExplanationBox(loadingBox);

            try {
                console.log('Calling onSelection with:', { selectedText, currentPage: pageNumber }); // Debug log
                const explanation = await onSelection({
                    selectedText,
                    currentPage: pageNumber,
                });

                console.log('Got explanation:', explanation); // Debug log
                setExplanationBox(prev => prev ? {
                    ...prev,
                    content: explanation,
                    loading: false
                } : null);
            } catch (error) {
                console.error('Error getting explanation:', error);
                setExplanationBox(prev => prev ? {
                    ...prev,
                    content: 'Error: Unable to get explanation. Please try again.',
                    loading: false
                } : null);
            }
        } else {
            console.log('Cannot explain: selectedText or contextMenu missing'); // Debug log
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

    // Debug logs for state changes
    useEffect(() => {
        console.log('Context menu state:', contextMenu);
    }, [contextMenu]);
    useEffect(() => {
        console.log('Explanation box state:', explanationBox);
    }, [explanationBox]);

    return (
        <>
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
            <div className="pdf-viewer">
                <nav>
                    <button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1}>Prev</button>
                    <span>Page {pageNumber}/{numPages}</span>
                    <button onClick={() => setPageNumber(p => Math.min(numPages, p + 1))} disabled={pageNumber >= numPages}>Next</button>
                </nav>
                <div ref={textLayerRef}>
                    <Document file="/dummy.pdf" onLoadSuccess={onLoadSuccess}>
                        <Page pageNumber={pageNumber} width={600} />
                    </Document>
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
                                textAlign: 'left'
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
