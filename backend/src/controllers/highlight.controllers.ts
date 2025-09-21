import { Request, Response } from "express";
import { sendResponse } from "../utils/ResponseHelpers.js";
import { getErrorMessage } from "../utils/utils.js";
import prisma from "../prisma/client.js";

// Color definitions to match frontend
const DEFAULT_HIGHLIGHT_COLORS = [
  {
    id: "yellow",
    name: "Yellow",
    backgroundColor: "rgba(255, 255, 0, 1)",
    borderColor: "rgba(230, 230, 0, 1)",
  },
  {
    id: "green",
    name: "Green",
    backgroundColor: "rgba(144, 238, 144, 1)",
    borderColor: "rgba(125, 216, 125, 1)",
  },
  {
    id: "blue",
    name: "Blue",
    backgroundColor: "rgba(135, 206, 235, 1)",
    borderColor: "rgba(107, 182, 212, 1)",
  },
  {
    id: "pink",
    name: "Pink",
    backgroundColor: "rgba(255, 182, 193, 1)",
    borderColor: "rgba(255, 158, 181, 1)",
  },
  {
    id: "orange",
    name: "Orange",
    backgroundColor: "rgba(255, 165, 0, 1)",
    borderColor: "rgba(230, 149, 0, 1)",
  },
];

const THREAT_COLORS = [
  {
    id: "threat-critical",
    name: "Critical Threat",
    backgroundColor: "rgba(255, 0, 0 , 1)",
    borderColor: "rgba(255, 0, 0  , 1)",
  },
  {
    id: "threat-high",
    name: "High Threat",
    backgroundColor: "rgba(0,0,255, 1)",
    borderColor: "rgba(0,0,255, 1)",
  },
  {
    id: "threat-medium",
    name: "Medium Threat",
    backgroundColor: "rgba(255, 0, 0, 1)",
    borderColor: "rgba(255, 0, 0, 1)",
  },
  {
    id: "threat-low",
    name: "Low Threat",
    backgroundColor: "rgba(255, 0, 0, 1)",
    borderColor: "rgba(255, 0, 0, 1)",
  },
];

/**
 * Transform a color string back to a color object for frontend compatibility
 */
function transformColorStringToObject(colorString: string) {
  // Try to find matching color by id first
  const allColors = [...DEFAULT_HIGHLIGHT_COLORS, ...THREAT_COLORS];
  const foundColor = allColors.find(
    (color) => color.id === colorString || color.name === colorString
  );

  if (foundColor) {
    return foundColor;
  }

  // If no match found, return the default yellow color
  return DEFAULT_HIGHLIGHT_COLORS[0];
}

/**
 * Save a highlight to the database
 */
export const saveHighlight = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const {
      documentId,
      pageNumber,
      position,
      text,
      color,
      note,
      explanation,
      tags,
    } = req.body;

    console.log("🎨 Received highlight data:", {
      documentId,
      pageNumber,
      color: typeof color === "object" ? color : "string",
      colorValue: color,
    });

    // Validate required fields
    if (!documentId || !pageNumber || !position || !text || !color) {
      return sendResponse({
        res,
        success: false,
        message: "Missing required fields",
        statusCode: 400,
      });
    }

    // Transform color object to string if needed
    let colorString: string;
    if (typeof color === "object" && color !== null) {
      // If color is an object, use the id or name as the string representation
      colorString = color.id || color.name || JSON.stringify(color);
      console.log("🔄 Transformed color object to string:", colorString);
    } else {
      colorString = String(color);
    }

    // Verify document exists and belongs to user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
      },
    });

    if (!document) {
      return sendResponse({
        res,
        success: false,
        message: "Document not found",
        statusCode: 404,
      });
    }

    // Create highlight
    const highlight = await prisma.highlight.create({
      data: {
        documentId,
        pageNumber: parseInt(pageNumber),
        position,
        text,
        color: colorString, // Use transformed color string
        note: note || null,
        explanation: explanation || null,
        tags: tags || [],
      },
    });

    return sendResponse({
      res,
      success: true,
      message: "Highlight saved successfully",
      data: highlight,
      statusCode: 201,
    });
  } catch (error) {
    console.error("Error saving highlight:", error);
    return sendResponse({
      res,
      success: false,
      message: "Failed to save highlight",
      error: {
        message: getErrorMessage(error),
      },
      statusCode: 500,
    });
  }
};

/**
 * Get all highlights for a document
 */
export const getHighlightsByDocument = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { documentId } = req.query;

    if (!documentId) {
      return sendResponse({
        res,
        success: false,
        message: "Document ID is required",
        statusCode: 400,
      });
    }

    // Verify document exists and belongs to user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId as string,
        userId,
      },
    });

    if (!document) {
      return sendResponse({
        res,
        success: false,
        message: "Document not found",
        statusCode: 404,
      });
    }

    // Get highlights for the document
    const highlights = await prisma.highlight.findMany({
      where: {
        documentId: documentId as string,
      },
      orderBy: [{ pageNumber: "asc" }, { createdAt: "asc" }],
    });

    // Transform color strings back to color objects for frontend compatibility
    const transformedHighlights = highlights.map((highlight) => ({
      ...highlight,
      color: transformColorStringToObject(highlight.color),
    }));

    return sendResponse({
      res,
      success: true,
      message: "Highlights retrieved successfully",
      data: transformedHighlights,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error getting highlights:", error);
    return sendResponse({
      res,
      success: false,
      message: "Failed to get highlights",
      error: {
        message: getErrorMessage(error),
      },
      statusCode: 500,
    });
  }
};

/**
 * Update a highlight
 */
export const updateHighlight = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { highlightId } = req.params;
    const { color, note, explanation, tags } = req.body;

    if (!highlightId) {
      return sendResponse({
        res,
        success: false,
        message: "Highlight ID is required",
        statusCode: 400,
      });
    }

    // Verify highlight exists and belongs to user's document
    const existingHighlight = await prisma.highlight.findFirst({
      where: {
        id: highlightId,
        document: {
          userId,
        },
      },
    });

    if (!existingHighlight) {
      return sendResponse({
        res,
        success: false,
        message: "Highlight not found",
        statusCode: 404,
      });
    }

    // Update highlight
    const highlight = await prisma.highlight.update({
      where: { id: highlightId },
      data: {
        ...(color && { color }),
        ...(note !== undefined && { note }),
        ...(explanation !== undefined && { explanation }),
        ...(tags && { tags }),
      },
    });

    return sendResponse({
      res,
      success: true,
      message: "Highlight updated successfully",
      data: highlight,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error updating highlight:", error);
    return sendResponse({
      res,
      success: false,
      message: "Failed to update highlight",
      error: {
        message: getErrorMessage(error),
      },
      statusCode: 500,
    });
  }
};

/**
 * Delete a highlight
 */
export const deleteHighlight = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { highlightId } = req.params;

    if (!highlightId) {
      return sendResponse({
        res,
        success: false,
        message: "Highlight ID is required",
        statusCode: 400,
      });
    }

    // Verify highlight exists and belongs to user's document
    const existingHighlight = await prisma.highlight.findFirst({
      where: {
        id: highlightId,
        document: {
          userId,
        },
      },
    });

    if (!existingHighlight) {
      return sendResponse({
        res,
        success: false,
        message: "Highlight not found",
        statusCode: 404,
      });
    }

    // Delete highlight
    await prisma.highlight.delete({
      where: { id: highlightId },
    });

    return sendResponse({
      res,
      success: true,
      message: "Highlight deleted successfully",
      statusCode: 200,
    });
  } catch (error) {
    console.error("Error deleting highlight:", error);
    return sendResponse({
      res,
      success: false,
      message: "Failed to delete highlight",
      error: {
        message: getErrorMessage(error),
      },
      statusCode: 500,
    });
  }
};
