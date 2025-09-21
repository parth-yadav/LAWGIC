import "dotenv/config";
import { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendResponse } from "@/utils/ResponseHelpers";
import { getErrorMessage } from "@/utils/utils";
import prisma from "@/prisma/client";

const key = process.env.COMPLEX_WORDS_API_KEY;

if (!key) {
  throw new Error("key not set in .env");
}

const genAI = new GoogleGenerativeAI(key);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Analyzes text content for security threats using Gemini AI
 *
 * @param {string} textContent - The text content to analyze
 * @param {number} pageNumber - The page number being analyzed
 * @returns {Array} Array of threats found
 */

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
    // Handle both GET (query params) and POST (body params) requests
    const documentId =
      req.method === "GET" ? (req.query.docId as string) : req.body.documentId;
    const pagesContent = req.method === "GET" ? null : req.body.pagesContent;
    const userId = req.user?.id;

    if (!documentId) {
      return sendResponse({
        res,
        success: false,
        error: {
          message: "Document ID is required",
        },
        statusCode: 400,
      });
    }

    // Verify user owns the document
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
        deletedAt: null,
      },
    });

    if (!document) {
      return sendResponse({
        res,
        success: false,
        error: {
          message: "Document not found or access denied",
        },
        statusCode: 404,
      });
    }

    // Check if threats already exist for this document
    const existingThreats = await prisma.threat.findMany({
      where: {
        documentId,
      },
      orderBy: [{ pageNumber: "asc" }, { threatNumber: "asc" }],
    });

    return sendResponse({
      res,
      success: true,
      data: {
        threats: existingThreats.map((threat) => ({
          id: threat.id,
          exactStringThreat: threat.text,
          explanation: threat.explanation,
          severity: threat.severity,
          category: threat.category,
          page: threat.pageNumber,
          number: threat.threatNumber,
          confidence: threat.confidence,
          position: threat.position,
        })),
        summary: {
          totalThreats: existingThreats.length,
          isFromCache: true,
        },
      },
      message: "Threats retrieved from database",
    });

    // If no existing threats, we need the pagesContent to analyze
    if (!pagesContent || !Array.isArray(pagesContent)) {
      return sendResponse({
        res,
        success: false,
        error: {
          message:
            req.method === "GET"
              ? "No threats found for this document. Use POST with pagesContent to analyze."
              : "pagesContent array is required for new analysis",
        },
        statusCode: req.method === "GET" ? 404 : 400,
      });
    }

    console.log(`🔍 BACKEND: Analyzing document ${documentId} for threats...`);
    console.log(`📥 BACKEND: Processing ${pagesContent.length} pages`);

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

      // Analyze this page for threats using AI
      const pageThreats = await analyzePageForThreatsWithAI(
        selectionApiContent,
        page
      );

      // Save each threat to database and add to results
      for (const threat of pageThreats) {
        const savedThreat = await prisma.threat.create({
          data: {
            documentId,
            text: threat.exactStringThreat,
            explanation: threat.explanation,
            pageNumber: page,
            threatNumber: threatNumber,
            severity: threat.severity?.toUpperCase() || "HIGH",
            category: threat.category || "Unknown",
            confidence: 1.0,
            position: {}, // You can enhance this based on your needs
          },
        });

        allThreats.push({
          id: savedThreat.id,
          exactStringThreat: threat.exactStringThreat,
          explanation: threat.explanation,
          severity: threat.severity,
          category: threat.category,
          page: page,
          number: threatNumber,
          confidence: 1.0,
          position: {},
        });

        threatNumber++;
      }

      console.log(
        `✅ BACKEND: Page ${page} analysis complete. Found ${pageThreats.length} threats.`
      );
    }

    console.log(`\n🎯 BACKEND: ANALYSIS COMPLETE`);
    console.log(`📊 BACKEND: Total threats found: ${allThreats.length}`);

    return sendResponse({
      res,
      success: true,
      data: {
        threats: allThreats,
        summary: {
          totalPages: pagesContent.length,
          totalThreats: allThreats.length,
          analysisTimestamp: new Date().toISOString(),
          isFromCache: false,
        },
      },
      message: "Threat analysis completed successfully",
    });
  } catch (error: any) {
    console.error("❌ BACKEND: Analysis failed:", error);
    return sendResponse({
      res,
      success: false,
      error: {
        message: getErrorMessage(
          error,
          "Failed to analyze document for threats"
        ),
        details: error,
      },
      statusCode: 500,
    });
  }
};

//HEALTH-CHECKPOINT
export const healthCheck = async (_req: Request, res: Response) => {
  console.log("🏥 BACKEND: Health check requested");
  res.json({
    status: "OK",
    message: "Threat Analyzer Backend is running",
    endpoints: {
      "GET /threats?docId=<docId>":
        "Get/analyze threats for a document (requires auth)",
      "GET /threats/health": "Health check endpoint",
    },
    timestamp: new Date().toISOString(),
  });
};
