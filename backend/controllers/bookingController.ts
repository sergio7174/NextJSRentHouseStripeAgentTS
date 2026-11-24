// nexthouserentingDeepAgentTSBETS\backend\controllers\bookingController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import Booking from "../models/booking";

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================

const objectIdSchema = z
  .string()
  .trim()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid MongoDB ObjectId format",
  });

const createBookingSchema = z.object({
  ownerId: objectIdSchema,
  ownerfullname: z.string().trim().min(1).max(120),
  owneremail: z.string().trim().email().max(160),
  tenantId: objectIdSchema,
  tenantfullname: z.string().trim().min(1).max(120),
  tenantemail: z.string().trim().email().max(160),
  houseId: objectIdSchema,
  houseCode: z.string().trim().min(1).max(60),
  state: z.string().trim().min(1).max(100),
  city: z.string().trim().min(1).max(100),
  street: z.string().trim().min(1).max(200),
  image: z.string().trim().max(500).nullable().optional().default(null),
  RentPrice: z.coerce.number().nonnegative(),
});

const houseCheckedSchema = z.object({
  ownerChecked: z.preprocess((val) => {
    if (val === "true" || val === true) return true;
    if (val === "false" || val === false) return false;
    return val;
  }, z.boolean()),
  approvalStatus: z.string().trim().min(1).max(60),
  RentPrice: z.coerce.number().nonnegative(),
});

const createMaintReqSchema = z.object({
  maintenaceRequest: z.string().trim().min(1).max(1000),
});

const updateMaintReqSchema = z.object({
  maintenaceRequest: z.string().trim().max(1000),
  maintenaceRequestStatus: z.string().trim().min(1).max(60),
});

const updateBookingSchema = z
  .object({
    nameplan: z.string().trim().max(120).optional(),
    description: z.string().trim().max(1000).optional(),
    trialdays: z.coerce.number().int().nonnegative().optional(),
    features: z.unknown().optional(),
    timedays: z.coerce.number().int().nonnegative().optional(),
    cost: z.coerce.number().nonnegative().optional(),
    code: z.string().trim().max(60).optional(),
    status: z.string().trim().max(60).optional(),
  })
  .strict();

function sendValidationError(res: Response, error: z.ZodError) {
  return res.status(400).json({
    message: "Validation failed",
    errors: error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });
}

// ==========================================
// CONTROLLERS
// ==========================================

// function to create Booking
export const PostCreateBooking = async (
  req: Request,
  res: Response
): Promise<any> => {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const data = parsed.data;
    const bookingData = {
      ownerId: data.ownerId,
      ownerfullname: data.ownerfullname,
      owneremail: data.owneremail,
      tenantId: data.tenantId,
      tenantfullname: data.tenantfullname,
      tenantemail: data.tenantemail,
      houseId: data.houseId,
      houseCode: data.houseCode,
      state: data.state,
      city: data.city,
      street: data.street,
      image: data.image,
      bookedAt: new Date(),
      ownerChecked: false,
      approvalStatus: "notApplied",
      leftdays: 0,
      ContractInitDay: new Date(),
      notification: "",
      RentPrice: data.RentPrice,
      contract: false,
      maintenaceRequest: "",
      maintenaceRequestStatus: "None",
      lastPaymentDate: Date.now(),
    };

    const booking = new Booking(bookingData);
    const newBooking = await booking.save();

    req.log.info(
      {
        bookingId: String(newBooking._id),
        houseCode: data.houseCode,
        tenantId: data.tenantId,
      },
      "Booking created"
    );

    return res
      .status(200)
      .send({ newBooking, message: "Booking Created Successfully .." });
  } catch (error: any) {
    req.log.error(
      {
        err: error,
        houseCode: parsed.data.houseCode,
        tenantId: parsed.data.tenantId,
      },
      "Error creating booking"
    );
    return res
      .status(500)
      .send({ message: `create Booking api issue : ${error.message}` });
  }
};

// function to list all Bookings
export const GetListAllBookings = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const bookings = await Booking.find({}).limit(12).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error: any) {
    req.log.error({ err: error }, "Error listing all bookings");
    return res
      .status(500)
      .send({ message: `get all Bookings api issue : ${error.message}` });
  }
};

// function to delete a Booking
export const GetDeleteBookingCtrl = async (
  req: Request,
  res: Response
): Promise<any> => {
  const idParsed = objectIdSchema.safeParse(req.params.id);
  if (!idParsed.success) {
    return sendValidationError(res, idParsed.error);
  }

  try {
    const deleted = await Booking.findByIdAndDelete(idParsed.data);
    if (!deleted) {
      return res.status(404).send({ message: "Booking not found" });
    }

    req.log.info(
      {
        bookingId: String(deleted._id),
        houseCode: deleted.houseCode,
        tenantId: deleted.tenantId ? String(deleted.tenantId) : undefined,
      },
      "Booking deleted"
    );

    return res.status(200).send({ message: "Booking Deleted Successfully" });
  } catch (error: any) {
    req.log.error(
      { err: error, bookingId: idParsed.data },
      "Error deleting booking"
    );
    return res
      .status(500)
      .send({ message: `delete Booking api issue : ${error.message}` });
  }
};

// function to Edit a Saved Booking
export const PutUpdateBookingCtrl = async (
  req: Request,
  res: Response
): Promise<any> => {
  const idParsed = objectIdSchema.safeParse(req.params.id);
  if (!idParsed.success) {
    return sendValidationError(res, idParsed.error);
  }

  const bodyParsed = updateBookingSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return sendValidationError(res, bodyParsed.error);
  }

  try {
    const updatedBooking = await Booking.findByIdAndUpdate(
      idParsed.data,
      {
        ...bodyParsed.data,
        createdAt: new Date(),
        ...(req.file?.path ? { image: req.file.path } : {}),
      },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).send({ message: "Booking not found" });
    }

    req.log.info(
      {
        bookingId: String(updatedBooking._id),
        houseCode: updatedBooking.houseCode,
        tenantId: updatedBooking.tenantId
          ? String(updatedBooking.tenantId)
          : undefined,
      },
      "Booking updated"
    );

    return res
      .status(200)
      .send({ message: "Booking updated successfully", updatedBooking });
  } catch (error: any) {
    req.log.error(
      { err: error, bookingId: idParsed.data },
      "Error updating booking"
    );
    return res
      .status(500)
      .send({ message: `update Booking api issue : ${error.message}` });
  }
};

// function to get a single Booking
export const GetSingleBookingCtrl = async (
  req: Request,
  res: Response
): Promise<any> => {
  const idParsed = objectIdSchema.safeParse(req.params.id);
  if (!idParsed.success) {
    return sendValidationError(res, idParsed.error);
  }

  try {
    const bookingDoc = await Booking.findById(idParsed.data);
    if (!bookingDoc) {
      return res.status(404).send({ message: "Booking not found" });
    }

    req.log.info(
      {
        bookingId: String(bookingDoc._id),
        houseCode: bookingDoc.houseCode,
        tenantId: bookingDoc.tenantId
          ? String(bookingDoc.tenantId)
          : undefined,
      },
      "Single booking fetched"
    );

    return res
      .status(200)
      .send({ message: "Single Booking Fetched Successfully", Booking: bookingDoc });
  } catch (error: any) {
    req.log.error(
      { err: error, bookingId: idParsed.data },
      "Error fetching single booking"
    );
    return res
      .status(500)
      .send({ message: `get single Booking api issue : ${error.message}` });
  }
};

// function to list all Bookings by Tenant
export const GetListAllBookingsByTenantId = async (
  req: Request,
  res: Response
): Promise<any> => {
  const tenantIdParsed = objectIdSchema.safeParse(req.params.tenantId);
  if (!tenantIdParsed.success) {
    return sendValidationError(res, tenantIdParsed.error);
  }

  const TenantId = tenantIdParsed.data;

  try {
    const Bookings = await Booking.find({ tenantId: TenantId })
      .limit(12)
      .sort({ createdAt: -1 });

    if (Bookings.length === 0) {
      return res.status(404).send({
        message: "No bookings found for this tenant",
        total: 0,
        Bookings: [],
      });
    }

    req.log.info(
      {
        tenantId: TenantId,
        houseCode: Bookings[0].houseCode,
        total: Bookings.length,
      },
      "Bookings fetched by tenantId"
    );

    return res.status(200).send({
      message: "All Bookings fetched successfully",
      total: Bookings.length,
      Bookings,
    });
  } catch (error: any) {
    req.log.error(
      { err: error, tenantId: TenantId },
      "Error fetching bookings by tenantId"
    );
    return res
      .status(500)
      .send({ message: `get all Bookings api issue : ${error.message}` });
  }
};

// function to get all Bookings by ownerId
export const GetListAllBookingsByOwnerId = async (
  req: Request,
  res: Response
): Promise<any> => {
  const ownerIdParsed = objectIdSchema.safeParse(req.params.ownerId);
  if (!ownerIdParsed.success) {
    return sendValidationError(res, ownerIdParsed.error);
  }

  const ownerId = ownerIdParsed.data;

  try {
    const ownerbooking = await Booking.find({ ownerId })
      .limit(12)
      .sort({ createdAt: -1 });

    if (ownerbooking.length === 0) {
      return res.status(404).send({
        message: "No bookings found for this ownerId",
        total: 0,
        ownerbooking: [],
      });
    }

    req.log.info(
      {
        ownerId,
        houseCode: ownerbooking[0].houseCode,
        total: ownerbooking.length,
      },
      "Bookings fetched by ownerId"
    );

    return res.status(200).send({
      message: "Houses fetched successfully for owner and booked: true",
      total: ownerbooking.length,
      ownerbooking,
    });
  } catch (error: any) {
    req.log.error(
      { err: error, ownerId },
      "Error fetching bookings by ownerId"
    );
    return res
      .status(500)
      .send({ message: `get houses by owner api issue : ${error.message}` });
  }
};

// function to update a Booking when the house is checked by the owner
export const PutUpdateBookingHouseCheckedCtrl = async (
  req: Request,
  res: Response
): Promise<any> => {
  const idParsed = objectIdSchema.safeParse(req.params.id);
  if (!idParsed.success) {
    return sendValidationError(res, idParsed.error);
  }

  const bodyParsed = houseCheckedSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return sendValidationError(res, bodyParsed.error);
  }

  const { ownerChecked, approvalStatus, RentPrice: monthlyPrice } = bodyParsed.data;

  /** Block to calculate the # of days to pay the rent of the house booked by the user */
  const today = new Date();
  const currentDay = today.getDate();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dailyRate = monthlyPrice / totalDaysInMonth;
  const daysLeftInMonth = totalDaysInMonth - currentDay + 1;
  const initialAmountToPay = parseFloat((dailyRate * daysLeftInMonth).toFixed(2));
  /*** End of Block ***/

  try {
    const updatedHousebookedownerChecked = await Booking.findByIdAndUpdate(
      idParsed.data,
      {
        ownerChecked,
        approvalStatus,
        leftdays: daysLeftInMonth,
        initialAmountToPay,
        initialAmountToPayStatus: "Not Paid",
        contract: true,
      },
      { new: true }
    );

    if (!updatedHousebookedownerChecked) {
      return res.status(404).send({ message: "Booking not found" });
    }

    req.log.info(
      {
        bookingId: String(updatedHousebookedownerChecked._id),
        houseCode: updatedHousebookedownerChecked.houseCode,
        tenantId: updatedHousebookedownerChecked.tenantId
          ? String(updatedHousebookedownerChecked.tenantId)
          : undefined,
        approvalStatus,
      },
      "Booking house-checked status updated"
    );

    return res.status(200).send({
      message: "Booking updated successfully",
      updatedHousebookedownerChecked,
    });
  } catch (error: any) {
    req.log.error(
      { err: error, bookingId: idParsed.data },
      "Error updating booking house-checked status"
    );
    return res
      .status(500)
      .send({ message: `update Booking checked api issue : ${error.message}` });
  }
};

// function to update a Booking creating a maintenance request by the Owner
export const PutbookinghousecreatemaintreqCtrl = async (
  req: Request,
  res: Response
): Promise<any> => {
  const idParsed = objectIdSchema.safeParse(req.params.id);
  if (!idParsed.success) {
    return sendValidationError(res, idParsed.error);
  }

  const bodyParsed = createMaintReqSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return sendValidationError(res, bodyParsed.error);
  }

  try {
    const maintenaceRequestUpdated = await Booking.findByIdAndUpdate(
      idParsed.data,
      {
        maintenaceRequest: bodyParsed.data.maintenaceRequest,
      },
      { new: true }
    );

    if (!maintenaceRequestUpdated) {
      return res.status(404).send({ message: "Booking not found" });
    }

    req.log.info(
      {
        bookingId: String(maintenaceRequestUpdated._id),
        houseCode: maintenaceRequestUpdated.houseCode,
        tenantId: maintenaceRequestUpdated.tenantId
          ? String(maintenaceRequestUpdated.tenantId)
          : undefined,
      },
      "Booking maintenance request created"
    );

    return res.status(200).send({
      message: "Booking updated successfully",
      maintenaceRequestUpdated,
    });
  } catch (error: any) {
    req.log.error(
      { err: error, bookingId: idParsed.data },
      "Error creating booking maintenance request"
    );
    return res
      .status(500)
      .send({ message: `create maintenance request api issue : ${error.message}` });
  }
};

// function to update a Booking deleting a maintenance request by Admin
export const PutbookingupdatemaintreqCtrl = async (
  req: Request,
  res: Response
): Promise<any> => {
  const idParsed = objectIdSchema.safeParse(req.params.id);
  if (!idParsed.success) {
    return sendValidationError(res, idParsed.error);
  }

  const bodyParsed = updateMaintReqSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return sendValidationError(res, bodyParsed.error);
  }

  try {
    const maintenaceRequestUpdated = await Booking.findByIdAndUpdate(
      idParsed.data,
      {
        maintenaceRequest: bodyParsed.data.maintenaceRequest,
        maintenaceRequestStatus: bodyParsed.data.maintenaceRequestStatus,
      },
      { new: true }
    );

    if (!maintenaceRequestUpdated) {
      return res.status(404).send({ message: "Booking not found" });
    }

    req.log.info(
      {
        bookingId: String(maintenaceRequestUpdated._id),
        houseCode: maintenaceRequestUpdated.houseCode,
        tenantId: maintenaceRequestUpdated.tenantId
          ? String(maintenaceRequestUpdated.tenantId)
          : undefined,
        maintenaceRequestStatus: bodyParsed.data.maintenaceRequestStatus,
      },
      "Booking maintenance request updated"
    );

    return res.status(200).send({
      message: "Booking updated successfully",
      maintenaceRequestUpdated,
    });
  } catch (error: any) {
    req.log.error(
      { err: error, bookingId: idParsed.data },
      "Error updating booking maintenance request"
    );
    return res
      .status(500)
      .send({ message: `update maintenance request api issue : ${error.message}` });
  }
};