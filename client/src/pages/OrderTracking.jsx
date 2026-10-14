import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import io from "socket.io-client";
import api from "../api/client";
import {
	ChefHat,
	Clock,
	Truck,
	CheckCircle2,
	Copy,
	Check,
	Phone,
	MapPin,
	Pizza,
	ArrowLeft,
	Radio,
	ShoppingBag,
	HelpCircle,
	ShieldCheck,
} from "lucide-react";

const SOCKET_SERVER_URL =
	import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const STATUS_STEPS = [
	{
		label: "Order Received",
		icon: Clock,
		desc: "Your order has been confirmed and forwarded to the kitchen.",
		estTime: "10-15 min",
	},
	{
		label: "In Kitchen",
		icon: ChefHat,
		desc: "Our pizza chefs are stretching the dough and baking in the oven.",
		estTime: "5-10 min",
	},
	{
		label: "Sent to Delivery",
		icon: Truck,
		desc: "Fresh out of the oven and riding hot to your doorstep.",
		estTime: "Arriving shortly",
	},
	{
		label: "Delivered",
		icon: CheckCircle2,
		desc: "Delivered straight into your hands! Enjoy every warm, savory slice.",
		estTime: "Delivered 🎉",
	},
];

export default function OrderTracking() {
	const { orderId } = useParams();
	const navigate = useNavigate();

	const [currentStatus, setCurrentStatus] = useState("Order Received");
	const [orderDetails, setOrderDetails] = useState(null);
	const [loading, setLoading] = useState(true);
	const [socketConnected, setSocketConnected] = useState(false);
	const [copied, setCopied] = useState(false);

	// 1. Fetch initial order data from backend
	useEffect(() => {
		const fetchOrder = async () => {
			try {
				const { data } = await api.get(`/orders/${orderId}`);
				setOrderDetails(data);
				if (data.status) {
					setCurrentStatus(data.status);
				}
			} catch (err) {
				console.error("Could not fetch order details:", err);
			} finally {
				setLoading(false);
			}
		};

		if (orderId) {
			fetchOrder();
		}
	}, [orderId]);

	// 2. Real-time WebSocket connection
	useEffect(() => {
		const socket = io(SOCKET_SERVER_URL);

		socket.on("connect", () => {
			setSocketConnected(true);
			// Join isolated room for this order
			socket.emit("joinOrderRoom", orderId);
		});

		socket.on("disconnect", () => {
			setSocketConnected(false);
		});

		// Listen for live status broadcasts from the admin management panel
		socket.on("orderStatusUpdated", (data) => {
			if (data.orderId === orderId) {
				setCurrentStatus(data.status);
				if (data.deliveredAt) {
					setOrderDetails((prev) =>
						prev ? { ...prev, deliveredAt: data.deliveredAt } : prev,
					);
				}
			}
		});

		return () => {
			socket.disconnect();
		};
	}, [orderId]);

	const getStepIndex = (status) =>
		STATUS_STEPS.findIndex((s) => s.label === status);

	const activeStepIdx = getStepIndex(currentStatus);

	const copyOrderId = () => {
		navigator.clipboard.writeText(orderId);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	if (loading) {
		return (
			<div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-[#F0F2F5]">
				<div className="w-10 h-10 border-4 border-[#E7F3FF] border-t-[#1877F2] rounded-full animate-spin" />
				<p className="text-xs font-bold text-[#65676B] animate-pulse">
					Connecting to live kitchen feed...
				</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#F0F2F5] text-[#050505] pb-16 font-sans">
			<div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
				{/* Navigation & Header */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<button
						onClick={() => navigate("/dashboard")}
						className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1877F2] hover:text-[#166FE5] bg-white px-3.5 py-2 rounded-xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition self-start"
					>
						<ArrowLeft className="w-4 h-4" /> Return to Menu
					</button>

					{/* WebSocket Pulse Indicator */}
					<div className="flex items-center gap-2 self-start sm:self-auto">
						<span
							className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
								socketConnected
									? "bg-[#E7F7ED] text-[#00A400] border-[#00A400]/20"
									: "bg-[#FFF4E5] text-[#F7B125] border-[#F7B125]/20"
							}`}
						>
							<Radio
								className={`w-3.5 h-3.5 ${
									socketConnected
										? "animate-pulse text-[#00A400]"
										: ""
								}`}
							/>
							<span>
								{socketConnected
									? "Live Feed Connected"
									: "Connecting..."}
							</span>
						</span>
					</div>
				</div>

				{/* Celebratory Delivery Banner when status is Delivered */}
				{currentStatus === "Delivered" && (
					<div className="bg-[#E7F7ED] border-2 border-[#00A400]/40 rounded-2xl p-6 text-center space-y-4 shadow-[0_2px_4px_rgba(0,164,0,0.1)]">
						<div className="w-14 h-14 mx-auto rounded-full bg-[#00A400] text-white flex items-center justify-center text-3xl shadow-sm">
							🍕
						</div>
						<div>
							<h2 className="text-xl sm:text-2xl font-black text-[#050505]">
								Your hot pizza has been delivered! Enjoy your meal 🍕
							</h2>
							<p className="text-xs text-[#65676B] mt-1 max-w-md mx-auto">
								Freshly crafted and delivered warm. Thank you for ordering with Pizza Co.!
							</p>
						</div>
						<div className="flex flex-wrap items-center justify-center gap-3 pt-1">
							<button
								onClick={() => navigate("/orders")}
								className="px-5 py-2.5 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-xs rounded-xl shadow-[0_2px_4px_rgba(24,119,242,0.25)] transition flex items-center gap-2"
							>
								<ShoppingBag className="w-4 h-4" />
								<span>View in Order History</span>
							</button>
							<button
								onClick={() => navigate("/builder")}
								className="px-5 py-2.5 bg-white border border-[#CED0D4]/70 hover:bg-[#F0F2F5] text-[#050505] font-bold text-xs rounded-xl transition flex items-center gap-2"
							>
								<Pizza className="w-4 h-4 text-[#1877F2]" />
								<span>Order Another Pizza</span>
							</button>
						</div>
					</div>
				)}

				{/* Hero Order Status Card */}
				<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-6 md:p-8 space-y-8">
					{/* Header with Copy ID */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E4E6EB]">
						<div>
							<span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1877F2]">
								Real-Time Tracking
							</span>
							<h1 className="text-2xl font-black text-[#050505] tracking-tight">
								{currentStatus === "Delivered"
									? "Order Delivered! 🎉"
									: currentStatus === "Sent to Delivery"
										? "Out For Delivery! 🚀"
										: currentStatus === "In Kitchen"
											? "Baking In The Oven 🔥"
											: "Order Confirmed & Queued 🍕"}
							</h1>
							<p className="text-xs text-[#65676B] mt-1">
								{currentStatus === "Delivered" ? (
									<span className="font-bold text-[#00A400]">
										Delivered directly to your address
									</span>
								) : (
									<>
										Estimated arrival in{" "}
										<span className="font-bold text-[#050505]">
											25–35 minutes
										</span>
									</>
								)}
							</p>
						</div>

						<div className="flex items-center gap-2 bg-[#F0F2F5] px-3 py-2 rounded-xl border border-[#CED0D4]/50">
							<span className="text-xs font-mono text-[#65676B]">
								ID: {orderId?.slice(-8) || "..."}
							</span>
							<button
								onClick={copyOrderId}
								className="p-1 hover:bg-[#E4E6EB] rounded text-[#1877F2] transition"
								title="Copy Full Order ID"
							>
								{copied ? (
									<Check className="w-3.5 h-3.5 text-[#00A400]" />
								) : (
									<Copy className="w-3.5 h-3.5" />
								)}
							</button>
						</div>
					</div>

					{/* Stepper Progress Bar */}
					<div className="relative pt-4 pb-2 px-2 sm:px-6">
						{/* Background Line */}
						<div className="absolute top-8 left-8 right-8 h-1.5 bg-[#E4E6EB] -translate-y-1/2 rounded-full z-0" />
						{/* Active Progress Line */}
						<div className="absolute top-8 left-8 right-8 h-1.5 -translate-y-1/2 rounded-full z-0 pointer-events-none">
							<div
								className="h-full bg-[#1877F2] rounded-full transition-all duration-700 ease-out"
								style={{
									width: `${activeStepIdx >= 0 ? (activeStepIdx / (STATUS_STEPS.length - 1)) * 100 : 0}%`,
								}}
							/>
						</div>

						<div className="relative z-10 flex justify-between items-start">
							{STATUS_STEPS.map((step, idx) => {
								const Icon = step.icon;
								const isCompleted = activeStepIdx >= idx;
								const isCurrent = activeStepIdx === idx;

								return (
									<div
										key={step.label}
										className="flex flex-col items-center text-center max-w-[80px] sm:max-w-[120px]"
									>
										<div
											className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-xs ${
												isCurrent
													? "bg-[#1877F2] text-white ring-4 ring-[#E7F3FF]"
													: isCompleted
														? "bg-[#00A400] text-white"
														: "bg-[#E4E6EB] text-[#65676B]"
											}`}
										>
											{isCompleted && !isCurrent ? (
												<CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
											) : (
												<Icon className="w-5 h-5" />
											)}
										</div>

										<span
											className={`text-xs mt-3 font-bold ${
												isCurrent
													? "text-[#1877F2]"
													: isCompleted
														? "text-[#050505]"
														: "text-[#65676B]"
											}`}
										>
											{step.label}
										</span>
										<span className="text-[10px] text-[#65676B] hidden sm:block mt-0.5">
											{step.estTime}
										</span>
									</div>
								);
							})}
						</div>
					</div>

					{/* Active Step Highlight Card */}
					<div className="bg-[#E7F3FF]/70 border border-[#1877F2]/20 rounded-xl p-4 flex items-start gap-3.5">
						<div className="w-8 h-8 rounded-lg bg-[#1877F2] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
							{activeStepIdx === 0 && (
								<Clock className="w-4 h-4" />
							)}
							{activeStepIdx === 1 && (
								<ChefHat className="w-4 h-4" />
							)}
							{activeStepIdx === 2 && (
								<Truck className="w-4 h-4" />
							)}
							{activeStepIdx === 3 && (
								<CheckCircle2 className="w-4 h-4" />
							)}
						</div>
						<div>
							<h4 className="text-xs font-bold text-[#1877F2] uppercase tracking-wider">
								Status Update
							</h4>
							<p className="text-sm font-semibold text-[#050505] mt-0.5">
								{STATUS_STEPS[activeStepIdx]?.desc ||
									"Preparing your pizza..."}
							</p>
						</div>
					</div>
				</div>


				{/* Detailed Breakdown Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
					{/* Order Item Details */}
					<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-5 space-y-4">
						<div className="flex items-center gap-2 pb-3 border-b border-[#E4E6EB]">
							<div className="w-8 h-8 rounded-lg bg-[#E7F3FF] text-[#1877F2] flex items-center justify-center">
								<Pizza className="w-4 h-4" />
							</div>
							<h3 className="text-sm font-bold text-[#050505]">
								Order Summary
							</h3>
						</div>

						{orderDetails ? (
							<div className="space-y-3 text-xs">
								{orderDetails.items?.map((item, idx) => (
									<div
										key={idx}
										className="p-3 bg-[#F0F2F5]/60 rounded-xl space-y-1.5"
									>
										<div className="flex justify-between font-bold text-[#050505]">
											<span>Custom Pizza #{idx + 1}</span>
											<span>
												Qty: {item.quantity || 1}
											</span>
										</div>
										<p className="text-[#65676B]">
											<strong>Crust:</strong>{" "}
											{item.base?.name || "Hand Tossed"}
										</p>
										<p className="text-[#65676B]">
											<strong>Sauce:</strong>{" "}
											{item.sauce?.name || "Marinara"}
										</p>
										<p className="text-[#65676B]">
											<strong>Cheese:</strong>{" "}
											{item.cheese?.name || "Mozzarella"}
										</p>
										{item.vegetables?.length > 0 && (
											<p className="text-[#65676B]">
												<strong>Toppings:</strong>{" "}
												{item.vegetables
													.map((v) => v?.name || "Topping")
													.join(", ")}
											</p>
										)}

									</div>
								))}

								<div className="pt-2 flex justify-between items-center text-sm font-black text-[#050505] border-t border-[#E4E6EB]">
									<span>Total Paid</span>
									<span className="text-[#1877F2]">
										₹{orderDetails.totalAmount}
									</span>
								</div>
							</div>
						) : (
							<div className="p-4 bg-[#F0F2F5] rounded-xl text-center text-xs text-[#65676B]">
								Fetching recipe specifications...
							</div>
						)}
					</div>

					{/* Delivery Agent & Support Contact */}
					<div className="space-y-4">
						<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-5 space-y-4">
							<div className="flex items-center gap-2 pb-3 border-b border-[#E4E6EB]">
								<div className="w-8 h-8 rounded-lg bg-[#E7F3FF] text-[#1877F2] flex items-center justify-center">
									<MapPin className="w-4 h-4" />
								</div>
								<h3 className="text-sm font-bold text-[#050505]">
									Delivery Hotline
								</h3>
							</div>

							<div className="space-y-3 text-xs">
								<div className="flex items-center justify-between p-3 bg-[#F0F2F5]/60 rounded-xl">
									<div>
										<span className="font-bold text-[#050505] block">
											Pizza Co. Kitchen Hub
										</span>
										<span className="text-[#65676B]">
											Express Delivery Partner
										</span>
									</div>
									<a
										href="tel:1800123456"
										className="p-2.5 bg-[#E7F3FF] text-[#1877F2] hover:bg-[#DBEBFF] rounded-xl transition"
										title="Call Kitchen Support"
									>
										<Phone className="w-4 h-4" />
									</a>
								</div>

								<div className="flex items-center gap-2 text-[#65676B] text-[11px] pt-1">
									<ShieldCheck className="w-4 h-4 text-[#00A400]" />
									<span>
										Contactless delivery verified with
										thermal bag pack
									</span>
								</div>
							</div>
						</div>

						{/* Quick Actions */}
						<div className="flex gap-3">
							<Link
								to="/builder"
								className="flex-1 py-3 bg-[#E7F3FF] hover:bg-[#DBEBFF] text-[#1877F2] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
							>
								<ShoppingBag className="w-4 h-4" />
								<span>Order Another</span>
							</Link>
							<button
								onClick={() =>
									alert(
										"Our delivery support line is open at 1800-123-456.",
									)
								}
								className="px-4 py-3 bg-white border border-[#CED0D4]/70 hover:bg-[#F0F2F5] text-[#65676B] font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
							>
								<HelpCircle className="w-4 h-4" />
								<span>Help</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
