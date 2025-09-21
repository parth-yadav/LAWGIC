import "dotenv/config";
import { Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import { sendResponse } from "@/utils/ResponseHelpers";
import { getErrorMessage } from "@/utils/utils";
import prisma from "@/prisma/client";

const key = process.env.COMPLEX_WORDS_API_KEY;

if (!key) {
  throw new Error("key not set in .env");
}
const ai = new GoogleGenAI({ apiKey: key });

// retry logic
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const makeRequestWithRetry = async (
  requestFn: () => Promise<any>,
  maxRetries = 3
) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;

      if (
        error.status === 503 ||
        error.status === 429 ||
        error.status === 500
      ) {
        const delayMs = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(
          `API request failed (attempt ${
            attempt + 1
          }/${maxRetries}), retrying in ${delayMs}ms...`
        );

        if (attempt < maxRetries - 1) {
          await delay(delayMs);
          continue;
        }
      }
      throw error;
    }
  }
  throw lastError;
};

export const explainText = async (req: Request, res: Response) => {
  try {
    console.log("🔍 EXPLAIN TEXT REQUEST:", {
      body: req.body,
      userId: req.user?.id,
      headers: {
        authorization: req.headers.authorization ? "Bearer [token]" : "Missing",
        "content-type": req.headers["content-type"],
      },
    });

    const {
      selectionText,
      currentPageText,
      prevPageText,
      nextPageText,
      page,
      documentId,
      startOffset,
      endOffset,
      position,
    } = req.body;

    const userId = req.user?.id;

    if (!userId) {
      console.error("❌ Missing user ID from auth middleware");
      return sendResponse({
        res,
        success: false,
        error: {
          message: "Authentication required",
        },
        statusCode: 401,
      });
    }

    if (!selectionText?.trim()) {
      console.error("❌ Missing selection text:", { selectionText });
      return sendResponse({
        res,
        success: false,
        error: {
          message: "Selection text is required",
        },
        statusCode: 400,
      });
    }

    if (!documentId) {
      console.error("❌ Missing document ID:", { documentId });
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
    console.log("🔍 Checking document ownership:", { documentId, userId });
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
        deletedAt: null,
      },
    });

    if (!document) {
      console.error("❌ Document not found or access denied:", {
        documentId,
        userId,
        documentExists: await prisma.document.findFirst({
          where: { id: documentId },
        }),
      });
      return sendResponse({
        res,
        success: false,
        error: {
          message: "Document not found or access denied",
        },
        statusCode: 404,
      });
    }

    console.log("✅ Document access verified:", document.title);

    // Check if explanation already exists for this exact text and document
    const existingExplanation = await prisma.explanation.findFirst({
      where: {
        documentId,
        selectedText: selectionText.trim(),
        pageNumber: page || 1,
      },
    });

    let explanationText: string;
    let isFromCache = false;

    if (existingExplanation) {
      // Reuse existing explanation text but create new entry with different position/offset
      explanationText = existingExplanation.explanationMeaning;
      isFromCache = true;
      console.log(
        `📄 BACKEND: Reusing existing explanation for "${selectionText.trim()}"`
      );
    } else {
      // Generate new explanation using AI
      console.log(
        `🤖 BACKEND: Generating new explanation for "${selectionText.trim()}"`
      );

      const prompt = `
            Act as a helpful legal expert with a talent for making complex topics simple. Your mission is to help ordinary people understand difficult legal documents.
            
            I will provide a JSON payload containing a 'selectionText' (a legal term or phrase), and optionally 'currentPageText', 'prevPageText', and 'nextPageText' for context.

            Your task is to explain the 'selectionText' in simple, easy-to-understand language. Use the surrounding page text for context to make your explanation more accurate. Also return the page number back.
            
            The 'term' in your JSON response should be the original 'selectionText', and the 'meaning' should be your simple explanation. Write as if you're explaining it to someone with no legal background. Avoid legal/technical jargon.
    `;

      const payload = {
        selectionText,
        currentPageText: currentPageText || "",
        prevPageText: prevPageText || "",
        nextPageText: nextPageText || "",
        page: page || 1,
      };

      const response = await makeRequestWithRetry(() =>
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    prompt + "\n\nJSON payload:\n" + JSON.stringify(payload),
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                meaning: { type: Type.STRING },
                page: { type: Type.NUMBER },
              },
              propertyOrdering: ["term", "meaning", "page"],
            },
          },
        })
      );

      const responseText = response.text ?? "";
      if (!responseText) {
        throw new Error("No response text from AI");
      }
      const explanation = JSON.parse(responseText);
      explanationText = explanation.meaning;
      isFromCache = false;
    }

    // Always save a new entry to database (with existing or new explanation text)
    const savedExplanation = await prisma.explanation.create({
      data: {
        documentId,
        selectedText: selectionText.trim(),
        explanationMeaning: explanationText,
        pageNumber: page || 1,
        startOffset: startOffset || 0,
        endOffset: endOffset || 0,
        position: position || {},
      },
    });

    return sendResponse({
      res,
      success: true,
      data: {
        term: selectionText.trim(),
        meaning: explanationText,
        page: page || 1,
        id: savedExplanation.id,
        isFromCache,
      },
      message: isFromCache
        ? "Explanation reused and saved with new position"
        : "Text explained successfully",
    });
  } catch (error: any) {
    console.error("❌ Error explaining text:", {
      error: error.message || error,
      stack: error.stack,
      userId: req.user?.id,
      documentId: req.body?.documentId,
      selectionText: req.body?.selectionText,
    });

    let errorMessage = "Failed to explain text";
    let statusCode = 500;

    if (error.status === 503) {
      errorMessage =
        "AI service is temporarily overloaded. Please try again in a few moments.";
      statusCode = 503;
    } else if (error.status === 429) {
      errorMessage =
        "Rate limit exceeded. Please wait a moment before trying again.";
      statusCode = 429;
    } else if (error.status === 500) {
      errorMessage =
        "AI service encountered an internal error. Please try again.";
      statusCode = 500;
    }

    return sendResponse({
      res,
      success: false,
      error: {
        message: getErrorMessage(error, errorMessage),
        details: error,
      },
      statusCode,
    });
  }
};

export const getExplanationsByDocument = async (
  req: Request,
  res: Response
) => {
  try {
    const { docId } = req.query;
    const userId = req.user?.id;

    if (!docId || typeof docId !== "string") {
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
        id: docId,
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

    // Get all explanations for this document
    const explanations = await prisma.explanation.findMany({
      where: {
        documentId: docId,
      },
      orderBy: [{ pageNumber: "asc" }, { createdAt: "asc" }],
    });

    return sendResponse({
      res,
      success: true,
      data: explanations.map((exp) => ({
        id: exp.id,
        term: exp.selectedText,
        meaning: exp.explanationMeaning,
        page: exp.pageNumber,
        startOffset: exp.startOffset,
        endOffset: exp.endOffset,
        position: exp.position,
        createdAt: exp.createdAt,
      })),
      message: "Explanations retrieved successfully",
    });
  } catch (error: any) {
    console.error("Error getting explanations:", error);

    return sendResponse({
      res,
      success: false,
      error: {
        message: getErrorMessage(error, "Failed to retrieve explanations"),
        details: error,
      },
      statusCode: 500,
    });
  }
};
