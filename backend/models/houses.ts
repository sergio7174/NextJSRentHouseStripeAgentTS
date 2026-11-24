// nexthouserentingDeepAgentTypescript\backend\models\houses.ts
"use strict";
import mongoose from "mongoose";
import { Schema } from 'mongoose';

const houseSchema = new Schema({
  
    houseCode: {type:String},
    ownerId: {   type:  mongoose.Schema.Types.ObjectId, ref:'User'},
    ownerfullname: {   type: String,},
    owneremail: { type: String , unique:true },
    description: {  type: String,},
    booked: {       type: Boolean, default: false,
                    required: true,
     } ,
    pincode: {type:String},
    state: {type:String},
    city: {type:String},
    street: {type:String},
    landmark: {type:String},
    totalRooms:{ type:Number, default:0 },
    legalDocuments: [{type:String}],
    image: {type:String},
    createdAt: {type: Date},
    RentPrice: {type: Number, default: 0}
},{
  // The timestamps property lets Mongoose know to include the createdAt and updatedAt
  // values, which are useful for keeping records on how and when data changes
  timestamps: true
})



export default mongoose.model('Houses', houseSchema)