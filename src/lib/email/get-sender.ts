import { getAdminDb } from "@/lib/firebase/admin";
import { resolveSenderIdentity } from "@/lib/email/sender";

interface AuthUser {
  uid: string;
  email?: string;
  name?: string;
}

/**
 * Loads sender identity for the authenticated user from token + Firestore profile.
 * Ensures outbound mail is sent as john@mydomain.com (the logged-in user).
 */
export async function getSenderForUser(user: AuthUser) {
  const db = getAdminDb();
  const userDoc = await db.collection("users").doc(user.uid).get();
  const profile = userDoc.data();

  return resolveSenderIdentity(
    user.email,
    profile?.displayName || user.name
  );
}

/**
 * Resolves sender from stored email document (scheduled sends).
 */
export function getSenderFromEmailRecord(email: {
  from: string;
  fromName?: string;
}) {
  return resolveSenderIdentity(email.from, email.fromName);
}
