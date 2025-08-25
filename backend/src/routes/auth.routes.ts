import {
  getNewAccessToken,
  getUser,
  googleAuthCallback,
  googleAuthUrl,
  logoutUser,
  refreshUserToken,
} from "@/controllers/auth.controllers";
import validToken from "@/middlewares/validToken";
import express from "express";

const authRouter = express.Router();

authRouter.get("/user", validToken, getUser);
authRouter.post("/refresh", refreshUserToken);
authRouter.get("/refresh", getNewAccessToken);
authRouter.get("/google/url", googleAuthUrl);
authRouter.get("/google/callback", googleAuthCallback);
authRouter.post("/logout", logoutUser);

export default authRouter;
