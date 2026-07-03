import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "5", 10);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      db.notifications.findMany({
        where: { user_id: decoded.id },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      db.notifications.count({
        where: { user_id: decoded.id },
      }),
      db.notifications.count({
        where: { user_id: decoded.id, is_read: false },
      }),
    ]);

    return NextResponse.json({
      success: true,
      notifications,
      total,
      unreadCount,
      page,
      limit,
    });
  } catch (error: any) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json().catch(() => ({ id: null }));

    if (id) {
      await db.notifications.updateMany({
        where: { id: parseInt(id, 10), user_id: decoded.id },
        data: { is_read: true },
      });
    } else {
      // Mark all as read
      await db.notifications.updateMany({
        where: { user_id: decoded.id, is_read: false },
        data: { is_read: true },
      });
    }

    const unreadCount = await db.notifications.count({
      where: { user_id: decoded.id, is_read: false },
    });

    return NextResponse.json({ success: true, unreadCount });
  } catch (error: any) {
    console.error("Mark notifications read error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
