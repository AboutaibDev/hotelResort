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

export async function PUT(request: Request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { ticketId, reply, status } = await request.json();
    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
    }

    const tId = parseInt(ticketId, 10);
    const ticket = await db.support_tickets.findUnique({
      where: { id: tId },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    let newMessage = ticket.message || "";
    if (reply && reply.trim() !== "") {
      newMessage += `\n\n--- Reply by ${admin.email} on ${new Date().toLocaleString()} ---\n${reply}`;
    }

    const updated = await db.support_tickets.update({
      where: { id: tId },
      data: {
        message: newMessage,
        status: status || ticket.status,
      },
    });

    // Create a notification for the ticket owner
    await db.notifications.create({
      data: {
        user_id: ticket.user_id,
        title: "Ticket Update",
        message: `Your ticket regarding "${ticket.subject}" has been updated. Status: ${status || ticket.status}.`,
        type: "ticket",
      },
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error: any) {
    console.error("Update ticket error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
