import { Router } from "express";
import {
  createDocument,
  getUserDocuments,
  deleteDocument,
  getDocumentById,
  renameDocumentById,
  getDocumentThumbnail,
} from "../controllers/document.controllers.js";
import validToken from "../middlewares/validToken.js";
import { uploadDocumentWithThumbnail } from "../middlewares/upload.js";

const router = Router();

// Apply validToken middleware to all routes except /:id/thumbnail
router.post(
  "/",
  validToken,
  (req, res, next) => {
    uploadDocumentWithThumbnail(req, res, (err: any) => {
      if (err) {
        res.status(400).json({
          success: false,
          error: { message: err.message },
        });
        return;
      }
      next();
    });
  },
  createDocument
);

router.get("/", validToken, getUserDocuments);
router.get("/:id", validToken, getDocumentById);
router.get("/:id/thumbnail", getDocumentThumbnail); // No validToken here
router.post("/:id/rename", validToken, renameDocumentById);
router.delete("/:id", validToken, deleteDocument);

export default router;
