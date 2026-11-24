// nexthouserentingDeepAgentTSBETS\backend\controllers\houseController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { z } from "zod";
import House from "../models/houses";

// ==========================================
// ZOD SCHEMAS & HELPERS
// ==========================================

const objectIdSchema = z
  .string()
  .trim()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid MongoDB ObjectId format",
  });

const booleanLikeSchema = z.preprocess((val) => {
  if (val === "true" || val === true) return true;
  if (val === "false" || val === false) return false;
  return val;
}, z.boolean());

const createHouseSchema = z.object({
  houseCode: z.string().trim().min(1).max(60),
  ownerId: objectIdSchema,
  ownerfullname: z.string().trim().min(1).max(120),
  owneremail: z.string().trim().email().max(160),
  description: z.string().trim().max(2000).optional().default(""),
  booked: booleanLikeSchema.optional().default(false),
  pincode: z.string().trim().max(30).optional().default(""),
  state: z.string().trim().min(1).max(100),
  city: z.string().trim().min(1).max(100),
  street: z.string().trim().min(1).max(200),
  landmark: z.string().trim().max(200).optional().default(""),
  totalRooms: z.coerce.number().int().nonnegative().optional().default(1),
  legalDocuments: z.unknown().optional(),
  RentPrice: z.coerce.number().nonnegative(),
});

const updateHouseSchema = z.object({
  houseCode: z.string().trim().min(1).max(60).optional(),
  ownerId: objectIdSchema.optional(),
  description: z.string().trim().max(2000).optional(),
  booked: booleanLikeSchema.optional(),
  pincode: z.string().trim().max(30).optional(),
  state: z.string().trim().min(1).max(100).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  street: z.string().trim().min(1).max(200).optional(),
  landmark: z.string().trim().max(200).optional(),
  totalRooms: z.coerce.number().int().nonnegative().optional(),
  legalDocuments: z.unknown().optional(),
  RentPrice: z.coerce.number().nonnegative().optional(),
  image: z.string().trim().max(500).optional(),
});

const updateHouseBookedSchema = z.object({
  booked: booleanLikeSchema,
  houseCode: z.string().trim().max(60).optional(),
});

const deleteImageSchema = z.object({
  image: z.string().trim().min(1).max(500),
});

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

// function to create House
export const PostcreateHouse = async (
  req: Request,
  res: Response
): Promise<any> => {
  const parsed = createHouseSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  try {
    const data = parsed.data;
    const imagePath = req.file?.path || "/uploads/default-house.jpg";

    const houseCodeExists = await House.findOne({ houseCode: data.houseCode });
    if (houseCodeExists) {
      req.log.warn(
        {
          houseId: String(houseCodeExists._id),
          houseCode: data.houseCode,
          ownerId: data.ownerId,
        },
        "Attempted to create house with duplicate houseCode"
      );
      return res.status(409).json({ message: "houseCode already exists" });
    }

    const NewHouse = new House({
      houseCode: data.houseCode,
      ownerId: data.ownerId,
      ownerfullname: data.ownerfullname,
      owneremail: data.owneremail,
      description: data.description,
      booked: data.booked,
      pincode: data.pincode,
      state: data.state,
      city: data.city,
      street: data.street,
      landmark: data.landmark,
      totalRooms: data.totalRooms,
      legalDocuments: data.legalDocuments,
      RentPrice: data.RentPrice,
      createdAt: new Date(),
      image: imagePath,
    });

    await NewHouse.save();

    req.log.info(
      {
        houseId: String(NewHouse._id),
        houseCode: data.houseCode,
        ownerId: data.ownerId,
      },
      "House created"
    );

    return res
      .status(200)
      .send({ NewHouse, message: "House Created Successfully .." });
  } catch (error: any) {
    req.log.error(
      {
        err: error,
        houseCode: parsed.data.houseCode,
        ownerId: parsed.data.ownerId,
      },
      "Error creating house"
    );
    return res
      .status(500)
      .send({ message: `create House api issue : ${error.message}` });
  }
};

// function to list all Houses booked=false
export const GetListAllHousesByOwnerBfalse = async (
  req: Request,
  res: Response
): Promise<any> => {
  const ownerIdParsed = objectIdSchema.safeParse(req.params.ownerId);
  if (!ownerIdParsed.success) {
    return sendValidationError(res, ownerIdParsed.error);
  }

  try {
    const ownerId = ownerIdParsed.data;
    const booked = false;

    const houses = await House.find({ ownerId, booked })
      .limit(12)
      .sort({ createdAt: -1 });

    req.log.info(
      {
        ownerId,
        houseCode: houses[0]?.houseCode,
        total: houses.length,
        booked,
      },
      "Available houses fetched by ownerId"
    );

    return res.status(200).send({
      message: "All Houses fetched successfully for owner and booked: false",
      total: houses.length,
      availableHousesRaw: houses,
    });
  } catch (error: any) {
    req.log.error(
      { err: error, ownerId: ownerIdParsed.data },
      "Error fetching available houses by ownerId"
    );
    return res
      .status(500)
      .send({ message: `get all Houses api issue : ${error.message}` });
  }
};

export const GetListAllHousesByOwnerBtrue = async (
  req: Request,
  res: Response
): Promise<any> => {
  const ownerIdParsed = objectIdSchema.safeParse(req.params.ownerId);
  if (!ownerIdParsed.success) {
    return sendValidationError(res, ownerIdParsed.error);
  }

  try {
    const ownerId = ownerIdParsed.data;
    const booked = true;

    const houses = await House.find({ ownerId, booked })
      .limit(12)
      .sort({ createdAt: -1 });

    req.log.info(
      {
        ownerId,
        houseCode: houses[0]?.houseCode,
        total: houses.length,
        booked,
      },
      "Booked houses fetched by ownerId"
    );

    return res.status(200).send({
      message: "Houses fetched successfully for owner and booked: true",
      total: houses.length,
      houses,
    });
  } catch (error: any) {
    req.log.error(
      { err: error, ownerId: ownerIdParsed.data },
      "Error fetching booked houses by ownerId"
    );
    return res
      .status(500)
      .send({ message: `get houses by owner api issue : ${error.message}` });
  }
};

// function to delete a House Image from Uploads dir when House is erased
export const PostdeleteImageCtrl = async (
  req: Request,
  res: Response
): Promise<any> => {
  const parsed = deleteImageSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendValidationError(res, parsed.error);
  }

  const uploadsRoot = path.resolve(process.cwd(), "uploads");
  const relativeTarget = parsed.data.image.replace(/^\/+/, "");
  const resolvedTarget = path.resolve(process.cwd(), relativeTarget);

  if (
    !resolvedTarget.startsWith(uploadsRoot + path.sep) &&
    resolvedTarget !== uploadsRoot
  ) {
    req.log.warn("Rejected house image deletion outside uploads directory");
    return res.status(400).send({ message: "Invalid image path" });
  }

  const fileName = path.basename(resolvedTarget);

  fs.unlink(resolvedTarget, (err) => {
    if (err) {
      if (err.code === "ENOENT") {
        req.log.warn({ fileName }, "House image file not found on disk");
        return res.status(404).send({ message: "File not found" });
      }
      req.log.error({ err, fileName }, "Error deleting house image file");
      return res.status(500).send({ message: "Error deleting file" });
    }

    req.log.info({ fileName }, "House image file deleted");
    return res.status(200).json({ message: "File deleted successfully" });
  });
};

// function to delete a House
export const deleteHouseCtrl = async (
  req: Request,
  res: Response
): Promise<any> => {
  const idParsed = objectIdSchema.safeParse(req.params.id);
  if (!idParsed.success) {
    return sendValidationError(res, idParsed.error);
  }

  try {
    const housedeleted = await House.findByIdAndDelete(idParsed.data);
    if (!housedeleted) {
      return res.status(404).send({ message: "House not found" });
    }

    req.log.info(
      {
        houseId: String(housedeleted._id),
        houseCode: housedeleted.houseCode,
        ownerId: housedeleted.ownerId
          ? String(housedeleted.ownerId)
          : undefined,
      },
      "House deleted"
    );

    return res.status(200).send({ message: "House Deleted Successfully" });
  } catch (error: any) {
    req.log.error(
      { err: error, houseId: idParsed.data },
      "Error deleting house"
    );
    return res
      .status(500)
      .send({ message: `delete House api issue : ${error.message}` });
  }
};

// function to Edit a Saved House
export const PutupdateHouseCtrl = async (
  req: Request,
  res: Response
): Promise<any> => {
  const idParsed = objectIdSchema.safeParse(req.params.id);
  if (!idParsed.success) {
    return sendValidationError(res, idParsed.error);
  }

  const bodyParsed = updateHouseSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return sendValidationError(res, bodyParsed.error);
  }

  try {
    const updatedHouse = await House.findByIdAndUpdate(
      idParsed.data,
      {
        ...bodyParsed.data,
        ...(req.file?.path ? { image: req.file.path } : {}),
      },
      { new: true }
    );

    if (!updatedHouse) {
      return res.status(404).send({ message: "House not found" });
    }

    req.log.info(
      {
        houseId: String(updatedHouse._id),
        houseCode: updatedHouse.houseCode,
        ownerId: updatedHouse.ownerId
          ? String(updatedHouse.ownerId)
          : undefined,
      },
      "House updated"
    );

    return res
      .status(200)
      .send({ message: "House updated successfully", updatedHouse });
  } catch (error: any) {
    req.log.error(
      {
        err: error,
        houseId: idParsed.data,
        houseCode: bodyParsed.data.houseCode,
        ownerId: bodyParsed.data.ownerId,
      },
      "Error updating house"
    );
    return res
      .status(500)
      .send({ message: `update House api issue : ${error.message}` });
  }
};

// function to update a House keeping the old image
export const PutupdateHouseBookedCtrl = async (
  req: Request,
  res: Response
): Promise<any> => {
  const idParsed = objectIdSchema.safeParse(req.params.id);
  if (!idParsed.success) {
    return sendValidationError(res, idParsed.error);
  }

  const bodyParsed = updateHouseBookedSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return sendValidationError(res, bodyParsed.error);
  }

  try {
    const updatedHousebooked = await House.findByIdAndUpdate(
      idParsed.data,
      { booked: bodyParsed.data.booked },
      { new: true }
    );

    if (!updatedHousebooked) {
      return res.status(404).send({ message: "House not found" });
    }

    req.log.info(
      {
        houseId: String(updatedHousebooked._id),
        houseCode: updatedHousebooked.houseCode ?? bodyParsed.data.houseCode,
        ownerId: updatedHousebooked.ownerId
          ? String(updatedHousebooked.ownerId)
          : undefined,
        booked: updatedHousebooked.booked,
      },
      "House booked status updated"
    );

    return res
      .status(200)
      .send({ message: "House updated successfully", updatedHousebooked });
  } catch (error: any) {
    req.log.error(
      {
        err: error,
        houseId: idParsed.data,
        houseCode: bodyParsed.data.houseCode,
      },
      "Error updating house booked status"
    );
    return res
      .status(500)
      .send({ message: `update House booked api issue : ${error.message}` });
  }
};

// function to update a House keeping the old image
export const PutupdateHouseOldImageCtrl = async (
  req: Request,
  res: Response
): Promise<any> => {
  const idParsed = objectIdSchema.safeParse(req.params.id);
  if (!idParsed.success) {
    return sendValidationError(res, idParsed.error);
  }

  const bodyParsed = updateHouseSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return sendValidationError(res, bodyParsed.error);
  }

  try {
    const updatedHouse = await House.findByIdAndUpdate(
      idParsed.data,
      bodyParsed.data,
      { new: true }
    );

    if (!updatedHouse) {
      return res.status(404).send({ message: "House not found" });
    }

    req.log.info(
      {
        houseId: String(updatedHouse._id),
        houseCode: updatedHouse.houseCode,
        ownerId: updatedHouse.ownerId
          ? String(updatedHouse.ownerId)
          : undefined,
      },
      "House updated keeping existing image"
    );

    return res
      .status(200)
      .send({ message: "House updated successfully", updatedHouse });
  } catch (error: any) {
    req.log.error(
      {
        err: error,
        houseId: idParsed.data,
        houseCode: bodyParsed.data.houseCode,
        ownerId: bodyParsed.data.ownerId,
      },
      "Error updating house keeping existing image"
    );
    return res
      .status(500)
      .send({ message: `update House api issue: ${error.message}` });
  }
};

// function to get a single House
export const GetSingleHouseCtrl = async (
  req: Request,
  res: Response
): Promise<any> => {
  const idParsed = objectIdSchema.safeParse(req.params.id);
  if (!idParsed.success) {
    return sendValidationError(res, idParsed.error);
  }

  try {
    const house = await House.findById(idParsed.data);
    if (!house) {
      return res.status(404).send({ message: "House not found" });
    }

    req.log.info(
      {
        houseId: String(house._id),
        houseCode: house.houseCode,
        ownerId: house.ownerId ? String(house.ownerId) : undefined,
      },
      "Single house fetched"
    );

    return res
      .status(200)
      .send({ message: "Single House Fetched Successfully", house });
  } catch (error: any) {
    req.log.error(
      { err: error, houseId: idParsed.data },
      "Error fetching single house"
    );
    return res
      .status(500)
      .send({ message: `get single House api issue : ${error.message}` });
  }
};

// function to list all Houses booked=false
export const GetListAllHouses = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const houses = await House.find({}).limit(12).sort({ createdAt: -1 });

    req.log.info(
      { total: houses.length },
      "All houses fetched"
    );

    return res.status(200).json({
      success: true,
      data: houses,
    });
  } catch (error: any) {
    req.log.error({ err: error }, "Error listing all houses");
    return res
      .status(500)
      .send({ message: `get all Houses api issue : ${error.message}` });
  }
};

// function to list all Houses booked false
export const GetListAllHousesBookedFalse = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const houses = await House.find({ booked: false })
      .limit(12)
      .sort({ createdAt: -1 });

    req.log.info(
      { total: houses.length, booked: false },
      "Unbooked houses fetched"
    );

    return res.status(200).send({
      message: "All Houses fetched successfully",
      total: houses.length,
      houses,
    });
  } catch (error: any) {
    req.log.error({ err: error }, "Error listing unbooked houses");
    return res
      .status(500)
      .send({ message: `get all Houses api issue : ${error.message}` });
  }
};

// function to list all Houses by ownerId
export const GetListAllHousesByOwnerId = async (
  req: Request,
  res: Response
): Promise<any> => {
  const ownerIdParsed = objectIdSchema.safeParse(req.params.ownerId);
  if (!ownerIdParsed.success) {
    return sendValidationError(res, ownerIdParsed.error);
  }

  try {
    const houses = await House.find({ ownerId: ownerIdParsed.data })
      .limit(12)
      .sort({ createdAt: -1 });

    req.log.info(
      {
        ownerId: ownerIdParsed.data,
        houseCode: houses[0]?.houseCode,
        total: houses.length,
      },
      "Houses fetched by ownerId"
    );

    return res.status(200).send({
      message: "All Houses fetched successfully for owner Id",
      total: houses.length,
      houses,
    });
  } catch (error: any) {
    req.log.error(
      { err: error, ownerId: ownerIdParsed.data },
      "Error fetching houses by ownerId"
    );
    return res
      .status(500)
      .send({ message: `get all Houses api issue : ${error.message}` });
  }
};