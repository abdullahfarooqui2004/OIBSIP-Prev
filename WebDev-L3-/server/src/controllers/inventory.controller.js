import { Inventory } from "../models/inventory.model.js";
import { getIO } from "../socket.js";
import { checkAndNotifyLowStock } from "../jobs/stockCron.js";

// 1. Fetch all items (used by Admin Inventory Dashboard and Pizza Builder)
export const getInventory = async (req, res) => {
	try {
		const items = await Inventory.find().sort({ category: 1, name: 1 });
		res.status(200).json(items);
	} catch (error) {
		res.status(500).json({
			message: "Error retrieving inventory.",
			error: error.message,
		});
	}
};

// 2. Create new inventory item (Admin only)
export const createInventoryItem = async (req, res) => {
	try {
		const { name, category, price, stock, threshold = 20 } = req.body;

		if (!name || typeof name !== "string" || !name.trim()) {
			return res.status(400).json({ message: "Ingredient name is required." });
		}

		const validCategories = ["base", "sauce", "cheese", "veggie"];
		if (!category || !validCategories.includes(category)) {
			return res.status(400).json({
				message: `Category must be one of: ${validCategories.join(", ")}.`,
			});
		}

		const numPrice = Number(price);
		const numStock = Number(stock);
		const numThreshold = Number(threshold);

		if (isNaN(numPrice) || numPrice < 0) {
			return res.status(400).json({
				message: "Price must be a valid positive number or 0.",
			});
		}
		if (isNaN(numStock) || numStock < 0) {
			return res.status(400).json({
				message: "Stock must be a valid positive number or 0.",
			});
		}
		if (isNaN(numThreshold) || numThreshold < 0) {
			return res.status(400).json({
				message: "Threshold must be a valid positive number or 0.",
			});
		}

		const item = await Inventory.create({
			name: name.trim(),
			category,
			price: numPrice,
			stock: numStock,
			threshold: numThreshold,
		});

		// Broadcast real-time event to connected clients
		try {
			const io = getIO();
			io.emit("inventoryUpdated", item);
			io.emit("inventoryCreated", item);
		} catch (err) {
			console.warn("[socket] Notification skipped:", err.message);
		}

		res.status(201).json({
			message: `"${item.name}" added to inventory successfully.`,
			item,
		});
	} catch (error) {
		res.status(500).json({
			message: "Failed to create inventory item.",
			error: error.message,
		});
	}
};

// 3. Manual stock & price & threshold update capability for each item (Admin only)
export const updateInventoryItem = async (req, res) => {
	try {
		const { id } = req.params;
		const { name, category, stock, threshold, price } = req.body;

		const item = await Inventory.findById(id);
		if (!item) {
			return res
				.status(404)
				.json({ message: "Inventory item not found." });
		}

		if (name !== undefined && typeof name === "string" && name.trim()) {
			item.name = name.trim();
		}
		if (category !== undefined) {
			const validCategories = ["base", "sauce", "cheese", "veggie"];
			if (validCategories.includes(category)) {
				item.category = category;
			}
		}
		if (stock !== undefined) item.stock = Math.max(0, Number(stock));
		if (threshold !== undefined)
			item.threshold = Math.max(0, Number(threshold));
		if (price !== undefined) item.price = Math.max(0, Number(price));

		await item.save();

		// Real-time broadcast to connected clients
		try {
			const io = getIO();
			io.emit("inventoryUpdated", item);
		} catch (err) {
			console.warn("[socket] Notification skipped:", err.message);
		}

		res.status(200).json({
			message: `${item.name} stock updated successfully.`,
			item,
		});
	} catch (error) {
		res.status(500).json({
			message: "Failed to update stock.",
			error: error.message,
		});
	}
};

// 4. Delete inventory item (Admin only)
export const deleteInventoryItem = async (req, res) => {
	try {
		const { id } = req.params;
		const item = await Inventory.findByIdAndDelete(id);
		if (!item) {
			return res
				.status(404)
				.json({ message: "Inventory item not found." });
		}

		// Real-time broadcast to connected clients
		try {
			const io = getIO();
			io.emit("inventoryUpdated", { deletedId: id });
			io.emit("inventoryDeleted", { id: item._id });
		} catch (err) {
			console.warn("[socket] Notification skipped:", err.message);
		}

		res.status(200).json({
			message: `"${item.name}" deleted from inventory successfully.`,
			id: item._id,
		});
	} catch (error) {
		res.status(500).json({
			message: "Failed to delete inventory item.",
			error: error.message,
		});
	}
};

// 5. Admin endpoint to trigger manual low-stock evaluation & email notification
export const triggerLowStockCheck = async (req, res) => {
	try {
		const result = await checkAndNotifyLowStock();
		res.status(200).json({
			message: `Low stock check completed. ${result.count} items below threshold.`,
			count: result.count,
			items: result.items,
		});
	} catch (error) {
		res.status(500).json({
			message: "Failed to execute low stock check.",
			error: error.message,
		});
	}
};


