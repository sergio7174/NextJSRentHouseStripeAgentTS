"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uploads_1 = __importDefault(require("../middleware/uploads"));
const houseController_1 = require("../controllers/houseController");
const router = (0, express_1.Router)();
// create House route by owner
router.post('/createhouse', uploads_1.default.single("image"), houseController_1.PostcreateHouse);
// delete Image route by owner
router.post('/delete-image', houseController_1.PostdeleteImageCtrl);
// get all Houses by admin
router.get('/listAllHouses', houseController_1.GetListAllHouses);
// get all Houses by Owner Id route
router.get('/GetListAllHousesByOwnerId/:ownerId', houseController_1.GetListAllHousesByOwnerId);
// get all Houses Booked False route by owner
router.get('/listAllHousesBookedFalse', houseController_1.GetListAllHousesBookedFalse);
// get all Houses route by owner 
router.get('/listAllbyOwnerBfalse/:ownerId', houseController_1.GetListAllHousesByOwnerBfalse);
// get all Houses route by owner
router.get('/listAllbyOwnerBtrue/:ownerId', houseController_1.GetListAllHousesByOwnerBtrue);
// getSingleProduct route by owner
router.get('/get-single-House/:id', houseController_1.GetSingleHouseCtrl);
// delete house route by owner
router.delete('/delete-house/:id', houseController_1.deleteHouseCtrl);
// update House route new Imagen by owner
router.put('/update-house/:id', uploads_1.default.single("image"), houseController_1.PutupdateHouseCtrl);
// update House booked route 
router.put('/update-housebooked/:id', uploads_1.default.single("image"), houseController_1.PutupdateHouseBookedCtrl);
// update House route keeping old Imagen
router.put('/update-houseOLdImage/:id', houseController_1.PutupdateHouseOldImageCtrl);
exports.default = router;
