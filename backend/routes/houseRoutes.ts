import { Router } from "express";
import upload from "../middleware/uploads";
import {
  PostcreateHouse,
  PostdeleteImageCtrl,
  GetListAllHousesBookedFalse,
  GetListAllHousesByOwnerBfalse,
  GetListAllHousesByOwnerBtrue,
  GetListAllHousesByOwnerId,
  GetSingleHouseCtrl,
  GetListAllHouses,
  deleteHouseCtrl,
  PutupdateHouseCtrl,
  PutupdateHouseOldImageCtrl,
  PutupdateHouseBookedCtrl
} from "../controllers/houseController";

const router = Router();

// create House route by owner
router.post('/createhouse', upload.single("image"), PostcreateHouse);

// delete Image route by owner
router.post('/delete-image', PostdeleteImageCtrl);

// get all Houses by admin
router.get('/listAllHouses', GetListAllHouses);

// get all Houses by Owner Id route
router.get('/GetListAllHousesByOwnerId/:ownerId', GetListAllHousesByOwnerId);

// get all Houses Booked False route by owner
router.get('/listAllHousesBookedFalse', GetListAllHousesBookedFalse);

// get all Houses route by owner 
router.get('/listAllbyOwnerBfalse/:ownerId', GetListAllHousesByOwnerBfalse);

// get all Houses route by owner
router.get('/listAllbyOwnerBtrue/:ownerId', GetListAllHousesByOwnerBtrue);

// getSingleProduct route by owner
router.get('/get-single-House/:id', GetSingleHouseCtrl);

// delete house route by owner
router.delete('/delete-house/:id', deleteHouseCtrl);

// update House route new Imagen by owner
router.put('/update-house/:id', upload.single("image"), PutupdateHouseCtrl);

// update House booked route 
router.put('/update-housebooked/:id', upload.single("image"), PutupdateHouseBookedCtrl);

// update House route keeping old Imagen
router.put('/update-houseOLdImage/:id', PutupdateHouseOldImageCtrl);

export default router;