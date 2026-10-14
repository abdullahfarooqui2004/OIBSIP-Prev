import crypto from "crypto";
import { razorpayInstance } from "../config/razorpay.js";
import { Order } from "../models/order.model.js";
import { Inventory } from "../models/inventory.model.js";
import { getIO } from "../socket.js";

// 1. Create Razorpay Order & Initialize DB Order with server-side pricing verification
export const createRazorpayOrder = async (req, res) => {
	try {
		const { items, couponCode, deliveryInfo } = req.body;

		if (!items || items.length === 0) {
			return res.status(400).json({ message: "No items in order." });
		}

		let calculatedSubtotal = 0;

		// Server-side validation of ingredients, stock, and total price calculation
		for (const item of items) {
			const quantity = Number(item.quantity) || 1;
			if (quantity < 1) {
				return res.status(400).json({ message: "Invalid item quantity." });
			}

			const ingredientIds = [
				item.base,
				item.sauce,
				item.cheese,
				...(item.vegetables || []),
			].filter(Boolean);

			// Fetch all selected ingredients from DB
			const ingredients = await Inventory.find({
				_id: { $in: ingredientIds },
			});

			const ingMap = new Map();
			ingredients.forEach((ing) => ingMap.set(ing._id.toString(), ing));

			// Verify base, sauce, cheese exist
			for (const reqId of [item.base, item.sauce, item.cheese]) {
				if (!reqId || !ingMap.has(reqId.toString())) {
					return res.status(400).json({
						message: "Required pizza component is invalid or missing.",
					});
				}
			}

			// Check stock and compute subtotal
			let itemPrice = 0;
			for (const ingId of ingredientIds) {
				const ing = ingMap.get(ingId.toString());
				if (!ing) {
					return res.status(400).json({
						message: "Selected ingredient not found in inventory.",
					});
				}
				if (ing.stock < quantity) {
					return res.status(400).json({
						message: `Insufficient stock for "${ing.name}". Only ${ing.stock} left in stock.`,
					});
				}
				itemPrice += ing.price;
			}

			calculatedSubtotal += itemPrice * quantity;
		}

		// Calculate delivery fee: Free for subtotal >= 500, else ₹40
		const deliveryFee = calculatedSubtotal >= 500 ? 0 : 40;

		// Calculate 5% GST taxes
		const taxes = Math.round(calculatedSubtotal * 0.05);

		// Coupon discounts: PIZZA50 = ₹50 off, FREEDEL = free delivery
		let discount = 0;
		const cleanCode = (couponCode || "").trim().toUpperCase();
		if (cleanCode === "PIZZA50") {
			discount = 50;
		} else if (cleanCode === "FREEDEL") {
			discount = deliveryFee;
		}

		const finalTotal = Math.max(0, calculatedSubtotal + deliveryFee + taxes - discount);

		// Razorpay accepts amounts in paise (1 INR = 100 Paise)
		const razorpayOptions = {
			amount: Math.round(finalTotal * 100),
			currency: "INR",
			receipt: `receipt_order_${Date.now()}`,
		};

		const razorpayOrder = await razorpayInstance.orders.create(razorpayOptions);

		// Save initial pending order to MongoDB
		const newOrder = await Order.create({
			user: req.user._id,
			items,
			subtotal: calculatedSubtotal,
			deliveryFee,
			taxes,
			discount,
			couponCode: cleanCode,
			totalAmount: finalTotal,
			paymentStatus: "pending",
			status: "Order Received",
			razorpayOrderId: razorpayOrder.id,
			deliveryAddress: deliveryInfo?.address || "",
			phone: deliveryInfo?.phone || "",
			recipientName: deliveryInfo?.fullName || req.user.name || "Customer",
		});

		res.status(201).json({
			orderId: newOrder._id,
			razorpayOrderId: razorpayOrder.id,
			amount: razorpayOrder.amount,
			currency: razorpayOrder.currency,
			keyId: process.env.RAZORPAY_KEY_ID,
			subtotal: calculatedSubtotal,
			deliveryFee,
			taxes,
			discount,
			finalTotal,
		});
	} catch (error) {
		console.error("Create Razorpay Order Error:", error);
		res.status(500).json({
			message: "Failed to create order.",
			error: error.message,
		});
	}
};

// 2. Verify Razorpay Payment Signature & Decrement Inventory
export const verifyPayment = async (req, res) => {
	try {
		const {
			razorpay_order_id,
			razorpay_payment_id,
			razorpay_signature,
			dbOrderId,
		} = req.body;

		// Signature formula: HMAC-SHA256(order_id + "|" + payment_id, secret)
		const generatedSignature = crypto
			.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
			.update(`${razorpay_order_id}|${razorpay_payment_id}`)
			.digest("hex");

		if (generatedSignature !== razorpay_signature) {
			// Mark as failed in DB
			await Order.findByIdAndUpdate(dbOrderId, {
				paymentStatus: "failed",
			});
			return res.status(400).json({
				message: "Payment verification failed: Invalid signature.",
			});
		}

		// Signature matches -> Find and finalize the order
		const order = await Order.findById(dbOrderId);
		if (!order) {
			return res.status(404).json({ message: "Order record not found." });
		}

		if (order.paymentStatus === "paid") {
			return res.status(200).json({
				success: true,
				message: "Order already processed.",
				order,
			});
		}

		// Update Order status
		order.paymentStatus = "paid";
		order.status = "Order Received"; // Initial status on dashboard
		order.razorpayPaymentId = razorpay_payment_id;
		order.razorpaySignature = razorpay_signature;
		await order.save();

		// Automatically decrement inventory for all components in the order
		for (const item of order.items) {
			const quantity = Number(item.quantity) || 1;
			const ingredientIds = [
				item.base,
				item.sauce,
				item.cheese,
				...(item.vegetables || []),
			].filter(Boolean);

			for (const ingId of ingredientIds) {
				await Inventory.findByIdAndUpdate(ingId, {
					$inc: { stock: -quantity },
				});
			}
		}

		// Populate order for response & socket broadcast
		await order.populate([
			{ path: "user", select: "name email" },
			{ path: "items.base items.sauce items.cheese items.vegetables" },
		]);

		// Broadcast real-time events via WebSockets
		try {
			const io = getIO();
			// Push new order to admin console
			io.to("adminRoom").emit("newOrder", order);
			io.emit("newOrder", order);

			// Push updated stock levels
			io.emit("inventoryUpdated");

			// Push order status to order-specific tracking room
			io.to(order._id.toString()).emit("orderStatusUpdated", {
				orderId: order._id,
				status: order.status,
			});

			// Push order status to user room
			if (order.user) {
				const userId = order.user._id ? order.user._id.toString() : order.user.toString();
				io.to(`user:${userId}`).emit("orderStatusUpdated", {
					orderId: order._id,
					status: order.status,
				});
			}
		} catch (sErr) {
			console.warn("[socket] Broadcast skipped:", sErr.message);
		}

		res.status(200).json({
			success: true,
			message: "Payment verified and order confirmed successfully.",
			order,
		});
	} catch (error) {
		console.error("Verify Payment Error:", error);
		res.status(500).json({
			message: "Error verifying payment.",
			error: error.message,
		});
	}
};

// 3. Get single order details by ID (used by OrderTracking page)
export const getOrderById = async (req, res) => {
	try {
		const { id } = req.params;
		const order = await Order.findById(id)
			.populate("user", "name email")
			.populate("items.base items.sauce items.cheese items.vegetables");

		if (!order) {
			return res.status(404).json({ message: "Order not found." });
		}

		// Access check: User must own the order or be an admin
		const isOwner =
			order.user &&
			order.user._id.toString() === req.user._id.toString();

		if (!isOwner && req.user.role !== "admin") {
			return res
				.status(403)
				.json({ message: "Access denied to this order." });
		}

		res.status(200).json(order);
	} catch (error) {
		res.status(500).json({
			message: "Failed to retrieve order details.",
			error: error.message,
		});
	}
};

// 4. Get all orders belonging to authenticated user (for customer dashboard live tracking)
export const getMyOrders = async (req, res) => {
	try {
		const orders = await Order.find({ user: req.user._id })
			.populate("items.base items.sauce items.cheese items.vegetables")
			.sort({ createdAt: -1 });

		res.status(200).json(orders);
	} catch (error) {
		res.status(500).json({
			message: "Failed to retrieve order history.",
			error: error.message,
		});
	}
};
