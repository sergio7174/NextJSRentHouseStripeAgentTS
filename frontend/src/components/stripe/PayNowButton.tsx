"use client";

import React, { useState } from "react";

interface PayNowButtonProps {
  tenantId: string; // or bookingId depending on what your endpoint expects
  disabled?: boolean;
}

export default function PayNowButton({ tenantId, disabled = false }: PayNowButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const handlePayNow = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: tenantId }),
      });

      const data = await res.json();

      if (!res.ok || !data?.url) {
        throw new Error(data?.message || "Could not start Stripe Checkout");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment error");
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handlePayNow}
        disabled={disabled || loading}
        className="btn btn-primary"
      >
        {loading ? "Redirecting to Stripe..." : "Pay Now"}
      </button>
      {error && <p className="text-danger mt-2">{error}</p>}
    </div>
  );
}