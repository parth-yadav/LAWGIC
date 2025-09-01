import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
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

// Extract text content with bounding boxes from a PDF page
async function extractPageData(page) {
  const textContent = await page.getTextContent();
  return textContent.items.map(item => ({
    text: item.str.trim(),
    bbox: {
      x: item.transform[4],
      y: item.transform[5],
      width: item.width,
      height: item.height,
    },
  })).filter(item => item.text.length > 0); // Filter out empty strings
}

// Analyze text for security threats using Gemini
async function analyzeThreats(pageText, pageNumber) {
  try {
    const prompt = `Analyze the following text from page ${pageNumber} of a document for security threats, vulnerabilities, and suspicious content. 
    
Return a JSON response with "threats" array containing objects with "text" (the exact threatening text found) and "reason" (why it's a threat).

Focus on:
- SQL injection patterns
- XSS vulnerabilities  
- Command injection
- Path traversal attempts
- Suspicious file operations
- Malicious URLs or domains
- Security misconfigurations
- Hardcoded credentials or secrets
- Potentially harmful code snippets

Text to analyze:
${pageText}

Return only valid JSON in this format:
{
  "threats": [
    {
      "text": "exact threatening text",
      "reason": "explanation of why this is a threat"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { threats: [] };
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return { threats: [] };
  }
}

// Find best matching word for a threat text
function findMatchingWord(threatText, words) {
  // First try exact match
  let match = words.find(w => w.text.toLowerCase() === threatText.toLowerCase());
  if (match) return match;
  
  // Try partial match (threat text contains word)
  match = words.find(w => threatText.toLowerCase().includes(w.text.toLowerCase()) && w.text.length > 2);
  if (match) return match;
  
  // Try word contains threat text
  match = words.find(w => w.text.toLowerCase().includes(threatText.toLowerCase()) && threatText.length > 2);
  if (match) return match;
  
  // Try fuzzy matching for similar words
  for (const word of words) {
    if (word.text.length > 2 && threatText.length > 2) {
      const similarity = calculateSimilarity(word.text.toLowerCase(), threatText.toLowerCase());
      if (similarity > 0.7) {
        return word;
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

// Main analysis endpoint
app.post("/analyze", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const pdfPath = path.join(process.cwd(), req.file.path);
    const pdfData = new Uint8Array(fs.readFileSync(pdfPath));
    
    // Load PDF document
    const loadingTask = getDocument({ data: pdfData });
    const pdf = await loadingTask.promise;

    let allPages = [];

    // Process each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const words = await extractPageData(page);

      // Build plain text string for Gemini analysis
      const pageText = words.map(w => w.text).join(" ");

      if (pageText.trim().length === 0) {
        allPages.push({ page: i, threats: [] });
        continue;
      }

      // Analyze page text with Gemini
      console.log(`Analyzing page ${i}...`);
      const analysis = await analyzeThreats(pageText, i);

      // Map threats back to word bounding boxes
      const mappedThreats = analysis.threats.map(threat => {
        const matchingWord = findMatchingWord(threat.text, words);
        return {
          text: threat.text,
          reason: threat.reason,
          bbox: matchingWord ? matchingWord.bbox : null,
          confidence: matchingWord ? 1.0 : 0.5, // Lower confidence if no bbox found
        };
      });

      allPages.push({ 
        page: i, 
        threats: mappedThreats,
        totalWords: words.length 
      });
    }

    // Clean up uploaded file
    fs.unlinkSync(pdfPath);

    console.log(`Analysis complete. Processed ${pdf.numPages} pages.`);
    res.json({ 
      pages: allPages,
      totalPages: pdf.numPages,
      totalThreats: allPages.reduce((sum, page) => sum + page.threats.length, 0)
    });

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
