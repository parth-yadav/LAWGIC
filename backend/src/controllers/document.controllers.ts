import { Request, Response } from "express";
import { z } from "zod";
import path from "path";
import { prisma } from "../prisma/client.js";
import { ApiResponse } from "../types/api.js";
import {
  uploadToS3,
  generateSignedUrl,
  getFileFromS3,
} from "../utils/s3Upload.js";

// Validation schema for document creation (form data)
const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
});

export const createDocument = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const multerReq = req as Request & {
      file?: Express.Multer.File;
      files?: { [fieldname: string]: Express.Multer.File[] };
    };

    // Check if file was uploaded (handle both single file and fields upload)
    const uploadedFile =
      multerReq.file ||
      (multerReq.files?.["file"] && multerReq.files["file"][0]);

    if (!uploadedFile) {
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
      uploadedFile.buffer,
      uploadedFile.originalname,
      uploadedFile.mimetype,
      "documents"
    );

    // Get page count from request body (sent from frontend)
    const pageCount = parseInt(req.body.pageCount) || 1;

    // Handle thumbnail upload if provided
    let thumbnailUrl: string | undefined;
    if (
      multerReq.files &&
      multerReq.files["thumbnail"] &&
      multerReq.files["thumbnail"][0]
    ) {
      const thumbnailFile = multerReq.files["thumbnail"][0];
      const thumbnailUploadResult = await uploadToS3(
        thumbnailFile.buffer,
        `${Date.now()}-thumbnail.png`,
        "image/png",
        "thumbnails"
      );
      thumbnailUrl = thumbnailUploadResult.fileUrl;
    }

    // Create document in database
    const document = await prisma.document.create({
      data: {
        userId,
        title: validatedData.title,
        fileName: uploadedFile.originalname,
        filePath: uploadResult.fileUrl,
        fileKey: uploadResult.fileKey,
        pageCount,
        ...(thumbnailUrl && { thumbnail: thumbnailUrl }),
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
            explanations: true,
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
            explanations: true,
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

export const renameDocumentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const { newName } = req.body;

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

    if (!newName) {
      res.status(400).json({
        success: false,
        error: { message: "New document name is required" },
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
    });

    if (!document) {
      res.status(404).json({
        success: false,
        error: { message: "Document not found" },
      } as ApiResponse);
      return;
    }

    // Update the document name
    const updatedDocument = await prisma.document.update({
      where: {
        id,
      },
      data: {
        title: newName,
      },
    });

    res.json({
      success: true,
      data: updatedDocument,
    } as ApiResponse);
  } catch (error) {
    console.error("Rename document error:", error);
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

export const getDocumentThumbnail = async (
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
      },
      select: {
        id: true,
        thumbnail: true,
        title: true,
      },
    });

    if (!document) {
      res.status(404).json({
        success: false,
        error: { message: "Document not found" },
      } as ApiResponse);
      return;
    }

    if (document.thumbnail) {
      // Extract the S3 key from the thumbnail URL
      const url = new URL(document.thumbnail);
      const thumbnailKey = url.pathname.substring(1); // Remove leading slash

      // Get file stream from S3
      const { stream, contentType, contentLength } = await getFileFromS3(
        thumbnailKey
      );

      // Set appropriate headers
      res.setHeader("Content-Type", contentType || "image/png");
      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }
      res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

      // Pipe the stream to response
      (stream as NodeJS.ReadableStream).pipe(res);
    } else {
      // Serve placeholder image
      const placeholderPath = path.join(
        process.cwd(),
        "src",
        "public",
        "pdf-thumbnail-placeholder.png"
      );
      res.sendFile(placeholderPath, (err) => {
        if (err) {
          console.error("Error serving placeholder image:", err);
          res.status(404).json({
            success: false,
            error: { message: "Thumbnail not available" },
          } as ApiResponse);
        }
      });
    }
  } catch (error) {
    console.error("Get document thumbnail error:", error);
    res.status(500).json({
      success: false,
      error: { message: "Internal server error" },
    } as ApiResponse);
  }
};
