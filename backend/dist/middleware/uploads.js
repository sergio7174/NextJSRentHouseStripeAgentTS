"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const dir = './uploads';
        // Check if directory exists
        if (!fs_1.default.existsSync(dir)) {
            // Create directory if it doesn't exist
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: function (req, file, callback) {
        if (file.mimetype !== "image/png" &&
            file.mimetype !== "image/jpg" &&
            file.mimetype !== "image/jpeg") {
            return callback(new Error("Only images are allowed"));
        }
        callback(null, true);
    },
    limits: {
        fileSize: 1024 * 1024 * 5
    }
});
exports.default = upload;
