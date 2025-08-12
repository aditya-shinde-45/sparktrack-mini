import express from "express";
import { login, adminDashboard } from "../controller/authcontroller.js";
import { verifyToken } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/login", login);
router.get("/admin/dashboard", verifyToken, adminDashboard);

export default router;
