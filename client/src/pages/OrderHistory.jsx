import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
	ShoppingBag,
	Clock,
	ChefHat,
	Truck,
	CheckCircle2,
	RotateCcw,
	ArrowRight,
	MapPin,
	Calendar,
	Radio,
	Layers,
	Flame,
	Sparkles,
	Leaf,
} from "lucide-react";


const SOCKET_SERVER_URL =
	import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export default function OrderHistory() {
	const navigate = useNavigate();
	const { user } = useAuth();

	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [socketConnected, setSocketConnected] = useState(false);

	// 1. Fetch user's full order history
	const fetchOrders = async () => {
		try {
			const { data } = await api.get("/orders/my-orders");
			setOrders(data);
		} catch (err) {
			console.error("Failed to load customer orders:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		let isMounted = true;
		(async () => {
			try {
				const { data } = await api.get("/orders/my-orders");
				if (isMounted) {
					setOrders(data);
				}
			} catch (err) {
				console.error("Failed to load customer orders:", err);
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		})();

		return () => {
			isMounted = false;
		};
	}, []);

	// 2. Real-time updates via Socket.io
	useEffect(() => {
		if (!user) return;

		const socket = io(SOCKET_SERVER_URL);

		socket.on("connect", () => {
			setSocketConnected(true);
			const uid = user.id || user._id;
			if (uid) {
				socket.emit("joinUserOrdersRoom", uid);
			}
		});

		socket.on("disconnect", () => {
			setSocketConnected(false);
		});

		// Listen for live order status broadcasts from Admin console
		socket.on("orderStatusUpdated", (data) => {
			setOrders((prev) =>
				prev.map((ord) =>
					ord._id === data.orderId
						? {
								...ord,
								status: data.status,
								deliveredAt: data.deliveredAt || ord.deliveredAt,
							}
						: ord,
				),
			);
		});

		return () => {
			socket.disconnect();
		};
	}, [user]);

	// Separate active and past orders
	const activeOrders = useMemo(() => {
		return orders.filter(
			(ord) =>
				ord.paymentStatus === "paid" && ord.status !== "Delivered",
		);
	}, [orders]);

	const pastOrders = useMemo(() => {
		return orders.filter(
			(ord) =>
				ord.status === "Delivered" || ord.paymentStatus !== "paid",
		);
	}, [orders]);

	// 3. Reorder Pizza Handler
	const handleReorder = (item) => {
		const customPizza = {
			base: item.base || { name: "Hand Tossed Artisan Base", price: 100 },
			sauce: item.sauce || { name: "Classic Herb Marinara", price: 40 },
			cheese: item.cheese || { name: "Creamy Mozzarella", price: 70 },
			vegetables: (item.vegetables || []).filter(Boolean),
			totalAmount:
				(item.base?.price || 100) +
				(item.sauce?.price || 40) +
				(item.cheese?.price || 70) +
				(item.vegetables?.reduce(
					(acc, v) => acc + (v?.price || 0),
					0,
				) || 0),
		};

		localStorage.setItem("cart_pizza", JSON.stringify(customPizza));
		navigate("/order-summary");
	};

	if (loading) {
		return (
			<div className="min-h-[75vh] flex flex-col items-center justify-center gap-3 bg-[#F0F2F5]">
				<div className="w-10 h-10 border-4 border-[#E7F3FF] border-t-[#1877F2] rounded-full animate-spin" />
				<p className="text-xs font-bold text-[#65676B] animate-pulse">
					Loading your orders...
				</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#F0F2F5] text-[#050505] pb-16 font-sans">
			<div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
				{/* Top Header Card */}
				<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<div className="flex items-center gap-2 mb-1.5">
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
										? "Live Feed Active"
										: "Connecting..."}
								</span>
							</span>
							<span className="text-[10px] font-extrabold uppercase tracking-wider text-[#65676B]">
								Account Orders
							</span>
						</div>
						<h1 className="text-2xl font-black text-[#050505] tracking-tight">
							Your Pizza Orders
						</h1>
						<p className="text-xs text-[#65676B] mt-0.5">
							Track live deliveries in real-time or instantly reorder your favorite artisan pizza.
						</p>
					</div>

					<div className="flex items-center gap-3">
						<button
							onClick={fetchOrders}
							title="Refresh Orders"
							className="p-2.5 bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#65676B] rounded-xl transition"
						>
							<RotateCcw className="w-4 h-4" />
						</button>
						<Link
							to="/builder"
							className="px-4 py-2.5 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-[0_2px_4px_rgba(24,119,242,0.25)] active:scale-95"
						>
							<Sparkles className="w-4 h-4" />
							<span>Build New Pizza</span>
						</Link>
					</div>
				</div>

				{/* SECTION 1: ACTIVE ORDERS */}
				<div className="space-y-3">
					<div className="flex items-center justify-between px-1">
						<div className="flex items-center gap-2">
							<div className="w-2.5 h-2.5 rounded-full bg-[#1877F2] animate-pulse" />
							<h2 className="text-base font-black text-[#050505]">
								Active Orders ({activeOrders.length})
							</h2>
						</div>
						{activeOrders.length > 0 && (
							<span className="text-xs font-bold text-[#1877F2]">
								Live Kitchen Sync
							</span>
						)}
					</div>

					{activeOrders.length === 0 ? (
						<div className="bg-white rounded-2xl border border-[#CED0D4]/70 p-8 text-center text-[#65676B] space-y-2">
							<ShoppingBag className="w-8 h-8 mx-auto text-[#CED0D4]" />
							<p className="font-bold text-[#050505] text-sm">
								No active orders at the moment.
							</p>
							<p className="text-xs text-[#65676B]">
								Fresh dough is ready! Build your custom pizza or pick a classic from our menu.
							</p>
							<div className="pt-2 flex justify-center gap-3">
								<Link
									to="/dashboard"
									className="px-4 py-2 bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#050505] text-xs font-bold rounded-xl transition"
								>
									Explore Menu
								</Link>
								<Link
									to="/builder"
									className="px-4 py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-bold rounded-xl transition"
								>
									Open Pizza Studio
								</Link>
							</div>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{activeOrders.map((ord) => (
								<div
									key={ord._id}
									className="bg-white rounded-2xl border-2 border-[#1877F2]/30 shadow-[0_2px_6px_rgba(24,119,242,0.1)] p-5 space-y-4 hover:border-[#1877F2] transition"
								>
									{/* Order Header */}
									<div className="flex items-start justify-between pb-3 border-b border-[#E4E6EB] gap-2">
										<div>
											<span className="text-[10px] font-mono font-bold text-[#1877F2] block">
												Order #{ord._id.slice(-8)}
											</span>
											<span className="text-xs text-[#65676B] flex items-center gap-1 mt-0.5">
												<Calendar className="w-3 h-3" />
												{new Date(
													ord.createdAt,
												).toLocaleDateString([], {
													month: "short",
													day: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												})}
											</span>
										</div>

										{/* Status Badge */}
										<span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#E7F3FF] text-[#1877F2] border border-[#1877F2]/20">
											{ord.status === "Order Received" && (
												<Clock className="w-3.5 h-3.5" />
											)}
											{ord.status === "In Kitchen" && (
												<ChefHat className="w-3.5 h-3.5" />
											)}
											{ord.status ===
												"Sent to Delivery" && (
												<Truck className="w-3.5 h-3.5" />
											)}
											<span>{ord.status}</span>
										</span>
									</div>

									{/* Pizza Recipe Items */}
									<div className="space-y-2">
										{ord.items?.map((it, idx) => (
											<div
												key={idx}
												className="bg-[#F0F2F5]/70 p-3 rounded-xl border border-[#CED0D4]/50 text-xs space-y-1"
											>
												<div className="flex justify-between font-bold text-[#050505]">
													<span>Custom Pizza #{idx + 1}</span>
													<span>Qty: {it.quantity || 1}</span>
												</div>
												<p className="text-[#65676B] text-[11px]">
													<strong>Crust:</strong>{" "}
													{it.base?.name || "Hand Tossed"} |{" "}
													<strong>Sauce:</strong>{" "}
													{it.sauce?.name || "Marinara"} |{" "}
													<strong>Cheese:</strong>{" "}
													{it.cheese?.name || "Mozzarella"}
												</p>
												{it.vegetables?.length > 0 && (
													<p className="text-[#00A400] text-[11px] font-medium">
														<strong>Toppings:</strong>{" "}
														{it.vegetables
															.map(
																(v) =>
																	v?.name || "Topping",
															)
															.join(", ")}
													</p>
												)}
											</div>
										))}
									</div>

									{/* Bottom Bar: Total & Live Track Link */}
									<div className="flex items-center justify-between pt-2 border-t border-[#E4E6EB]">
										<div>
											<span className="text-[10px] uppercase font-bold text-[#65676B] block">
												Total Paid
											</span>
											<span className="text-base font-black text-[#050505]">
												₹{ord.totalAmount}
											</span>
										</div>

										<Link
											to={`/track/${ord._id}`}
											className="px-4 py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
										>
											<span>Live Tracker</span>
											<ArrowRight className="w-3.5 h-3.5" />
										</Link>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* SECTION 2: PAST / DELIVERED ORDERS */}
				<div className="space-y-3 pt-4">
					<div className="flex items-center justify-between px-1">
						<div className="flex items-center gap-2">
							<CheckCircle2 className="w-4 h-4 text-[#00A400]" />
							<h2 className="text-base font-black text-[#050505]">
								Past Orders ({pastOrders.length})
							</h2>
						</div>
						<span className="text-xs font-medium text-[#65676B]">
							Delivered & Completed
						</span>
					</div>

					{pastOrders.length === 0 ? (
						<div className="bg-white rounded-2xl border border-[#CED0D4]/70 p-8 text-center text-[#65676B]">
							<p className="text-xs">No previous completed orders found.</p>
						</div>
					) : (
						<div className="space-y-3.5">
							{pastOrders.map((ord) => (
								<div
									key={ord._id}
									className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.06)] p-5 space-y-4"
								>
									{/* Order Header */}
									<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[#E4E6EB]">
										<div>
											<div className="flex items-center gap-2">
												<span className="text-xs font-mono font-bold text-[#1877F2]">
													Order #{ord._id}
												</span>
												<span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#E7F7ED] text-[#00A400] border border-[#00A400]/20">
													<CheckCircle2 className="w-3 h-3" />
													Delivered
												</span>
											</div>

											<div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#65676B]">
												<span className="flex items-center gap-1">
													<Calendar className="w-3.5 h-3.5" />
													{new Date(
														ord.createdAt,
													).toLocaleDateString([], {
														year: "numeric",
														month: "short",
														day: "numeric",
													})}
												</span>
												{ord.deliveredAt && (
													<span className="text-[#00A400] font-semibold">
														Delivered at{" "}
														{new Date(
															ord.deliveredAt,
														).toLocaleTimeString(
															[],
															{
																hour: "2-digit",
																minute: "2-digit",
															},
														)}
													</span>
												)}
												{ord.deliveryAddress && (
													<span className="flex items-center gap-1">
														<MapPin className="w-3.5 h-3.5" />
														{ord.deliveryAddress}
													</span>
												)}
											</div>
										</div>

										<div className="text-right">
											<span className="text-[10px] uppercase font-bold text-[#65676B] block">
												Amount Paid
											</span>
											<span className="text-lg font-black text-[#050505]">
												₹{ord.totalAmount}
											</span>
										</div>
									</div>

									{/* Itemized Pizza Recipes */}
									<div className="space-y-2.5">
										{ord.items?.map((it, idx) => (
											<div
												key={idx}
												className="bg-[#F0F2F5]/70 p-3.5 rounded-xl border border-[#CED0D4]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
											>
												<div className="space-y-1">
													<div className="flex items-center gap-2">
														<span className="font-bold text-[#1877F2]">
															Custom Pizza #{idx + 1}
														</span>
														<span className="bg-white px-2 py-0.5 rounded text-[11px] font-semibold text-[#65676B] border border-[#CED0D4]/60">
															Qty: {it.quantity || 1}
														</span>
													</div>

													<div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
														<span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-[#CED0D4]/60">
															<Layers className="w-3 h-3 text-[#1877F2]" />
															<span>
																Crust:{" "}
																<strong>
																	{it.base
																		?.name ||
																		"Artisan Base"}
																</strong>
															</span>
														</span>

														<span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-[#CED0D4]/60">
															<Flame className="w-3 h-3 text-[#FA383E]" />
															<span>
																Sauce:{" "}
																<strong>
																	{it.sauce
																		?.name ||
																		"Marinara"}
																</strong>
															</span>
														</span>

														<span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-[#CED0D4]/60">
															<Sparkles className="w-3 h-3 text-[#F7B125]" />
															<span>
																Cheese:{" "}
																<strong>
																	{it.cheese
																		?.name ||
																		"Mozzarella"}
																</strong>
															</span>
														</span>

														{it.vegetables?.length >
															0 && (
															<span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-[#CED0D4]/60 text-[#00A400]">
																<Leaf className="w-3 h-3" />
																<span>
																	Toppings:{" "}
																	<strong>
																		{it.vegetables
																			.map(
																				(
																					v,
																				) =>
																					v?.name ||
																					"Topping",
																			)
																			.join(
																				", ",
																			)}
																	</strong>
																</span>
															</span>
														)}
													</div>
												</div>

												{/* Reorder Pizza Button */}
												<button
													onClick={() =>
														handleReorder(it)
													}
													className="px-3.5 py-2 bg-[#E7F3FF] hover:bg-[#DBEBFF] text-[#1877F2] font-bold rounded-xl transition flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0 active:scale-95 text-xs shadow-xs"
													title="Reorder this exact pizza recipe"
												>
													<RotateCcw className="w-3.5 h-3.5" />
													<span>Reorder Pizza</span>
												</button>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
