import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const protect = async (req, res, next) => {
	let token;
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith("Bearer")
	) {
		token = req.headers.authorization.split(" ")[1];
	}

	if (!token) {
		return res
			.status(401)
			.json({ message: "Authentication required. No token provided." });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(decoded.id).select("-password");

		if (!user) {
			return res
				.status(401)
				.json({
					message: "User belonging to this token no longer exists.",
				});
		}

		req.user = user;
		next();
	} catch (error) {
		return res.status(401).json({ message: "Invalid or expired token." });
	}
};

// Admin route guard: Prevents standard registered users from accessing admin routes
export const requireAdmin = (req, res, next) => {
	if (req.user && req.user.role === "admin") {
		next();
	} else {
		res.status(403).json({
			message: "Access denied: Admin privileges required.",
		});
	}
};
