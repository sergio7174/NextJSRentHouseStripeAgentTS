"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uploads_1 = __importDefault(require("../middleware/uploads"));
const usersController = __importStar(require("../controllers/userController"));
const router = (0, express_1.Router)();
// delete Image route
router.post('/delete-image', usersController.PostDeleteImageCtrl);
// Add a route to handle GET requests to the GETALLUSERS option
router.get("/getallusers", usersController.GETALLUSERS);
// Add a route to handle GET requests to the USEREMAILCHECK option
router.get("/uemailcheck/:uemail", usersController.GETUSEREMAILCHECK);
// Add a route to handle GET requests to the GETUSERBYID option
router.get("/getuserbyid/:userid", usersController.GETUSERBYID);
// Add a route to handle put requests to the GetUserByIdAndUpdate option 
// without a new image, I mean keeping the old image saved in the database
router.put("/updateuser/:userid", usersController.GetUserByIdAndUpdate);
// Add a route to handle put requests to the GetUserByIdAndUpdate option 
// with a new image
router.put("/updateuserNewImage/:userid", uploads_1.default.single("image"), usersController.GetUserByIdAndUpdateNewImage);
// Add a route to handle put requests to update password
router.put("/updatepassword/:id", usersController.PutUpdatePassword);
// Add a route to handle get requests to the profile view option
router.get("/profile/:userid", usersController.GetProfileData);
// delete User route
router.delete('/delete-user/:id', usersController.DeleteUserCtrl);
exports.default = router;
