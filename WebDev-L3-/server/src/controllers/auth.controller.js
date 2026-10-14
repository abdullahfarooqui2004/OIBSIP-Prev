import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { sendEmail } from "../utils/sendEmail.js";

const generateToken = (id, role) => {
	return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// 1. User Registration with Email Verification[cite: 2]
export const register = async (req, res) => {
	try {
		const { name, email, password } = req.body;

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res
				.status(400)
				.json({
					message: "An account with this email already exists.",
				});
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// Generate verification token (valid for 24 hours)
		const verificationToken = crypto.randomBytes(32).toString("hex");
		const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;

		const user = await User.create({
			name,
			email,
			password: hashedPassword,
			role: "user", // Always default to user role to prevent privilege escalation[cite: 2]
			verificationToken,
			verificationTokenExpires,
		});

		const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
		await sendEmail({
			to: user.email,
			subject: "Verify your Pizza Co. Account",
			html: `
        <h2>Welcome to Pizza Co.!</h2>
        <p>Please confirm your account by clicking the link below:</p>
        <a href="${verifyUrl}" target="_blank">Verify Email Address</a>
        <p>This link expires in 24 hours.</p>
      `,
		});

		res.status(201).json({
			message:
				"Registration successful! Please check your email to verify your account.",
		});
	} catch (error) {
        console.error("Registration Error Details:", error);
        res.status(500).json({
            message: "Server error during registration.",
            error: error.message,
        });
	}
};

// 2. Email Verification Handler[cite: 2]
export const verifyEmail = async (req, res) => {
	try {
		const { token } = req.query;

		const user = await User.findOne({
			verificationToken: token,
			verificationTokenExpires: { $gt: Date.now() },
		});

		if (!user) {
			return res
				.status(400)
				.json({
					message: "Verification link is invalid or has expired.",
				});
		}

		user.isVerified = true;
		user.verificationToken = undefined;
		user.verificationTokenExpires = undefined;
		await user.save();

		res.status(200).json({
			message: "Email verified successfully. You can now log in.",
		});
	} catch (error) {
		res.status(500).json({
			message: "Email verification failed.",
			error: error.message,
		});
	}
};

// 3. User Login[cite: 2]
export const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email });
		if (!user) {
			return res
				.status(401)
				.json({ message: "Invalid email or password." });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res
				.status(401)
				.json({ message: "Invalid email or password." });
		}

		if (!user.isVerified) {
			return res
				.status(403)
				.json({
					message: "Please verify your email before logging in.",
				});
		}

		const token = generateToken(user._id, user.role);

		res.status(200).json({
			token,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				phone: user.phone || "",
				address: user.address || "",
			},
		});
	} catch (error) {
		res.status(500).json({
			message: "Login failed.",
			error: error.message,
		});
	}
};

// 4. Admin Login (Dedicated flow enforcing admin role)[cite: 2]
export const adminLogin = async (req, res) => {
	try {
		const { email, password } = req.body;

		const admin = await User.findOne({ email, role: "admin" });
		if (!admin) {
			return res
				.status(403)
				.json({
					message: "Invalid credentials or unauthorized access.",
				});
		}

		const isMatch = await bcrypt.compare(password, admin.password);
		if (!isMatch) {
			return res.status(403).json({ message: "Invalid credentials." });
		}

		const token = generateToken(admin._id, admin.role);

		res.status(200).json({
			token,
			admin: {
				id: admin._id,
				name: admin.name,
				email: admin.email,
				role: admin.role,
				phone: admin.phone || "",
				address: admin.address || "",
			},
		});
	} catch (error) {
		res.status(500).json({
			message: "Admin login failed.",
			error: error.message,
		});
	}
};

// 5. Forgot Password Flow (Generates reset link)[cite: 2]
export const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		const user = await User.findOne({ email });

		if (!user) {
			return res
				.status(404)
				.json({
					message: "No account associated with that email address.",
				});
		}

		const resetToken = crypto.randomBytes(32).toString("hex");
		user.resetPasswordToken = crypto
			.createHash("sha256")
			.update(resetToken)
			.digest("hex");
		user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes validity
		await user.save();

		const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
		await sendEmail({
			to: user.email,
			subject: "Password Reset Request",
			html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetUrl}" target="_blank">Reset Password</a>
        <p>This link is valid for 15 minutes.</p>
      `,
		});

		res.status(200).json({
			message: "Password reset link sent to your email.",
		});
	} catch (error) {
		res.status(500).json({
			message: "Failed to process request.",
			error: error.message,
		});
	}
};

// 6. Reset Password Handler[cite: 2]
export const resetPassword = async (req, res) => {
	try {
		const { token, newPassword } = req.body;
		const hashedToken = crypto
			.createHash("sha256")
			.update(token)
			.digest("hex");

		const user = await User.findOne({
			resetPasswordToken: hashedToken,
			resetPasswordExpires: { $gt: Date.now() },
		});

		if (!user) {
			return res
				.status(400)
				.json({
					message: "Password reset link is invalid or has expired.",
				});
		}

		const salt = await bcrypt.genSalt(10);
		user.password = await bcrypt.hash(newPassword, salt);
		user.resetPasswordToken = undefined;
		user.resetPasswordExpires = undefined;
		await user.save();

		res.status(200).json({
			message: "Password updated successfully. You can now log in.",
		});
	} catch (error) {
		res.status(500).json({
			message: "Password reset failed.",
			error: error.message,
		});
	}
};

// 7. Update User Profile (Persistence of phone & default delivery address)
export const updateProfile = async (req, res) => {
	try {
		const { name, phone, address } = req.body;
		const user = await User.findById(req.user._id);

		if (!user) {
			return res.status(404).json({ message: "User not found." });
		}

		if (name !== undefined && typeof name === "string" && name.trim()) {
			user.name = name.trim();
		}
		if (phone !== undefined) {
			user.phone = typeof phone === "string" ? phone.trim() : "";
		}
		if (address !== undefined) {
			user.address = typeof address === "string" ? address.trim() : "";
		}

		await user.save();

		res.status(200).json({
			message: "Profile updated successfully.",
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				phone: user.phone,
				address: user.address,
			},
		});
	} catch (error) {
		res.status(500).json({
			message: "Failed to update profile.",
			error: error.message,
		});
	}
};

