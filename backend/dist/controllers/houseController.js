"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetListAllHousesByOwnerId = exports.GetListAllHousesBookedFalse = exports.GetListAllHouses = exports.GetSingleHouseCtrl = exports.PutupdateHouseOldImageCtrl = exports.PutupdateHouseBookedCtrl = exports.PutupdateHouseCtrl = exports.deleteHouseCtrl = exports.PostdeleteImageCtrl = exports.GetListAllHousesByOwnerBtrue = exports.GetListAllHousesByOwnerBfalse = exports.PostcreateHouse = void 0;
const houses_1 = __importDefault(require("../models/houses"));
const fs_1 = __importDefault(require("fs"));
// function to create House
const PostcreateHouse = async (req, res) => {
    const imagePath = req.file?.path || '/uploads/default-house.jpg';
    console.log('Estoy en HouseController - line 12 - imagePath: ' + imagePath);
    const houseCodeExists = await houses_1.default.findOne({ houseCode: req.body.houseCode });
    if (houseCodeExists) {
        return res.status(401).json({ message: 'houseCode already exits' });
    }
    const NewHouse = new houses_1.default({
        houseCode: req.body.houseCode,
        ownerId: req.body.ownerId,
        ownerfullname: req.body.ownerfullname,
        owneremail: req.body.owneremail,
        description: req.body.description,
        booked: req.body.booked ?? false,
        pincode: req.body.pincode,
        state: req.body.state,
        city: req.body.city,
        street: req.body.street,
        landmark: req.body.landmark,
        totalRooms: req.body.totalRooms,
        legalDocuments: req.body.legalDocuments,
        RentPrice: req.body.RentPrice,
        createdAt: new Date(),
        image: imagePath,
    });
    await NewHouse.save();
    return res.status(200).send({ NewHouse, message: 'House Created Successfully ..' });
};
exports.PostcreateHouse = PostcreateHouse;
// function to list all Houses booked=false
const GetListAllHousesByOwnerBfalse = async (req, res) => {
    console.log("Estoy en HouseController - line 45 - GetListAllHousesBookedFalse");
    console.log("Im at house controller- GetListAllHousesByOwnerBfalse - line 46 - req.params.ownerId:  ", req.params.ownerId);
    try {
        const ownerId = req.params.ownerId;
        const booked = false;
        if (!ownerId) {
            return res.status(400).send({ message: 'ownerId is required to fetch houses by owner' });
        }
        const houses = await houses_1.default.find({ ownerId, booked }).limit(12).sort({ createdAt: -1 });
        console.log("Estoy en HouseController - line 53 - GetListAllHousesBookedFalse: " + houses.length);
        res.status(200).send({
            message: 'All Houses fetched successfully for owner and booked: false',
            total: houses.length,
            availableHousesRaw: houses
        });
    }
    catch (error) {
        console.log(error);
        res.status(401).send({ message: `get all Houses api issue : ${error.message}`, error });
    }
};
exports.GetListAllHousesByOwnerBfalse = GetListAllHousesByOwnerBfalse;
const GetListAllHousesByOwnerBtrue = async (req, res) => {
    try {
        const ownerId = req.params.ownerId;
        const booked = true;
        if (!ownerId) {
            return res.status(400).send({ message: 'ownerId is required to fetch houses by owner' });
        }
        const houses = await houses_1.default.find({ ownerId, booked }).limit(12).sort({ createdAt: -1 });
        return res.status(200).send({
            message: 'Houses fetched successfully for owner and booked: true',
            total: houses.length,
            houses
        });
    }
    catch (error) {
        console.error('Error fetching houses by owner:', error);
        return res.status(500).send({ message: `get houses by owner api issue : ${error.message}`, error });
    }
};
exports.GetListAllHousesByOwnerBtrue = GetListAllHousesByOwnerBtrue;
// function to delete a House Image from Uploads dir when House is erased
const PostdeleteImageCtrl = async (req, res) => {
    const Image = req.body.image;
    const filePath = Image;
    fs_1.default.unlink(filePath, (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(200).send({ message: 'File not found' });
            }
            return res.status(200).send({ message: 'Error deleting file', error: err });
        }
        res.status(200).json({ message: 'File deleted successfully' });
    });
};
exports.PostdeleteImageCtrl = PostdeleteImageCtrl;
// function to delete a House
const deleteHouseCtrl = async (req, res) => {
    try {
        const housedeleted = await houses_1.default.findByIdAndDelete(req.params.id);
        res.status(200).send({ message: 'House Deleted Successfully' });
    }
    catch (error) {
        console.log(error);
        res.status(401).send({ message: `delete House api issue : ${error.message}`, error });
    }
};
exports.deleteHouseCtrl = deleteHouseCtrl;
// function to Edit a Saved House
const PutupdateHouseCtrl = async (req, res) => {
    if (req.params.id) {
        // console.log("Estoy en HouseController - line 123 - PutupdateHouseCtrl - req.params.id: "+req.params.id);
    }
    await houses_1.default.findByIdAndUpdate(req.params.id, {
        houseCode: req.body.houseCode,
        ownerId: req.body.ownerId,
        description: req.body.description,
        booked: req.body.booked,
        pincode: req.body.pincode,
        state: req.body.state,
        city: req.body.city,
        street: req.body.street,
        landmark: req.body.landmark,
        totalRooms: req.body.totalRooms,
        legalDocuments: req.body.legalDocuments,
        RentPrice: req.body.RentPrice,
        // Using optional chaining in case req.file is undefined
        image: req.file?.path,
    }, { new: true })
        .then(updatedHouse => {
        if (updatedHouse) {
            res.status(200).send({ message: 'House updated successfully', updatedHouse });
        }
        else {
            res.status(401).send({ message: 'House Not updated successfully' });
            console.log('House not found');
        }
    })
        .catch(error => {
        console.error('Error updating House:', error);
    });
};
exports.PutupdateHouseCtrl = PutupdateHouseCtrl;
// function to update a House keeping the old image
const PutupdateHouseBookedCtrl = async (req, res) => {
    console.log("Estoy en HouseController - line 160 - PutupdateHouseBookedCtrl - : Here we go");
    console.log("Estoy en HouseController - line 161 - PutupdateHouseBookedCtrl - req.body.houseCode: " + req.body.houseCode);
    console.log("Estoy en HouseController - line 162 - PutupdateHouseBookedCtrl - req.params.id: " + req.params.id);
    await houses_1.default.findByIdAndUpdate(req.params.id, {
        booked: req.body.booked,
    }, { new: true })
        .then(updatedHousebooked => {
        if (updatedHousebooked) {
            console.log('House updated successfully - line 214:', updatedHousebooked);
            res.status(200).send({ message: 'House updated successfully', updatedHousebooked });
        }
        else {
            res.status(401).send({ message: 'House Not updated successfully' });
            console.log('House not found');
        }
    })
        .catch(error => {
        console.error('Error updating House:', error);
    });
};
exports.PutupdateHouseBookedCtrl = PutupdateHouseBookedCtrl;
// function to update a House keeping the old image
const PutupdateHouseOldImageCtrl = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).send({ message: 'House id is required' });
        }
        const updatedHouse = await houses_1.default.findByIdAndUpdate(req.params.id, {
            houseCode: req.body.houseCode,
            ownerId: req.body.ownerId,
            description: req.body.description,
            booked: req.body.booked,
            pincode: req.body.pincode,
            state: req.body.state,
            city: req.body.city,
            street: req.body.street,
            landmark: req.body.landmark,
            totalRooms: req.body.totalRooms,
            legalDocuments: req.body.legalDocuments,
            RentPrice: req.body.RentPrice,
            image: req.body.image,
        }, { new: true });
        if (!updatedHouse) {
            return res.status(404).send({ message: 'House not found' });
        }
        res.status(200).send({ message: 'House updated successfully', updatedHouse });
    }
    catch (error) {
        console.error('Error updating House:', error);
        res.status(500).send({ message: `update House api issue: ${error.message}`, error });
    }
};
exports.PutupdateHouseOldImageCtrl = PutupdateHouseOldImageCtrl;
// function to get a simple House
const GetSingleHouseCtrl = async (req, res) => {
    try {
        const house = await houses_1.default.findById(req.params.id);
        if (!house) {
            return res.status(404).send({ message: 'House not found' });
        }
        res.status(200).send({ message: 'Single House Fetched Successfully', house: house });
    }
    catch (error) {
        console.log(error);
        res.status(500).send({ message: `get single House api issue : ${error.message}`, error });
    }
};
exports.GetSingleHouseCtrl = GetSingleHouseCtrl;
// function to list all Houses booked=false
const GetListAllHouses = async (req, res) => {
    console.log("Estoy en HouseController - line 247 - GetListAllHouses");
    try {
        const houses = await houses_1.default.find({}).limit(12).sort({ createdAt: -1 });
        if (houses.length > 0) {
            return res.status(200).json({
                success: true,
                data: houses
            });
        }
        if (houses.length === 0) {
            return res.status(401).json({
                success: false,
            });
        }
    }
    catch (error) {
        console.log(error);
        res.status(401).send({ message: `get all Houses api issue : ${error.message}`, error });
    }
};
exports.GetListAllHouses = GetListAllHouses;
// function to list all Bookings by booked false
const GetListAllHousesBookedFalse = async (req, res) => {
    console.log("Estoy en BookingController - GetListAllBookingsBookedfalse - line 272 - ");
    try {
        const houses = await houses_1.default.find({ booked: false }).limit(12).sort({ createdAt: -1 });
        res.status(200).send({ message: 'All Bookings fetched successfully', total: houses.length, houses });
    }
    catch (error) {
        console.log(error);
        res.status(200).send({ message: `get all Bookings api issue : ${error.message}`, error });
    }
};
exports.GetListAllHousesBookedFalse = GetListAllHousesBookedFalse;
// function to list all Houses booked=false
const GetListAllHousesByOwnerId = async (req, res) => {
    console.log("Estoy en HouseController - line 286 - GetListAllHousesyOwnerId");
    try {
        const houses = await houses_1.default.find({ ownerId: req.params.ownerId }).limit(12).sort({ createdAt: -1 });
        console.log("Estoy en HouseController - line 290 - GetListAllHousesyOwnerId: " + houses);
        res.status(200).send({ message: 'All Houses fetched successfully for owner Id', total: houses.length, houses });
    }
    catch (error) {
        console.log(error);
        res.status(401).send({ message: `get all Houses api issue : ${error.message}`, error });
    }
};
exports.GetListAllHousesByOwnerId = GetListAllHousesByOwnerId;
