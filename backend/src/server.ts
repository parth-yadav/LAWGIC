import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 6900;
// const clientOrigin = process.env.CLIENT_URL || "http://localhost:3000";

app.use(cors());
// app.use(
//   cors({
//     origin: clientOrigin,
//     credentials: true,
//   })
// );
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
