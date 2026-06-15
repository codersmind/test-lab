import type { EmailAttachment } from "@/types";
import { getAttachmentFromS3 } from "@/lib/aws/s3";

export interface MimeAttachmentPart {
  filename: string;
  contentType: string;
  content: Buffer;
}

export async function loadAttachmentsForMime(
  attachments: EmailAttachment[]
): Promise<MimeAttachmentPart[]> {
  const parts: MimeAttachmentPart[] = [];

  for (const att of attachments) {
    const content = await getAttachmentFromS3(att.s3Key);
    parts.push({
      filename: att.filename,
      contentType: att.contentType,
      content,
    });
  }

  return parts;
}
