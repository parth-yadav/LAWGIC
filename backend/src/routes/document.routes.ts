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

router.use(validToken);

router.post(
  "/",
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

router.get("/", getUserDocuments);
router.get("/:id", getDocumentById);
router.get("/:id/thumbnail", getDocumentThumbnail);
router.post("/:id/rename", renameDocumentById);
router.delete("/:id", deleteDocument);

export default router;
