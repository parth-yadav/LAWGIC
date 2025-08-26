import prisma from "@/prisma/client";
import {
  accessSecret,
  accessTokenCookieOptions,
  accessTokenExpiry,
  clientBaseUrl,
  getExpiryDate,
  refreshSecret,
  refreshTokenCookieOptions,
  refreshTokenExpiry,
} from "@/utils/auth";
import jwt from "jsonwebtoken";
import ms, { StringValue } from "ms";
import { getErrorMessage } from "@/utils/utils";
import { Request, Response } from "express";
import { sendResponse } from "@/utils/ResponseHelpers";
import axios from "axios";
import { oAuth2Client } from "@/utils/googleClient";

export const getUser = async (req: Request, res: Response) => {
  try {
    return sendResponse({
      res,
      success: true,
      data: { user: req.user },
    });
  } catch (error) {
    return sendResponse({
      res,
      success: false,
      error: {
        message: getErrorMessage(error, "Failed to get user information"),
      },
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const updatedData = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updatedData,
    });

    return sendResponse({
      res,
      success: true,
      data: { user },
    });
  } catch (error) {
    return sendResponse({
      res,
      success: false,
      error: {
        message: getErrorMessage(error, "Failed to update user information"),
      },
    });
  }
};

export const refreshUserToken = async (req: Request, res: Response) => {
  const clientRefreshToken =
    req.cookies?.refreshToken || req.headers["refreshToken"];

  if (!clientRefreshToken) {
    return sendResponse({
      res,
      statusCode: 401,
      success: false,
      error: {
        message: "Unauthorized request",
      },
    });
  }

  try {
    const { id: userId } = jwt.verify(
      clientRefreshToken,
      refreshSecret
    ) as RefreshTokenPayload;

    const dbRefreshToken = await prisma.refreshToken.findUnique({
      where: { userId: userId, token: clientRefreshToken },
      include: { user: true },
    });

    if (!dbRefreshToken?.user) {
      throw new Error("Invalid refresh token");
    }

    const accessToken = jwt.sign(
      {
        id: dbRefreshToken.user.id,
        email: dbRefreshToken.user.email,
      } as AccessTokenPayload,
      accessSecret,
      { expiresIn: accessTokenExpiry as StringValue }
    );

    res.cookie("accessToken", accessToken, accessTokenCookieOptions);

    return sendResponse({
      res,
      success: true,
      data: { accessToken, refreshToken: clientRefreshToken },
      message: "Token refreshed successfully",
    });
  } catch (error) {
    return sendResponse({
      res,
      success: false,
      error: {
        message: getErrorMessage(
          error,
          getErrorMessage(error, "Failed to refresh token")
        ),
        details: error,
      },
      statusCode: 403,
    });
  }
};

export const getNewAccessToken = async (req: Request, res: Response) => {
  const clientRefreshToken =
    req.cookies?.refreshToken || req.headers["refresh-token"];

  if (!clientRefreshToken) {
    return sendResponse({
      res,
      statusCode: 401,
      success: false,
      error: {
        message: "Unauthorized request",
      },
    });
  }

  try {
    const { id: userId } = jwt.verify(
      clientRefreshToken,
      refreshSecret
    ) as RefreshTokenPayload;

    const dbRefreshToken = await prisma.refreshToken.findUnique({
      where: { userId: userId, token: clientRefreshToken },
      include: { user: true },
    });

    if (!dbRefreshToken?.user) {
      throw new Error("Invalid refresh token");
    }

    const accessToken = jwt.sign(
      {
        id: dbRefreshToken.user.id,
        email: dbRefreshToken.user.email,
      } as AccessTokenPayload,
      accessSecret,
      { expiresIn: accessTokenExpiry as StringValue }
    );

    return sendResponse({
      res,
      success: true,
      data: { accessToken, maxAge: ms(accessTokenExpiry) },
      message: "Token refreshed successfully",
    });
  } catch (error) {
    return sendResponse({
      res,
      success: false,
      error: {
        message: getErrorMessage(
          error,
          getErrorMessage(error, "Failed to refresh token")
        ),
        details: error,
      },
      statusCode: 403,
    });
  }
};

export const googleAuthUrl = (_req: Request, res: Response) => {
  try {
    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      prompt: "consent",
    });
    return sendResponse({
      res,
      success: true,
      data: { url: authorizeUrl },
    });
  } catch (error) {
    return sendResponse({
      res,
      success: false,
      error: {
        message: getErrorMessage(error, "Failed to get Google Auth URL"),
      },
    });
  }
};

export const googleAuthCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code;
    if (!code || typeof code !== "string") {
      return sendResponse({
        res,
        success: false,
        error: {
          message: "Authorization code is required",
        },
        statusCode: 400,
      });
    }

    const { tokens } = await oAuth2Client.getToken(code);

    oAuth2Client.setCredentials(tokens);

    const { id_token, access_token } = tokens;

    const { data: GoogleUserInfo } = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      }
    );
    const { email, name, picture } = GoogleUserInfo as {
      email: string;
      name: string;
      picture: string;
    };

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          avatar: picture,
        },
      });
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email } as AccessTokenPayload,
      accessSecret,
      { expiresIn: accessTokenExpiry as StringValue }
    );

    const refreshToken = jwt.sign(
      { id: user.id } as RefreshTokenPayload,
      refreshSecret,
      {
        expiresIn: refreshTokenExpiry as StringValue,
      }
    );

    const clientInfo = {
      userAgent: req?.headers?.["user-agent"] ?? "N/A",
      host: req?.headers?.["host"] ?? "N/A",
      ip:
        (req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress) ??
        "N/A",
    };

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getExpiryDate(refreshTokenExpiry),
        clientInfo,
      },
    });

    res
      .cookie("accessToken", accessToken, accessTokenCookieOptions)
      .cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    return res.redirect(clientBaseUrl);
  } catch (error) {
    console.error("Google Auth Callback Error:", error);
    return res.redirect(
      encodeURI(
        `${clientBaseUrl}/login?error=Failed to authenticate with Google`
      )
    );
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  try {
    const clientRefreshToken =
      req.cookies?.refreshToken || req.headers["refresh-token"];

    await prisma.refreshToken.delete({
      where: {
        token: clientRefreshToken,
      },
    });

    res
      .clearCookie("accessToken", accessTokenCookieOptions)
      .clearCookie("refreshToken", refreshTokenCookieOptions);

    return sendResponse({
      res,
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    return sendResponse({
      res,
      success: false,
      error: {
        message: getErrorMessage(error, "Failed to logout"),
      },
    });
  }
};
