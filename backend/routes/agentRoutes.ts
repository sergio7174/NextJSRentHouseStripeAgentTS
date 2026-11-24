// nexthouserentingDeepAgentTSBETS\backend\routes\agentRoutes.ts
import "dotenv/config";
import express, { NextFunction, Request, Response, Router } from "express";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import {
  Annotation,
  Command,
  MemorySaver,
  START,
  END,
  StateGraph,
  interrupt,
} from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import Booking from "../models/booking";
import House from "../models/houses";
import { logger } from "../logger";

const router: Router = express.Router();

const MAX_MESSAGE_LENGTH = 2000;
const MAX_THREAD_ID_LENGTH = 120;

type AuthenticatedRequest = Request & {
  auth?: {
    userId?: string;
    tenantId?: string;
    role?: string;
  };
};

const agentTurnLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many agent requests. Please wait a minute and try again.",
  },
});

function validateAgentTurnPayload(
  req: Request,
  res: Response,
  next: NextFunction
): any {
  const { thread_id, message, decision, tenant_id } = (req.body ?? {}) as {
    thread_id?: unknown;
    message?: unknown;
    decision?: unknown;
    tenant_id?: unknown;
  };

  if (typeof thread_id !== "string" || thread_id.trim().length === 0) {
    return res.status(400).json({ message: "thread_id is required" });
  }

  if (thread_id.trim().length > MAX_THREAD_ID_LENGTH) {
    return res.status(400).json({
      message: `thread_id exceeds ${MAX_THREAD_ID_LENGTH} character limit`,
    });
  }

  if (message !== undefined && typeof message !== "string") {
    return res.status(400).json({ message: "message must be a string" });
  }

  if (typeof message === "string" && message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      message: `message exceeds ${MAX_MESSAGE_LENGTH} character limit`,
    });
  }

  if (
    decision === undefined &&
    (typeof message !== "string" || message.trim().length === 0)
  ) {
    return res.status(400).json({
      message: "message is required when decision is not provided",
    });
  }

  if (tenant_id !== undefined && typeof tenant_id !== "string") {
    return res.status(400).json({ message: "tenant_id must be a string" });
  }

  if (decision !== undefined) {
    const isValidStringDecision =
      typeof decision === "string" && ["approve", "reject"].includes(decision);
    const isValidObjectDecision =
      typeof decision === "object" &&
      decision !== null &&
      !Array.isArray(decision) &&
      typeof (decision as { approved?: unknown }).approved === "boolean";

    if (!isValidStringDecision && !isValidObjectDecision) {
      return res.status(400).json({
        message:
          'Invalid decision payload. Expected "approve", "reject", or { approved: boolean }.',
      });
    }
  }

  return next();
}

async function findHouseByIdOrCode(houseIdentifier: string) {
  if (mongoose.Types.ObjectId.isValid(houseIdentifier)) {
    const byId = await House.findById(houseIdentifier).lean();
    if (byId) return byId;
  }
  return House.findOne({ houseCode: houseIdentifier }).lean();
}

async function resolveTenantInfo(rawTenantId?: string) {
  const UserModel = mongoose.models.User || mongoose.model("User");

  // 1. If a valid ObjectId was provided, look up that user first
  if (rawTenantId && mongoose.Types.ObjectId.isValid(rawTenantId)) {
    const userById = await UserModel.findById(rawTenantId).lean();
    if (userById) {
      return {
        tenantId: (userById as { _id: unknown })._id,
        tenantfullname:
          (userById as { fullname?: string; name?: string }).fullname ||
          (userById as { name?: string }).name,
        tenantemail: (userById as { email?: string }).email,
      };
    }
    return {
      tenantId: new mongoose.Types.ObjectId(rawTenantId),
      tenantfullname: undefined,
      tenantemail: undefined,
    };
  }

  // 2. Fallback to DEFAULT_TENANT_ID from environment if valid
  const defaultTenantId = process.env.DEFAULT_TENANT_ID?.trim();
  if (defaultTenantId && mongoose.Types.ObjectId.isValid(defaultTenantId)) {
    const defaultUser = await UserModel.findById(defaultTenantId).lean();
    return {
      tenantId: defaultUser
        ? (defaultUser as { _id: unknown })._id
        : new mongoose.Types.ObjectId(defaultTenantId),
      tenantfullname:
        (defaultUser as { fullname?: string; name?: string } | null)?.fullname ||
        (defaultUser as { name?: string } | null)?.name,
      tenantemail: (defaultUser as { email?: string } | null)?.email,
    };
  }

  // 3. Last-resort lookup: find an existing user in MongoDB if available
  const fallbackUser = await UserModel.findOne().lean();
  if (fallbackUser) {
    return {
      tenantId: (fallbackUser as { _id: unknown })._id,
      tenantfullname:
        (fallbackUser as { fullname?: string; name?: string }).fullname ||
        (fallbackUser as { name?: string }).name,
      tenantemail: (fallbackUser as { email?: string }).email,
    };
  }

  return {
    tenantId: undefined,
    tenantfullname: undefined,
    tenantemail: undefined,
  };
}

// 1. Read tool: safe to run automatically
const listHousesTool = tool(
  async ({ limit = 5 }) => {
    const houses = await House.find()
      .select("houseCode city state RentPrice")
      .limit(limit)
      .lean();
    return JSON.stringify(houses);
  },
  {
    name: "list_houses",
    description: "List available rental houses from MongoDB.",
    schema: z.object({
      limit: z.number().int().min(1).max(25).optional().default(5),
    }),
  }
);

// 2. Write tool: pauses via interrupt() for HITL approval before writing to MongoDB
const createBookingTool = tool(
  async (args, config) => {
    const effectiveTenantId =
      (config?.configurable?.tenant_id as string | undefined) || args.tenant_id;

    const decision = interrupt({
      action: "create_booking",
      args: {
        ...args,
        tenant_id: effectiveTenantId,
      },
    });

    const approved =
      decision === "approve" ||
      (typeof decision === "object" &&
        decision !== null &&
        (decision as { approved?: boolean }).approved === true);

    if (!approved) {
      return JSON.stringify({
        status: "rejected",
        message:
          "Booking creation was rejected by the user; no database record was created.",
      });
    }

    const houseDoc = await findHouseByIdOrCode(args.house_id);

    if (!houseDoc) {
      return JSON.stringify({
        status: "error",
        message: `House not found for identifier "${args.house_id}".`,
      });
    }

    const checkIn = new Date(args.check_in_date);
    const checkOut = new Date(args.check_out_date);
    const hasValidDates =
      !Number.isNaN(checkIn.getTime()) && !Number.isNaN(checkOut.getTime());

    const rentalDays = hasValidDates
      ? Math.max(
          0,
          Math.round(
            (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
          )
        )
      : 0;

    const nightlyRate = Number((houseDoc as { RentPrice?: number }).RentPrice ?? 0);
    const totalAmount = nightlyRate * Math.max(1, rentalDays);
    const tenantInfo = await resolveTenantInfo(effectiveTenantId);
    const bookingPayload: Record<string, unknown> = {
      ownerId: (houseDoc as { ownerId?: unknown }).ownerId,
      ownerfullname: (houseDoc as { ownerfullname?: string }).ownerfullname,
      owneremail: (houseDoc as { owneremail?: string }).owneremail,
      ...(tenantInfo.tenantId ? { tenantId: tenantInfo.tenantId } : {}),
      ...(tenantInfo.tenantfullname
        ? { tenantfullname: tenantInfo.tenantfullname }
        : {}),
      ...(tenantInfo.tenantemail ? { tenantemail: tenantInfo.tenantemail } : {}),
      houseId: (houseDoc as { _id?: unknown })._id,
      houseCode: (houseDoc as { houseCode?: string }).houseCode,
      state: (houseDoc as { state?: string }).state,
      city: (houseDoc as { city?: string }).city,
      street: (houseDoc as { street?: string }).street,
      image: (houseDoc as { image?: string }).image,
      bookedAt: new Date(),
      ContractInitDay: hasValidDates ? checkIn : new Date(),
      leftdays: rentalDays,
      RentPrice: nightlyRate,
      initialAmountToPay: totalAmount,
      paymentStatus: "unpaid",
      notification: `Stay ${args.check_in_date} to ${args.check_out_date}`.slice(
        0,
        100
      ),
    };

    const booking = await Booking.create(bookingPayload);

    return JSON.stringify({
      status: "created",
      bookingId: String(booking._id),
      tenantId: booking.tenantId ? String(booking.tenantId) : null,
      houseCode: booking.houseCode,
      paymentStatus: booking.paymentStatus,
    });
  },
  {
    name: "create_booking",
    description:
      "Create a house booking in MongoDB after human approval using a house ID or houseCode.",
    schema: z.object({
      house_id: z
        .string()
        .describe("House ObjectId or houseCode such as ARTPTO05"),
      tenant_id: z
        .string()
        .optional()
        .default("unknown")
        .describe("Tenant User ObjectId if provided, otherwise 'unknown'"),
      check_in_date: z.string().describe("Check-in date in YYYY-MM-DD format"),
      check_out_date: z.string().describe("Check-out date in YYYY-MM-DD format"),
    }),
  }
);

const tools = [listHousesTool, createBookingTool];
const toolNode = new ToolNode(tools);

// 3. Graph state with thread_id memory via MemorySaver
const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
});

const openRouterApiKey = process.env.OPENROUTER_API_KEY;
logger.info(
  { openRouterApiKeyConfigured: Boolean(openRouterApiKey) },
  "agentRoutes OpenRouter configuration check"
);
if (!openRouterApiKey) {
  throw new Error(
    "OPENROUTER_API_KEY is required to initialize the rental agent."
  );
}

const llm = new ChatOpenAI({
  model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct",
  temperature: 0,
  maxTokens: 512,
  apiKey: openRouterApiKey,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
}).bindTools(tools);

async function callModel(state: typeof AgentState.State) {
  const systemPrompt = new SystemMessage(
    "You are a concise rental assistant. Use list_houses for lookups and create_booking when asked to book a house."
  );
  const response = await llm.invoke([systemPrompt, ...state.messages]);
  return { messages: [response] };
}

const graph = new StateGraph(AgentState)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", toolsCondition, {
    tools: "tools",
    [END]: END,
  })
  .addEdge("tools", "agent")
  .compile({ checkpointer: new MemorySaver() });

// 4. POST /api/agent/turn
router.post(
  "/turn",
  agentTurnLimiter,
  validateAgentTurnPayload,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    let scopedThreadIdForError: string | undefined;
    try {
      const { thread_id, message, decision } = req.body as {
        thread_id: string;
        message?: string;
        decision?: "approve" | "reject" | { approved: boolean };
        tenant_id?: string;
      };

      // Derive tenantId from verified auth session; fall back to resolveTenantInfo if needed
      let verifiedTenantId = req.auth?.tenantId?.trim();
      if (!verifiedTenantId) {
        const resolved = await resolveTenantInfo();
        verifiedTenantId = resolved.tenantId
          ? String(resolved.tenantId)
          : undefined;
      }

      if (!verifiedTenantId) {
        req.log.warn("Rejected agent turn due to missing tenant context");
        return res
          .status(401)
          .json({ message: "Authenticated tenant context required" });
      }

      const rawThreadId = thread_id.trim();
      const scopedThreadId = rawThreadId.startsWith(`${verifiedTenantId}::`)
        ? rawThreadId
        : `${verifiedTenantId}::${rawThreadId}`;
      scopedThreadIdForError = scopedThreadId;

      const config = {
        configurable: {
          thread_id: scopedThreadId,
          tenant_id: verifiedTenantId,
        },
        metadata: {
          tenant_id: verifiedTenantId,
          raw_thread_id: rawThreadId,
          scoped_thread_id: scopedThreadId,
          is_resume: decision !== undefined,
        },
      };

      // Verify HITL thread ownership before resuming an interrupted graph
      if (decision !== undefined) {
        const snapshot:any = await graph.getState(config);
        const checkpointTenantId = (
          snapshot?.configurable as { tenant_id?: string } | undefined
        )?.tenant_id;

        if (!snapshot?.tasks || snapshot.tasks.length === 0) {
          req.log.warn(
            { scopedThreadId, tenantId: verifiedTenantId },
            "Rejected HITL resume: no active interrupted task on thread"
          );
          return res.status(409).json({
            message: "No interrupted workflow found for this thread to resume",
          });
        }

        if (checkpointTenantId && checkpointTenantId !== verifiedTenantId) {
          req.log.warn(
            { scopedThreadId, tenantId: verifiedTenantId },
            "Rejected HITL resume: cross-tenant thread ownership mismatch"
          );
          return res.status(403).json({
            message: "Forbidden: thread belongs to another tenant",
          });
        }
      }

      const trimmedMessage = typeof message === "string" ? message.trim() : "";

      const result =
        decision !== undefined
          ? await graph.invoke(new Command({ resume: decision }), config)
          : await graph.invoke(
              { messages: [new HumanMessage(trimmedMessage)] },
              config
            );

      let createdBookingId: string | null = null;
      let createdTenantId: string | null = null;

      for (let i = result.messages.length - 1; i >= 0; i--) {
        const msg = result.messages[i];
        if (msg instanceof ToolMessage && typeof msg.content === "string") {
          try {
            const parsed = JSON.parse(msg.content);
            if (parsed?.status === "created" && parsed?.bookingId) {
              createdBookingId = String(parsed.bookingId);
              createdTenantId = parsed.tenantId ? String(parsed.tenantId) : null;
              break;
            }
          } catch {
            // Ignore non-JSON tool messages
          }
        }
      }

      // Check if LangGraph paused at an interrupt()
      const rawInterrupts = (result as any).__interrupt__;
      if (Array.isArray(rawInterrupts) && rawInterrupts.length > 0) {
        req.log.info(
          {
            scopedThreadId,
            tenantId: verifiedTenantId,
            status: "interrupted",
          },
          "Agent turn paused at HITL interrupt"
        );
        return res.json({
          thread_id: scopedThreadId,
          status: "interrupted",
          interrupts: rawInterrupts.map((item: any) => item.value),
          reply: "",
        });
      }

      const lastMsg = result.messages[result.messages.length - 1];
      const reply =
        lastMsg instanceof AIMessage && typeof lastMsg.content === "string"
          ? lastMsg.content
          : "";

      req.log.info(
        {
          scopedThreadId,
          tenantId: verifiedTenantId,
          status: createdBookingId ? "completed_with_booking" : "completed",
          ...(createdBookingId ? { bookingId: createdBookingId } : {}),
        },
        "Agent turn completed"
      );

      return res.json({
        thread_id: scopedThreadId,
        status: "completed",
        interrupts: [],
        reply,
        ...(createdBookingId ? { booking_id: createdBookingId } : {}),
        ...(createdTenantId ? { tenant_id: createdTenantId } : {}),
      });
    } catch (err: any) {
      req.log.error(
        { err, scopedThreadId: scopedThreadIdForError },
        "Failed to process agent turn"
      );
      return res
        .status(500)
        .json({ message: "Failed to process agent turn" });
    }
  }
);

export default router;