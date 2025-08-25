import prisma from "@/prisma/client";
import {
  accessSecret,
  accessTokenExpiry,
  cookieOptions,
  refreshSecret,
  refreshTokenExpiry,
} from "@/utils/auth";
import { getExpiryDate } from "@/utils/getExpiryDate";
import jwt from "jsonwebtoken";
import { StringValue } from "ms";
import { getErrorMessage } from "@/utils/utils";
import { Request, Response } from "express";
import { sendResponse } from "@/utils/ResponseHelpers";
import { oauth2Client } from "@/utils/googleClient";
import axios from "axios";

export const generateAndSetTokens = async ({
  req,
  res,
  userId,
}: {
  req: Request;
  res: Response;
  userId: string;
}) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new Error("User not found");

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
    userAgent: req?.headers?.["user-agent"],
    host: req?.headers?.["host"],
    ip: req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress,
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
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions);

  return { accessToken, refreshToken };
};

export const getUser = async (req: Request, res: Response) => {
  try {
    return sendResponse({
      res,
      success: true,
      data: req.user,
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

    const { accessToken, refreshToken } = await generateAndSetTokens({
      userId: dbRefreshToken.user.id,
      req,
      res,
    });

    return sendResponse({
      res,
      success: true,
      data: { accessToken, refreshToken },
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

export const googleAuth = async (req: Request, res: Response) => {
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

    const googleRes = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(googleRes.tokens);
    const userRes = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
    );
    const { email, name, picture } = userRes.data as {
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

    const { accessToken, refreshToken } = await generateAndSetTokens({
      userId: user.id,
      req,
      res,
    });

    return sendResponse({
      res,
      success: true,
      data: { accessToken, refreshToken, user },
      message: "Authenticated with Google successfully",
    });
  } catch (error) {
    return sendResponse({
      res,
      success: false,
      error: {
        message: getErrorMessage(error, "Failed to authenticate with Google"),
      },
    });
  }
};
