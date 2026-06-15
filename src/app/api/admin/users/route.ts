import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/verify";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { isEmailOnAllowedDomain } from "@/lib/auth/config";

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const snapshot = await getAdminDb()
    .collection("users")
    .orderBy("createdAt", "desc")
    .get();

  const users = snapshot.docs.map((doc) => ({
    uid: doc.id,
    ...doc.data(),
  }));

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { email, password, displayName, role } = await request.json();

  if (!email || !password || !displayName) {
    return NextResponse.json(
      { error: "Email, password, and display name are required" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!isEmailOnAllowedDomain(normalizedEmail)) {
    const domain = process.env.ALLOWED_EMAIL_DOMAIN || "your domain";
    return NextResponse.json(
      { error: `Only @${domain} email addresses can be created` },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const userRole = role === "admin" ? "admin" : "user";
  const auth = getAdminAuth();
  const db = getAdminDb();
  const now = new Date().toISOString();

  try {
    const userRecord = await auth.createUser({
      email: normalizedEmail,
      password,
      displayName: displayName.trim(),
      emailVerified: true,
    });

    await auth.setCustomUserClaims(userRecord.uid, {
      role: userRole,
      admin: userRole === "admin",
    });

    await db.collection("users").doc(userRecord.uid).set({
      email: normalizedEmail,
      displayName: displayName.trim(),
      role: userRole,
      active: true,
      createdAt: now,
      createdBy: admin.uid,
      updatedAt: now,
    });

    return NextResponse.json({
      uid: userRecord.uid,
      email: normalizedEmail,
      displayName: displayName.trim(),
      role: userRole,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
