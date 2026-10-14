import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		password: { type: String, required: true },
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user", // Admins are provisioned separately
		},
		isVerified: { type: Boolean, default: false },
		verificationToken: { type: String },
		verificationTokenExpires: { type: Date },
		resetPasswordToken: { type: String },
		resetPasswordExpires: { type: Date },
		phone: { type: String, default: "" },
		address: { type: String, default: "" },
	},
	{ timestamps: true },
);

export const User = mongoose.model("User", userSchema);
