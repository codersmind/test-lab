import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/verify";
import { getAdminDb } from "@/lib/firebase/admin";
import { isAdminEmail, isEmailOnAllowedDomain } from "@/lib/auth/config";

export async function GET(request: NextRequest) {
  const decoded = await verifyAuth(request);
  if (!decoded?.uid || !decoded.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isEmailOnAllowedDomain(decoded.email)) {
    return NextResponse.json(
      { error: "Email domain is not allowed", provisioned: false },
      { status: 403 }
    );
  }

  const userDoc = await getAdminDb().collection("users").doc(decoded.uid).get();

  if (!userDoc.exists || userDoc.data()?.active === false) {
    return NextResponse.json(
      { error: "Account not provisioned by admin", provisioned: false },
      { status: 403 }
    );
  }

  const data = userDoc.data()!;

  return NextResponse.json({
    uid: decoded.uid,
    email: decoded.email,
    displayName: data.displayName || decoded.name || "",
    role: data.role || "user",
    isAdmin:
      data.role === "admin" ||
      decoded.admin === true ||
      isAdminEmail(decoded.email),
    provisioned: true,
  });
}
