import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
	{
		name: { 
            type: String,
             required: true,
              trim: true 
        },
		category: {
			type: String,
			required: true,
			enum: ["base", "sauce", "cheese", "veggie"],
		},
		stock: {
             type: Number, required: true, min: 0, default: 0 },
		threshold: { type: Number, required: true, default: 20 }, // Triggers node-cron alerts when stock < threshold
		price: { type: Number, required: true, default: 0 },
	},
	{ timestamps: true },
);

export const Inventory = mongoose.model("Inventory", inventorySchema);
