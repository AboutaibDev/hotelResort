import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// ─── Smart local fallback AI ─────────────────────────────────────────────────
function getLocalAIResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("room") || lower.includes("suite") || lower.includes("accomm")) {
    return "We offer four exclusive luxury accommodations: the Presidential Penthouse Suite ($850/night), the Royal Garden Villa ($620/night), the Executive Panoramic Suite ($350/night), and the Deluxe Valley Room ($220/night). Each suite is designed with unique character and premium amenities. You can browse them on our Rooms page and book directly. Is there a specific suite you'd like to learn more about?";
  }

  if (lower.includes("activity") || lower.includes("experience") || lower.includes("tour") || lower.includes("trek") || lower.includes("spa") || lower.includes("wellness")) {
    return "Amanora Resort offers four curated luxury experiences:\n\n🧖 **Himalayan Spa Ritual** — 90 min, $120/person — Deep tissue massage with herbal oils, private steam bath.\n🏔️ **Valley Mountain Trekking** — 3 hrs, $55/person — Expert naturalist guide, bird watching, panoramic views.\n⛵ **Private Lake Sunset Cruise** — 2 hrs, $240/group — Live violin, gourmet charcuterie, sparkling beverages.\n👨‍🍳 **Culinary Masterclass** — 2.5 hrs, $95/person — Michelin-trained chef, 3-course organic meal creation.\n\nYou can book any of these from our Activities page. Would you like a recommendation based on your interests?";
  }

  if (lower.includes("price") || lower.includes("cost") || lower.includes("how much")) {
    return "Our pricing:\n\n**Rooms:** Starting from $220/night (Deluxe Valley Room) up to $850/night (Presidential Penthouse).\n\n**Activities:** From $55/person (Mountain Trekking) to $240/group (Sunset Cruise).\n\nAll rates include complimentary resort access, spa pool usage, and high-speed Wi-Fi. Simulated payments are used on this platform — no real charges will be made.";
  }

  if (lower.includes("check") && (lower.includes("in") || lower.includes("out"))) {
    return "Standard check-in is at **3:00 PM** and check-out is at **11:00 AM**. Early check-in and late check-out can be arranged via your Customer Dashboard under 'My Reservations' or by submitting a support request. We recommend contacting the front desk at least 24 hours in advance to confirm availability.";
  }

  if (lower.includes("cancel") || lower.includes("refund")) {
    return "You can cancel any room reservation or activity booking free of charge up to **24 hours before** the scheduled date. To cancel, visit your Customer Dashboard → My Reservations → click 'Cancel' next to the booking. For assistance, please use the Contact page to file a support ticket and our team will respond promptly.";
  }

  if (lower.includes("payment") || lower.includes("pay") || lower.includes("card") || lower.includes("credit")) {
    return "This platform uses a **simulated payment system** — no real money is charged. During checkout, you can enter any mock card number to complete the booking. All accepted 'transactions' are recorded in the database for demonstration purposes, and a confirmation notification is sent to your account.";
  }

  if (lower.includes("wifi") || lower.includes("internet") || lower.includes("amenity") || lower.includes("amenities")) {
    return "All Amanora suites come with:\n✓ Complimentary high-speed fiber Wi-Fi\n✓ 4K Smart TV with streaming\n✓ Premium Egyptian cotton linens\n✓ Nespresso coffee machine\n✓ Private balcony or garden terrace\n✓ En-suite marble bathroom with rain shower\n✓ 24/7 concierge and room service\n\nThe Presidential Penthouse and Royal Garden Villa additionally include a private infinity pool/hot tub.";
  }

  if (lower.includes("location") || lower.includes("where") || lower.includes("address") || lower.includes("how to get")) {
    return "Amanora Resort is located at **100 Resort Lane, Amanora Valley, Pune, India**. We're nestled between scenic mountain peaks and a private lake, approximately 45 minutes from Pune International Airport. Private airport transfers can be arranged — please file a support ticket or contact our front desk at +1 (800) 123-4567 for arrangements.";
  }

  if (lower.includes("contact") || lower.includes("support") || lower.includes("help") || lower.includes("problem") || lower.includes("issue")) {
    return "I can help create a support ticket for you right away. Alternatively:\n\n📞 **Phone:** +1 (800) 123-4567 (24/7)\n📧 **Email:** reservations@amanoraresort.com\n💬 **Live Chat:** This AI assistant (me!)\n📋 **Support Ticket:** Visit our Contact page to file a tracked support ticket.\n\nWould you like me to **escalate this to a support ticket** so one of our staff members can follow up with you personally?";
  }

  if (lower.includes("escalate") || lower.includes("ticket") || lower.includes("human") || lower.includes("staff") || lower.includes("speak to")) {
    return "ESCALATE_TO_TICKET";
  }

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("good") || lower.includes("greet")) {
    return "Welcome to Amanora Resort's AI concierge! 🌿 I'm here to help you with:\n\n• Room and suite information & booking\n• Resort activity recommendations\n• Check-in / check-out queries\n• Payment and cancellation policies\n• Connecting you with our support team\n\nHow may I assist you today?";
  }

  if (lower.includes("thank") || lower.includes("thanks")) {
    return "You're most welcome! It's my pleasure to assist you. Is there anything else I can help you with regarding your Amanora Resort experience? 🌟";
  }

  return "Thank you for your message. I'm Amanora Resort's AI concierge and I can help with:\n\n• **Rooms & Suites** — pricing, amenities, availability\n• **Resort Activities** — spa, trekking, cruises, culinary classes\n• **Check-in / Check-out** policies\n• **Payments & Cancellations**\n• **Contacting our team**\n\nCould you rephrase your question or choose one of the topics above so I can give you the most accurate answer?";
}

// ─── Gemini API call ──────────────────────────────────────────────────────────
async function callGemini(systemPrompt: string, userMessage: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
          },
        }),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Please log in to use AI chat" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    const { message } = await request.json();
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Save user message to DB
    await db.ai_messages.create({
      data: {
        user_id: decoded.id,
        role: "user",
        message: message.trim(),
      },
    });

    const systemPrompt = `You are the AI concierge for Amanora Resort, a luxury 5-star hotel and activity booking platform. You assist guests with:
- Room & suite information (Presidential Penthouse $850/night, Royal Garden Villa $620/night, Executive Panoramic Suite $350/night, Deluxe Valley Room $220/night)
- Resort activities (Himalayan Spa $120, Mountain Trekking $55, Sunset Cruise $240, Culinary Class $95)
- Check-in (3PM) / Check-out (11AM) policies
- Payment system (simulated, no real charges)
- Cancellation policy (free up to 24hrs before)
- Resort location (Amanora Valley, Pune, India)
Be warm, professional, concise, and helpful. Format responses with bullet points when listing multiple items.`;

    // Try Gemini, then OpenAI, then fallback
    let aiReply = await callGemini(systemPrompt, message);

    if (!aiReply) {
      // Local smart fallback
      aiReply = getLocalAIResponse(message);
    }

    // Handle escalation keyword
    let ticketCreated = false;
    if (aiReply === "ESCALATE_TO_TICKET") {
      try {
        await db.support_tickets.create({
          data: {
            user_id: decoded.id,
            subject: "AI Chat Escalation",
            message: `Customer requested human assistance. Their last message was: "${message}"`,
            status: "open",
            priority: "medium",
          },
        });
        ticketCreated = true;
        aiReply =
          "I've escalated your request and created a **support ticket** for you. One of our team members will review it shortly and respond via the Notifications tab in your dashboard. Is there anything else I can help you with in the meantime?";
      } catch {
        aiReply =
          "I'd like to connect you with our team. Please visit the Contact page to file a support ticket, or call our front desk at +1 (800) 123-4567.";
      }
    }

    // Save AI reply to DB
    await db.ai_messages.create({
      data: {
        user_id: decoded.id,
        role: "ai",
        message: aiReply,
      },
    });

    return NextResponse.json({ success: true, reply: aiReply, ticketCreated });
  } catch (error: any) {
    console.error("AI chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Fetch chat history
export async function GET() {
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

    const messages = await db.ai_messages.findMany({
      where: { user_id: decoded.id },
      orderBy: { created_at: "asc" },
      take: 100,
    });

    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    console.error("Get chat history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
