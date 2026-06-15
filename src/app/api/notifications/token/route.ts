import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/verify";
import { getAdminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fcmToken } = await request.json();
  if (!fcmToken) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  await getAdminDb().collection("users").doc(user.uid).set(
    {
      uid: user.uid,
      email: user.email,
      displayName: user.name || "",
      fcmToken,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return NextResponse.json({ success: true });
}
