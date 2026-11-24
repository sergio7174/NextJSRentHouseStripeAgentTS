"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// nexthouserentingDeepAgentTSBETS\backend\routes\agentRoutes.ts
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const tools_1 = require("@langchain/core/tools");
const openai_1 = require("@langchain/openai");
const langgraph_1 = require("@langchain/langgraph");
const prebuilt_1 = require("@langchain/langgraph/prebuilt");
const messages_1 = require("@langchain/core/messages");
const booking_1 = __importDefault(require("../models/booking"));
const houses_1 = __importDefault(require("../models/houses"));
const router = express_1.default.Router();
async function findHouseByIdOrCode(houseIdentifier) {
    if (mongoose_1.default.Types.ObjectId.isValid(houseIdentifier)) {
        const byId = await houses_1.default.findById(houseIdentifier).lean();
        if (byId)
            return byId;
    }
    return houses_1.default.findOne({ houseCode: houseIdentifier }).lean();
}
// 1. Read tool: safe to run automatically
const listHousesTool = (0, tools_1.tool)(async ({ limit = 5 }) => {
    const houses = await houses_1.default.find().limit(limit).lean();
    return JSON.stringify(houses);
}, {
    name: "list_houses",
    description: "List available rental houses from MongoDB.",
    schema: zod_1.z.object({
        limit: zod_1.z.number().optional().default(5),
    }),
});
// 2. Write tool: pauses via interrupt() for HITL approval before writing to MongoDB
const createBookingTool = (0, tools_1.tool)(async (args) => {
    // Do NOT wrap interrupt() in try/catch; let LangGraph pause and resume cleanly
    const decision = (0, langgraph_1.interrupt)({
        action: "create_booking",
        args,
    });
    const approved = decision === "approve" ||
        (typeof decision === "object" &&
            decision !== null &&
            decision.approved === true);
    if (!approved) {
        return JSON.stringify({
            status: "rejected",
            message: "Booking creation was rejected by the user; no database record was created.",
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
    const hasValidDates = !Number.isNaN(checkIn.getTime()) && !Number.isNaN(checkOut.getTime());
    const rentalDays = hasValidDates
        ? Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;
    const nightlyRate = Number(houseDoc.RentPrice ?? 0);
    const totalAmount = nightlyRate * Math.max(1, rentalDays);
    const tenantObjectId = mongoose_1.default.Types.ObjectId.isValid(args.tenant_id)
        ? new mongoose_1.default.Types.ObjectId(args.tenant_id)
        : undefined;
    const bookingPayload = {
        ownerId: houseDoc.ownerId,
        ownerfullname: houseDoc.ownerfullname,
        owneremail: houseDoc.owneremail,
        ...(tenantObjectId ? { tenantId: tenantObjectId } : {}),
        houseId: houseDoc._id,
        houseCode: houseDoc.houseCode,
        state: houseDoc.state,
        city: houseDoc.city,
        street: houseDoc.street,
        image: houseDoc.image,
        bookedAt: new Date(),
        ContractInitDay: hasValidDates ? checkIn : new Date(),
        leftdays: rentalDays,
        RentPrice: nightlyRate,
        initialAmountToPay: totalAmount,
        paymentStatus: "unpaid",
        notification: `Stay ${args.check_in_date} to ${args.check_out_date}`.slice(0, 100),
    };
    const booking = await booking_1.default.create(bookingPayload);
    return JSON.stringify({
        status: "created",
        bookingId: String(booking._id),
        houseCode: booking.houseCode,
        paymentStatus: booking.paymentStatus,
    });
}, {
    name: "create_booking",
    description: "Create a house booking in MongoDB after human approval using a house ID or houseCode.",
    schema: zod_1.z.object({
        house_id: zod_1.z
            .string()
            .describe("House ObjectId or houseCode such as ARTPTO05"),
        tenant_id: zod_1.z.string().describe("Tenant User ObjectId"),
        check_in_date: zod_1.z.string().describe("Check-in date in YYYY-MM-DD format"),
        check_out_date: zod_1.z.string().describe("Check-out date in YYYY-MM-DD format"),
    }),
});
const tools = [listHousesTool, createBookingTool];
const toolNode = new prebuilt_1.ToolNode(tools);
// 3. Graph state with thread_id memory via MemorySaver
const AgentState = langgraph_1.Annotation.Root({
    messages: (0, langgraph_1.Annotation)({
        reducer: (left, right) => left.concat(right),
        default: () => [],
    }),
});
const openRouterApiKey = process.env.OPENROUTER_API_KEY;
if (!openRouterApiKey) {
    throw new Error("OPENROUTER_API_KEY is required to initialize the rental agent.");
}
const llm = new openai_1.ChatOpenAI({
    model: process.env.OPENAI_MODEL || "meta-llama/llama-3.3-70b-instruct",
    apiKey: openRouterApiKey,
    configuration: {
        baseURL: "https://openrouter.ai/api/v1",
    },
    temperature: 0,
}).bindTools(tools);
async function callModel(state) {
    const systemPrompt = new messages_1.SystemMessage("You are a concise rental assistant. Use list_houses for lookups and create_booking when asked to book a house.");
    const response = await llm.invoke([systemPrompt, ...state.messages]);
    return { messages: [response] };
}
const graph = new langgraph_1.StateGraph(AgentState)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge(langgraph_1.START, "agent")
    .addConditionalEdges("agent", prebuilt_1.toolsCondition, {
    tools: "tools",
    [langgraph_1.END]: langgraph_1.END,
})
    .addEdge("tools", "agent")
    .compile({ checkpointer: new langgraph_1.MemorySaver() });
// 4. POST /api/agent/turn
router.post("/turn", async (req, res) => {
    console.log("Im at agentRoutes - line 188 - req.body");
    try {
        const { thread_id, message, decision } = req.body;
        if (!thread_id) {
            return res.status(400).json({ message: "thread_id is required" });
        }
        const config = { configurable: { thread_id } };
        // Invoke separately so TypeScript matches Command vs. state update overloads cleanly
        const result = decision !== undefined
            ? await graph.invoke(new langgraph_1.Command({ resume: decision }), config)
            : await graph.invoke({ messages: [new messages_1.HumanMessage(message || "")] }, config);
        // Check if LangGraph paused at an interrupt()
        const rawInterrupts = result.__interrupt__;
        if (Array.isArray(rawInterrupts) && rawInterrupts.length > 0) {
            return res.json({
                thread_id,
                status: "interrupted",
                interrupts: rawInterrupts.map((item) => item.value),
                reply: "",
            });
        }
        const lastMsg = result.messages[result.messages.length - 1];
        const reply = lastMsg instanceof messages_1.AIMessage && typeof lastMsg.content === "string"
            ? lastMsg.content
            : "";
        return res.json({
            thread_id,
            status: "completed",
            interrupts: [],
            reply,
        });
    }
    catch (err) {
        console.error("Agent turn error:", err);
        return res.status(500).json({ message: "Failed to process agent turn" });
    }
});
exports.default = router;
