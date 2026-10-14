import express from "express";
import {
	getAllOrders,
	updateOrderStatus,
} from "../controllers/adminOrder.controller.js";
import { protect, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect, requireAdmin); // Guard entire route file for admin role[cite: 2]

router.get("/", getAllOrders);
router.patch("/:id/status", updateOrderStatus);

export default router;
