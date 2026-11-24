"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uploads_1 = __importDefault(require("../middleware/uploads"));
const bookingController_1 = require("../controllers/bookingController");
const router = (0, express_1.Router)();
// post create booking
router.post('/createbooking', bookingController_1.PostCreateBooking);
// get list all bookings by tenant Id
router.get('/listAllBookingsByTenantId/:tenantId', bookingController_1.GetListAllBookingsByTenantId);
// get list all bookings by owner Id
router.get('/listAllBookingsByOwnerId/:ownerId', bookingController_1.GetListAllBookingsByOwnerId);
// get list all bookings documents
router.get('/listAllBookingsDocuments', bookingController_1.GetListAllBookings);
// delete Booking route
router.delete('/delete-Booking/:id', bookingController_1.GetDeleteBookingCtrl);
// update Booking route
router.put('/update-Booking/:id', uploads_1.default.single("image"), bookingController_1.PutUpdateBookingCtrl);
// getSingleProduct route
router.get('/get-single-Booking/:id', bookingController_1.GetSingleBookingCtrl);
// update Booking route a booking document when the house its checked
router.put('/updateBookinghousechecked/:id', uploads_1.default.single("image"), bookingController_1.PutUpdateBookingHouseCheckedCtrl);
// update Booking route a booking document when a maintenance request is created for the house
router.put('/bookinghousecreatemaintreq/:id', uploads_1.default.single("image"), bookingController_1.PutbookinghousecreatemaintreqCtrl);
// update Booking route a booking document when a maintenance request is created for the house
router.put('/bookingupdatemaintreq/:id', uploads_1.default.single("image"), bookingController_1.PutbookingupdatemaintreqCtrl);
exports.default = router;
