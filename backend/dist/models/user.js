// nexthouserentingDeepAgentTypescript\backend\models\user.ts
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_2 = require("mongoose");
const userSchema = new mongoose_2.Schema({
    fullName: { type: String },
    email: { type: String, unique: true },
    ide: { type: String, unique: true },
    password: { type: String },
    role: {
        type: String,
        required: true,
        enum: ['Admin', 'Owner', 'Tenant'], // Restricts values to these three options
        default: 'None' // Sets a default value if none is provided
    },
    image: { type: String, require: true },
    phoneNumber: { type: String },
    timestamps: { type: Boolean, default: true },
});
const User = mongoose_1.default.model('User', userSchema);
exports.default = User;
