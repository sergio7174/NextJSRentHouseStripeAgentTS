"use client";

import React, { useState } from "react";
import styles from "./AiChatWidget.module.css";

interface PendingAction {
  action: string;
  args: Record<string, unknown>;
}

interface AgentTurnResponse {
  thread_id: string;
  status: "completed" | "interrupted";
  interrupts?: Array<{
    action?: string;
    args?: Record<string, unknown>;
    action_requests?: Array<{ name: string; args: Record<string, unknown> }>;
  }>;
  reply?: string;
  booking_id?: string;
  tenant_id?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AiChatWidgetProps {
  currentUserId?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function AssistantSparkIcon({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3L13.7 8.3L19 10L13.7 11.7L12 17L10.3 11.7L5 10L10.3 8.3L12 3Z"
        fill="currentColor"
      />
      <path
        d="M18.5 15L19.4 17.6L22 18.5L19.4 19.4L18.5 22L17.6 19.4L15 18.5L17.6 17.6L18.5 15Z"
        fill="currentColor"
        opacity="0.85"
      />
      <circle cx="6.5" cy="17.5" r="1.6" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

export default function AiChatWidget({ currentUserId }: AiChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [threadId] = useState(() => `web-${Date.now()}`);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [pendingTenantId, setPendingTenantId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const getActiveTenantId = (): string | undefined => {
    if (currentUserId) return currentUserId;
    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          return parsed?._id || parsed?.id;
        }
      } catch {
        return undefined;
      }
    }
    return undefined;
  };

  const normalizeInterrupt = (
    rawInterrupts?: AgentTurnResponse["interrupts"]
  ): PendingAction | null => {
    if (!Array.isArray(rawInterrupts) || rawInterrupts.length === 0) {
      return null;
    }
    const first = rawInterrupts[0];
    if (first.action) {
      return { action: first.action, args: first.args || {} };
    }
    const req = first.action_requests?.[0];
    if (req) {
      return { action: req.name, args: req.args || {} };
    }
    return null;
  };

  const handlePayNow = async () => {
    const checkoutTargetId = pendingTenantId || pendingBookingId;
    if (!checkoutTargetId || paying) return;

    setPaying(true);
    try {
      const res = await fetch(`${API_BASE_URL}/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: checkoutTargetId }),
      });

      if (!res.ok) {
        throw new Error(`Checkout failed (${res.status})`);
      }

      const sessionData: { url?: string } = await res.json();
      if (sessionData.url) {
        window.location.href = sessionData.url;
      }
    } catch (err) {
      console.error("Stripe checkout error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Could not start Stripe checkout. Please try again.",
        },
      ]);
    } finally {
      setPaying(false);
    }
  };

  const sendTurn = async (payload: {
    message?: string;
    decision?: "approve" | "reject";
  }) => {
    setLoading(true);
    try {
      const tenantId = getActiveTenantId();

      const res = await fetch(`${API_BASE_URL}/api/agent/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: threadId,
          ...(tenantId ? { tenant_id: tenantId } : {}),
          ...payload,
        }),
      });

      if (!res.ok) {
        throw new Error(`Agent request failed (${res.status})`);
      }

      const data: AgentTurnResponse = await res.json();

      if (data.status === "interrupted") {
        setPendingAction(normalizeInterrupt(data.interrupts));
      } else {
        setPendingAction(null);

        if (data.booking_id) {
          setPendingBookingId(data.booking_id);
          setPendingTenantId(data.tenant_id || getActiveTenantId() || null);
        }

        if (data.reply) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.reply! },
          ]);
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong reaching the rental assistant.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading || pendingAction) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    await sendTurn({ message: trimmed });
  };

  const handleDecision = async (decision: "approve" | "reject") => {
    if (!pendingAction || loading) return;
    await sendTurn({ decision });
  };

  return (
    <div className={styles.root}>
      {!isOpen ? (
        <button
          type="button"
          className={styles.launcherBtn}
          aria-label="Open AI Rental Assistant"
          title="AI Rental Assistant"
          onClick={() => setIsOpen(true)}
        >
          <span className={styles.statusDot} aria-hidden="true" />
          <AssistantSparkIcon size={26} />
        </button>
      ) : (
        <div className={styles.panel}>
          <div className={styles.header}>
            <div className={styles.headerTitleWrap}>
              <span className={styles.headerBadge}>
                <AssistantSparkIcon size={18} />
              </span>
              <div>
                <h6 className={styles.headerTitle}>AI Rental Assistant</h6>
                <div className={styles.headerSubtitle}>
                  Houses &amp; Instant Booking
                </div>
              </div>
            </div>
            <button
              type="button"
              className={styles.minimizeBtn}
              aria-label="Minimize assistant"
              title="Minimize"
              onClick={() => setIsOpen(false)}
            >
              &minus;
            </button>
          </div>

          <div className={styles.body}>
            <div className={styles.messagesBox}>
              {messages.length === 0 && (
                <p className={styles.emptyHint}>
                  Ask about available houses or request a booking (e.g. &ldquo;Book house ARTPTO05 from 2026-12-01 to 2026-12-05&rdquo;).
                </p>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={
                    msg.role === "user"
                      ? styles.messageRowUser
                      : styles.messageRowAssistant
                  }
                >
                  <span
                    className={
                      msg.role === "user"
                        ? styles.bubbleUser
                        : styles.bubbleAssistant
                    }
                  >
                    {msg.content}
                  </span>
                </div>
              ))}
            </div>

            {/* Created Booking + Pay Now Banner */}
            {pendingBookingId && (
              <div className={styles.bookingBanner}>
                <div className={styles.bookingText}>
                  Booking: <code>{pendingBookingId}</code>
                </div>
                <button
                  type="button"
                  className="btn btn-success btn-sm flex-shrink-0"
                  disabled={paying}
                  onClick={handlePayNow}
                >
                  {paying ? "Redirecting..." : "Pay Now"}
                </button>
              </div>
            )}

            {/* HITL Approval Card */}
            {pendingAction && (
              <div className={styles.approvalCard}>
                <div className={styles.approvalTitle}>
                  Approval required: <code>{pendingAction.action}</code>
                </div>
                <pre className={styles.approvalPre}>
                  {JSON.stringify(pendingAction.args, null, 2)}
                </pre>
                <div className={styles.approvalActions}>
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    disabled={loading}
                    onClick={() => handleDecision("approve")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    disabled={loading}
                    onClick={() => handleDecision("reject")}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSendMessage} className={styles.inputForm}>
              <input
                type="text"
                className={styles.textInput}
                placeholder={
                  pendingAction
                    ? "Approve or reject the pending action first..."
                    : "Type a message..."
                }
                value={input}
                disabled={loading || Boolean(pendingAction)}
                onChange={(e) => setInput(e.target.value)}
              />
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={loading || Boolean(pendingAction) || !input.trim()}
              >
                {loading ? "..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}