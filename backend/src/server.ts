import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import explainRouter from "./routes/explain.routes.js";
import documentRouter from "./routes/document.routes.js";
import threatRouter from "./routes/threat.routes.js";
import highlightRouter from "./routes/highlight.routes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 6900;

app.use(
  cors({
    origin: process.env.CLIENT_BASE_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.get("/", (_req, res) => {
  res.send(`This is your API`);
});

app.use("/auth", authRouter);
app.use("/documents", documentRouter);
app.use("/explanations", explainRouter);
app.use("/threats", threatRouter);
app.use("/highlights", highlightRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
