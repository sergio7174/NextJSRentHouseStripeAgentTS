// nexthouserentingDeepAgentTSBETS\backend\routes\index.ts
"use strict";
import agentRoutes from "./agentRoutes";

import express, { Request, Response, Router } from "express";
import Stripe from "stripe";
import Booking from "../models/booking";
import House from "../models/houses";

const router: Router = express.Router();

import userRoutes from "./userRoutes";
import houseRoutes from "./houseRoutes";
import bookingRoutes from "./bookingRoutes";
import authRoutes from "./authRoutes";
import metricsRoutes from "./metricsRoutes";

router.use("/", userRoutes);
router.use("/api/auth", authRoutes);
router.use("/api/house", houseRoutes);
router.use("/api/booking", bookingRoutes);
router.use("/api/user", userRoutes);
router.use("/api/metrics", metricsRoutes);
router.use("/api/agent", agentRoutes);

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { 
     // @ts-expect-error This integration intentionally remains pinned to its existing API version.
    apiVersion: "2023-10-16" }) // Added apiVersion to prevent TS errors
  : null;

// Create Stripe Checkout Session for a tenant's booking
router.post("/create-checkout-session", async (req: Request, res: Response): Promise<any> => {
  console.log("Im at index.ts router - line 29 - router.post - '/create-checkout-session'");
  console.log("Im at index.ts router - line 30 - stripe initialized:", Boolean(stripe));

  try {
    if (!stripe) {
      return res.status(500).json({ message: "STRIPE_SECRET_KEY is not configured" });
    }

    // Tell TS what we expect in the body
    const { bookingId } = req.body as { bookingId?: string };
    
    console.log("Im at index.ts router - line 39 - router.post - bookingId:", bookingId);
    if (!bookingId) {
      return res.status(400).json({ message: "bookingId is required" });
    }

    const bookings = await Booking.find({ tenantId: bookingId }).sort({ bookedAt: -1 });
    console.log("Im at index.ts router - line 44 - router.post - booking:", bookings.length);

    if (!Array.isArray(bookings) || bookings.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Pick the most recent booking for this tenantId
    const targetBooking = bookings[0];

    const houseIdStr = targetBooking.houseId?.toString();

    //console.log("Im at index.ts router - line 59 - houseIdStr:", houseIdStr);
    //console.log("Im at index.ts router - line 60 - targetBooking.houseCode:", targetBooking.houseCode);

    let house = houseIdStr ? await House.findById(houseIdStr) : null;
    
    if (!house && houseIdStr) {
      const houses = await House.find({ houseId: houseIdStr });
      house = Array.isArray(houses) ? houses[0] : houses;
    }

    console.log("Im at index.ts router - line 54 - router.post - house:", house);
    
    const nightlyRate =
      house?.RentPrice ||
      targetBooking.RentPrice ||
      targetBooking.initialAmountToPay ||
      100;
      
    const unitAmountCents = Math.round(nightlyRate * 100);

    console.log("Im at index.ts router - line 69 - house?.houseCode:", house?.houseCode);
    console.log("Im at index.ts router - line 70 - targetBooking.houseCode:", targetBooking.houseCode);
    console.log("Im at index.ts router - line 71 - targetBooking.houseId:", targetBooking.houseId);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `House Booking (${house?.houseCode || targetBooking.houseCode || targetBooking.houseId})`,
            },
            unit_amount: unitAmountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: String(targetBooking._id),
      },
      success_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/booking/cancel?booking_id=${targetBooking._id}`,
    });

    targetBooking.stripeSessionId = session.id;
    await targetBooking.save();

    return res.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return res.status(500).json({ message: "Failed to create checkout session" });
  }
});

export default router;