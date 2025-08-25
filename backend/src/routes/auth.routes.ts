import {
  getNewAccessToken,
  getUser,
  googleAuthCallback,
  googleAuthUrl,
  logoutUser,
  refreshUserToken,
  updateUser,
} from "@/controllers/auth.controllers";
import validToken from "@/middlewares/validToken";
import express from "express";

const authRouter = express.Router();

authRouter.get("/user", validToken, getUser);
authRouter.post("/user", validToken, updateUser);
authRouter.post("/refresh", refreshUserToken);
authRouter.get("/refresh", getNewAccessToken);
authRouter.get("/google/url", googleAuthUrl);
authRouter.get("/google/callback", googleAuthCallback);
authRouter.post("/logout", logoutUser);

export default authRouter;
