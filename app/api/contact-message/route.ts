import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Visitor inquiry message received:", body);
    return NextResponse.json({ success: true, message: "Visitor message simulated successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 550 });
  }
}
