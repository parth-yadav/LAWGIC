// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure dotenv to load from multiple possible paths
const envPaths = [
  join(__dirname, '../.env'),
  join(process.cwd(), '.env'),
  join(process.cwd(), 'backend/.env')
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`Environment loaded from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.error('Could not find .env file in any expected location');
}

// Debug: Check if environment variables are loaded
console.log('Environment loaded:');
console.log('PORT:', process.env.PORT ? 'Present' : 'Missing');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing');
console.log('SERVER_BASE_URL:', process.env.SERVER_BASE_URL);
console.log('GOOGLE_REDIRECT_PATH:', process.env.GOOGLE_REDIRECT_PATH);
console.log('ACCESS_TOKEN_SECRET:', process.env.ACCESS_TOKEN_SECRET ? 'Present' : 'Missing');
console.log('REFRESH_TOKEN_SECRET:', process.env.REFRESH_TOKEN_SECRET ? 'Present' : 'Missing');

// Now import other modules after environment is loaded
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import explainRouter from "./routes/explain.routes.js";
import documentRouter from "./routes/document.routes.js";
import threatRouter from "./routes/threat.routes.js";
import highlightRouter from "./routes/highlight.routes.js";

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
