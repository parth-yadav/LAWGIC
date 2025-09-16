import { explainText } from "@/controllers/explain.controllers";
import express from "express";

const explainRouter = express.Router();

explainRouter.post("/text", explainText);

export default explainRouter;
