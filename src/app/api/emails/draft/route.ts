import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/verify";
import { getAdminDb } from "@/lib/firebase/admin";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const now = new Date().toISOString();
  const id = uuidv4();

  const draft = {
    userId: user.uid,
    from: user.email || "",
    to: body.to || [],
    cc: body.cc || [],
    bcc: body.bcc || [],
    subject: body.subject || "",
    body: body.body || "",
    folder: "drafts",
    read: true,
    starred: false,
    labels: [],
    createdAt: now,
    updatedAt: now,
  };

  await getAdminDb().collection("emails").doc(id).set(draft);
  return NextResponse.json({ id, ...draft });
}
