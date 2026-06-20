import { NextResponse } from "next/server";
import { seedIfNeeded } from "@/lib/seed";

export async function GET() {
  try {
    await seedIfNeeded();
    return NextResponse.json({ success: true, message: "Seeding complete (if tables were empty)." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
