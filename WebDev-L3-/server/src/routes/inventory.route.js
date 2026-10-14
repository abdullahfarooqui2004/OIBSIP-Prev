import express from "express";
import {
	getInventory,
	createInventoryItem,
	updateInventoryItem,
	deleteInventoryItem,
	triggerLowStockCheck,
} from "../controllers/inventory.controller.js";
import { protect, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public / Authenticated user route for Pizza Builder & Admin Dashboard
router.get("/", getInventory);

// Admin-protected routes for Inventory CRUD
router.post("/", protect, requireAdmin, createInventoryItem);
router.post("/check-low-stock", protect, requireAdmin, triggerLowStockCheck);
router.patch("/:id", protect, requireAdmin, updateInventoryItem);
router.delete("/:id", protect, requireAdmin, deleteInventoryItem);

export default router;

