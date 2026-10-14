import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		items: [
			{
				base: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Inventory",
					required: true,
				},
				sauce: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Inventory",
					required: true,
				},
				cheese: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Inventory",
					required: true,
				},
				vegetables: [
					{ type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
				],
				quantity: { type: Number, default: 1, min: 1 },
			},
		],
		subtotal: { type: Number, default: 0 },
		deliveryFee: { type: Number, default: 0 },
		taxes: { type: Number, default: 0 },
		discount: { type: Number, default: 0 },
		couponCode: { type: String, default: "" },
		totalAmount: { type: Number, required: true }, // in INR
		status: {
			type: String,
			enum: ["Order Received", "In Kitchen", "Sent to Delivery", "Delivered"],
			default: "Order Received",
		},
		paymentStatus: {
			type: String,
			enum: ["pending", "paid", "failed"],
			default: "pending",
		},
		razorpayOrderId: { type: String },
		razorpayPaymentId: { type: String },
		razorpaySignature: { type: String },
		deliveryAddress: { type: String, default: "" },
		phone: { type: String, default: "" },
		recipientName: { type: String, default: "" },
		deliveredAt: { type: Date },
	},
	{ timestamps: true },
);

export const Order = mongoose.model("Order", orderSchema);
