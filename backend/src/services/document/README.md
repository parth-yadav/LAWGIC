# Document Processing Services

This directory contains modular document processing services split into individual, focused components.

## Architecture

### 📁 File Structure
```
src/services/document/
├── index.ts                     # Main exports
├── DocumentProcessor.ts         # Main orchestrator service
├── PdfTextExtractor.ts         # PDF text extraction
├── TextParser.ts               # Text parsing and structuring
├── ThreatAnalyzer.ts           # Threat detection and analysis
├── ComplexTermsIdentifier.ts   # Legal/complex terms identification
└── UrlExtractor.ts             # URL and web content extraction
```

### 🔧 Services Overview

#### **DocumentProcessor** (Main Service)
- **Purpose**: Orchestrates all other services
- **Responsibilities**: 
  - Coordinates document processing workflow
  - Manages service dependencies
  - Returns final `AugmentedLeanDocument` structure

#### **PdfTextExtractor**
- **Purpose**: Extract text from PDF documents
- **Method**: Uses `pdf-parse` with custom page rendering
- **Features**:
  - Page-by-page text extraction
  - Layout-aware text sorting (Y/X coordinates)
  - Smart page boundary detection
  - Multiple splitting strategies (page markers, form feeds, content-based)

#### **TextParser**
- **Purpose**: Parse and structure extracted text
- **Features**:
  - Sentence segmentation with regex
  - Word tokenization
  - Unique ID generation for all elements
  - Page/sentence/word hierarchy creation

#### **ThreatAnalyzer**
- **Purpose**: Identify potential legal/business threats
- **Features**:
  - Keyword-based threat detection
  - Three severity levels (high/medium/low)
  - Customizable threat keywords
  - Contextual recommendations

#### **ComplexTermsIdentifier**
- **Purpose**: Identify and define complex legal terms
- **Features**:
  - Pre-defined legal terms dictionary
  - Term-to-definition mapping
  - Extensible term database
  - Reference tracking to original word positions

#### **UrlExtractor**
- **Purpose**: Extract content from URLs and web pages
- **Features**:
  - PDF download and processing from URLs
  - Web page text extraction using Puppeteer
  - Document type detection
  - Error handling for unsupported formats

## 🚀 Usage

### Basic Usage
```typescript
import { DocumentProcessor } from '../services/document/index.js';

const processor = new DocumentProcessor();

// Process PDF buffer
const result = await processor.processDocument(pdfBuffer, 'pdf');

// Process URL
const result = await processor.processDocument(url, 'url');
```

### Advanced Usage (Individual Services)
```typescript
import { 
  PdfTextExtractor, 
  TextParser, 
  ThreatAnalyzer 
} from '../services/document/index.js';

const pdfExtractor = new PdfTextExtractor();
const textParser = new TextParser();
const threatAnalyzer = new ThreatAnalyzer();

// Extract text
const { pages } = await pdfExtractor.extractTextFromPDF(buffer);

// Parse text
const structuredPages = textParser.processTextContentFromPages(pages);

// Analyze threats
const threats = threatAnalyzer.analyzeThreats(structuredPages);
```

### Customization Examples
```typescript
// Add custom threat keywords
processor.getThreatAnalyzer().addThreatKeywords('high', ['bankruptcy', 'liquidation']);

// Add custom legal terms
processor.getComplexTermsIdentifier().addLegalTerm('novation', 'The replacement of an old contract with a new one');
```

## 🔄 Data Flow

1. **Input**: PDF Buffer or URL string
2. **Extraction**: 
   - PDF → `PdfTextExtractor` → Raw text pages
   - URL → `UrlExtractor` → Raw text
3. **Parsing**: `TextParser` → Structured pages with sentences and words
4. **Analysis**: 
   - `ThreatAnalyzer` → Identified threats
   - `ComplexTermsIdentifier` → Complex terms with definitions
5. **Output**: `AugmentedLeanDocument` with all analysis results

## 🎯 Benefits of This Architecture

### **Modularity**
- Each service has a single responsibility
- Easy to test individual components
- Clear separation of concerns

### **Maintainability** 
- Changes to one service don't affect others
- Easy to add new analysis features
- Simple to update extraction methods

### **Extensibility**
- Easy to add new document types
- Simple to extend analysis capabilities
- Pluggable architecture

### **Reusability**
- Services can be used independently
- Easy to compose different workflows
- Suitable for different use cases

## 🔧 Configuration

Each service can be configured independently:

```typescript
// Configure threat analyzer
const threatAnalyzer = new ThreatAnalyzer();
threatAnalyzer.addThreatKeywords('critical', ['immediate termination']);

// Configure complex terms
const termsIdentifier = new ComplexTermsIdentifier();
termsIdentifier.addLegalTerm('escrow', 'A financial arrangement where a third party holds funds');
```

## 🧪 Testing

Each service can be unit tested independently:

```typescript
// Test PDF extraction
const extractor = new PdfTextExtractor();
const result = await extractor.extractTextFromPDF(testBuffer);
expect(result.pages).toHaveLength(5);

// Test threat analysis
const analyzer = new ThreatAnalyzer();
const threats = analyzer.analyzeThreats(testPages);
expect(threats).toContainEqual(expect.objectContaining({ severity: 'high' }));
```

## 📈 Performance

- **Parallel Processing**: Services can be optimized independently
- **Memory Efficient**: Only load required services
- **Caching**: Easy to add caching at service level
- **Lazy Loading**: Services loaded only when needed
