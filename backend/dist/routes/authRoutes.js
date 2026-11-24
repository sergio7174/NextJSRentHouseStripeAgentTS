"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uploads_1 = __importDefault(require("../middleware/uploads"));
const authcontroller_1 = require("../controllers/authcontroller");
const router = (0, express_1.Router)();
// signUp route - home view - menu option Signup
router.post('/signUp', uploads_1.default.single("image"), authcontroller_1.signUp);
// signUp route - home view - menu option login
router.post('/login', authcontroller_1.login);
// Getalladmin route - for checking if there is an admin
router.get('/getoneadmin', authcontroller_1.getOneAdmin);
exports.default = router;
