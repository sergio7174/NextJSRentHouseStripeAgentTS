"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const agentRoutes_1 = __importDefault(require("./agentRoutes"));
const express_1 = __importDefault(require("express"));
const stripe_1 = __importDefault(require("stripe"));
const booking_1 = __importDefault(require("../models/booking"));
const houses_1 = __importDefault(require("../models/houses"));
const router = express_1.default.Router();
const userRoutes_1 = __importDefault(require("./userRoutes"));
const houseRoutes_1 = __importDefault(require("./houseRoutes"));
const bookingRoutes_1 = __importDefault(require("./bookingRoutes"));
const authRoutes_1 = __importDefault(require("./authRoutes"));
const metricsRoutes_1 = __importDefault(require("./metricsRoutes"));
router.use("/", userRoutes_1.default);
router.use("/api/auth", authRoutes_1.default);
router.use("/api/house", houseRoutes_1.default);
router.use("/api/booking", bookingRoutes_1.default);
router.use("/api/user", userRoutes_1.default);
router.use("/api/metrics", metricsRoutes_1.default);
router.use("/api/agent", agentRoutes_1.default);
const stripe = process.env.STRIPE_SECRET_KEY
    ? new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
        // @ts-expect-error This integration intentionally remains pinned to its existing API version.
        apiVersion: "2023-10-16"
    }) // Added apiVersion to prevent TS errors
    : null;
// Create Stripe Checkout Session for a tenant's booking
router.post("/create-checkout-session", async (req, res) => {
    console.log("Im at index.ts router - line 29 - router.post - '/create-checkout-session'");
    console.log("Im at index.ts router - line 30 - stripe initialized:", Boolean(stripe));
    try {
        if (!stripe) {
            return res.status(500).json({ message: "STRIPE_SECRET_KEY is not configured" });
        }
        // Tell TS what we expect in the body
        const { bookingId } = req.body;
        console.log("Im at index.ts router - line 39 - router.post - bookingId:", bookingId);
        if (!bookingId) {
            return res.status(400).json({ message: "bookingId is required" });
        }
        const bookings = await booking_1.default.find({ tenantId: bookingId }).sort({ bookedAt: -1 });
        console.log("Im at index.ts router - line 44 - router.post - booking:", bookings.length);
        if (!Array.isArray(bookings) || bookings.length === 0) {
            return res.status(404).json({ message: "Booking not found" });
        }
        // Pick the most recent booking for this tenantId
        const targetBooking = bookings[0];
        const houseIdStr = targetBooking.houseId?.toString();
        //console.log("Im at index.ts router - line 59 - houseIdStr:", houseIdStr);
        //console.log("Im at index.ts router - line 60 - targetBooking.houseCode:", targetBooking.houseCode);
        let house = houseIdStr ? await houses_1.default.findById(houseIdStr) : null;
        if (!house && houseIdStr) {
            const houses = await houses_1.default.find({ houseId: houseIdStr });
            house = Array.isArray(houses) ? houses[0] : houses;
        }
        console.log("Im at index.ts router - line 54 - router.post - house:", house);
        const nightlyRate = house?.RentPrice ||
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
    }
    catch (err) {
        console.error("Stripe checkout error:", err);
        return res.status(500).json({ message: "Failed to create checkout session" });
    }
});
exports.default = router;
