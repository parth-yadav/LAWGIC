import { Router } from "express";
import {
  createDocument,
  getUserDocuments,
  deleteDocument,
  getDocumentById,
} from "../controllers/document.controllers.js";
import validToken from "../middlewares/validToken.js";
import { uploadSingle } from "../middlewares/upload.js";

const router = Router();

router.use(validToken);

router.post(
  "/",
  (req, res, next) => {
    uploadSingle(req, res, (err) => {
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
router.delete("/:id", deleteDocument);

export default router;
