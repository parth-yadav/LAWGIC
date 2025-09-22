import { getSignedFileUrl } from "@/utils/S3helper";
import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { promises as fs } from "fs";

export const GET = async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");

    if (!url) {
      throw new Error("Missing file parameter");
    }

    const signedUrl = await getSignedFileUrl(url);

    const response = await fetch(signedUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch image");
    }
    const imageBuffer = await response.arrayBuffer();
    const contentType =
      response.headers.get("content-type") || "application/octet-stream";
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
    });
  } catch (error) {
    const fallbackImagePath = join(
      process.cwd(),
      "public",
      "/images/blankProfilePicture.jpg",
    );

    const imageData = await fs.readFile(fallbackImagePath);
    return new NextResponse(new Uint8Array(imageData), {
      status: 200,
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store" },
    });
  }
};
