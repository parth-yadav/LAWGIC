import {
  explainText,
  getExplanationsByDocument,
} from "../controllers/explain.controllers.js";
import validToken from "../middlewares/validToken.js";
import express from "express";

const explainRouter = express.Router();

// Apply authentication middleware to all routes
explainRouter.use(validToken);

explainRouter.post("/text", explainText);
explainRouter.get("/", getExplanationsByDocument);

export default explainRouter;
