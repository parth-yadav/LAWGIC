# PDF Threat Analyzer Backend

A Node.js backend service that analyzes PDF documents for security threats using Google's Gemini AI and pdfjs-dist for text extraction with bounding box coordinates.

## Features

- 📄 PDF text extraction with precise bounding box coordinates
- 🔍 AI-powered threat detection using Google Gemini
- 🎯 Threat-to-location mapping for visual highlighting
- 🌐 RESTful API with CORS support
- 📊 Comprehensive analysis results

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your Gemini API key to `.env`:
```
GEMINI_API_KEY=your_actual_api_key_here
```

4. Start the server:
```bash
npm run dev
```

## API Endpoints

### POST /analyze
Analyzes a PDF file for security threats.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
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

## Threat Detection

The system detects various security threats including:
- SQL injection patterns
- XSS vulnerabilities
- Command injection attempts
- Path traversal attacks
- Suspicious file operations
- Malicious URLs
- Security misconfigurations
- Hardcoded credentials
- Potentially harmful code snippets

## Architecture

1. **PDF Processing**: Uses pdfjs-dist to extract text with bounding boxes
2. **AI Analysis**: Sends page text to Google Gemini for threat detection
3. **Mapping**: Maps detected threats back to original word positions
4. **Response**: Returns structured JSON with threats and their locations
