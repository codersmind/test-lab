export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/verify";
import {
  uploadAttachmentToS3,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
} from "@/lib/aws/s3";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_ATTACHMENT_BYTES) {
    return NextResponse.json(
      { error: `File too large. Max ${MAX_ATTACHMENT_BYTES / 1024 / 1024} MB per file` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = file.name || "attachment";
  const contentType = file.type || "application/octet-stream";

  try {
    const s3Key = await uploadAttachmentToS3(user.uid, filename, contentType, buffer);
    return NextResponse.json({
      id: uuidv4(),
      filename,
      contentType,
      size: file.size,
      s3Key,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    maxFileBytes: MAX_ATTACHMENT_BYTES,
    maxFiles: MAX_ATTACHMENTS,
  });
}
