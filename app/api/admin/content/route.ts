import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { stringifyImages } from "@/lib/images";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "admin") return null;
  return decoded;
}

export async function POST(request: Request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { type, data } = await request.json();
    if (!type || !data) {
      return NextResponse.json({ error: "Content type and data are required" }, { status: 400 });
    }

    if (type === "room") {
      const room = await db.rooms.create({
        data: {
          title: data.title,
          description: data.description,
          price_per_night: parseFloat(data.price),
          capacity: parseInt(data.capacity, 10),
          image: data.image
            ? (data.image.trim().startsWith("[") ? data.image : stringifyImages([data.image]))
            : stringifyImages(["https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1200"]),
          status: data.status || "available",
        },
      });
      return NextResponse.json({ success: true, item: room });
    } else if (type === "activity") {
      const activity = await db.activities.create({
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          price: parseFloat(data.price),
          capacity: parseInt(data.capacity, 10),
          duration: parseInt(data.duration, 10),
          image: data.image
            ? (data.image.trim().startsWith("[") ? data.image : stringifyImages([data.image]))
            : stringifyImages(["https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1200"]),
          status: data.status || "available",
        },
      });
      return NextResponse.json({ success: true, item: activity });
    }

    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  } catch (error: any) {
    console.error("Content creation error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { type, id, data } = await request.json();
    if (!type || !id || !data) {
      return NextResponse.json({ error: "Content type, ID, and data are required" }, { status: 400 });
    }

    const itemId = parseInt(id, 10);

    if (type === "room") {
      const room = await db.rooms.update({
        where: { id: itemId },
        data: {
          title: data.title,
          description: data.description,
          price_per_night: parseFloat(data.price),
          capacity: parseInt(data.capacity, 10),
          image: data.image,
          status: data.status,
        },
      });
      return NextResponse.json({ success: true, item: room });
    } else if (type === "activity") {
      const activity = await db.activities.update({
        where: { id: itemId },
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          price: parseFloat(data.price),
          capacity: parseInt(data.capacity, 10),
          duration: parseInt(data.duration, 10),
          image: data.image,
          status: data.status,
        },
      });
      return NextResponse.json({ success: true, item: activity });
    }

    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  } catch (error: any) {
    console.error("Content update error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json({ error: "Content type and ID are required" }, { status: 400 });
    }

    const itemId = parseInt(id, 10);

    if (type === "room") {
      await db.rooms.delete({
        where: { id: itemId },
      });
      return NextResponse.json({ success: true });
    } else if (type === "activity") {
      await db.activities.delete({
        where: { id: itemId },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  } catch (error: any) {
    console.error("Content deletion error:", error);
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 });
  }
}
