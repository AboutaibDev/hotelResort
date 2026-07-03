import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    const { room, checkInDate, checkOutDate, guestsCount, activities, paymentMethod, cardName, cardNumber, expiry, cvv } = await request.json();

    if (!room && (!activities || activities.length === 0)) {
      return NextResponse.json({ error: "No items in booking cart" }, { status: 400 });
    }

    // Mock payment processor logic
    if (cardNumber) {
      const cleanCard = cardNumber.replace(/\s+/g, "");
      if (!/^\d{12,19}$/.test(cleanCard)) {
        return NextResponse.json({ error: "Invalid card number format. Must be between 12 and 19 digits." }, { status: 400 });
      }
      if (cleanCard.endsWith("0000")) {
        return NextResponse.json({ error: "Card declined: Insufficient funds." }, { status: 402 });
      }
      if (cleanCard.endsWith("9999")) {
        return NextResponse.json({ error: "Card declined: Fraud check failed." }, { status: 402 });
      }
    }

    if (cvv) {
      const cleanCvv = cvv.replace(/\s+/g, "");
      if (!/^\d{3,4}$/.test(cleanCvv)) {
        return NextResponse.json({ error: "Invalid CVV format. Must be 3 or 4 digits." }, { status: 400 });
      }
    }

    if (expiry) {
      const cleanExpiry = expiry.trim();
      if (!/^\d{2}\/\d{2}$/.test(cleanExpiry)) {
        return NextResponse.json({ error: "Invalid Expiry date format. Must be MM/YY." }, { status: 400 });
      }
      const [mStr, yStr] = cleanExpiry.split("/");
      const month = parseInt(mStr, 10);
      const year = parseInt(yStr, 10) + 2000;
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      if (month < 1 || month > 12 || year < currentYear || (year === currentYear && month < currentMonth)) {
        return NextResponse.json({ error: "Card declined: Expiration date is in the past." }, { status: 400 });
      }
    }

    const transactionRef = "TR-" + Math.floor(10000000 + Math.random() * 90000000);
    const createdReservations: any[] = [];
    const createdActivityBookings: any[] = [];
    const createdPayments: any[] = [];
    let dbNotification: any = null;

    // Run Prisma transaction
    await db.$transaction(async (tx: any) => {
      // 1. If room selected, create room reservation
      if (room) {
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const roomTotal = Number(room.pricePerNight) * nights;

        const resObj = await tx.reservations.create({
          data: {
            user_id: decoded.id,
            room_id: room.id,
            check_in_date: checkIn,
            check_out_date: checkOut,
            guests_count: guestsCount,
            total_price: roomTotal,
            status: "confirmed", // Mark as confirmed since payment is simulated success
          },
        });
        createdReservations.push(resObj);

        // Create associated payment
        const payObj = await tx.payments.create({
          data: {
            user_id: decoded.id,
            reservation_id: resObj.id,
            amount: roomTotal,
            method: paymentMethod || "card",
            status: "success", // Success status matching enum: success, failed, pending
            transaction_ref: transactionRef,
          },
        });
        createdPayments.push(payObj);
      }

      // 2. If activities selected, create activity bookings
      if (activities && activities.length > 0) {
        for (const act of activities) {
          const actTotal = Number(act.price) * act.participantsCount;

          const actBooking = await tx.activity_bookings.create({
            data: {
              user_id: decoded.id,
              activity_id: act.id,
              booking_date: new Date(), // Set as today for simplicity
              participants_count: act.participantsCount,
              total_price: actTotal,
              status: "confirmed",
            },
          });
          createdActivityBookings.push(actBooking);

          // Create associated payment
          const payObj = await tx.payments.create({
            data: {
              user_id: decoded.id,
              activity_booking_id: actBooking.id,
              amount: actTotal,
              method: paymentMethod || "card",
              status: "success",
              transaction_ref: transactionRef,
            },
          });
          createdPayments.push(payObj);
        }
      }

      // 3. Create a notification for the user
      dbNotification = await tx.notifications.create({
        data: {
          user_id: decoded.id,
          title: "Booking Completed",
          message: `Your booking has been confirmed under transaction ref: ${transactionRef}. Thank you for choosing Amanora Resort!`,
          type: "booking",
          is_read: false,
        },
      });
    });

    // Notify via WebSocket server
    try {
      await fetch("http://localhost:3002/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: dbNotification?.id,
          userId: decoded.id,
          title: "Booking Completed",
          message: `Your booking has been confirmed under transaction ref: ${transactionRef}. Thank you for choosing Amanora Resort!`,
          type: "booking",
        }),
      });
    } catch (e) {
      console.error("Failed to push WS notification:", e);
    }

    return NextResponse.json({
      success: true,
      transactionRef,
      createdReservations,
      createdActivityBookings,
    });
  } catch (error: any) {
    console.error("Checkout process error:", error);
    return NextResponse.json({ error: "Checkout transaction failed: " + error.message }, { status: 500 });
  }
}
