import { Router } from "express";
import upload from "../middleware/uploads";
import { signUp, login, getOneAdmin } from "../controllers/authcontroller";

const router = Router();

// signUp route - home view - menu option Signup
router.post('/signUp', upload.single("image"), signUp);

// signUp route - home view - menu option login
router.post('/login', login);

// Getalladmin route - for checking if there is an admin
router.get('/getoneadmin', getOneAdmin);

export default router;