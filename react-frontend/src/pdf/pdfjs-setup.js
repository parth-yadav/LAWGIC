import { pdfjs } from "react-pdf";

// Serve the worker locally from /public to avoid CORS issues
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
