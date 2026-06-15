import { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { isAdminEmail } from "@/lib/auth/config";

export async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded;
  } catch {
    return null;
  }
}

export async function verifyAdmin(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user?.email) return null;

  const isAdmin =
    user.admin === true ||
    user.role === "admin" ||
    isAdminEmail(user.email);

  return isAdmin ? user : null;
}
