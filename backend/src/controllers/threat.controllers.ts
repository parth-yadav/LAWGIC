import "dotenv/config";
import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const key = process.env.COMPLEX_WORDS_API_KEY;

if (!key) {
  throw new Error("key not set in .env");
}

const genAI = new GoogleGenerativeAI(key);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Analyzes text content for security threats using Gemini AI
 * For DEVELOPMENT: Creates mock threats from specific test strings
 *
 * @param {string} textContent - The text content to analyze
 * @param {number} pageNumber - The page number being analyzed
 * @returns {Array} Array of threats found
 */

//DUMMY_HELPER
async function analyzePageForThreats(textContent: string, pageNumber: number) {
  try {
    console.log(
      `🤖 BACKEND: Analyzing page ${pageNumber} with DEVELOPMENT MODE`
    );
    console.log(`🤖 BACKEND: Text length: ${textContent.length} characters`);

    // DEVELOPMENT MODE: Send specific test string as threat
    const testThreatString = "Our maximum liability under this Benefit";

    // Check if the test string exists in the content
    if (textContent.toLowerCase().includes(testThreatString.toLowerCase())) {
      console.log(`🤖 BACKEND: Found test threat string in page ${pageNumber}`);

      const mockThreats = [
        {
          number: 1,
          page: pageNumber,
          exactStringThreat: testThreatString,
          explanation: `Development test threat: "${testThreatString}" detected for testing frontend highlighting system. This specific string is used to verify the Selection API integration and highlight creation process.`,
        },
      ];

      console.log(`🤖 BACKEND: Created 1 mock threat for page ${pageNumber}:`);
      console.log(`🤖 BACKEND: Mock Threat: "${testThreatString}"`);

      return mockThreats;
    } else {
      console.log(
        `🤖 BACKEND: Test threat string not found in page ${pageNumber} content`
      );
      console.log(`🤖 BACKEND: Searched for: "${testThreatString}"`);
      console.log(
        `🤖 BACKEND: In content: "${textContent.substring(0, 200)}..."`
      );
      return [];
    }

    // OPTIONAL: Also run real AI analysis for comparison (commented out for development)
    /*
        console.log(`🤖 BACKEND: Running real AI analysis for comparison...`);
        const aiThreats = await analyzePageForThreatsWithAI(textContent, pageNumber);
        return [...mockThreats, ...aiThreats];
        */
  } catch (error) {
    console.error(`❌ BACKEND: Error analyzing page ${pageNumber}:`, error);
    return [];
  }
}

//AI_HELPER FXN
async function analyzePageForThreatsWithAI(
  textContent: string,
  pageNumber: number
) {
  try {
    console.log(`🤖 BACKEND: Running REAL AI analysis for page ${pageNumber}`);

    const prompt = `Analyze the following legal document text for potentially problematic clauses, unfavorable terms, and legal risks. 
    Focus on detecting:
    - Liability limitations that may disadvantage the reader
    - Indemnification clauses that shift excessive risk
    - Termination clauses with unfavorable conditions
    - Payment terms with hidden fees or penalties
    - Intellectual property assignments that are overly broad
    - Confidentiality clauses that are one-sided
    - Dispute resolution clauses that limit legal remedies
    - Force majeure clauses that are too restrictive
    - Warranty disclaimers that eliminate important protections
    - Automatic renewal clauses with difficult opt-out terms
    - Jurisdiction clauses that create inconvenience
    - Penalty clauses with excessive damages
    - Non-compete or non-solicitation clauses that are overly restrictive
    - Data handling clauses with insufficient privacy protection
    - Amendment clauses that allow unilateral changes
    
    For each problematic clause found, provide:
    1. The exact text of the problematic clause
    2. A detailed explanation of why it could be unfavorable or risky
    3. Risk level (Critical, High, Medium, Low)
    4. The type of legal issue it represents
    
    Risk Level Guidelines:
    - Critical: Clauses that could result in significant financial loss or legal exposure
    - High: Terms that heavily favor the other party or limit important rights
    - Medium: Clauses that are somewhat unfavorable but manageable
    - Low: Minor issues that should be noted but aren't deal-breakers
    
    Return your response as a JSON object with this structure:
    {
        "threats": [
            {
                "exactStringThreat": "exact problematic clause text from input",
                "explanation": "detailed explanation of why this clause is problematic and what risks it poses",
                "severity": "Critical|High|Medium|Low",
                "category": "Liability|Indemnification|Termination|Payment|IP|Confidentiality|Dispute Resolution|Warranty|etc"
            }
        ]
    }
    
    Legal document text to analyze:
    ${textContent}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

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
      } catch (parseError: any) {
        console.log(`🤖 BACKEND: JSON parsing failed: ${parseError.message}`);
      }
    } else {
      console.log(`🤖 BACKEND: No JSON pattern found in response`);
    }

    // Validate and return threats
    if (jsonData && jsonData.threats && Array.isArray(jsonData.threats)) {
      const validThreats = jsonData.threats.filter(
        (threat: any) => threat.exactStringThreat && threat.explanation
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

//MAIN FUNCTION
export const analyzePdfContent = async (req: Request, res: Response) => {
  try {
    console.log("\n🔥 ===============================================");
    console.log("📥 BACKEND: NEW PDF CONTENT ANALYSIS REQUEST");
    console.log("🔥 ===============================================");

    console.log("📥 BACKEND: Request headers:", {
      "content-type": req.headers["content-type"],
      "content-length": req.headers["content-length"],
    });

    const { pagesContent } = req.body;

    // Validate input structure
    if (!pagesContent || !Array.isArray(pagesContent)) {
      console.log("❌ BACKEND: Invalid pagesContent data");
      return res.status(400).json({
        success: false,
        error: "pagesContent array is required",
        expectedFormat: {
          pagesContent: [
            { page: 1, selectionApiContent: "text content from page 1..." },
            { page: 2, selectionApiContent: "text content from page 2..." },
          ],
        },
      });
    }

    console.log(`📥 BACKEND: Processing ${pagesContent.length} pages`);
    console.log("📊 BACKEND: Pages data structure:");
    pagesContent.forEach((pageData: any, index: number) => {
      console.log(`  Page ${index + 1}:`, {
        page: pageData.page,
        contentLength: pageData.selectionApiContent?.length || 0,
        contentPreview: pageData.selectionApiContent?.substring(0, 100) + "...",
      });
    });

    const allThreats: any[] = [];
    let threatNumber = 1;

    // Process each page
    for (const pageData of pagesContent) {
      const { page, selectionApiContent } = pageData;

      if (!selectionApiContent || typeof selectionApiContent !== "string") {
        console.log(`⚠️ BACKEND: Skipping page ${page} - no valid content`);
        continue;
      }

      console.log(`\n🔍 BACKEND: Analyzing page ${page}...`);

      // Analyze this page for threats (here use the helper fxns AI or dummy)
      const pageThreats = await analyzePageForThreatsWithAI(
        selectionApiContent,
        page
      );

      // Add threat numbers and page info
      for (const threat of pageThreats) {
        allThreats.push({
          ...threat,
          number: threatNumber++,
          page: page,
        });
      }

      console.log(
        `✅ BACKEND: Page ${page} analysis complete. Found ${pageThreats.length} threats.`
      );
    }

    console.log(`\n🎯 BACKEND: ANALYSIS COMPLETE`);
    console.log(`📊 BACKEND: Total threats found: ${allThreats.length}`);
    console.log(`📋 BACKEND: Threat summary:`);
    allThreats.forEach((threat, index) => {
      console.log(
        `  ${index + 1}. Page ${
          threat.page
        }: "${threat.exactStringThreat.substring(0, 50)}..."`
      );
    });

    // Return results in expected format
    const response = {
      success: true,
      threats: allThreats,
      summary: {
        totalPages: pagesContent.length,
        totalThreats: allThreats.length,
        analysisTimestamp: new Date().toISOString(),
      },
    };

    console.log("\n📤 BACKEND: Sending response to frontend");
    console.log("📊 BACKEND: Response structure:", {
      success: response.success,
      threatCount: response.threats.length,
      summaryInfo: response.summary,
    });

    res.json(response);
  } catch (error: any) {
    console.error("❌ BACKEND: Analysis failed:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during threat analysis",
      message: error.message,
    });
  }
};

//HEALT-CHECKPOINT
export const healthCheck = async (_req: Request, res: Response) => {
  console.log("🏥 BACKEND: Health check requested");
  res.json({
    status: "OK",
    message: "Threat Analyzer Backend is running",
    endpoints: {
      "POST /threats/analyze-pdf-content": "Main threat analysis endpoint",
      "GET /threats/health": "Health check endpoint",
    },
    timestamp: new Date().toISOString(),
  });
};
