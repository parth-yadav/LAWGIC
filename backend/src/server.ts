import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import { clientBaseUrl } from "./utils/auth";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 6900;

app.use(
  cors({
    origin: clientBaseUrl,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.get("/", (_req, res) => {
  res.send(`This is your API`);
});

app.use("/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
