import { Order } from "../models/order.model.js";
import { getIO } from "../socket.js";

// 1. Order Management Panel: View all incoming orders
export const getAllOrders = async (req, res) => {
	try {
		const orders = await Order.find()
			.populate("user", "name email")
			.populate("items.base items.sauce items.cheese items.vegetables")
			.sort({ createdAt: -1 });

		res.status(200).json(orders);
	} catch (error) {
		res.status(500).json({
			message: "Error retrieving orders.",
			error: error.message,
		});
	}
};

// 2. Update order status and emit real-time event[cite: 2]
export const updateOrderStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { status } = req.body;

		const validStatuses = [
			"Order Received",
			"In Kitchen",
			"Sent to Delivery",
			"Delivered",
		];
		if (!validStatuses.includes(status)) {
			return res
				.status(400)
				.json({ message: "Invalid order status value." });
		}

		const updatePayload = { status };
		if (status === "Delivered") {
			updatePayload.deliveredAt = new Date();
		}

		const order = await Order.findByIdAndUpdate(
			id,
			updatePayload,
			{ new: true },
		).populate("user", "name email");

		if (!order) {
			return res.status(404).json({ message: "Order not found." });
		}

		// Broadcast status change in real time to order room, user room, and admin console
		try {
			const io = getIO();
			const payload = {
				orderId: order._id,
				status: order.status,
				deliveredAt: order.deliveredAt,
			};
			io.to(id.toString()).emit("orderStatusUpdated", payload);
			io.to("adminRoom").emit("orderStatusUpdated", payload);
			if (order.user) {
				const userId = order.user._id ? order.user._id.toString() : order.user.toString();
				io.to(`user:${userId}`).emit("orderStatusUpdated", payload);
			}
			io.emit("orderStatusUpdated", payload);
		} catch (sErr) {
			console.warn("[socket] Status broadcast skipped:", sErr.message);
		}

		res.status(200).json({
			message: `Order status changed to "${order.status}".`,
			order,
		});
	} catch (error) {
		res.status(500).json({
			message: "Failed to update order status.",
			error: error.message,
		});
	}
};

