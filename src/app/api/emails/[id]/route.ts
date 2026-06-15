import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/verify";
import { getAdminDb } from "@/lib/firebase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = await getAdminDb().collection("emails").doc(id).get();

  if (!doc.exists || doc.data()?.userId !== user.uid) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ email: { id: doc.id, ...doc.data() } });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const updates = await request.json();
  const db = getAdminDb();
  const docRef = db.collection("emails").doc(id);
  const doc = await docRef.get();

  if (!doc.exists || doc.data()?.userId !== user.uid) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await docRef.update({ ...updates, updatedAt: new Date().toISOString() });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getAdminDb();
  const docRef = db.collection("emails").doc(id);
  const doc = await docRef.get();

  if (!doc.exists || doc.data()?.userId !== user.uid) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const folder = doc.data()?.folder;
  if (folder === "trash") {
    await docRef.delete();
  } else {
    await docRef.update({ folder: "trash", updatedAt: new Date().toISOString() });
  }

  return NextResponse.json({ success: true });
}
