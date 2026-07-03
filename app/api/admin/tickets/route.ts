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

    if (status === "closed" && (!reply || !reply.trim())) {
      return NextResponse.json({ error: "An answer is required to close a ticket." }, { status: 400 });
    }

    const updated = await db.support_tickets.update({
      where: { id: tId },
      data: {
        admin_answer: reply && reply.trim() !== "" ? reply.trim() : ticket.admin_answer,
        status: status || ticket.status,
      },
    });

    // Create a notification for the ticket owner
    const dbNotif = await db.notifications.create({
      data: {
        user_id: ticket.user_id,
        title: "Ticket Update",
        message: `Your ticket regarding "${ticket.subject}" has been updated. Status: ${status || ticket.status}.`,
        type: "ticket",
      },
    });

    // Notify via WebSocket server
    try {
      await fetch("http://localhost:3002/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: dbNotif?.id,
          userId: ticket.user_id,
          title: "Ticket Update",
          message: `Your ticket regarding "${ticket.subject}" has been updated. Status: ${status || ticket.status}.`,
          type: "ticket",
        }),
      });
    } catch (e) {
      console.error("Failed to push WS notification:", e);
    }

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error: any) {
    console.error("Update ticket error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
