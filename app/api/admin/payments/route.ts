import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") return null;
  return decoded;
}

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const dbPayments = await db.payments.findMany({
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        reservations: {
          include: {
            rooms: {
              select: {
                title: true,
              },
            },
          },
        },
        activity_bookings: {
          include: {
            activities: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const payments = dbPayments.map((p) => ({
      ...p,
      amount: Number(p.amount || 0),
    }));

    return NextResponse.json({ success: true, payments });
  } catch (error: any) {
    console.error("Admin payments fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
