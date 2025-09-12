# PDF Threat Analyzer Frontend

A Next.js frontend application for visualizing PDF security threats detected by the backend AI service.

## Features

- 📄 Interactive PDF viewer with zoom controls
- 🎯 Visual threat highlighting with bounding boxes
- 📊 Threat severity classification (High/Medium/Low)
- 🔍 Click-to-navigate threat selection
- 📱 Responsive design with Tailwind CSS
- ⚡ Real-time analysis results display

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Upload PDF**: Click the upload area and select a PDF file
2. **Analyze**: Click "Analyze Threats" to send the PDF to the backend
3. **Review Results**: Browse threats in the sidebar, organized by page
4. **Navigate**: Use page controls to navigate through the document
5. **Inspect Threats**: Click on threats in the sidebar to highlight them in the PDF
6. **Zoom**: Use zoom controls to examine threats more closely

## Architecture

### Components

- **Main Page** (`app/page.tsx`): Core PDF analyzer interface
- **PDF Renderer**: Uses PDF.js for client-side PDF rendering
- **Threat Overlay**: Dynamic highlighting system for detected threats
- **Sidebar Navigation**: Threat listing and page controls

### Threat Visualization

- **Bounding Boxes**: Precise word-level threat highlighting
- **Color Coding**: 
  - 🔴 High Severity: Red (injections, XSS, malicious code)
  - 🟠 Medium Severity: Orange (suspicious patterns, credentials)
  - 🟡 Low Severity: Yellow (minor security concerns)
- **Interactive Selection**: Click threats to highlight and focus

### API Integration

Communicates with backend at `http://localhost:4000`:
- `POST /analyze`: Upload PDF for threat analysis
- Response: Structured JSON with threats and bounding boxes

## Dependencies

- **Next.js 14**: React framework with App Router
- **PDF.js**: Client-side PDF rendering and text extraction
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Modern icon library
- **TypeScript**: Type-safe development

## Configuration

- **PDF.js Worker**: Configured via CDN for optimal performance
- **CORS**: Assumes backend runs on localhost:4000
- **Responsive Design**: Mobile-friendly interface

## Browser Support

- Modern browsers with PDF.js support
- Chrome, Firefox, Safari, Edge (latest versions)
- Requires JavaScript enabled
