"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PutbookingupdatemaintreqCtrl = exports.PutbookinghousecreatemaintreqCtrl = exports.PutUpdateBookingHouseCheckedCtrl = exports.GetListAllBookingsByOwnerId = exports.GetListAllBookingsByTenantId = exports.GetSingleBookingCtrl = exports.PutUpdateBookingCtrl = exports.GetDeleteBookingCtrl = exports.GetListAllBookings = exports.PostCreateBooking = void 0;
const booking_1 = __importDefault(require("../models/booking"));
// function to create Booking
const PostCreateBooking = async (req, res) => {
    console.log("Estoy en BookingController - line 10 - req.body.houseId:  " + req.body.houseId);
    const bookingData = {
        ownerId: req.body.ownerId,
        ownerfullname: req.body.ownerfullname,
        owneremail: req.body.owneremail,
        tenantId: req.body.tenantId,
        tenantfullname: req.body.tenantfullname,
        tenantemail: req.body.tenantemail,
        houseId: req.body.houseId,
        houseCode: req.body.houseCode,
        state: req.body.state,
        city: req.body.city,
        street: req.body.street,
        image: req.body.image,
        bookedAt: new Date(),
        ownerChecked: false,
        approvalStatus: 'notApplied',
        leftdays: 0,
        ContractInitDay: new Date(),
        notification: '',
        RentPrice: req.body.RentPrice,
        contract: false,
        maintenaceRequest: '',
        maintenaceRequestStatus: 'None',
        lastPaymentDate: Date.now(),
    };
    const booking = new booking_1.default(bookingData);
    const newBooking = await booking.save();
    return res.status(200).send({ newBooking, message: "Booking Created Successfully .." });
};
exports.PostCreateBooking = PostCreateBooking;
// function to list all Bookings
const GetListAllBookings = async (req, res) => {
    try {
        const bookings = await booking_1.default.find({}).limit(12).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: bookings,
        });
    }
    catch (error) {
        console.log(error);
        res.status(200).send({ message: `get all Bookings api issue : ${error.message}`, error });
    }
};
exports.GetListAllBookings = GetListAllBookings;
// function to delete a Booking
const GetDeleteBookingCtrl = async (req, res) => {
    try {
        await booking_1.default.findByIdAndDelete(req.params.id);
        res.status(200).send({ message: 'Booking Deleted Successfully' });
    }
    catch (error) {
        console.log(error);
        res.status(200).send({ message: `delete Booking api issue : ${error.message}`, error });
    }
};
exports.GetDeleteBookingCtrl = GetDeleteBookingCtrl;
// function to Edit a Saved Booking
const PutUpdateBookingCtrl = async (req, res) => {
    await booking_1.default.findByIdAndUpdate(req.params.id, {
        nameplan: req.body.nameplan,
        description: req.body.description,
        trialdays: req.body.trialdays,
        features: req.body.features,
        timedays: req.body.timedays,
        cost: req.body.cost,
        code: req.body.code,
        status: req.body.status,
        createdAt: new Date(),
        // Using optional chaining in case req.file is undefined
        image: req.file?.path
    }, { new: true })
        .then(updatedBooking => {
        if (updatedBooking) {
            res.status(200).send({ message: 'Booking updated successfully', updatedBooking });
        }
        else {
            res.status(200).send({ message: 'Booking Not updated successfully' });
            console.log('Booking not found');
        }
    })
        .catch(error => {
        console.error('Error updating Booking:', error);
    });
};
exports.PutUpdateBookingCtrl = PutUpdateBookingCtrl;
// function to get a simple Booking
const GetSingleBookingCtrl = async (req, res) => {
    try {
        // Renamed variable from 'Booking' to 'bookingDoc' to avoid conflict with the imported model
        const bookingDoc = await booking_1.default.findById(req.params.id);
        console.log("Estoy en GetSingleBookingCrtl - line 139 - Booking: " + bookingDoc);
        res.status(200).send({ message: 'Single Booking Fetched Successfully', Booking: bookingDoc });
    }
    catch (error) {
        console.log(error);
        res.status(500).send({ message: `get single Booking api issue : ${error.message}`, error });
    }
};
exports.GetSingleBookingCtrl = GetSingleBookingCtrl;
// function to list all Bookings by Tenant
const GetListAllBookingsByTenantId = async (req, res) => {
    const TenantId = req.params.tenantId;
    console.log("Estoy en BookingController -GetListAllBookingsByTenantId- line 130 - GetListAllBookingsByTenantId: " + TenantId);
    try {
        const Bookings = await booking_1.default.find({ tenantId: TenantId }).limit(12).sort({ createdAt: -1 });
        if (Bookings.length === 0) {
            return res.status(404).send({ message: 'No bookings found for this tenant', total: 0, Bookings: [] });
        }
        console.log("Estoy en BookingController -GetListAllBookingsByTenantId-- line 158 - GetListAllBookings - Bookings[0].houseCode: " + Bookings[0].houseCode);
        return res.status(200).send({ message: 'All Bookings fetched successfully', total: Bookings.length, Bookings });
    }
    catch (error) {
        console.log(error);
        res.status(401).send({ message: `get all Bookings api issue : ${error.message}`, error });
    }
};
exports.GetListAllBookingsByTenantId = GetListAllBookingsByTenantId;
// function to get all Bookings by ownerId
const GetListAllBookingsByOwnerId = async (req, res) => {
    console.log("Im at booking controller- GetListAllHousesByOwnerBtrue - line 153 - req.body.ownerId:  ", req.params.ownerId);
    try {
        const ownerId = req.params.ownerId;
        console.log("Im at booking controller - GetListAllHousesByOwnerId- line 158 - req.body.ownerId:  ", req.params.ownerId);
        if (!ownerId) {
            return res.status(401).send({ message: 'ownerId is required to fetch houses by owner' });
        }
        const ownerbooking = await booking_1.default.find({ ownerId: ownerId }).limit(12).sort({ createdAt: -1 });
        console.log("Im at booking controller - GetListAllHousesByOwnerId - line 163 - houses:  ", ownerbooking.length);
        if (ownerbooking.length > 0) {
            return res.status(200).send({
                message: 'Houses fetched successfully for owner and booked: true',
                total: ownerbooking.length,
                ownerbooking: ownerbooking
            });
        }
        if (ownerbooking.length === 0) {
            return res.status(401).send({
                message: 'get houses by owner api issue. Database Empty for this ownerId and booked: true',
            });
        }
    }
    catch (error) {
        console.error('Error fetching houses by owner:', error);
        return res.status(401).send({ message: `get houses by owner api issue : ${error.message}`, error });
    }
};
exports.GetListAllBookingsByOwnerId = GetListAllBookingsByOwnerId;
// function to update a Booking when the house is checked by the owner
const PutUpdateBookingHouseCheckedCtrl = async (req, res) => {
    const monthlyPrice = req.body.RentPrice;
    console.log("Estoy en BookingController - line 203 - PutUpdateBookingHouseCheckedCtrl - monthlyPrice: " + monthlyPrice);
    /** Block to calculate the # of days to pay the rent of the house booked by the user */
    const today = new Date();
    const currentDay = today.getDate();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0 = Jan, 11 = Dec
    let rentStartDate;
    // 1. Determine official rent cycle start date
    if (currentDay > 15) {
        rentStartDate = new Date(currentYear, currentMonth + 1, 1);
    }
    else {
        rentStartDate = new Date(currentYear, currentMonth, 1);
    }
    // 2. Get total days in the current month to find the exact daily rate
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyRate = monthlyPrice / totalDaysInMonth;
    // 3. Calculate remaining days left in the month (inclusive of today)
    const daysLeftInMonth = (totalDaysInMonth - currentDay) + 1;
    // 4. Calculate the prorated amount to pay for the rest of this month
    const initialAmountToPay = parseFloat((dailyRate * daysLeftInMonth).toFixed(2));
    /*** End of Block ***/
    await booking_1.default.findByIdAndUpdate(req.params.id, {
        ownerChecked: req.body.ownerChecked,
        approvalStatus: req.body.approvalStatus,
        leftdays: daysLeftInMonth,
        initialAmountToPay: initialAmountToPay,
        initialAmountToPayStatus: 'Not Paid',
        contract: true,
    }, { new: true })
        .then(updatedHousebookedownerChecked => {
        if (updatedHousebookedownerChecked) {
            res.status(200).send({ message: 'Booking updated successfully', updatedHousebookedownerChecked });
        }
        else {
            res.status(401).send({ message: 'Booking Not updated successfully' });
            console.log('House not found');
        }
    })
        .catch(error => {
        console.error('Error updating House:', error);
    });
};
exports.PutUpdateBookingHouseCheckedCtrl = PutUpdateBookingHouseCheckedCtrl;
// function to update a Booking creating a maintenance request by the Owner
const PutbookinghousecreatemaintreqCtrl = async (req, res) => {
    await booking_1.default.findByIdAndUpdate(req.params.id, {
        maintenaceRequest: req.body.maintenaceRequest,
    }, { new: true })
        .then(maintenaceRequestUpdated => {
        if (maintenaceRequestUpdated) {
            console.log('House updated successfully - line 280 - PutbookinghousecreatemaintreqCtrl:', maintenaceRequestUpdated);
            res.status(200).send({ message: 'Booking updated successfully', maintenaceRequestUpdated });
        }
        else {
            res.status(401).send({ message: 'Booking Not updated successfully' });
            console.log('House not found');
        }
    })
        .catch(error => {
        console.error('Error updating House:', error);
    });
};
exports.PutbookinghousecreatemaintreqCtrl = PutbookinghousecreatemaintreqCtrl;
// function to update a Booking deleting a maintenance request by Admin
const PutbookingupdatemaintreqCtrl = async (req, res) => {
    await booking_1.default.findByIdAndUpdate(req.params.id, {
        maintenaceRequest: req.body.maintenaceRequest,
        maintenaceRequestStatus: req.body.maintenaceRequestStatus,
    }, { new: true })
        .then(maintenaceRequestUpdated => {
        if (maintenaceRequestUpdated) {
            console.log('Booking Document updated successfully:', maintenaceRequestUpdated);
            res.status(200).send({ message: 'Booking updated successfully', maintenaceRequestUpdated });
        }
        else {
            res.status(401).send({ message: 'Booking Not updated successfully' });
            console.log('House not found');
        }
    })
        .catch(error => {
        console.error('Error updating Booking:', error);
    });
};
exports.PutbookingupdatemaintreqCtrl = PutbookingupdatemaintreqCtrl;
