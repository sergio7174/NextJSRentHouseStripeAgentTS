// src/pages/booking/success/success.tsx
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function BookingSuccessPage() {
  const router = useRouter();
  const sessionId = typeof router.query.session_id === "string" ? router.query.session_id : undefined;

  return (
    <div className="container py-5">
      <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: 560 }}>
        <h1 className="h3 text-success mb-2">Payment Completed</h1>
        <p className="text-muted">
          Thank you for your payment. Stripe has received your checkout and your
          booking payment status is being confirmed via webhook.
        </p>

        {sessionId && (
          <p className="small bg-light p-2 rounded border text-break">
            <strong>Checkout Session ID:</strong> {sessionId}
          </p>
        )}

        <div className="d-flex gap-2 mt-3">
          <Link href="/tenant/tenantdashboard" className="btn btn-primary">
            Back to Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}