# GenAI Backend API Documentation

## Overview

This backend provides AI-powered document analysis capabilities including text explanations and threat detection for legal documents. All endpoints require user authentication and enforce document ownership validation.

## Base Configuration

- **Base URL**: `http://localhost:6900` (or your configured backend URL)
- **Authentication**: Cookie-based or header-based authentication required
- **Content-Type**: `application/json` for all POST requests

## Authentication

### Cookie-based (Recommended)

```javascript
fetch("/endpoint", {
  method: "POST",
  credentials: "include", // Includes httpOnly cookies
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
```

### Header-based (Alternative)

```javascript
fetch("/endpoint", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "access-token": "your-access-token",
  },
  body: JSON.stringify(data),
});
```

## Error Handling

### Standard Error Response Format

```typescript
{
  success: false;
  error: {
    message: string;
    details?: any;
  };
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (invalid/missing authentication)
- `404` - Not Found (document not found or access denied)
- `429` - Rate Limit Exceeded (AI service rate limit)
- `500` - Internal Server Error
- `503` - Service Unavailable (AI service overloaded)

---

## 📝 Explanations Module

### Generate/Reuse Text Explanation

**Endpoint**: `POST /explanations/text`

**Purpose**: Generates AI explanation for selected text or reuses existing explanation with new position data

**Authentication**: Required

**Request Body**:

```typescript
{
  selectionText: string;        // Required: Text to explain
  documentId: string;           // Required: Document ID
  currentPageText?: string;     // Optional: Full page text for context
  prevPageText?: string;        // Optional: Previous page text for context
  nextPageText?: string;        // Optional: Next page text for context
  page?: number;               // Optional: Page number (default: 1)
  startOffset?: number;        // Optional: Selection start position
  endOffset?: number;          // Optional: Selection end position
  position?: object;           // Optional: Position data for highlighting
}
```

**Response**:

```typescript
{
  success: true;
  data: {
    term: string; // Original selected text
    meaning: string; // AI-generated explanation
    page: number; // Page number
    id: string; // Database ID of this entry
    isFromCache: boolean; // true if reused existing explanation
  }
  message: string; // "Text explained successfully" or "Explanation reused and saved with new position"
}
```

**Behavior**:

- **First time explaining text**: Generates new explanation via AI (`isFromCache: false`)
- **Same text, different position**: Reuses explanation but creates new DB entry with new position (`isFromCache: true`)
- Always creates a new database entry with correct position/offset data

**Frontend Example**:

```javascript
const explainText = async (selectionData) => {
  const response = await fetch("/explanations/text", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      selectionText: selectionData.text,
      documentId: selectionData.documentId,
      currentPageText: selectionData.pageText,
      page: selectionData.pageNumber,
      startOffset: selectionData.startOffset,
      endOffset: selectionData.endOffset,
      position: selectionData.position,
    }),
  });

  const result = await response.json();
  if (result.success) {
    console.log("Explanation:", result.data.meaning);
    console.log("From cache:", result.data.isFromCache);
    return result.data;
  }
};
```

### Get All Explanations for Document

**Endpoint**: `GET /explanations?docId=<documentId>`

**Purpose**: Retrieves all explanations created for a specific document

**Authentication**: Required

**Query Parameters**:

- `docId` (string, required): Document ID

**Response**:

```typescript
{
  success: true;
  data: Array<{
    id: string;
    term: string; // Explained text
    meaning: string; // Explanation
    page: number; // Page number
    startOffset: number; // Selection start position
    endOffset: number; // Selection end position
    position: object; // Position data
    createdAt: string; // ISO timestamp
  }>;
  message: "Explanations retrieved successfully";
}
```

**Frontend Example**:

```javascript
const getDocumentExplanations = async (documentId) => {
  const response = await fetch(`/explanations?docId=${documentId}`, {
    credentials: "include",
  });
  const result = await response.json();
  return result.success ? result.data : null;
};
```

---

## 🚨 Threats Module

### Get/Analyze Document Threats

**Endpoint**: `GET /threats?docId=<documentId>`

**Purpose**: Returns existing threats for a document, or indicates that analysis is needed

**Authentication**: Required

**Query Parameters**:

- `docId` (string, required): Document ID

**Response - Existing Threats Found**:

```typescript
{
  success: true;
  data: {
    threats: Array<{
      id: string;
      exactStringThreat: string; // Problematic text found
      explanation: string; // Why it's problematic
      severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      category: string; // Type of threat (e.g., "Liability", "Termination")
      page: number; // Page number where found
      number: number; // Sequential threat number
      confidence: number; // AI confidence score (0-1)
      position: object; // Position data
    }>;
    summary: {
      totalThreats: number;
      isFromCache: true;
    }
  }
  message: "Threats retrieved from database";
}
```

**Response - No Threats Found**:

```typescript
{
  success: false;
  error: {
    message: "No threats found for this document. Use POST with pagesContent to analyze.";
  }
  statusCode: 404;
}
```

**Frontend Example**:

```javascript
const getThreats = async (documentId) => {
  const response = await fetch(`/threats?docId=${documentId}`, {
    credentials: "include",
  });

  const result = await response.json();

  if (result.success) {
    // Threats found
    return result.data.threats;
  } else if (response.status === 404) {
    // No threats - analysis needed
    return null;
  } else {
    throw new Error(result.error.message);
  }
};
```

### Analyze Document for Threats (POST)

**Endpoint**: `POST /threats` (if you need to analyze new documents)

**Purpose**: Analyzes PDF content for security threats using AI

**Authentication**: Required

**Request Body**:

```typescript
{
  documentId: string; // Required: Document ID
  pagesContent: Array<{
    // Required: PDF content to analyze
    page: number;
    selectionApiContent: string;
  }>;
}
```

**Response**: Same format as GET response but with `isFromCache: false`

---

## 🏥 Health Check

### Service Health Check

**Endpoint**: `GET /threats/health`

**Purpose**: Check if the threat analysis service is running

**Authentication**: Not required

**Response**:

```typescript
{
  status: "OK";
  message: "Threat Analyzer Backend is running";
  endpoints: {
    "GET /threats?docId=<docId>": "Get/analyze threats for a document (requires auth)";
    "GET /threats/health": "Health check endpoint";
  };
  timestamp: string;
}
```

---

## 📋 Integration Workflows

### 1. Document Upload & Initial Load

```javascript
// After document upload
const documentId = uploadedDocument.id;

// Check for existing explanations and threats
const [explanations, threats] = await Promise.all([
  getDocumentExplanations(documentId).catch(() => []),
  getThreats(documentId).catch(() => null),
]);

// Display existing data in UI
displayExplanations(explanations);
if (threats) {
  displayThreats(threats);
} else {
  showAnalysisNeededMessage();
}
```

### 2. Text Selection for Explanation

```javascript
const handleTextSelection = async (selection) => {
  try {
    const explanation = await explainText({
      text: selection.text,
      documentId: currentDocumentId,
      pageText: selection.pageContext,
      pageNumber: selection.page,
      startOffset: selection.start,
      endOffset: selection.end,
      position: selection.boundingRect,
    });

    // Show explanation in UI
    showExplanationTooltip(explanation);

    // Highlight the explained text
    addExplanationHighlight(selection, explanation);
  } catch (error) {
    showErrorMessage("Failed to explain text");
  }
};
```

### 3. Threat Analysis Workflow

```javascript
const analyzeDocumentThreats = async (documentId, pdfContent) => {
  try {
    // First check if threats already exist
    const existingThreats = await getThreats(documentId);

    if (existingThreats) {
      // Display existing threats
      displayThreats(existingThreats);
      return existingThreats;
    }

    // If no threats exist, trigger analysis
    showAnalysisLoadingState();

    const analysisResult = await analyzePdfContent(documentId, pdfContent);
    displayThreats(analysisResult.threats);
    hideAnalysisLoadingState();

    return analysisResult.threats;
  } catch (error) {
    hideAnalysisLoadingState();
    showErrorMessage("Threat analysis failed");
  }
};
```

### 4. Error Handling Pattern

```javascript
const handleApiCall = async (
  apiFunction,
  fallbackMessage = "Operation failed"
) => {
  try {
    return await apiFunction();
  } catch (error) {
    if (error.status === 401) {
      redirectToLogin();
    } else if (error.status === 404) {
      showMessage("Resource not found or access denied");
    } else if (error.status === 429) {
      showMessage("Rate limit exceeded. Please try again later.");
    } else if (error.status === 503) {
      showMessage("Service temporarily unavailable. Please try again.");
    } else {
      showMessage(fallbackMessage);
    }
    return null;
  }
};
```

---

## 🔑 Key Features

### Explanations Module

- **Smart Caching**: Reuses explanation text for identical content
- **Position Tracking**: Creates separate entries for different positions of same text
- **Context Awareness**: Uses surrounding page text for better explanations
- **Efficient**: Avoids duplicate AI calls while maintaining position accuracy

### Threats Module

- **Comprehensive Analysis**: Detects liability, termination, payment, and other legal risks
- **Severity Classification**: Categorizes threats as LOW, MEDIUM, HIGH, or CRITICAL
- **Batch Processing**: Analyzes entire documents page by page
- **Caching**: Stores analysis results to avoid re-processing

### Security

- **Authentication Required**: All endpoints require valid user session
- **Document Ownership**: Users can only access their own documents
- **Input Validation**: Comprehensive validation of all request parameters
- **Error Sanitization**: Safe error messages without sensitive data exposure

---

## 📊 Database Schema Context

### Explanation Model

```typescript
{
  id: string;
  documentId: string; // Foreign key to Document
  selectedText: string; // The text that was explained
  explanationMeaning: string; // AI-generated explanation
  pageNumber: number; // Page where text was found
  startOffset: number; // Selection start position
  endOffset: number; // Selection end position
  position: object; // Position/coordinate data
  createdAt: Date; // Timestamp
}
```

### Threat Model

```typescript
{
  id: string;
  documentId: string; // Foreign key to Document
  text: string; // Problematic text found
  explanation: string; // Why it's problematic
  pageNumber: number; // Page where found
  threatNumber: number; // Sequential number
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: string; // Type of threat
  confidence: number; // AI confidence (0-1)
  position: object; // Position data
  createdAt: Date; // Timestamp
  updatedAt: Date; // Last modified
}
```

This documentation provides everything needed for frontend integration with the GenAI backend API.
