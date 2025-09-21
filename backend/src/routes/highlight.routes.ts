import express from "express";
import {
  saveHighlight,
  getHighlightsByDocument,
  updateHighlight,
  deleteHighlight,
} from "../controllers/highlight.controllers.js";
import validToken from "../middlewares/validToken.js";

const highlightRouter = express.Router();

// Apply authentication middleware to all routes
highlightRouter.use(validToken);

// GET /highlights?documentId=xxx - Get all highlights for a document
highlightRouter.get("/", getHighlightsByDocument);

// POST /highlights - Save a new highlight
highlightRouter.post("/", saveHighlight);

// PUT /highlights/:highlightId - Update a highlight
highlightRouter.put("/:highlightId", updateHighlight);

// DELETE /highlights/:highlightId - Delete a highlight
highlightRouter.delete("/:highlightId", deleteHighlight);

export default highlightRouter;
