import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// No longer needed - frontend handles word extraction
// This function has been removed as we only use frontend word data

// Analyze text for security threats using Gemini
async function analyzeThreats(pageText, pageNumber) {
  try {
    const prompt = `You are a cybersecurity expert analyzing document content for potential security threats and vulnerabilities. 

Analyze the following text from page ${pageNumber} and identify specific security concerns. Return ONLY a valid JSON response.

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

RESPONSE FORMAT (JSON only):
{
  "threats": [
    {
      "text": "exact threatening text as it appears",
      "reason": "specific security concern and why it's dangerous"
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

// Find best matching word for a threat text
function findMatchingWord(threatText, words) {
  const cleanThreatText = threatText.toLowerCase().trim();
  
  // First try exact match
  let match = words.find(w => w.text.toLowerCase() === cleanThreatText);
  if (match) return match;
  
  // Try finding the threat text as a substring in any word
  match = words.find(w => w.text.toLowerCase().includes(cleanThreatText) && cleanThreatText.length > 2);
  if (match) return match;
  
  // Try finding any word that's contained in the threat text
  match = words.find(w => cleanThreatText.includes(w.text.toLowerCase()) && w.text.length > 2);
  if (match) return match;
  
  // Split threat text into words and try to match the most significant word
  const threatWords = cleanThreatText.split(/\s+/).filter(word => word.length > 2);
  for (const threatWord of threatWords) {
    match = words.find(w => w.text.toLowerCase() === threatWord);
    if (match) return match;
  }
  
  // Try partial matching with individual words from threat text
  for (const threatWord of threatWords) {
    match = words.find(w => w.text.toLowerCase().includes(threatWord) || threatWord.includes(w.text.toLowerCase()));
    if (match) return match;
  }
  
  // Try fuzzy matching for similar words (only for shorter texts to avoid false positives)
  if (cleanThreatText.length <= 50) {
    for (const word of words) {
      if (word.text.length > 2 && cleanThreatText.length > 2) {
        const similarity = calculateSimilarity(word.text.toLowerCase(), cleanThreatText);
        if (similarity > 0.8) { // Higher threshold for better accuracy
          return word;
        }
      }
    }
  }
  
  return null;
}

// Simple string similarity calculation
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

// Levenshtein distance calculation
function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
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
      console.log(`Analyzing page ${i} (${words.length} words, ${pageText.length} chars)...`);
      
      const analysis = await analyzeThreats(pageText, i);

      // Add a dummy threat for development purposes (first actual word after sorting)
      const dummyThreats = [];
      if (words.length > 0) {
        // Find first meaningful word (skip single characters and common short words)
        let selectedWord = words[0]; // Default to first word
        for (let j = 0; j < Math.min(10, words.length); j++) {
          const word = words[j];
          if (word.text.length > 2 && !['the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'a', 'an'].includes(word.text.toLowerCase())) {
            selectedWord = word;
            console.log(`🎯 Using meaningful word at index ${j} for dummy threat: "${selectedWord.text}"`);
            break;
          }
        }
        
        if (selectedWord === words[0]) {
          console.log(`🎯 Using first word at index 0 for dummy threat: "${selectedWord.text}"`);
        }
        
        dummyThreats.push({
          text: selectedWord.text,
          reason: "Dummy threat for development testing - simulated SQL injection pattern",
          bbox: selectedWord.bbox,
          confidence: 1.0
        });
      }

      // Map threats back to word bounding boxes
      const mappedThreats = analysis.threats.map((threat, threatIndex) => {
        const matchingWord = findMatchingWord(threat.text, words);
        
        if (matchingWord) {
          console.log(`✓ Threat "${threat.text}" mapped to word "${matchingWord.text}" on page ${i}`);
        } else {
          console.log(`⚠ Threat "${threat.text}" could not be mapped to any word on page ${i}`);
        }
        
        return {
          text: threat.text,
          reason: threat.reason,
          bbox: matchingWord ? matchingWord.bbox : null,
          confidence: matchingWord ? 1.0 : 0.5, // Lower confidence if no bbox found
        };
      });

      // Combine AI threats with dummy threats for development
      const allThreats = [...mappedThreats, ...dummyThreats];

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
