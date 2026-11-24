// nexthouserentingDeepAgentTypescript\backend\models\booking.ts
import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const bookingSchema = new Schema({

    ownerId:        { type: mongoose.Schema.Types.ObjectId, ref:'User',},
    ownerfullname:  { type: String,},
    owneremail:     { type: String  },
    tenantId:       { type:mongoose.Schema.Types.ObjectId, ref:'User' },
    tenantfullname: { type: String },
    tenantemail:    { type: String },
    houseId:        { type: mongoose.Schema.Types.ObjectId,ref: 'houses',},
    houseCode:      { type:String},
    state:          { type:String},
    city:           { type:String},
    street:         { type:String},
    image:          { type:String},
    bookedAt:       { type: Date, default: Date.now },
    ownerChecked:   { type: Boolean, default: false },
    approvalStatus: { type:String, default: 'notApplied', 
                      enum: ['notApplied', 'approved', 'rejected'] },
    leftdays:       { type: Number, default: 0 },
    ContractInitDay:{ type: Date, default: Date.now },
    notification:   { type: String, maxlength:100 },
    RentPrice:      { type: Number, default: 0 },
    initialAmountToPay: { type: Number, default: 0 },
    initialAmountToPayStatus: { type: String, default: 'Not Paid' ,enum: ['Paid','Not Paid'],},
    contract:       { type: Boolean, default: false },
    maintenaceRequest: { type:String, maxlength:100 },
    maintenaceRequestStatus: { type: String, default: 'None', 
        enum: [ 'In Progress', 'Completed', 'Rejected','Pending', 'None'],
    },    
    lastPaymentDate: { type: Date, default: Date.now },
    lastPaymentStatus: { type: String, default: 'Pending' ,enum: ['Completed','Pending'],},
    paymentStatus: {  type: String, enum: ['unpaid', 'paid', 'failed'], default: 'unpaid',},
    stripeSessionId: { type: String, default: null,},
    paidAt: { type: Date, default: null,},
    timestamps: { type: Boolean, default: true },
})

export default mongoose.model('bookingDetails', bookingSchema)