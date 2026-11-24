// nexthouserentingDeepAgentTypescript\backend\models\houses.ts
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_2 = require("mongoose");
const houseSchema = new mongoose_2.Schema({
    houseCode: { type: String },
    ownerId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' },
    ownerfullname: { type: String, },
    owneremail: { type: String, unique: true },
    description: { type: String, },
    booked: { type: Boolean, default: false,
        required: true,
    },
    pincode: { type: String },
    state: { type: String },
    city: { type: String },
    street: { type: String },
    landmark: { type: String },
    totalRooms: { type: Number, default: 0 },
    legalDocuments: [{ type: String }],
    image: { type: String },
    createdAt: { type: Date },
    RentPrice: { type: Number, default: 0 }
}, {
    // The timestamps property lets Mongoose know to include the createdAt and updatedAt
    // values, which are useful for keeping records on how and when data changes
    timestamps: true
});
exports.default = mongoose_1.default.model('Houses', houseSchema);
