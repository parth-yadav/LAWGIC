# Frontend-only PDF highlight fix

This zip does not require backend/database changes.

## What changed

- Threats returned by the backend are treated as text-only data.
- Saved highlights returned by the backend are also rendered from their text instead of trusting saved offsets.
- Every time a React-PDF text layer renders, the frontend rebuilds a searchable text index from the real DOM text layer.
- Matching text is converted into browser `Range.getClientRects()` rectangles.
- Highlights/threats are drawn as overlay rectangles instead of rewriting PDF text spans.
- `AddDocument.tsx` dynamically imports `react-pdf` only when processing a selected PDF, which avoids the common Next.js/pdfjs dashboard crash.
- `next.config.ts` disables eval source maps for the browser dev bundle to avoid the `Object.defineProperty called on non-object` pdfjs issue.

## Key files changed

- `pdf/highlight/textLayerHighlighter.ts` added
- `pdf/PdfProvider.tsx` changed
- `pdf/PdfViewer.tsx` changed
- `pdf/highlight/PdfThreats.tsx` changed
- `pdf/highlight/types.ts` changed
- `components/documents/AddDocument.tsx` changed
- `next.config.ts` changed

## Backend compatibility

No backend change is needed. The frontend accepts the existing threat response fields:

- `exactStringThreat`
- `text`
- `page`
- `pageNumber`
- `explanation`
- `severity`
- `category`

For saved highlights, the frontend still sends the backend-required `position` object, but rendering is based on text matching instead of the saved offsets.
