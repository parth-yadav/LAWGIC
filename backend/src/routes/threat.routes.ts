import express from "express";
import { analyzePdfContent, healthCheck } from "@/controllers/threat.controllers";

const threatRouter = express.Router();

threatRouter.post("/", analyzePdfContent);

threatRouter.get("/health", healthCheck);

export default threatRouter;