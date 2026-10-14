import express from "express";
import {
	register,
	verifyEmail,
	login,
	adminLogin,
	forgotPassword,
	resetPassword,
	updateProfile,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.get("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/admin/login", adminLogin); // Separate admin endpoint[cite: 2]
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.patch("/profile", protect, updateProfile);

export default router;

