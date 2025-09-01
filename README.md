# PDF Threat Analyzer

A comprehensive full-stack solution for AI-powered PDF security threat detection and visualization.

## 🎯 Overview

This application combines a Node.js backend with Google Gemini AI and a Next.js frontend to analyze PDF documents for security threats, providing precise visual highlighting of detected issues.

## 🏗️ Architecture

### Backend (`newbackend/`)
- **Node.js + Express** server
- **PDF.js** for text extraction with bounding boxes
- **Google Gemini AI** for threat analysis
- **Multer** for file upload handling
- **CORS** enabled for frontend communication

### Frontend (`newfrontend/`)
- **Next.js 14** with App Router
- **PDF.js** for client-side PDF rendering
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **TypeScript** for type safety

## 🚀 Quick Start

### Option 1: Automated Setup

**Windows:**
```cmd
setup.bat
```

**Linux/Mac:**
```bash
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

1. **Backend Setup:**
```bash
cd newbackend
npm install
cp .env.example .env
# Add your GEMINI_API_KEY to .env
npm run dev
```

2. **Frontend Setup:**
```bash
cd newfrontend
npm install
npm run dev
```

3. **Access Application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## 🔧 Configuration

### Environment Variables

Create `newbackend/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=4000
```

### Getting Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Add it to your `.env` file

## 📋 Features

### Backend Capabilities
- ✅ PDF text extraction with precise bounding boxes
- ✅ AI-powered threat detection via Gemini
- ✅ Threat-to-location mapping
- ✅ Multi-page document support
- ✅ Error handling and validation
- ✅ RESTful API design

### Frontend Features
- ✅ Drag & drop PDF upload
- ✅ Interactive PDF viewer with zoom
- ✅ Real-time threat highlighting
- ✅ Severity-based color coding
- ✅ Page navigation
- ✅ Click-to-highlight threat selection
- ✅ Responsive design
- ✅ Loading states and error handling

### Threat Detection
- 🔍 SQL injection patterns
- 🔍 XSS vulnerabilities
- 🔍 Command injection attempts
- 🔍 Path traversal attacks
- 🔍 Malicious URLs and domains
- 🔍 Hardcoded credentials
- 🔍 Security misconfigurations
- 🔍 Suspicious code patterns

## 📖 API Documentation

### POST /analyze
Analyzes a PDF file for security threats.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: PDF file under key "pdf"

**Response:**
```json
{
  "pages": [
    {
      "page": 1,
      "threats": [
        {
          "text": "DROP TABLE users",
          "reason": "SQL injection attempt detected",
          "bbox": {
            "x": 120,
            "y": 300,
            "width": 80,
            "height": 12
          },
          "confidence": 1.0
        }
      ],
      "totalWords": 150
    }
  ],
  "totalPages": 3,
  "totalThreats": 5
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "message": "Threat Analyzer Backend is running"
}
```

## 🎨 UI Components

### Threat Severity Colors
- 🔴 **High Severity**: Red (injections, XSS, malicious code)
- 🟠 **Medium Severity**: Orange (suspicious patterns, credentials)
- 🟡 **Low Severity**: Yellow (minor security concerns)

### Interactive Elements
- **Upload Area**: Drag & drop or click to upload
- **Threat Sidebar**: Clickable threat list with details
- **PDF Viewer**: Zoomable canvas with overlay highlights
- **Page Controls**: Navigate through multi-page documents
- **Zoom Controls**: Adjust view scale for detailed inspection

## 🔄 Communication Flow

1. **Frontend → Backend**: Upload PDF via `/analyze` endpoint
2. **Backend Processing**:
   - Extract text + bounding boxes with PDF.js
   - Send page text to Gemini for analysis
   - Parse AI response for threats
   - Map threats back to word locations
3. **Backend → Frontend**: Return structured JSON with threats + coordinates
4. **Frontend Rendering**:
   - Render PDF pages with PDF.js
   - Overlay threat highlights at bbox positions
   - Display threat list in sidebar
   - Enable interactive threat selection

## 🛠️ Development

### Backend Structure
```
newbackend/
├── server.js          # Main Express server
├── package.json       # Dependencies and scripts
├── .env.example       # Environment template
└── uploads/           # Temporary file storage
```

### Frontend Structure
```
newfrontend/
├── app/
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Main analyzer component
│   └── globals.css    # Global styles
├── package.json       # Dependencies and scripts
└── next.config.js     # Next.js configuration
```

### Testing

Test the backend health:
```bash
curl http://localhost:4000/health
```

Test analysis endpoint:
```bash
curl -X POST -F "pdf=@sample.pdf" http://localhost:4000/analyze
```

## 🚨 Security Considerations

- File uploads are temporary and cleaned up after processing
- CORS is configured for development (adjust for production)
- API key should be kept secure and not committed to version control
- Consider rate limiting for production deployment
- Validate file types and sizes on both client and server

## 📈 Performance

- **Backend**: Processes PDFs page-by-page for memory efficiency
- **Frontend**: Uses PDF.js worker for non-blocking rendering
- **AI Processing**: Batches page text for optimal Gemini usage
- **Caching**: Consider implementing Redis for production

## 🐛 Troubleshooting

### Common Issues

1. **PDF.js Worker Errors**: Ensure CDN worker URL is accessible
2. **CORS Issues**: Check backend is running on port 4000
3. **Gemini API Errors**: Verify API key and quota limits
4. **File Upload Failures**: Check file size and format (PDF only)

### Debug Mode

Enable debug logging in backend:
```javascript
// Add to server.js
const DEBUG = process.env.DEBUG === 'true';
if (DEBUG) console.log('Debug message');
```

## 📄 License

This project is provided as-is for educational and development purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Happy threat hunting! 🔍🛡️**
