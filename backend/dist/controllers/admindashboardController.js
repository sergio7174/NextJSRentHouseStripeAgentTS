"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getallMaintenanceRequests = exports.getLatestMaintenanceRequests = exports.getLatestBookedHouses = exports.getLatestCreatedHouses = exports.getDashboardStats = void 0;
const user_1 = __importDefault(require("../models/user"));
const booking_1 = __importDefault(require("../models/booking"));
const houses_1 = __importDefault(require("../models/houses"));
const getDashboardStats = async (req, res) => {
    try {
        // 1. Get counts from USER collection using aggregation for efficiency
        const userCounts = await user_1.default.aggregate([
            {
                $group: {
                    _id: "$role",
                    count: { $sum: 1 }
                }
            }
        ]);
        // Map the aggregation result to a readable format
        const stats = {
            tenants: 0,
            admins: 0,
            owners: 0,
            activeContracts: 0,
            incomingFunds: 0,
            maintenanceRequests: 0,
            activeUsersCount: 0
        };
        stats.activeUsersCount = await user_1.default.countDocuments({
            role: { $in: ['Admin', 'Owner', 'Tenant'] }
        });
        userCounts.forEach(item => {
            if (item._id === 'Tenant')
                stats.tenants = item.count;
            if (item._id === 'Admin')
                stats.admins = item.count;
            if (item._id === 'Owner')
                stats.owners = item.count;
        });
        // 2. ACTIVE CONTRACTS: Counts where contract is true
        stats.activeContracts = await booking_1.default.countDocuments({ contract: true });
        // 3. INCOMING FUNDS: Sum of RentPrice or initialAmountToPay where status is 'Paid' / 'Completed'
        const fundsResult = await booking_1.default.aggregate([
            {
                $match: {
                    $or: [
                        { initialAmountToPayStatus: 'Paid' },
                        { lastPaymentStatus: 'Completed' }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    totalFunds: { $sum: "$RentPrice" }
                }
            }
        ]);
        stats.incomingFunds = fundsResult.length > 0 ? fundsResult[0].totalFunds : 0;
        // 4. NUMBER OF MAINTENANCE REQUESTS: Filter out 'None' statuses
        stats.maintenanceRequests = await booking_1.default.countDocuments({
            maintenaceRequestStatus: { $in: ['Pending', 'In Progress'] }
        });
        console.log("Estoy en adminDashboardController - line 66 - stats.maintenanceRequests: " + stats.maintenanceRequests);
        console.log("Estoy en adminDashboardController - line 67 - stats.incomingFunds: " + stats.incomingFunds);
        console.log("Estoy en adminDashboardController - line 68 - stats.tenants: " + stats.tenants);
        console.log("Estoy en adminDashboardController - line 69 - stats.admins: " + stats.admins);
        console.log("Estoy en adminDashboardController - line 70 - stats.owners: " + stats.owners);
        console.log("Estoy en adminDashboardController - line 71 - stats.activeContracts: " + stats.activeContracts);
        console.log("Estoy en adminDashboardController - line 72 - stats.activeUsersCount: " + stats.activeUsersCount);
        return res.status(200).json({ success: true, data: stats });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching dashboard data",
            error: error.message
        });
    }
};
exports.getDashboardStats = getDashboardStats;
// 1. Get 12 Latest Houses Created
const getLatestCreatedHouses = async (req, res) => {
    try {
        const latestHouses = await houses_1.default.find({})
            .sort({ createdAt: -1 }) // Sort by newest first
            .limit(12); // Limit results to 12 documents
        return res.status(200).json({
            success: true,
            data: latestHouses
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching latest created houses",
            error: error.message
        });
    }
};
exports.getLatestCreatedHouses = getLatestCreatedHouses;
// 2. Get 12 Latest Houses Booked
const getLatestBookedHouses = async (req, res) => {
    try {
        const latestBookings = await booking_1.default.find({})
            .sort({ bookedAt: -1 }) // Sort by newest bookings first
            .limit(12); // Limit results to 12 documents
        return res.status(200).json({
            success: true,
            data: latestBookings
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching latest booked houses",
            error: error.message
        });
    }
};
exports.getLatestBookedHouses = getLatestBookedHouses;
// function to get the latest maintenance requests
const getLatestMaintenanceRequests = async (req, res) => {
    console.log("Im at admindashboardcontroller - line 128 - getLatestMaintenanceRequests ");
    try {
        const latestRequests = await booking_1.default.find({
            maintenaceRequestStatus: { $ne: 'None' }
        })
            .sort({ updatedAt: -1 })
            .limit(12);
        return res.status(200).json({
            success: true,
            data: latestRequests
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching maintenance requests",
            error: error.message
        });
    }
};
exports.getLatestMaintenanceRequests = getLatestMaintenanceRequests;
// function to get the all maintenance requests
const getallMaintenanceRequests = async (req, res) => {
    console.log("Im at admindashboardcontroller - line 152 - getalltMaintenanceRequests ");
    try {
        const latestRequests = await booking_1.default.find({
            maintenaceRequestStatus: { $ne: 'None' }
        })
            .sort({ updatedAt: -1 });
        return res.status(200).json({
            success: true,
            data: latestRequests
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching maintenance requests",
            error: error.message
        });
    }
};
exports.getallMaintenanceRequests = getallMaintenanceRequests;
