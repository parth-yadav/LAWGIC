import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface UploadResult {
  fileUrl: string;
  fileKey: string;
}

export const uploadToS3 = async (
  file: Buffer,
  fileName: string,
  mimeType: string,
  folder: string = "documents"
): Promise<UploadResult> => {
  try {
    const fileExtension = fileName.slice(fileName.lastIndexOf(".") + 1);
    const uniqueId = uuidv4();
    const fileKey = `${folder}/${uniqueId}.${fileExtension}`;

    const bucket = process.env.S3_BUCKET!;
    const region = process.env.AWS_REGION!;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: fileKey,
        Body: file,
        ContentType: mimeType,
      })
    );

    const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`;

    return {
      fileUrl,
      fileKey,
    };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error("Failed to upload file to S3");
  }
};

export const generateSignedUrl = async (
  fileKey: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> => {
  try {
    const bucket = process.env.S3_BUCKET!;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    });

    return signedUrl;
  } catch (error) {
    console.error("Generate signed URL error:", error);
    throw new Error("Failed to generate signed URL");
  }
};

export const getFileFromS3 = async (
  fileKey: string
): Promise<{
  stream: NodeJS.ReadableStream;
  contentType?: string;
  contentLength?: number;
}> => {
  try {
    const bucket = process.env.S3_BUCKET!;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error("No file body returned from S3");
    }

    return {
      stream: response.Body as NodeJS.ReadableStream,
      ...(response.ContentType && { contentType: response.ContentType }),
      ...(response.ContentLength && { contentLength: response.ContentLength }),
    };
  } catch (error) {
    console.error("Get file from S3 error:", error);
    throw new Error("Failed to get file from S3");
  }
};

export { s3Client };
