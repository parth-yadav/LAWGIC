import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
// import validateEnv from "./utils/validateEnv.js";
import explainRouter from "./routes/explain.routes.js";
import documentRouter from "./routes/document.routes.js";
import threatRouter from "./routes/threat.routes.js";
import highlightRouter from "./routes/highlight.routes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 6900;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      return callback(null, origin);
    },
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

// validateEnv()
//   .then(() => {
//     const server = app.listen(PORT, () => {
//       console.log(`Server is running on port ${PORT}`);
//     });

//     process.on("SIGTERM", () => {
//       console.log("SIGTERM received, shutting down gracefully");
//       server.close(() => {
//         console.log("Process terminated");
//       });
//     });

//     process.on("SIGINT", () => {
//       console.log("SIGINT received, shutting down gracefully");
//       server.close(() => {
//         console.log("Process terminated");
//       });
//     });
//   })
//   .catch(() => {
//     console.error(
//       "Check your .env file and ensure all variables are set correctly"
//     );
//   });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
