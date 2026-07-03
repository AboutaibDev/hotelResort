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

    const { room_id, activity_id, rating, comment } = await request.json();

    if (!rating || !comment) {
      return NextResponse.json({ error: "Rating and comment are required" }, { status: 400 });
    }

    if (room_id) {
      const parsedRoomId = parseInt(room_id, 10);
      const hasBooking = await db.reservations.findFirst({
        where: {
          user_id: decoded.id,
          room_id: parsedRoomId,
          status: "confirmed",
        },
      });
      if (!hasBooking) {
        return NextResponse.json({ error: "You must complete a booking for this room before leaving a review." }, { status: 403 });
      }
    } else if (activity_id) {
      const parsedActivityId = parseInt(activity_id, 10);
      const hasBooking = await db.activity_bookings.findFirst({
        where: {
          user_id: decoded.id,
          activity_id: parsedActivityId,
          status: "confirmed",
        },
      });
      if (!hasBooking) {
        return NextResponse.json({ error: "You must complete a booking for this activity before leaving a review." }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Room ID or Activity ID is required" }, { status: 400 });
    }

    const review = await db.reviews.create({
      data: {
        user_id: decoded.id,
        room_id: room_id ? parseInt(room_id, 10) : null,
        activity_id: activity_id ? parseInt(activity_id, 10) : null,
        rating: parseInt(rating, 10),
        comment,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error("Create review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
