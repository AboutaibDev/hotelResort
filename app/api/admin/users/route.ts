import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// Middleware equivalent to verify admin role
async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") return null;
  return decoded;
}

export async function PUT(request: Request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { userId, role } = await request.json();
    if (!userId || !role) {
      return NextResponse.json({ error: "User ID and role are required" }, { status: 450 });
    }

    const updated = await db.users.update({
      where: { id: parseInt(userId, 10) },
      data: { role },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Admin user update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userIdStr = searchParams.get("userId");
    if (!userIdStr) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const userId = parseInt(userIdStr, 10);
    if (userId === admin.id) {
      return NextResponse.json({ error: "Cannot delete your own admin account" }, { status: 400 });
    }

    // Delete associated records first (cascading emulation)
    await db.$transaction([
      db.payments.deleteMany({ where: { user_id: userId } }),
      db.reservations.deleteMany({ where: { user_id: userId } }),
      db.activity_bookings.deleteMany({ where: { user_id: userId } }),
      db.reviews.deleteMany({ where: { user_id: userId } }),
      db.notifications.deleteMany({ where: { user_id: userId } }),
      db.support_tickets.deleteMany({ where: { user_id: userId } }),
      db.ai_messages.deleteMany({ where: { user_id: userId } }),
      db.users.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json({ success: true, message: "User deleted successfully." });
  } catch (error: any) {
    console.error("Admin user delete error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
