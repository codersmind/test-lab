import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { isEmailOnAllowedDomain } from "@/lib/auth/config";

/**
 * One-time bootstrap for the first admin account.
 * Set ADMIN_BOOTSTRAP_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_DISPLAY_NAME in env.
 * POST with header: x-bootstrap-secret: <ADMIN_BOOTSTRAP_SECRET>
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-bootstrap-secret");
  if (!secret || secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const displayName = process.env.ADMIN_DISPLAY_NAME || "Admin";

  if (!email || !password) {
    return NextResponse.json(
      { error: "ADMIN_EMAIL and ADMIN_PASSWORD must be set in env" },
      { status: 400 }
    );
  }

  if (!isEmailOnAllowedDomain(email)) {
    return NextResponse.json(
      { error: "Admin email must match ALLOWED_EMAIL_DOMAIN" },
      { status: 400 }
    );
  }

  const db = getAdminDb();
  const existingAdmins = await db
    .collection("users")
    .where("role", "==", "admin")
    .limit(1)
    .get();

  if (!existingAdmins.empty) {
    return NextResponse.json(
      { error: "Admin already exists. Use /admin to create more users." },
      { status: 400 }
    );
  }

  const auth = getAdminAuth();
  const now = new Date().toISOString();

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    });

    await auth.setCustomUserClaims(userRecord.uid, { role: "admin", admin: true });

    await db.collection("users").doc(userRecord.uid).set({
      email,
      displayName,
      role: "admin",
      active: true,
      createdAt: now,
      createdBy: "bootstrap",
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      email,
      message: "Admin created. Sign in and remove ADMIN_BOOTSTRAP_SECRET from env.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bootstrap failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
