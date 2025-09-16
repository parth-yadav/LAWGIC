import { Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import { sendResponse } from "@/utils/ResponseHelpers";
import { getErrorMessage } from "@/utils/utils";

const key =
  process.env.COMPLEX_WORDS_API_KEY ||
  "AIzaSyABrb5vmKxdQdDH7aB4kHmb1C_k2-WIbXc";
if (!key) {
  throw new Error("key not set in .env");
}
const ai = new GoogleGenAI({ apiKey: key });

export const explainText = async (req: Request, res: Response) => {
  try {
    const { selectionText, currentPageText, prevPageText, nextPageText, page } =
      req.body;

    if (!selectionText?.trim()) {
      return sendResponse({
        res,
        success: false,
        error: {
          message: "Selection text is required",
        },
        statusCode: 400,
      });
    }

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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt + "\n\nJSON payload:\n" + JSON.stringify(payload) },
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
    });

    const responseText = response.text ?? "";
    if (!responseText) {
      throw new Error("No response text from AI");
    }
    const explanation = JSON.parse(responseText);

    return sendResponse({
      res,
      success: true,
      data: explanation,
      message: "Text explained successfully",
    });
  } catch (error) {
    console.error("Error explaining text:", error);
    return sendResponse({
      res,
      success: false,
      error: {
        message: getErrorMessage(error, "Failed to explain text"),
        details: error,
      },
      statusCode: 500,
    });
  }
};
