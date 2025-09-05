"use client";

import dynamic from "next/dynamic";
import { fetchContextText } from "../lib/textSelection";

const PDFViewerClientNoSSR = dynamic(() => import("./PDFViewerClient").then(mod => mod.PDFViewerClient), {
    ssr: false
});

type SelectionPayload = {
    selectedText: string;
    currentPage: number;
};

export default function PDFViewer() {
    async function handleSelection(payload: SelectionPayload): Promise<string> {
        const extras = await fetchContextText(payload.currentPage);
        const fullPayload = { ...payload, ...extras };
        const response = await fetch("/api/selection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fullPayload),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.meaning;
    }

    return <PDFViewerClientNoSSR onSelection={handleSelection} />;
}
