import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const upload = multer({ 
  dest: "uploads/",
  limits: {
    fieldSize: 50 * 1024 * 1024, // 50MB field size limit
    fileSize: 100 * 1024 * 1024, // 100MB file size limit
    fields: 10, // Maximum number of non-file fields
    files: 1 // Maximum number of file fields
  }
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// No longer needed - frontend handles word extraction
// This function has been removed as we only use frontend word data

// Analyze words for security threats using Gemini
async function analyzeThreats(words, pageNumber) {
  try {
    // Create text from words for analysis
    const pageText = words.map(w => w.text).join(" ");
    
    const prompt = `You are a cybersecurity expert analyzing document content for potential security threats and vulnerabilities. 

Analyze the following text from page ${pageNumber} and identify specific security concerns. For each threat, return the EXACT word or phrase as it appears in the text.

SECURITY FOCUS AREAS:
- SQL Injection patterns (UNION, SELECT, DROP, etc.)
- Cross-Site Scripting (XSS) attempts (<script>, javascript:, etc.)
- Command injection patterns (eval, exec, system calls)
- Path traversal attempts (../, ../../../, etc.)
- Suspicious file operations and paths
- Malicious URLs, domains, or IP addresses
- Hardcoded credentials, API keys, passwords
- Security misconfigurations
- Suspicious code snippets or commands
- Social engineering patterns
- Phishing indicators
- Malware signatures or suspicious executables

Be precise and only flag actual threats, not legitimate technical documentation.

TEXT TO ANALYZE:
${pageText}

IMPORTANT: For each threat, return the EXACT word or short phrase as it appears in the text. Don't return long sentences.

RESPONSE FORMAT (JSON only):
{
  "threats": [
    {
      "text": "exact word or short phrase as it appears",
      "reason": "specific security concern and why it's dangerous",
      "severity": "critical|high|medium|low"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response - try multiple patterns
    let jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      jsonMatch = text.match(/\{[\s\S]*\}/);
    }
    
    if (jsonMatch) {
      const jsonText = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonText);
      
      // Validate the structure
      if (parsed.threats && Array.isArray(parsed.threats)) {
        return parsed;
      }
    }
    
    return { threats: [] };
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return { threats: [] };
  }
}

// Create threat highlights using the same mechanism as regular highlights
function createThreatHighlights(threats, words, pageNumber) {
  const threatHighlights = [];
  
  threats.forEach((threat, threatIndex) => {
    // Find the exact word or words that match the threat text
    const matchingWords = findExactMatchingWords(threat.text, words);
    
    if (matchingWords.length > 0) {
      // For each matching word/phrase, create a highlight-like object
      matchingWords.forEach((wordMatch, matchIndex) => {
        const highlightId = `threat-${pageNumber}-${threatIndex}-${matchIndex}`;
        
        // Calculate text offsets for the matched words
        const startOffset = wordMatch.startWordIndex;
        const endOffset = wordMatch.endWordIndex + 1; // End is exclusive
        
        const threatHighlight = {
          id: highlightId,
          text: wordMatch.matchedText,
          severity: threat.severity || 'high',
          reason: threat.reason,
          category: 'security',
          confidence: wordMatch.confidence,
          position: {
            pageNumber: pageNumber,
            startOffset: startOffset,
            endOffset: endOffset,
            startXPath: '', // Will be calculated on frontend
            endXPath: '',   // Will be calculated on frontend
          },
          bbox: wordMatch.bbox, // Combined bounding box of all matched words
          wordIndices: wordMatch.wordIndices // Array of word indices for precise matching
        };
        
        threatHighlights.push(threatHighlight);
      });
    } else {
      console.log(`⚠ BACKEND: Threat "${threat.text}" could not be mapped to any words on page ${pageNumber}`);
      
      // Create a threat without position for debugging
      threatHighlights.push({
        id: `threat-${pageNumber}-${threatIndex}-unmapped`,
        text: threat.text,
        severity: threat.severity || 'high',
        reason: threat.reason,
        category: 'security',
        confidence: 0.3,
        position: null,
        bbox: null,
        wordIndices: []
      });
    }
  });
  
  return threatHighlights;
}

// Find exact word matches for threat text using multiple strategies
function findExactMatchingWords(threatText, words) {
  const matches = [];
  const cleanThreatText = threatText.toLowerCase().trim();
  
  // Strategy 1: Exact single word match
  words.forEach((word, index) => {
    if (word.text.toLowerCase() === cleanThreatText) {
      matches.push({
        matchedText: word.text,
        startWordIndex: index,
        endWordIndex: index,
        wordIndices: [index],
        confidence: 1.0,
        bbox: word.bbox
      });
    }
  });
  
  // If exact matches found, return them
  if (matches.length > 0) {
    return matches;
  }
  
  // Strategy 2: Multi-word phrase matching
  const threatWords = cleanThreatText.split(/\s+/).filter(w => w.length > 0);
  
  if (threatWords.length > 1) {
    // Look for consecutive word sequences
    for (let i = 0; i <= words.length - threatWords.length; i++) {
      const wordSequence = words.slice(i, i + threatWords.length);
      const sequenceText = wordSequence.map(w => w.text.toLowerCase()).join(' ');
      
      if (sequenceText === cleanThreatText) {
        // Calculate combined bounding box
        const combinedBbox = calculateCombinedBbox(wordSequence.map(w => w.bbox));
        
        matches.push({
          matchedText: wordSequence.map(w => w.text).join(' '),
          startWordIndex: i,
          endWordIndex: i + threatWords.length - 1,
          wordIndices: Array.from({length: threatWords.length}, (_, idx) => i + idx),
          confidence: 1.0,
          bbox: combinedBbox
        });
      }
    }
  }
  
  // If phrase matches found, return them
  if (matches.length > 0) {
    return matches;
  }
  
  // Strategy 3: Partial word matching (for compound words or partial matches)
  words.forEach((word, index) => {
    const wordText = word.text.toLowerCase();
    
    // Check if word contains the threat text
    if (wordText.includes(cleanThreatText) && cleanThreatText.length > 2) {
      matches.push({
        matchedText: word.text,
        startWordIndex: index,
        endWordIndex: index,
        wordIndices: [index],
        confidence: 0.8,
        bbox: word.bbox
      });
    }
    
    // Check if threat text contains the word (for longer threat texts)
    else if (cleanThreatText.includes(wordText) && wordText.length > 2) {
      matches.push({
        matchedText: word.text,
        startWordIndex: index,
        endWordIndex: index,
        wordIndices: [index],
        confidence: 0.7,
        bbox: word.bbox
      });
    }
  });
  
  // Strategy 4: Individual word matching from multi-word threats
  if (matches.length === 0 && threatWords.length > 1) {
    threatWords.forEach(threatWord => {
      words.forEach((word, index) => {
        if (word.text.toLowerCase() === threatWord && threatWord.length > 2) {
          matches.push({
            matchedText: word.text,
            startWordIndex: index,
            endWordIndex: index,
            wordIndices: [index],
            confidence: 0.6,
            bbox: word.bbox
          });
        }
      });
    });
  }
  
  // Remove duplicates and sort by confidence
  const uniqueMatches = matches.filter((match, index, self) => 
    index === self.findIndex(m => m.startWordIndex === match.startWordIndex && m.endWordIndex === match.endWordIndex)
  );
  
  return uniqueMatches.sort((a, b) => b.confidence - a.confidence);
}

// Calculate combined bounding box for multiple words
function calculateCombinedBbox(bboxes) {
  if (bboxes.length === 0) return null;
  if (bboxes.length === 1) return bboxes[0];
  
  const leftmost = Math.min(...bboxes.map(b => b.x));
  const topmost = Math.min(...bboxes.map(b => b.y));
  const rightmost = Math.max(...bboxes.map(b => b.x + b.width));
  const bottommost = Math.max(...bboxes.map(b => b.y + b.height));
  
  return {
    x: leftmost,
    y: topmost,
    width: rightmost - leftmost,
    height: bottommost - topmost
  };
}

// Main analysis endpoint - only uses word data from frontend
app.post("/analyze", upload.single("pdf"), async (req, res) => {
  try {
    console.log('📥 BACKEND: Received analysis request');
    console.log('📥 BACKEND: Request file info:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      filename: req.file.filename,
      path: req.file.path
    } : 'No file received');
    
    console.log('📥 BACKEND: Request body keys:', Object.keys(req.body));
    console.log('📥 BACKEND: Words data present:', !!req.body.wordsData);
    
    if (!req.file) {
      console.log('❌ BACKEND: No PDF file uploaded');
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    // Require word data from frontend
    if (!req.body.wordsData) {
      console.log('❌ BACKEND: No word data from frontend');
      return res.status(400).json({ error: "Word data from frontend is required" });
    }

    console.log('📥 BACKEND: Words data string length:', req.body.wordsData.length);
    const frontendWordsData = JSON.parse(req.body.wordsData);
    
    console.log('📥 BACKEND: Parsed words data:');
    console.log('📥 BACKEND: Pages with word data:', Object.keys(frontendWordsData));
    
    // Log details for each page
    Object.entries(frontendWordsData).forEach(([pageNum, words]) => {
      console.log(`📥 BACKEND: Page ${pageNum} - received ${words.length} words`);
      if (words.length > 0) {
        console.log(`📥 BACKEND: Page ${pageNum} first 3 words:`, words.slice(0, 3).map(w => ({ text: w.text, bbox: w.bbox })));
      }
    });
    
    const pdfPath = path.join(process.cwd(), req.file.path);
    console.log('📥 BACKEND: PDF saved to:', pdfPath);

    let allPages = [];

    // Process each page using only frontend data
    for (let i = 1; i <= Object.keys(frontendWordsData).length; i++) {
      console.log(`\n🔄 BACKEND: Processing page ${i}`);
      
      if (!frontendWordsData[i]) {
        console.log(`⚠ BACKEND: No word data for page ${i}, skipping`);
        allPages.push({ page: i, threats: [] });
        continue;
      }

      // Use words data from frontend (correct visual order)
      const words = frontendWordsData[i];
      const pageText = words.map(w => w.text).join(" ");
      
      console.log(`📱 BACKEND: Using frontend word data for page ${i}:`);
      console.log(`📱 BACKEND: - Total words: ${words.length}`);
      console.log(`📱 BACKEND: - Page text length: ${pageText.length} characters`);
      console.log(`� BACKEND: - First 10 words:`, words.slice(0, 10).map((w, idx) => `${idx}: "${w.text}"`));
      console.log(`📱 BACKEND: - Sample bounding boxes:`, words.slice(0, 3).map(w => ({ text: w.text, bbox: w.bbox })));

      if (pageText.trim().length === 0) {
        allPages.push({ page: i, threats: [] });
        continue;
      }

      // Analyze page text with Gemini
      console.log(`🔍 BACKEND: Analyzing page ${i} (${words.length} words, ${pageText.length} chars)...`);
      
      const analysis = await analyzeThreats(words, i);
      console.log(`🔍 BACKEND: Found ${analysis.threats.length} AI threats on page ${i}`);

      // Create threat highlights using precise positioning
      const threatHighlights = createThreatHighlights(analysis.threats, words, i);
      console.log(`🔍 BACKEND: Created ${threatHighlights.length} threat highlights on page ${i}`);

      // Add a dummy threat for development purposes (using first meaningful word)
      const dummyThreats = [];
      if (words.length > 0) {
        // Find first meaningful word (skip single characters and common short words)
        let selectedWordIndex = 0;
        for (let j = 0; j < Math.min(10, words.length); j++) {
          const word = words[j];
          if (word.text.length > 2 && !['the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'a', 'an'].includes(word.text.toLowerCase())) {
            selectedWordIndex = j;
            console.log(`🎯 BACKEND: Using meaningful word at index ${j} for dummy threat: "${word.text}"`);
            break;
          }
        }
        
        const selectedWord = words[selectedWordIndex];
        console.log(`🎯 BACKEND: Creating dummy threat for word: "${selectedWord.text}" at index ${selectedWordIndex}`);
        
        dummyThreats.push({
          id: `threat-${i}-dummy-0`,
          text: selectedWord.text,
          severity: 'high',
          reason: "Dummy threat for development testing - simulated SQL injection pattern",
          category: 'security',
          confidence: 1.0,
          position: {
            pageNumber: i,
            startOffset: selectedWordIndex,
            endOffset: selectedWordIndex + 1,
            startXPath: '',
            endXPath: '',
          },
          bbox: selectedWord.bbox,
          wordIndices: [selectedWordIndex]
        });
      }

      // Combine AI threats with dummy threats for development
      const allThreats = [...threatHighlights, ...dummyThreats];
      
      console.log(`✅ BACKEND: Page ${i} final threats:`, allThreats.map(t => ({
        id: t.id,
        text: t.text,
        severity: t.severity,
        hasPosition: !!t.position,
        hasBbox: !!t.bbox,
        confidence: t.confidence
      })));

      allPages.push({ 
        page: i, 
        threats: allThreats,
        totalWords: words.length 
      });
    }

    // Clean up uploaded file
    fs.unlinkSync(pdfPath);

    console.log(`\n✅ BACKEND: Analysis complete. Processed ${allPages.length} pages.`);
    console.log(`✅ BACKEND: Total threats found: ${allPages.reduce((sum, page) => sum + page.threats.length, 0)}`);
    
    // Log summary of each page's results
    allPages.forEach(page => {
      console.log(`✅ BACKEND: Page ${page.page} - ${page.threats.length} threats, ${page.totalWords || 0} words`);
      if (page.threats.length > 0) {
        console.log(`✅ BACKEND: Page ${page.page} threats:`, page.threats.map(t => ({ text: t.text, reason: t.reason, hasBbox: !!t.bbox })));
      }
    });
    
    const responseData = { 
      pages: allPages,
      totalPages: allPages.length,
      totalThreats: allPages.reduce((sum, page) => sum + page.threats.length, 0)
    };
    
    console.log(`📤 BACKEND: Sending response with ${responseData.pages.length} pages, ${responseData.totalThreats} total threats`);
    res.json(responseData);

  } catch (error) {
    console.error("Analysis error:", error);
    
    // Clean up file if it exists
    if (req.file) {
      try {
        fs.unlinkSync(path.join(process.cwd(), req.file.path));
      } catch (unlinkError) {
        console.error("File cleanup error:", unlinkError);
      }
    }
    
    res.status(500).json({ 
      error: "Failed to analyze PDF",
      details: error.message 
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Threat Analyzer Backend is running" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${path.join(process.cwd(), 'uploads')}`);
});
