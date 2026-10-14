import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";

dotenv.config();

async function createAdmin() {
	try {
		await mongoose.connect(process.env.MONGODB_URI);

		const adminEmail = process.env.ADMIN_EMAIL || "admin@pizzaco.com";
		const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";

		const existingAdmin = await User.findOne({ email: adminEmail });
		if (existingAdmin) {
			console.log(`Admin account (${adminEmail}) already exists.`);
			process.exit(0);
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(adminPassword, salt);

		await User.create({
			name: "Store Manager",
			email: adminEmail,
			password: hashedPassword,
			role: "admin",
			isVerified: true,
		});

		console.log(`Admin successfully provisioned!`);
		console.log(`Email: ${adminEmail}`);
		console.log(`Password: ${adminPassword}`);
		process.exit(0);
	} catch (error) {
		console.error("Error seeding admin user:", error);
		process.exit(1);
	}
}

createAdmin();
