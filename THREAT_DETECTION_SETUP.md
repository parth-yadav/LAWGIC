# PDF Threat Detection Setup Guide

## Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd simplebackend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file and add your Google Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Start the backend server:**
   ```bash
   npm start
   # or
   node server.js
   ```

   The server will run on `http://localhost:4000`

## Frontend Integration

The frontend is already configured to work with the threat detection system. Once the backend is running:

1. **Open PDF viewer** in your browser
2. **Click the shield icon** in the toolbar to open threats panel
3. **Click "Analyze PDF for Threats"** to scan the document
4. **View detected threats** with severity levels and descriptions
5. **Click any threat** to navigate to its location in the PDF

## Features

### Threat Detection
- ✅ SQL Injection patterns
- ✅ XSS attempts
- ✅ Command injection
- ✅ Path traversal
- ✅ Malicious URLs
- ✅ Hardcoded credentials
- ✅ Security misconfigurations

### UI Features
- ✅ Severity-based color coding
- ✅ Threat filtering by severity
- ✅ Search through threats
- ✅ Jump to threat location
- ✅ Threat count badges
- ✅ Analysis progress indicators

### Security Levels
- 🔴 **Critical**: Immediate security risks
- 🟠 **High**: Significant security concerns  
- 🟡 **Medium**: Moderate security issues
- 🔵 **Low**: Minor security observations

## API Endpoints

- `GET /health` - Health check
- `POST /analyze` - Analyze PDF for threats
  - Requires: PDF file + word position data
  - Returns: Threat analysis results

## Getting Gemini AI API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env` file

## Troubleshooting

### Backend Issues
- Ensure Node.js is installed (v16+)
- Check that port 4000 is available
- Verify your Gemini API key is valid
- Check console logs for detailed error messages

### Frontend Issues
- Ensure backend is running on port 4000
- Check browser console for network errors
- Verify CORS is properly configured
- Make sure PDF is properly loaded before analysis

## File Structure

```
simplebackend/
├── server.js          # Main server file
├── .env.example       # Environment template
├── .env              # Your environment config
├── package.json      # Dependencies
└── uploads/          # Temporary file storage

frontend/pdf/
├── PdfProvider.tsx    # Context with threat state
├── PdfToolbar.tsx     # Updated with threats button
├── PdfContentTab.tsx  # Updated with threats tab
└── highlight/
    ├── types.ts       # Extended with threat types
    └── PdfThreats.tsx # New threats panel component
```

## Development Notes

- The system uses react-pdf for text extraction
- Word positions are calculated client-side for accuracy
- Backend processes text with Gemini AI for threat detection
- Results are mapped back to visual coordinates
- Threats are displayed with appropriate severity styling
