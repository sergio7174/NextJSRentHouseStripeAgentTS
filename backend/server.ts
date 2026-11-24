// nexthouserentingDeepAgentTSBETS\backend\server.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import methodOverride from "method-override";
import Stripe from "stripe";
import mongoose from "mongoose";
import pinoHttp from "pino-http";
import mongoSanitize from "express-mongo-sanitize";
import { logger } from "./logger";
import connectDb from "./config/db";
import Booking from "./models/booking";
import router from "./routes/index";

dotenv.config();

const app = express();

// Initialize Stripe with proper typing
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      // @ts-expect-error This integration intentionally remains pinned to its existing API version.
      apiVersion: "2023-10-16",
    })
  : null;

// Connect to database
connectDb();

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "traceparent"],
  })
);

// Mount pino-http right after cors(...) and before routes
app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  })
);

function sanitizeRequestInPlace(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const options = { replaceWith: "_" };

  if (req.body && typeof req.body === "object") {
    mongoSanitize.sanitize(req.body, options);
  }

  if (req.params && typeof req.params === "object") {
    mongoSanitize.sanitize(req.params, options);
  }

  if (req.headers && typeof req.headers === "object") {
    mongoSanitize.sanitize(req.headers, options);
  }

  if (req.query && typeof req.query === "object") {
    mongoSanitize.sanitize(req.query as Record<string, unknown>, options);
  }

  next();
}

// serve images to frontend
app.use("/uploads", express.static("uploads"));

// 1. Stripe Webhook MUST come BEFORE express.json() / urlencoded / sanitizeRequestInPlace
// so req.body stays raw bytes for stripe.webhooks.constructEvent()
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response): Promise<any> => {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      req.log.error("Stripe webhook is not configured");
      return res
        .status(500)
        .json({ message: "Stripe webhook is not configured" });
    }

    const sig = req.headers["stripe-signature"];

    if (!sig || typeof sig !== "string") {
      req.log.warn("Webhook request missing stripe-signature header");
      return res
        .status(400)
        .send("Webhook Error: Missing stripe-signature header");
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      req.log.error(
        { err },
        "Webhook signature verification failed"
      );
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId =
          session.metadata?.bookingId || session.metadata?.booking_id;

        if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
          req.log.warn(
            {
              eventId: event.id,
              sessionId: session.id,
              bookingId: bookingId ?? null,
            },
            "Webhook checkout.session.completed missing or invalid bookingId metadata"
          );
          return res.json({ received: true });
        }

        if (session.payment_status !== "paid") {
          req.log.info(
            {
              eventId: event.id,
              sessionId: session.id,
              bookingId,
              paymentStatus: session.payment_status,
            },
            "Skipping booking update because checkout session is not paid"
          );
          return res.json({ received: true });
        }

        const existingBooking = await Booking.findById(bookingId);
        if (!existingBooking) {
          req.log.warn(
            {
              eventId: event.id,
              sessionId: session.id,
              bookingId,
            },
            "Booking not found for Stripe checkout session"
          );
          return res.json({ received: true });
        }

        const alreadyPaid =
          existingBooking.paymentStatus === "paid" ||
          (existingBooking as any).paymentstatus === "paid";

        if (alreadyPaid && existingBooking.stripeSessionId === session.id) {
          req.log.info(
            {
              eventId: event.id,
              sessionId: session.id,
              bookingId,
            },
            "Idempotent skip: booking already marked paid for session"
          );
          return res.json({ received: true });
        }

        const paidTimestamp = existingBooking.paidAt || new Date();

        const updated = await Booking.findByIdAndUpdate(
          bookingId,
          {
            paymentStatus: "paid",
            paymentstatus: "paid",
            stripeSessionId: session.id,
            paidAt: paidTimestamp,
          },
          { new: true }
        );

        req.log.info(
          {
            eventId: event.id,
            sessionId: session.id,
            bookingId: String(updated?._id ?? bookingId),
            paidAt: updated?.paidAt,
          },
          "Booking marked paid via Stripe webhook"
        );
      }

      return res.json({ received: true });
    } catch (err: any) {
      req.log.error(
        {
          err,
          eventId: event.id,
          sessionId:
            event.type === "checkout.session.completed"
              ? (event.data.object as Stripe.Checkout.Session).id
              : undefined,
        },
        "Error processing Stripe webhook event"
      );
      return res.status(500).json({ message: "Webhook handler error" });
    }
  }
);

// 2. JSON & URL-encoded parsers for standard API routes
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// JSON syntax error handler
app.use(
  (
    err: unknown,
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (err instanceof SyntaxError && "status" in err && err.status === 400) {
      return res.status(400).json({
        message: "Invalid JSON payload",
        detail: err.message,
      });
    }
    return next(err);
  }
);

// 3. Express 5-safe in-place sanitization BEFORE mounting application routes
app.use(sanitizeRequestInPlace);

app.use("/uploads", express.static("uploads"));

app.set("port", process.env.PORT || 3001);

app.get("/", (req: Request, res: Response) => {
  res.send("Hi");
});

app.use(methodOverride("_method", { methods: ["POST", "GET"] }));
app.use("/", router);

app.listen(app.get("port"), () => {
  logger.info({ port: app.get("port") }, "Server running");
});


// how to call the server now after adding observability and security policy
// npx tsx --import ./instrumentation.ts server.ts
// 