import express from "express";
import {
  getExistingThreats,
  analyzeNewThreats,
  healthCheck,
} from "../controllers/threat.controllers.js";
import validToken from "../middlewares/validToken.js";

const threatRouter = express.Router();

// GET endpoint - retrieves existing threats for a document
threatRouter.get("/", validToken, getExistingThreats);

// POST endpoint - analyzes new content and creates threats
threatRouter.post("/", validToken, analyzeNewThreats);

// Health check doesn't need authentication
threatRouter.get("/health", healthCheck);

export default threatRouter;
