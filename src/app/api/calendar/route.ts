import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth/verify";
import { getAdminDb } from "@/lib/firebase/admin";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");

  let query = getAdminDb()
    .collection("calendar_events")
    .where("userId", "==", user.uid);

  if (start) query = query.where("start", ">=", start);
  if (end) query = query.where("start", "<=", end);

  const snapshot = await query.orderBy("start").get();
  const events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const now = new Date().toISOString();
  const id = uuidv4();

  const event = {
    userId: user.uid,
    title: body.title,
    description: body.description || "",
    start: body.start,
    end: body.end,
    allDay: body.allDay || false,
    location: body.location || "",
    attendees: body.attendees || [],
    color: body.color || "#1a73e8",
    reminderMinutes: body.reminderMinutes ?? 30,
    linkedEmailId: body.linkedEmailId || null,
    createdAt: now,
    updatedAt: now,
  };

  await getAdminDb().collection("calendar_events").doc(id).set(event);
  return NextResponse.json({ id, ...event });
}
