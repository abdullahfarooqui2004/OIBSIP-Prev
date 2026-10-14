import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import server from "./src/app.js";

const PORT = process.env.PORT || 5000;

mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => {
		console.log("Connected to MongoDB.");
		server.listen(PORT, () =>
			console.log(`Server running on port ${PORT}`),
		);
	})
	.catch((err) => console.error("MongoDB connection error:", err));