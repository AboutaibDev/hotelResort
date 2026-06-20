import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roomId = parseInt(id, 10);

    if (isNaN(roomId)) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
    }

    // Fetch all non-cancelled reservations for this room
    const reservations = await db.reservations.findMany({
      where: {
        room_id: roomId,
        status: { not: "cancelled" },
        check_in_date: { not: null },
        check_out_date: { not: null },
      },
      select: {
        check_in_date: true,
        check_out_date: true,
      },
    });

    // Return as ISO date strings
    const bookedRanges = reservations.map((r) => ({
      checkIn: r.check_in_date?.toISOString().split("T")[0],
      checkOut: r.check_out_date?.toISOString().split("T")[0],
    }));

    return NextResponse.json({ bookedRanges });
  } catch (error) {
    console.error("Error fetching booked dates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
