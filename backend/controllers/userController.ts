"use strict";

import { Request, Response } from "express";
import User from "../models/user";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import fs from "fs";

// Note: process.env variables should ideally be strings.
process.env.TOKEN_KEY = "Sergio";
const TOKEN_EXPIRY_SECONDS = 24 * 60 * 60;

export const register = async (req: Request, res: Response): Promise<any> => {
  console.log("Estoy en userController - line 35 - register - req.body.uemail: " + req.body.email);
  console.log("Estoy en userController - line 36 - register - req.body: ", req.body);

  if (!(req.body.uemail && req.body.userpass)) {
    return res.status(400).json({ message: 'Email and password not present' });
  }
  const { uemail, userpass } = req.body;

  const emailExists = await User.exists({ uemail });

  if (emailExists) {
    return res.status(400).json({ message: 'Email already exits' });
  }

  const newUser = new User(req.body);
  newUser.save();

  return res.status(200).json(newUser);
};

// login action
export const login = async (req: Request, res: Response): Promise<any> => {
  const { uemail, userpass } = req.body;

  const user = await User.findOne({ uemail });
  if (!user) {
    return res.status(409).json({ message: "User does not exists" });
  }
  // Checking if userpass exists on your typed model
  if (!((user as any).userpass === userpass)) {
    return res.status(409).json({ message: 'Incorrect userpass' });
  }

  // TypeScript requires the secret to be strictly a string
  const token = jwt.sign(
    { user_id: user._id }, 
    process.env.TOKEN_KEY as string, 
    { expiresIn: TOKEN_EXPIRY_SECONDS }
  );

  // save user token
  (user as any).token = token;

  let data = user;

  res.json(data);
};

// Add a Action to handle GET requests to the GETALLUSERS option
export const GETALLUSERS = async (req: Request, res: Response): Promise<any> => {
  console.log("Im at usercontroller - line 73 - GETALLUSERS ");
  try {
    // Finds bookings that have a valid maintenance status (excluding 'None')
    const allusers = await User.find({})
      .sort({ updatedAt: -1 }) // Sort by latest updated requests first
      .limit(12);              // Restrict result count to 12

    console.log("Im at usercontroller - line 81 - GETALLUSERS - allusers.length: " + allusers.length);
    return res.status(200).json({
      success: true,
      data: allusers
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching users data",
      error: error.message
    });
  }
};

// Add a route to handle GET requests to the USEREMAILCHECK option
export const GETUSEREMAILCHECK = (req: Request, res: Response): void => {
  const uemail = req.params.uemail;
  if (typeof uemail !== "string") {
    res.status(400).json({ message: "Invalid email" });
    return;
  }

  console.log(uemail);
  User.find({ uemail })
    .then(data => {
      res.json(data);
    })
    .catch(error => {
      res.status(403).json("Error in Finding the Doc");
    });
};

// Add a action to handle GET requests to the GETUSERBYID option
export const GETUSERBYID = (req: Request, res: Response): void => {
  const userid = req.params.userid;
  if (typeof userid !== "string") {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }

  console.log(userid);
  User.findById(userid)
    .then(data => {
      console.log("Estoy en userController - GETUSERBYID - line 122 -data:" + data);
      res.json(data);
    })
    .catch(error => {
      res.status(403).json("Error in Finding the Doc");
    });
};

// Add a route to handle put requests to the GetUserByIdAndUpdate option
export const GetUserByIdAndUpdate = (req: Request, res: Response): void => {
  const newId = req.params.userid;

  if (typeof newId !== "string" || !mongoose.Types.ObjectId.isValid(newId)) {
    res.status(400).send('No record with given Id ');
    return;
  }

  var userData = {
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    ide: req.body.ide,
    phoneNumber: req.body.phoneNumber,
    role: req.body.role,
    image: req.body.image
  };

  console.log("estoy en GetUserByIdAndUpdate - findByIdAndUpdate - line 151 -req.params.id:" + req.params.userid);
  console.log("estoy en GetUserByIdAndUpdate - findByIdAndUpdate - line 152 -req.body.fullName:" + req.body.fullName);

  User.findByIdAndUpdate(newId, {
    $set: userData
  }).then(data => {
    if (data) {
      console.log('Line 167 - GetUserByIdAndUpdate - Booking updated successfully:', data);
      res.status(200).send({ message: 'Booking updated successfully', data });
    } else {
      res.status(401).send({ message: 'Booking Not updated successfully' });
      console.log('Booking not found');
    }
  })
  .catch(error => {
    console.log('Error in Update User : ' + JSON.stringify(error, undefined, 2));
  });
};

// Add a route to handle put requests to the GetUserByIdAndUpdate option,
// with a new image, I mean saving the new image in the database
export const GetUserByIdAndUpdateNewImage = (req: Request, res: Response): void => {
  const newId = req.params.userid;
  console.log("estoy en GetUserByIdAndUpdateNewImage  - line 187 newId:" + newId);
  
  if (typeof newId !== "string" || !mongoose.Types.ObjectId.isValid(newId)) {
    res.status(400).send('No record with given Id ');
    return;
  }

  var userData = {
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    ide: req.body.ide,
    role: req.body.role,
    phoneNumber: req.body.phoneNumber,
    // Using optional chaining on req.file in case the image isn't sent
    image: req.file?.path 
  };
  
  console.log("estoy en GetUserByIdAndUpdateNewImage - line 193 -req.params.id:" + req.params.userid);
  
  User.findByIdAndUpdate(newId, {
    $set: userData
  }).then(data => {
    if (data) {
      res.status(200).send({ message: 'User updated successfully', data });
    } else {
      res.status(401).send({ message: 'User Not updated successfully' });
    }
  })
  .catch(error => {
    console.log('Error in Update User : ' + JSON.stringify(error, undefined, 2));
  });
};

// Add an action to handle get requests to the profile view option
export const GetProfileData = (req: Request, res: Response): void => {
  const userid = req.params.userid;
  if (typeof userid !== "string") {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }

  User.findById(userid)
    .then(data => {
      res.json(data);
    })
    .catch(error => {
      res.status(403).json("Error in Finding the Doc");
    });
};

// function to delete a user Image from Uploads dir when user is erased
export const PostDeleteImageCtrl = async (req: Request, res: Response): Promise<any> => {
  const Image = req.body.image;
  const filePath = Image;

  fs.unlink(filePath, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(200).send({ message: 'File not found' });
      }
      return res.status(200).send({ message: 'Error deleting file', error: err });
    }
    res.status(200).json({ message: 'File deleted successfully' });
  });
};

export const PutUpdatePassword = async (req: Request, res: Response): Promise<any> => {
  const id = req.params.id;
  if (typeof id !== "string") {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const password = req.body.password;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  req.body.password = hashedPassword;

  await User.findByIdAndUpdate(id, { 
    password: req.body.password
  }, { new: true })
  .then(updatedUserPassword => {
    if (updatedUserPassword) {
      res.status(200).send({ message: 'Password updated successfully', updatedUserPassword });
    } else {
      res.status(401).send({ message: 'Password Not updated successfully' });
      console.log('User not found');
    }
  })
  .catch(error => {
    console.error('Error updating Booking:', error);
  });
};

// function to delete a user by Id
export const DeleteUserCtrl = async (req: Request, res: Response): Promise<any> => {
  const id = req.params.id;
  if (typeof id !== "string") {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    await User.findByIdAndDelete(id);
    res.status(200).send({ message: 'House Deleted Successfully' });
  } catch (error: any) {
    console.log(error);
    res.status(401).send({ message: `delete House api issue : ${error}`, error });
  }
};