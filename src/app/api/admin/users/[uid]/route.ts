import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/verify";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { uid } = await params;
  const { password, displayName, active } = await request.json();
  const auth = getAdminAuth();
  const db = getAdminDb();
  const now = new Date().toISOString();

  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updatedAt: now };
  const authUpdates: Record<string, unknown> = {};

  if (displayName !== undefined) {
    updates.displayName = displayName;
    authUpdates.displayName = displayName;
  }

  if (typeof active === "boolean") {
    updates.active = active;
    authUpdates.disabled = !active;
  }

  if (password) {
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    authUpdates.password = password;
  }

  if (Object.keys(authUpdates).length) {
    await auth.updateUser(uid, authUpdates);
  }

  await db.collection("users").doc(uid).update(updates);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { uid } = await params;

  if (uid === admin.uid) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  const auth = getAdminAuth();
  const db = getAdminDb();

  try {
    await auth.deleteUser(uid);
    await db.collection("users").doc(uid).delete();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 400 });
  }
}
