export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  processInboundNotification,
  type SesInboundNotification,
} from "@/lib/email/inbound";

interface SnsMessage {
  Type: string;
  MessageId: string;
  TopicArn?: string;
  Subject?: string;
  Message: string;
  SubscribeURL?: string;
  Timestamp?: string;
  SignatureVersion?: string;
  Signature?: string;
  SigningCertURL?: string;
}

function parseSnsBody(raw: string): SnsMessage {
  return JSON.parse(raw) as SnsMessage;
}

function isAllowedTopic(topicArn: string | undefined): boolean {
  const allowed = process.env.AWS_SNS_INBOUND_TOPIC_ARN;
  if (!allowed) return true;
  return topicArn === allowed;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    if (!rawBody) {
      return NextResponse.json({ error: "Empty body" }, { status: 400 });
    }

    const snsMessage = parseSnsBody(rawBody);

    if (!isAllowedTopic(snsMessage.TopicArn)) {
      return NextResponse.json({ error: "Unauthorized topic" }, { status: 403 });
    }

    if (snsMessage.Type === "SubscriptionConfirmation") {
      if (snsMessage.SubscribeURL) {
        await fetch(snsMessage.SubscribeURL);
      }
      return NextResponse.json({ ok: true, confirmed: true });
    }

    if (snsMessage.Type === "UnsubscribeConfirmation") {
      return NextResponse.json({ ok: true });
    }

    if (snsMessage.Type !== "Notification") {
      return NextResponse.json({ ok: true, ignored: snsMessage.Type });
    }

    const sesNotification = JSON.parse(snsMessage.Message) as SesInboundNotification;

    const result = await processInboundNotification(sesNotification);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Inbound email error:", error);
    const message = error instanceof Error ? error.message : "Processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "SES inbound webhook",
    hint: "Configure SNS to POST here after SES receipt rule stores mail in S3",
  });
}
