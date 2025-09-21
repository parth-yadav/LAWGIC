import multer from "multer";
import { Request } from "express";

// Configure multer for memory storage (we'll upload directly to S3)
const storage = multer.memoryStorage();

// File filter to only allow PDF files
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"));
  }
};

// File filter for documents and thumbnails
const documentWithThumbnailFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.fieldname === "file" && file.mimetype === "application/pdf") {
    cb(null, true);
  } else if (
    file.fieldname === "thumbnail" &&
    file.mimetype.startsWith("image/")
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PDF files for document and image files for thumbnail are allowed"
      )
    );
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Configure multer for document with thumbnail upload
export const uploadWithThumbnail = multer({
  storage,
  fileFilter: documentWithThumbnailFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 2, // Max 2 files (document + thumbnail)
  },
});

// Middleware for single file upload
export const uploadSingle = upload.single("file");

// Middleware for document with optional thumbnail upload
export const uploadDocumentWithThumbnail = uploadWithThumbnail.fields([
  { name: "file", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);
