import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/verify";
import { getAdminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await getAdminDb().collection("user_settings").doc(user.uid).get();
  const data = doc.data();

  return NextResponse.json({
    signature: data?.signature || "",
    replyBehavior: data?.replyBehavior || "reply",
  });
}

export async function PATCH(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const updates = await request.json();
  const db = getAdminDb();

  await db.collection("user_settings").doc(user.uid).set(
    {
      ...updates,
      userId: user.uid,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return NextResponse.json({ success: true });
}
