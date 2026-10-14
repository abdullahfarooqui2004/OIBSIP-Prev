import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
	createRazorpayOrder,
	verifyPayment,
	getOrderById,
	getMyOrders,
} from "../controllers/order.controller.js";

const router = express.Router();

router.use(protect); // All order actions require authentication

router.post("/create-razorpay-order", createRazorpayOrder);
router.post("/verify-payment", verifyPayment);
router.get("/my-orders", getMyOrders);
router.get("/:id", getOrderById);

export default router;
