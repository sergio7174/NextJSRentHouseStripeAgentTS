import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function BookingCancelPage() {
  const router = useRouter();
  const bookingId = typeof router.query.booking_id === "string" ? router.query.booking_id : undefined;

  return (
    <div className="container py-5">
      <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: 560 }}>
        <h1 className="h3 text-warning mb-2">Payment Cancelled</h1>
        <p className="text-muted">
          Your Stripe Checkout session was cancelled. No charge was made and your
          booking remains unpaid.
        </p>

        {bookingId && (
          <p className="small bg-light p-2 rounded border text-break">
            <strong>Booking Reference:</strong> {bookingId}
          </p>
        )}

        <div className="d-flex gap-2 mt-3">
          <Link href="/tenant/tenantdashboard" className="btn btn-primary">
            Return to Booking &amp; Try Again
          </Link>
        </div>
      </div>
    </div>
  );
}