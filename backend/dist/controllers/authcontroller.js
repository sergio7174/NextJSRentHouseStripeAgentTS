"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOneAdmin = exports.login = exports.signUp = void 0;
const user_1 = __importDefault(require("../models/user"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
process.env.TOKEN_KEY = "Sergio";
process.env.TOKEN_EXPIRY = new Date().setDate(new Date().getDate() + 1).toString();
const signUp = async (req, res) => {
    console.log("Estoy en PackController - line 15 - req.file.path:  " + req.file?.path);
    try {
        console.log('Estoy en authController - line 19 - signUp controller - body', req.body);
        console.log('Estoy en authController - line 20 - signUp controller - body.fullName', req.body.fullName);
        console.log('Estoy en authController - line 21 - signUp controller - email.fullName', req.body.email);
        console.log('Estoy en authController - line 22 - signUp controller - password.fullName', req.body.password);
        console.log('Estoy en authController - line 23 - signUp controller - password.isAdmin', req.body.role);
        if (!(req.body.email && req.body.password)) {
            return res.status(200).json({ message: 'Email and password not present' });
        }
        const emailExists = await user_1.default.findOne({ email: req.body.email });
        console.log("Estoy en  authController - line 34 - emailExists:  " + emailExists);
        if (emailExists) {
            console.log("Estoy en  authController -Dentro de emailExist- line 25 - emailExists:  " + emailExists);
            return res.status(200).json({ message: 'Email already exits' });
        }
        /** changing the password to save it with cripto */
        const password = req.body.password;
        const salt = await bcrypt_1.default.genSalt(10);
        const hashedPassword = await bcrypt_1.default.hash(password, salt);
        req.body.password = hashedPassword;
        const GetUserParams = new user_1.default({
            fullName: req.body.fullName,
            email: req.body.email,
            password: req.body.password,
            ide: req.body.ide,
            phoneNumber: req.body.phoneNumber,
            role: req.body.role,
            image: req.file?.path
        });
        const newUser = new user_1.default(GetUserParams);
        await newUser.save();
        return res.status(200).json({ newUser, message: 'User Register Successfully ..' });
    }
    catch (error) {
        console.log(error);
        // Note: .bgRed.black requires the 'colors' import in server.ts to work properly
        res.status(200).send({ success: false, message: `Register api issue : ${error.message}`.bgRed.black, error });
    }
};
exports.signUp = signUp;
const login = async (req, res) => {
    console.log('Estoy en authController - line 58 - login controller - query: ', req.body);
    const email = req.body.email;
    const password = req.body.password;
    console.log("Estoy en authcontroller - login - line 63, email: " + email);
    console.log("Estoy en authcontroller - login - line 64, password: " + password);
    const user = await user_1.default.findOne({ email });
    if (!user) {
        console.log("Estoy en authcontroller - login - line 71 - not user");
        return res.status(200).json({ message: "User does not exists" });
    }
    if (typeof user.password !== "string") {
        return res.status(200).send({ message: 'Invalid Credentials!, Incorrect Password ..' });
    }
    // the compare function needs the await command to work ..
    const isMatchedPassword = await bcrypt_1.default.compare(req.body.password, user.password);
    if (!isMatchedPassword) {
        console.log("Estoy en authController - login - line 80 - mensajeNotOk: Invalid Credentials .....");
        return res.status(200).send({ message: 'Invalid Credentials!, Incorrect Password ..' });
    }
    // Using the process.env.JWT_SECRETKEY as fallback, but forcing TS string typing
    const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRETKEY || process.env.TOKEN_KEY, { expiresIn: "1d" });
    return res.status(200).json({ user: user, token: token, message: 'Login Successful' });
};
exports.login = login;
const getOneAdmin = async (req, res) => {
    console.log("Estoy en authcontroller - getOneAdmin - line 114 - ");
    let haveAdmin = await user_1.default.find({ role: 'Admin' });
    try {
        /*** If there is data in database ***/
        if (haveAdmin.length > 0) {
            const numberOfAdmins = haveAdmin.length;
            console.log("Estoy en authcontroller - getOneAdmin - line 122 - haveAdmin found: " + haveAdmin);
            return res.status(200).json({ "data": numberOfAdmins });
        }
        else {
            const haveAdminfalse = 'false';
            console.log('Register api issue, IsAdmin not found .. !, maybe Not Data in Database. haveAdmin:' + haveAdmin);
            return res.status(200).json({ message: 'Register api issue, Admin not found .. !, maybe Not Data in Database.', haveAdmin: haveAdminfalse });
        }
    }
    catch (error) {
        console.log(error);
        res.status(200).send({ message: `Register api issue : ${error.message}`.bgRed.black, error });
    }
};
exports.getOneAdmin = getOneAdmin;
