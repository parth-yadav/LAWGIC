import {
  getUser,
  googleAuth,
  refreshUserToken,
} from "@/controllers/auth.controllers";
import validToken from "@/middlewares/validToken";
import express from "express";

const authRouter = express.Router();

authRouter.get("/user", validToken, getUser);
authRouter.post("/refresh", refreshUserToken);
authRouter.get("/google", googleAuth);

export default authRouter;
