import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables
dotenv.config();

const app = express();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ========================================
// MAIN THREAT ANALYSIS ENDPOINT
// ========================================

/**
 * New API endpoint for threat analysis using Selection API approach
 * 
 * Expected input format:
 * {
 *   pagesContent: [
 *     { page: 1, selectionApiContent: "text content from page 1..." },
 *     { page: 2, selectionApiContent: "text content from page 2..." }
 *   ]
 * }
 * 
 * Response format:
 * {
 *   success: true,
 *   threats: [
 *     {
 *       number: 1,
 *       page: 1,
 *       exactStringThreat: "SELECT * FROM users",
 *       explanation: "SQL injection pattern detected"
 *     }
 *   ]
 * }
 */
app.post("/analyze-pdf-content", async (req, res) => {
  try {
    console.log('\n🔥 ===============================================');
    console.log('📥 BACKEND: NEW PDF CONTENT ANALYSIS REQUEST');
    console.log('🔥 ===============================================');
    
    console.log('📥 BACKEND: Request headers:', {
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length']
    });
    
    const { pagesContent } = req.body;
    
    // Validate input structure
    if (!pagesContent || !Array.isArray(pagesContent)) {
      console.log('❌ BACKEND: Invalid pagesContent data');
      return res.status(400).json({ 
        success: false,
        error: "pagesContent array is required",
        expectedFormat: {
          pagesContent: [
            { page: 1, selectionApiContent: "text content..." }
          ]
        }
      });
    }
    
    console.log(`📥 BACKEND: Processing ${pagesContent.length} pages`);
    
    // Log page details
    pagesContent.forEach((pageData, index) => {
      console.log(`📄 BACKEND: Page ${pageData.page}: ${pageData.selectionApiContent?.length || 0} characters`);
      if (pageData.selectionApiContent) {
        console.log(`📄 BACKEND: Preview: "${pageData.selectionApiContent.substring(0, 100)}..."`);
      }
    });
    
    const allThreats = [];
    let threatCounter = 1;
    
    // Process each page
    for (const pageData of pagesContent) {
      const { page, selectionApiContent } = pageData;
      
      console.log(`\n🔄 BACKEND: Analyzing page ${page}`);
      
      if (!selectionApiContent || selectionApiContent.trim().length === 0) {
        console.log(`⚠️ BACKEND: Page ${page} has no content, skipping`);
        continue;
      }
      
      // Analyze page content for threats
      const pageThreats = await analyzePageForThreats(selectionApiContent, page);
      
      // Add sequential numbering and page info
      pageThreats.forEach(threat => {
        threat.number = threatCounter++;
        threat.page = page;
        allThreats.push(threat);
      });
      
      console.log(`✅ BACKEND: Found ${pageThreats.length} threats on page ${page}`);
    }
    
    console.log(`\n🎯 BACKEND: Analysis complete - Total threats: ${allThreats.length}`);
    
    // Prepare final response
    const response = {
      success: true,
      threats: allThreats,
      totalThreats: allThreats.length,
      processedPages: pagesContent.length,
      timestamp: new Date().toISOString()
    };
    
    // Log threat summary
    if (allThreats.length > 0) {
      console.log('\n📋 BACKEND: THREAT SUMMARY:');
      allThreats.forEach(threat => {
        console.log(`📋 ${threat.number}. Page ${threat.page}: "${threat.exactStringThreat}" - ${threat.explanation}`);
      });
    } else {
      console.log('\n✅ BACKEND: No threats detected in analyzed content');
    }
    
    res.json(response);
    
  } catch (error) {
    console.error("❌ BACKEND: Analysis error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to analyze PDF content for threats",
      details: error.message 
    });
  }
});

// ========================================
// GEMINI AI THREAT ANALYSIS FUNCTION
// ========================================

/**
 * Analyzes text content for security threats using Gemini AI
 * For DEVELOPMENT: Creates mock threats from 10th-15th words of each page
 * 
 * @param {string} textContent - The text content to analyze
 * @param {number} pageNumber - The page number being analyzed
 * @returns {Array} Array of threats found
 */
async function analyzePageForThreats(textContent, pageNumber) {
  try {
    console.log(`🤖 BACKEND: Analyzing page ${pageNumber} with DEVELOPMENT MODE`);
    console.log(`🤖 BACKEND: Text length: ${textContent.length} characters`);
    
    // DEVELOPMENT MODE: Create mock threats from 10th-15th words
    const words = textContent.split(/\s+/).filter(word => word.trim().length > 0);
    console.log(`🤖 BACKEND: Found ${words.length} words on page ${pageNumber}`);
    
    const mockThreats = [];
    
    // Extract words 10-15 as individual threats
    for (let i = 9; i < Math.min(15, words.length); i++) { // 9-14 (0-indexed) = 10th-15th words
      const word = words[i];
      if (word && word.length > 2) { // Only use words longer than 2 characters
        const threatNumber = i - 8; // 1-6 for threats
        mockThreats.push({
          exactStringThreat: word,
          explanation: `Development mock threat #${threatNumber}: "${word}" detected as potential security risk for testing purposes. This is simulated threat detection to test the frontend highlighting system.`
        });
      }
    }
    
    // If we don't have enough words, create some generic mock threats
    if (mockThreats.length === 0) {
      const sampleWords = words.slice(0, 5); // Take first 5 words if available
      sampleWords.forEach((word, index) => {
        if (word && word.length > 1) {
          mockThreats.push({
            exactStringThreat: word,
            explanation: `Development mock threat from word ${index + 1}: "${word}" flagged for testing purposes.`
          });
        }
      });
    }
    
    console.log(`🤖 BACKEND: Created ${mockThreats.length} mock threats for page ${pageNumber}:`);
    mockThreats.forEach((threat, index) => {
      console.log(`🤖 BACKEND: Mock Threat ${index + 1}: "${threat.exactStringThreat}"`);
    });
    
    // OPTIONAL: Also run real AI analysis for comparison (commented out for development)
    /*
    console.log(`🤖 BACKEND: Running real AI analysis for comparison...`);
    const aiThreats = await analyzePageForThreatsWithAI(textContent, pageNumber);
    console.log(`🤖 BACKEND: AI found ${aiThreats.length} real threats vs ${mockThreats.length} mock threats`);
    */
    
    return mockThreats;
    
  } catch (error) {
    console.error(`❌ BACKEND: Mock threat analysis error for page ${pageNumber}:`, error);
    return [];
  }
}

/**
 * REAL AI ANALYSIS FUNCTION (for production use)
 * Currently commented out for development, but can be enabled later
 */
async function analyzePageForThreatsWithAI(textContent, pageNumber) {
  try {
    console.log(`🤖 BACKEND: Analyzing page ${pageNumber} with Gemini AI`);
    console.log(`🤖 BACKEND: Text length: ${textContent.length} characters`);
    
    const prompt = `You are an advanced cybersecurity expert analyzing document content for potential security threats and vulnerabilities.

Analyze the following text from page ${pageNumber} of a document and identify specific security concerns.

SECURITY FOCUS AREAS TO DETECT:
- SQL Injection patterns: SELECT, UNION, DROP, INSERT, UPDATE, DELETE, CREATE, ALTER, OR, AND, LIKE, etc.
- Cross-Site Scripting (XSS): <script>, javascript:, onclick, onload, eval, alert, document.cookie, etc.
- Command injection: eval, exec, system, shell_exec, passthru, cmd, powershell, bash, etc.
- Path traversal: ../, ../../../, %2e%2e%2f, /etc/passwd, /windows/system32, etc.
- Suspicious URLs and domains: suspicious domains, malicious IPs, phishing URLs
- Hardcoded credentials: password=, key=, token=, secret=, api_key=, etc.
- Security misconfigurations: debug=true, test mode, default passwords
- Suspicious code patterns: base64 encoded strings, obfuscated code
- Social engineering: urgent action required, verify account, click here immediately
- Malware signatures: suspicious executables, .exe, .bat, .scr files
- Network scanning: nmap, port scanning, vulnerability scanning
- Privilege escalation: sudo, runas, administrator, root access

CRITICAL INSTRUCTIONS:
1. For each threat, return the EXACT word or phrase as it appears in the text
2. Provide a clear explanation of why it's a security threat
3. Only flag actual threats, not legitimate documentation
4. Return ONLY valid JSON, no other text

REQUIRED JSON FORMAT:
{
  "threats": [
    {
      "exactStringThreat": "exact word or phrase from text",
      "explanation": "detailed explanation of the security risk"
    }
  ]
}

TEXT TO ANALYZE:
${textContent}`;

    console.log(`🤖 BACKEND: Sending ${prompt.length} character prompt to Gemini`);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log(`🤖 BACKEND: Received response (${text.length} characters)`);
    console.log(`🤖 BACKEND: Raw response: ${text.substring(0, 500)}...`);
    
    // Extract JSON from response
    let jsonData = null;
    
    // Try to find JSON in code block
    let jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      // Try to find raw JSON
      jsonMatch = text.match(/\{[\s\S]*\}/);
    }
    
    if (jsonMatch) {
      const jsonText = jsonMatch[1] || jsonMatch[0];
      console.log(`🤖 BACKEND: Extracted JSON: ${jsonText}`);
      
      try {
        jsonData = JSON.parse(jsonText);
        console.log(`🤖 BACKEND: Successfully parsed JSON`);
      } catch (parseError) {
        console.log(`🤖 BACKEND: JSON parsing failed: ${parseError.message}`);
      }
    } else {
      console.log(`🤖 BACKEND: No JSON pattern found in response`);
    }
    
    // Validate and return threats
    if (jsonData && jsonData.threats && Array.isArray(jsonData.threats)) {
      const validThreats = jsonData.threats.filter(threat => 
        threat.exactStringThreat && threat.explanation
      );
      
      console.log(`🤖 BACKEND: Found ${validThreats.length} valid threats`);
      return validThreats;
    } else {
      console.log(`🤖 BACKEND: No valid threats structure found`);
      return [];
    }
    
  } catch (error) {
    console.error(`❌ BACKEND: Gemini AI error for page ${pageNumber}:`, error);
    return [];
  }
}

// ========================================
// UTILITY ENDPOINTS
// ========================================

// Health check endpoint
app.get("/health", (req, res) => {
  console.log('🏥 BACKEND: Health check requested');
  res.json({ 
    status: "OK", 
    message: "Threat Analyzer Backend is running",
    endpoints: {
      "POST /analyze-pdf-content": "Main threat analysis endpoint",
      "GET /health": "Health check endpoint"
    },
    timestamp: new Date().toISOString()
  });
});

// Root endpoint with API documentation
app.get("/", (req, res) => {
  res.json({
    service: "PDF Threat Analyzer Backend",
    version: "2.0.0",
    description: "Analyzes PDF content for security threats using Selection API approach",
    endpoints: {
      "POST /analyze-pdf-content": {
        description: "Analyze page-wise PDF content for security threats",
        input: {
          pagesContent: [
            {
              page: 1,
              selectionApiContent: "text content from page 1..."
            }
          ]
        },
        output: {
          success: true,
          threats: [
            {
              number: 1,
              page: 1,
              exactStringThreat: "SELECT * FROM users",
              explanation: "SQL injection pattern detected"
            }
          ]
        }
      },
      "GET /health": "Health check endpoint"
    },
    timestamp: new Date().toISOString()
  });
});

// ========================================
// SERVER STARTUP
// ========================================

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log('\n🚀 ===============================================');
  console.log('🚀 PDF THREAT ANALYZER BACKEND STARTED');
  console.log('🚀 ===============================================');
  console.log(`✅ Server running on: http://localhost:${PORT}`);
  console.log(`🔍 Main endpoint: POST /analyze-pdf-content`);
  console.log(`🏥 Health check: GET /health`);
  console.log(`📚 Documentation: GET /`);
  console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? 'Configured' : 'NOT CONFIGURED'}`);
  console.log('� MODE: DEVELOPMENT (Mock threats from 10th-15th words)');
  console.log('�🚀 ===============================================');
  console.log('🚀 Ready to analyze PDF content for threats!');
  console.log('🚀 ===============================================\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  process.exit(0);
});
