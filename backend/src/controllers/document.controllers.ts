import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma/client.js";
import { ApiResponse } from "../types/api.js";
import { uploadToS3, generateSignedUrl } from "../utils/s3Upload.js";

// Validation schema for document creation (form data)
const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
});

export const createDocument = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const multerReq = req as Request & { file?: Express.Multer.File };

    // Check if file was uploaded
    if (!multerReq.file) {
      res.status(400).json({
        success: false,
        error: { message: "No file uploaded" },
      } as ApiResponse);
      return;
    }

    // Validate form data
    const validatedData = createDocumentSchema.parse(req.body);

    // Get user ID from authenticated request
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      } as ApiResponse);
      return;
    }

    // Upload file to S3
    const uploadResult = await uploadToS3(
      multerReq.file.buffer,
      multerReq.file.originalname,
      multerReq.file.mimetype,
      "documents"
    );

    // TODO: Extract page count from PDF if needed
    // You can use a library like pdf-parse for this
    const pageCount = 1; // Default to 1 for now

    // Create document in database
    const document = await prisma.document.create({
      data: {
        userId,
        title: validatedData.title,
        fileName: multerReq.file.originalname,
        filePath: uploadResult.fileUrl,
        fileKey: uploadResult.fileKey,
        pageCount,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: document,
    } as ApiResponse);
  } catch (error) {
    console.error("Create document error:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: {
          message: "Validation error",
          details: error.issues,
        },
      } as ApiResponse);
      return;
    }

    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    } as ApiResponse);
  }
};

export const getUserDocuments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      } as ApiResponse);
      return;
    }

    const documents = await prisma.document.findMany({
      where: {
        userId,
        deletedAt: null, // Only get non-deleted documents
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            highlights: true,
            threats: true,
            complexTerms: true,
          },
        },
      },
    });

    // Generate signed URLs for all documents
    const documentsWithSignedUrls = await Promise.all(
      documents.map(async (document) => {
        try {
          const signedUrl = await generateSignedUrl(document.fileKey, 3600); // 1 hour expiry
          return {
            ...document,
            signedUrl,
          };
        } catch (error) {
          console.error(
            `Failed to generate signed URL for document ${document.id}:`,
            error
          );
          // Return document without signed URL if generation fails
          return {
            ...document,
            signedUrl: null,
          };
        }
      })
    );

    res.json({
      success: true,
      data: documentsWithSignedUrls,
    } as ApiResponse);
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    } as ApiResponse);
  }
};

export const getDocumentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      } as ApiResponse);
      return;
    }

    if (!id) {
      res.status(400).json({
        success: false,
        error: { message: "Document ID is required" },
      } as ApiResponse);
      return;
    }

    // Find the document and ensure user owns it
    const document = await prisma.document.findFirst({
      where: {
        id,
        userId,
        deletedAt: null, // Only get non-deleted documents
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            highlights: true,
            threats: true,
            complexTerms: true,
          },
        },
      },
    });

    if (!document) {
      res.status(404).json({
        success: false,
        error: { message: "Document not found" },
      } as ApiResponse);
      return;
    }

    // Generate signed URL for secure file access (expires in 1 hour)
    const signedUrl = await generateSignedUrl(document.fileKey, 3600);

    // Return document data with signed URL
    const documentWithSignedUrl = {
      ...document,
      signedUrl,
    };

    res.json({
      success: true,
      data: documentWithSignedUrl,
    } as ApiResponse);
  } catch (error) {
    console.error("Get document by ID error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    } as ApiResponse);
  }
};

export const deleteDocument = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { message: "Unauthorized" },
      } as ApiResponse);
      return;
    }

    if (!id) {
      res.status(400).json({
        success: false,
        error: { message: "Document ID is required" },
      } as ApiResponse);
      return;
    }

    // Soft delete - set deletedAt timestamp
    const document = await prisma.document.update({
      where: {
        id,
        userId, // Ensure user owns the document
      },
      data: {
        deletedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Document deleted successfully",
      data: document,
    } as ApiResponse);
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    } as ApiResponse);
  }
};
