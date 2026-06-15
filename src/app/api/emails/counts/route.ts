import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/verify";
import { getAdminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getAdminDb();
  const folders = ["inbox", "drafts", "scheduled", "sent"];

  const counts: Record<string, number> = {};

  await Promise.all(
    folders.map(async (folder) => {
      const snapshot = await db
        .collection("emails")
        .where("userId", "==", user.uid)
        .where("folder", "==", folder)
        .where("read", "==", false)
        .count()
        .get();
      counts[folder] = snapshot.data().count;
    })
  );

  return NextResponse.json({ counts });
}
