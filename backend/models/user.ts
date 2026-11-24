// nexthouserentingDeepAgentTypescript\backend\models\user.ts
"use strict";
import mongoose from "mongoose";
import { Schema } from 'mongoose';

const userSchema = new Schema({
   
    fullName: { type: String},
    email: { type: String , unique:true },
    ide: { type: String , unique:true },
    password: { type: String },
    role: {
    type: String,
    required: true,
    enum: ['Admin', 'Owner', 'Tenant'], // Restricts values to these three options
    default: 'None'                  // Sets a default value if none is provided
  },
    image: {type: String, require: true },
    phoneNumber: { type: String},
    timestamps: {type: Boolean, default: true},
    

})

const User = mongoose.model('User', userSchema)

export default User;

