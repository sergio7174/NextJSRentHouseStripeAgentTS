import { Router } from "express";
import * as dashboardController from "../controllers/admindashboardController";

const router = Router();

router.get('/', dashboardController.getDashboardStats);
router.get('/latest-created', dashboardController.getLatestCreatedHouses);
router.get('/latest-booked', dashboardController.getLatestBookedHouses);
router.get('/latest-maintenance', dashboardController.getLatestMaintenanceRequests);
router.get('/all-maintenance-request', dashboardController.getallMaintenanceRequests);

export default router;