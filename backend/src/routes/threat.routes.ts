import express from "express";
import {
  analyzePdfContent,
  healthCheck,
} from "@/controllers/threat.controllers";
import validToken from "@/middlewares/validToken";

const threatRouter = express.Router();

// Main threat analysis endpoint - handles both getting existing and analyzing new
threatRouter.get("/", validToken, analyzePdfContent);
threatRouter.post("/", validToken, analyzePdfContent);

// Health check doesn't need authentication
threatRouter.get("/health", healthCheck);

export default threatRouter;
