import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB per file
export const MAX_ATTACHMENTS = 5;

function getAttachmentsBucket(): string {
  const bucket =
    process.env.AWS_SES_ATTACHMENTS_BUCKET || process.env.AWS_SES_INBOUND_BUCKET;
  if (!bucket) {
    throw new Error("AWS_SES_ATTACHMENTS_BUCKET or AWS_SES_INBOUND_BUCKET is not configured");
  }
  return bucket;
}

function getAttachmentsPrefix(): string {
  const prefix = process.env.AWS_SES_ATTACHMENTS_PREFIX || "attachments/";
  return prefix.endsWith("/") ? prefix : `${prefix}/`;
}

export function buildAttachmentS3Key(userId: string, filename: string): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${getAttachmentsPrefix()}${userId}/${uuidv4()}-${safeName}`;
}

export async function uploadAttachmentToS3(
  userId: string,
  filename: string,
  contentType: string,
  data: Buffer
): Promise<string> {
  const key = buildAttachmentS3Key(userId, filename);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: getAttachmentsBucket(),
      Key: key,
      Body: data,
      ContentType: contentType,
    })
  );
  return key;
}

export async function getAttachmentFromS3(key: string): Promise<Buffer> {
  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: getAttachmentsBucket(), Key: key })
  );
  if (!response.Body) throw new Error(`Empty attachment: ${key}`);
  const bytes = await response.Body.transformToByteArray();
  return Buffer.from(bytes);
}

export async function getInboundEmailFromS3(objectKey: string): Promise<Buffer> {
  const bucket = process.env.AWS_SES_INBOUND_BUCKET;
  if (!bucket) throw new Error("AWS_SES_INBOUND_BUCKET is not configured");

  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: bucket, Key: objectKey })
  );
  if (!response.Body) throw new Error(`Empty S3 object: ${objectKey}`);
  const bytes = await response.Body.transformToByteArray();
  return Buffer.from(bytes);
}

export function buildInboundS3Key(messageId: string): string {
  const prefix = process.env.AWS_SES_INBOUND_PREFIX || "inbound/";
  const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
  return `${normalizedPrefix}${messageId}`;
}
