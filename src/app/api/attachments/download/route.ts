export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/verify";
import { getAttachmentFromS3 } from "@/lib/aws/s3";
import { getAdminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const emailId = request.nextUrl.searchParams.get("emailId");
  const attachmentId = request.nextUrl.searchParams.get("attachmentId");

  if (!emailId || !attachmentId) {
    return NextResponse.json({ error: "emailId and attachmentId required" }, { status: 400 });
  }

  const emailDoc = await getAdminDb().collection("emails").doc(emailId).get();
  if (!emailDoc.exists || emailDoc.data()?.userId !== user.uid) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const attachments = emailDoc.data()?.attachments || [];
  const attachment = attachments.find((a: { id: string }) => a.id === attachmentId);

  if (!attachment?.s3Key) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  try {
    const data = await getAttachmentFromS3(attachment.s3Key);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": attachment.contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${attachment.filename}"`,
        "Content-Length": String(data.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to download" }, { status: 500 });
  }
}
