import { Server } from "socket.io";

let ioInstance;

export const initSocket = (httpServer) => {
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

	ioInstance = new Server(httpServer, {
		cors: {
			origin: (origin, callback) => {
				if (isAllowedOrigin(origin)) {
					callback(null, true);
					return;
				}
				callback(new Error("Socket origin not allowed"));
			},
			methods: ["GET", "POST", "PATCH"],
			credentials: true,
		},
	});

	ioInstance.on("connection", (socket) => {
		// User joins a dedicated room for their specific order
		socket.on("joinOrderRoom", (orderId) => {
			if (orderId) {
				const roomId = orderId.toString();
				socket.join(roomId);
				console.log(`Socket ${socket.id} joined order room: ${roomId}`);
			}
		});

		// User joins a room for all their orders (for live dashboard updates)
		socket.on("joinUserOrdersRoom", (userId) => {
			if (userId) {
				const roomId = `user:${userId.toString()}`;
				socket.join(roomId);
				console.log(`Socket ${socket.id} joined user room: ${roomId}`);
			}
		});

		// Admin joins admin dashboard room for real-time order queue & inventory
		socket.on("joinAdminRoom", () => {
			socket.join("adminRoom");
			console.log(`Socket ${socket.id} joined adminRoom`);
		});

		socket.on("disconnect", () => {
			// Automatic cleanup
		});
	});

	return ioInstance;
};

export const getIO = () => {
	if (!ioInstance) {
		throw new Error("Socket.io has not been initialized yet.");
	}
	return ioInstance;
};
