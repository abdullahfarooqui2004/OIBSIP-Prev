import dotenv from "dotenv";
import mongoose from "mongoose";
import { Inventory } from "../models/inventory.model.js";

dotenv.config();

const defaultInventory = [
	{
		name: "Classic Thin Crust",
		category: "base",
		stock: 30,
		threshold: 8,
		price: 120,
	},
	{
		name: "Hand Tossed Crust",
		category: "base",
		stock: 25,
		threshold: 7,
		price: 140,
	},
	{
		name: "Cheese Burst Base",
		category: "base",
		stock: 18,
		threshold: 6,
		price: 170,
	},
	{
		name: "Whole Wheat Base",
		category: "base",
		stock: 20,
		threshold: 6,
		price: 150,
	},
	{
		name: "Gluten Free Base",
		category: "base",
		stock: 12,
		threshold: 5,
		price: 180,
	},

	{
		name: "Marinara Sauce",
		category: "sauce",
		stock: 35,
		threshold: 10,
		price: 60,
	},
	{
		name: "Pesto Sauce",
		category: "sauce",
		stock: 25,
		threshold: 8,
		price: 80,
	},
	{
		name: "Barbeque Sauce",
		category: "sauce",
		stock: 20,
		threshold: 7,
		price: 75,
	},
	{
		name: "Creamy Alfredo",
		category: "sauce",
		stock: 18,
		threshold: 6,
		price: 90,
	},
	{
		name: "Arrabbiata Sauce",
		category: "sauce",
		stock: 22,
		threshold: 8,
		price: 70,
	},

	{
		name: "Mozzarella",
		category: "cheese",
		stock: 40,
		threshold: 12,
		price: 90,
	},
	{ name: "Cheddar", category: "cheese", stock: 28, threshold: 9, price: 85 },
	{
		name: "Parmesan",
		category: "cheese",
		stock: 22,
		threshold: 8,
		price: 95,
	},

	{
		name: "Bell Peppers",
		category: "veggie",
		stock: 30,
		threshold: 10,
		price: 30,
	},
	{ name: "Onions", category: "veggie", stock: 35, threshold: 10, price: 20 },
	{
		name: "Mushrooms",
		category: "veggie",
		stock: 28,
		threshold: 9,
		price: 35,
	},
	{ name: "Olives", category: "veggie", stock: 26, threshold: 8, price: 25 },
	{
		name: "Jalapeños",
		category: "veggie",
		stock: 20,
		threshold: 7,
		price: 28,
	},
	{
		name: "Sweet Corn",
		category: "veggie",
		stock: 32,
		threshold: 10,
		price: 24,
	},
];

async function seedInventory() {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		await Inventory.deleteMany({});
		const items = await Inventory.insertMany(defaultInventory);
		console.log(`Seeded ${items.length} inventory items.`);
		process.exit(0);
	} catch (error) {
		console.error("Error seeding inventory:", error);
		process.exit(1);
	}
}

seedInventory();
