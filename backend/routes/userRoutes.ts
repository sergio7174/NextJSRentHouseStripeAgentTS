"use strict";

import { Router } from "express";
import upload from "../middleware/uploads";
import * as usersController from "../controllers/userController";

const router = Router();

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
router.put("/updateuserNewImage/:userid", upload.single("image"), usersController.GetUserByIdAndUpdateNewImage);

// Add a route to handle put requests to update password
router.put("/updatepassword/:id", usersController.PutUpdatePassword);

// Add a route to handle get requests to the profile view option
router.get("/profile/:userid", usersController.GetProfileData);

// delete User route
router.delete('/delete-user/:id', usersController.DeleteUserCtrl);

export default router;