import prisma from "@/prisma/client";
import { accessSecret } from "@/utils/auth";
import { getErrorMessage } from "@/utils/utils";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export default async function validToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!accessToken) {
      throw "Unauthorized request";
    }

    const { id: userId } = jwt.verify(
      accessToken,
      accessSecret
    ) as AccessTokenPayload;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw "Invalid Access Token";
    }

    req.user = user;

    next();
  } catch (err) {
    return res
      .status(401)
      .json({ error: getErrorMessage(err, "Unauthorized Access") });
  }
}
