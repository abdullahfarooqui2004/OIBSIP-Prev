import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";

import adminOrderRoutes from "./routes/adminOrder.route.js";
import authRoutes from "./routes/auth.route.js";
import inventoryRoutes from "./routes/inventory.route.js";
import orderRoutes from "./routes/order.route.js";

import { initStockCronJob } from "./jobs/stockCron.js";
import { initSocket } from "./socket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
	process.env.CLIENT_URL,
	"http://localhost:5173",
	"http://127.0.0.1:5173",
	"http://localhost:5174",
	"http://127.0.0.1:5174",
].filter(Boolean);

const isAllowedOrigin = (origin) => {
	if (!origin) return true;
	if (allowedOrigins.includes(origin)) return true;
	if (/^https?:\/\/localhost:\d+$/.test(origin)) return true;
	if (/^https?:\/\/127\.0\.0\.1:\d+$/.test(origin)) return true;
	return false;
};

// Middleware
app.use(
	cors({
		origin: (origin, callback) => {
			if (isAllowedOrigin(origin)) {
				callback(null, true);
				return;
			}
			callback(new Error("Not allowed by CORS"));
		},
		credentials: true,
	}),
);
app.use(express.json());

// Socket.io initialization[cite: 2]
initSocket(server);

// Start node-cron scheduled monitoring[cite: 2]
initStockCronJob();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/admin/orders", adminOrderRoutes);

export default server;
