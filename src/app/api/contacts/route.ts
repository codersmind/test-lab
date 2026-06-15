import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/verify";
import { getAdminDb } from "@/lib/firebase/admin";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snapshot = await getAdminDb()
    .collection("contacts")
    .where("userId", "==", user.uid)
    .orderBy("name")
    .get();

  const contacts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ contacts });
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const now = new Date().toISOString();
  const id = uuidv4();

  const contact = {
    userId: user.uid,
    name: body.name,
    email: body.email,
    phone: body.phone || "",
    company: body.company || "",
    notes: body.notes || "",
    createdAt: now,
    updatedAt: now,
  };

  await getAdminDb().collection("contacts").doc(id).set(contact);
  return NextResponse.json({ id, ...contact });
}
