"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const method_override_1 = __importDefault(require("method-override"));
const stripe_1 = __importDefault(require("stripe"));
const db_1 = __importDefault(require("./config/db"));
const booking_1 = __importDefault(require("./models/booking"));
const index_1 = __importDefault(require("./routes/index"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Initialize Stripe with proper typing
const stripe = process.env.STRIPE_SECRET_KEY
    ? new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
        // @ts-expect-error This integration intentionally remains pinned to its existing API version.
        apiVersion: "2023-10-16",
    })
    : null;
// Connect to database
(0, db_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use("/uploads", express_1.default.static("uploads"));
// Stripe Webhook must receive the raw body BEFORE JSON/urlencoded parsers run
app.post("/api/payments/webhook", express_1.default.raw({ type: "application/json" }), async (req, res) => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(500).json({ message: "Stripe webhook is not configured" });
    }
    const sig = req.headers["stripe-signature"];
    // TS requires sig to be a string
    if (!sig || typeof sig !== "string") {
        return res.status(400).send("Webhook Error: Missing stripe-signature header");
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    try {
        if (event.type === "checkout.session.completed") {
            // Cast to Stripe.Checkout.Session to access metadata correctly
            const session = event.data.object;
            const bookingId = session.metadata?.bookingId;
            if (!bookingId) {
                console.warn(`Webhook checkout.session.completed missing metadata.bookingId (event: ${event.id}, session: ${session.id})`);
                return res.json({ received: true });
            }
            if (session.payment_status !== "paid") {
                console.log(`Skipping booking ${bookingId} update: session.payment_status is "${session.payment_status}" (session: ${session.id})`);
                return res.json({ received: true });
            }
            const existingBooking = await booking_1.default.findById(bookingId);
            if (!existingBooking) {
                console.warn(`Booking not found for bookingId: ${bookingId} (event: ${event.id})`);
                return res.json({ received: true });
            }
            // Note: You need to make sure your IBooking interface has these properties defined
            const alreadyPaid = existingBooking.paymentStatus === "paid" ||
                existingBooking.paymentstatus === "paid"; // Cast if your schema has typos
            if (alreadyPaid && existingBooking.stripeSessionId === session.id) {
                console.log(`Idempotent skip: booking ${bookingId} already marked paid for session ${session.id} (event: ${event.id})`);
                return res.json({ received: true });
            }
            const paidTimestamp = existingBooking.paidAt || new Date();
            const updated = await booking_1.default.findByIdAndUpdate(bookingId, {
                paymentStatus: "paid",
                paymentstatus: "paid", // Keep if your DB relies on this casing
                stripeSessionId: session.id,
                paidAt: paidTimestamp,
            }, { new: true });
            console.log("Booking marked paid:", String(updated?._id), "| session:", updated?.stripeSessionId, "| paidAt:", updated?.paidAt);
        }
        return res.json({ received: true });
    }
    catch (err) {
        console.error("Error processing webhook event:", event.id, err);
        return res.status(500).json({ message: "Webhook handler error" });
    }
});
// Standard body parsers for all normal JSON/form routes
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.set("port", process.env.PORT || 3001);
app.get("/", (req, res) => {
    res.send("Hi");
});
app.use((0, method_override_1.default)("_method", { methods: ["POST", "GET"] }));
app.use("/", index_1.default);
app.listen(app.get("port"), () => {
    console.log(`Server running at http://localhost:${app.get("port")}`);
});
