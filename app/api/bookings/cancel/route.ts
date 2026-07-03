import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const { type, id } = await request.json();

    if (!type || !id) {
      return NextResponse.json({ error: "Booking type and ID are required" }, { status: 400 });
    }

    const bookingId = parseInt(id, 10);

    if (type === "room") {
      // Find reservation
      const res = await db.reservations.findUnique({
        where: { id: bookingId },
      });

      if (!res || res.user_id !== decoded.id) {
        return NextResponse.json({ error: "Reservation not found or unauthorized" }, { status: 404 });
      }

      // Update status
      const updated = await db.reservations.update({
        where: { id: bookingId },
        data: { status: "cancelled" },
      });

      // Log notification
      const dbNotif = await db.notifications.create({
        data: {
          user_id: decoded.id,
          title: "Reservation Cancelled",
          message: `Your hotel room reservation (ID: ${bookingId}) has been successfully cancelled.`,
          type: "cancellation",
        },
      });

      // Notify via WebSocket server
      try {
        await fetch("http://localhost:3002/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: dbNotif?.id,
            userId: decoded.id,
            title: "Reservation Cancelled",
            message: `Your hotel room reservation (ID: ${bookingId}) has been successfully cancelled.`,
            type: "cancellation",
          }),
        });
      } catch (e) {
        console.error("Failed to push WS notification:", e);
      }

      return NextResponse.json({ success: true, updated });
    } else if (type === "activity") {
      // Find activity booking
      const booking = await db.activity_bookings.findUnique({
        where: { id: bookingId },
      });

      if (!booking || booking.user_id !== decoded.id) {
        return NextResponse.json({ error: "Activity booking not found or unauthorized" }, { status: 404 });
      }

      // Update status
      const updated = await db.activity_bookings.update({
        where: { id: bookingId },
        data: { status: "cancelled" },
      });

      // Log notification
      const dbNotif = await db.notifications.create({
        data: {
          user_id: decoded.id,
          title: "Activity Booking Cancelled",
          message: `Your resort activity booking (ID: ${bookingId}) has been successfully cancelled.`,
          type: "cancellation",
        },
      });

      // Notify via WebSocket server
      try {
        await fetch("http://localhost:3002/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: dbNotif?.id,
            userId: decoded.id,
            title: "Activity Booking Cancelled",
            message: `Your resort activity booking (ID: ${bookingId}) has been successfully cancelled.`,
            type: "cancellation",
          }),
        });
      } catch (e) {
        console.error("Failed to push WS notification:", e);
      }

      return NextResponse.json({ success: true, updated });
    }

    return NextResponse.json({ error: "Invalid booking type specified" }, { status: 400 });
  } catch (error: any) {
    console.error("Cancel booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
