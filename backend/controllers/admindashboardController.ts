// nexthouserentingDeepAgentTSBETS\backend\controllers\admindashboardController.ts
import { Request, Response } from "express";
import { z } from "zod";
import User from "../models/user";
import Booking from "../models/booking";
import House from "../models/houses";

// ==========================================
// ZOD SCHEMAS & TYPES
// ==========================================

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});

const maintenanceQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(["Pending", "In Progress", "Completed", "All"]).optional(),
});

type MaintenanceStatus = "Pending" | "In Progress" | "Completed" | "Rejected";

const ACTIVE_OR_TRACKED_STATUSES: MaintenanceStatus[] = [
  "Pending",
  "In Progress",
  "Completed",
  "Rejected",
];

function resolveMaintenanceStatusFilter(
  status?: "Pending" | "In Progress" | "Completed" | "All"
) {
  if (status && status !== "All") {
    return status;
  }
  return { $in: ACTIVE_OR_TRACKED_STATUSES };
}

interface UserCountAggregation {
  _id: string;
  count: number;
}

interface FundsAggregation {
  _id: null;
  totalFunds: number;
}

function sendValidationError(res: Response, error: z.ZodError) {
  return res.status(400).json({
    success: false,
    message: "Invalid query parameters",
    errors: error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });
}

// ==========================================
// CONTROLLERS
// ==========================================

export const getDashboardStats = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // 1. Get counts from USER collection using aggregation for efficiency
    const userCounts = await User.aggregate<UserCountAggregation>([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      tenants: 0,
      admins: 0,
      owners: 0,
      activeContracts: 0,
      incomingFunds: 0,
      maintenanceRequests: 0,
      activeUsersCount: 0,
    };

    stats.activeUsersCount = await User.countDocuments({
      role: { $in: ["Admin", "Owner", "Tenant"] },
    });

    userCounts.forEach((item) => {
      if (item._id === "Tenant") stats.tenants = item.count;
      if (item._id === "Admin") stats.admins = item.count;
      if (item._id === "Owner") stats.owners = item.count;
    });

    // 2. ACTIVE CONTRACTS: Counts where contract is true
    stats.activeContracts = await Booking.countDocuments({ contract: true });

    // 3. INCOMING FUNDS: Sum of RentPrice where status is 'Paid' / 'Completed'
    const fundsResult = await Booking.aggregate<FundsAggregation>([
      {
        $match: {
          $or: [
            { initialAmountToPayStatus: "Paid" },
            { lastPaymentStatus: "Completed" },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalFunds: { $sum: "$RentPrice" },
        },
      },
    ]);
    stats.incomingFunds = fundsResult.length > 0 ? fundsResult[0].totalFunds : 0;

    // 4. NUMBER OF MAINTENANCE REQUESTS: Filter out 'None' statuses
    stats.maintenanceRequests = await Booking.countDocuments({
      maintenaceRequestStatus: { $in: ["Pending", "In Progress"] },
    });

    req.log.info(
      {
        tenants: stats.tenants,
        admins: stats.admins,
        owners: stats.owners,
        activeContracts: stats.activeContracts,
        incomingFunds: stats.incomingFunds,
        maintenanceRequests: stats.maintenanceRequests,
        activeUsersCount: stats.activeUsersCount,
      },
      "Admin dashboard stats computed"
    );

    return res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    req.log.error(
      { err: error },
      "Error fetching admin dashboard stats"
    );
    return res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
      error: error.message,
    });
  }
};

// 1. Get Latest Houses Created (default 12, capped at 50)
export const getLatestCreatedHouses = async (
  req: Request,
  res: Response
): Promise<any> => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const latestHouses = await House.find({})
      .sort({ createdAt: -1 })
      .limit(parsed.data.limit)
      .lean();

    req.log.info(
      {
        limit: parsed.data.limit,
        returnedCount: latestHouses.length,
      },
      "Latest created houses fetched"
    );

    return res.status(200).json({
      success: true,
      data: latestHouses,
    });
  } catch (error: any) {
    req.log.error(
      { err: error, limit: parsed.data.limit },
      "Error fetching latest created houses"
    );
    return res.status(500).json({
      success: false,
      message: "Error fetching latest created houses",
      error: error.message,
    });
  }
};

// 2. Get Latest Houses Booked (default 12, capped at 50)
export const getLatestBookedHouses = async (
  req: Request,
  res: Response
): Promise<any> => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const latestBookings = await Booking.find({})
      .sort({ bookedAt: -1 })
      .limit(parsed.data.limit)
      .lean();

    req.log.info(
      {
        limit: parsed.data.limit,
        returnedCount: latestBookings.length,
      },
      "Latest booked houses fetched"
    );

    return res.status(200).json({
      success: true,
      data: latestBookings,
    });
  } catch (error: any) {
    req.log.error(
      { err: error, limit: parsed.data.limit },
      "Error fetching latest booked houses"
    );
    return res.status(500).json({
      success: false,
      message: "Error fetching latest booked houses",
      error: error.message,
    });
  }
};

// Get the latest maintenance requests (default 12, capped at 100)
export const getLatestMaintenanceRequests = async (
  req: Request,
  res: Response
): Promise<any> => {
  const parsed = maintenanceQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const limit = parsed.data.limit ?? 12;
    const statusFilter = resolveMaintenanceStatusFilter(parsed.data.status);

    const latestRequests = await Booking.find({
      maintenaceRequestStatus: statusFilter,
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    req.log.info(
      {
        limit,
        status: parsed.data.status ?? "ActiveOrTracked",
        returnedCount: latestRequests.length,
      },
      "Latest maintenance requests fetched"
    );

    return res.status(200).json({
      success: true,
      data: latestRequests,
    });
  } catch (error: any) {
    req.log.error(
      {
        err: error,
        limit: parsed.data.limit ?? 12,
        status: parsed.data.status ?? "ActiveOrTracked",
      },
      "Error fetching latest maintenance requests"
    );
    return res.status(500).json({
      success: false,
      message: "Error fetching maintenance requests",
      error: error.message,
    });
  }
};

// Get all maintenance requests (optional bounded limit and status filter)
export const getallMaintenanceRequests = async (
  req: Request,
  res: Response
): Promise<any> => {
  const parsed = maintenanceQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const statusFilter = resolveMaintenanceStatusFilter(parsed.data.status);

    let query = Booking.find({
      maintenaceRequestStatus: statusFilter,
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (parsed.data.limit !== undefined) {
      query = query.limit(parsed.data.limit);
    }

    const latestRequests = await query;

    req.log.info(
      {
        limit: parsed.data.limit ?? null,
        status: parsed.data.status ?? "ActiveOrTracked",
        returnedCount: latestRequests.length,
      },
      "All maintenance requests fetched"
    );

    return res.status(200).json({
      success: true,
      data: latestRequests,
    });
  } catch (error: any) {
    req.log.error(
      {
        err: error,
        limit: parsed.data.limit ?? null,
        status: parsed.data.status ?? "ActiveOrTracked",
      },
      "Error fetching all maintenance requests"
    );
    return res.status(500).json({
      success: false,
      message: "Error fetching maintenance requests",
      error: error.message,
    });
  }
};