import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
	Sparkles,
	PlusCircle,
	ShoppingBag,
	Search,
	Flame,
	Clock,
	ArrowRight,
	SlidersHorizontal,
	Star,
	CheckCircle,
	ChefHat,
	Truck,
	Radio,
	CheckCircle2,
} from "lucide-react";

const SOCKET_SERVER_URL =
	import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const PRESET_PIZZAS = [
	{
		id: "margherita",
		name: "Classic Margherita",
		category: "Classic",
		description:
			"Fresh Mozzarella, classic marinara sauce, and fresh basil herbs.",
		price: 250,
		rating: 4.8,
		prepTime: "15-20 min",
		isBestseller: true,
		spicy: false,
		image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60",
	},
	{
		id: "farmhouse",
		name: "Garden Farmhouse",
		category: "Veggie",
		description:
			"Crisp bell peppers, button mushrooms, red onions, and mozzarella on a hand-tossed crust.",
		price: 380,
		rating: 4.9,
		prepTime: "20-25 min",
		isBestseller: true,
		spicy: false,
		image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60",
	},
	{
		id: "spicy-arrabbiata",
		name: "Fiery Arrabbiata Feast",
		category: "Spicy",
		description:
			"Spicy arrabbiata sauce, jalapeños, olives, and smoked gouda.",
		price: 410,
		rating: 4.7,
		prepTime: "20-25 min",
		isBestseller: false,
		spicy: true,
		image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=60",
	},
	{
		id: "pesto-delight",
		name: "Basil Pesto Special",
		category: "Artisan",
		description:
			"Aromatic basil pesto base, baby spinach, cheddar cheese, and mushrooms.",
		price: 440,
		rating: 4.6,
		prepTime: "18-22 min",
		isBestseller: false,
		spicy: false,
		image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&auto=format&fit=crop&q=60",
	},
];

const CATEGORIES = ["All", "Classic", "Veggie", "Spicy", "Artisan"];

const TRACKING_STEPS = [
	{ label: "Order Received", icon: Clock },
	{ label: "In Kitchen", icon: ChefHat },
	{ label: "Sent to Delivery", icon: Truck },
];

export default function Dashboard() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [selectedCategory, setSelectedCategory] = useState("All");
	const [searchQuery, setSearchQuery] = useState("");
	const [userOrders, setUserOrders] = useState([]);
	const [socketConnected, setSocketConnected] = useState(false);

	// Fetch customer's orders if logged in
	useEffect(() => {
		if (!user) return;

		let isMounted = true;
		const fetchMyOrders = async () => {
			try {
				const { data } = await api.get("/orders/my-orders");
				if (isMounted) {
					setUserOrders(data);
				}
			} catch (err) {
				console.error("Could not fetch user orders:", err);
			}
		};

		fetchMyOrders();

		return () => {
			isMounted = false;
		};
	}, [user]);

	// Real-time WebSocket connection for live status tracking on dashboard
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

		// Listen for status updates pushed from Admin panel
		socket.on("orderStatusUpdated", (data) => {
			setUserOrders((prevOrders) =>
				prevOrders.map((ord) =>
					ord._id === data.orderId
						? { ...ord, status: data.status }
						: ord,
				),
			);
		});

		return () => {
			socket.disconnect();
		};
	}, [user]);

	// Filter active orders that are in progression
	const activeOrders = useMemo(() => {
		return userOrders.filter(
			(o) =>
				o.paymentStatus === "paid" &&
				(o.status === "Order Received" ||
					o.status === "In Kitchen" ||
					o.status === "Sent to Delivery"),
		);
	}, [userOrders]);

	const filteredPizzas = useMemo(() => {
		return PRESET_PIZZAS.filter((pizza) => {
			const matchesCategory =
				selectedCategory === "All" ||
				pizza.category === selectedCategory;
			const matchesSearch =
				pizza.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				pizza.description
					.toLowerCase()
					.includes(searchQuery.toLowerCase());
			return matchesCategory && matchesSearch;
		});
	}, [selectedCategory, searchQuery]);

	const getStepIndex = (status) =>
		TRACKING_STEPS.findIndex((s) => s.label === status);

	return (
		<div className="min-h-screen bg-[#F0F2F5] text-[#050505] pb-16 font-sans">
			<div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
				{/* Live Real-Time Order Tracking Banner (if customer has active orders) */}
				{activeOrders.length > 0 && (
					<div className="bg-white rounded-2xl border border-[#1877F2]/40 shadow-[0_2px_8px_rgba(24,119,242,0.15)] p-5 md:p-6 space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E4E6EB]">
							<div className="flex items-center gap-2.5">
								<div className="w-9 h-9 rounded-xl bg-[#E7F3FF] text-[#1877F2] flex items-center justify-center">
									<Radio
										className={`w-5 h-5 ${
											socketConnected ? "animate-pulse" : ""
										}`}
									/>
								</div>
								<div>
									<h2 className="text-base font-bold text-[#050505] flex items-center gap-2">
										<span>Live Order Tracking</span>
										<span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#E7F7ED] text-[#00A400]">
											{socketConnected ? "Live Feed" : "Connecting..."}
										</span>
									</h2>
									<p className="text-xs text-[#65676B]">
										Real-time updates pushed from our kitchen staff
									</p>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<span className="text-xs font-semibold text-[#65676B]">
									{activeOrders.length} active order(s)
								</span>
								<button
									onClick={() => navigate("/orders")}
									className="text-xs font-bold text-[#1877F2] hover:underline"
								>
									View All Orders →
								</button>
							</div>

						</div>

						{/* Active Orders List */}
						<div className="space-y-4">
							{activeOrders.map((ord) => {
								const currentIdx = Math.max(0, getStepIndex(ord.status));

								return (
									<div
										key={ord._id}
										className="p-4 rounded-xl bg-[#F0F2F5]/70 border border-[#CED0D4]/60 space-y-4"
									>
										<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
											<div>
												<span className="text-xs font-mono font-bold text-[#1877F2]">
													Order #{ord._id.slice(-8)}
												</span>
												<p className="text-xs text-[#65676B] mt-0.5">
													{ord.items?.length || 1} Pizza(s) • Total: ₹{ord.totalAmount}
												</p>
											</div>

											<button
												onClick={() => navigate(`/track/${ord._id}`)}
												className="px-4 py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
											>
												<span>Full Tracking</span>
												<ArrowRight className="w-3.5 h-3.5" />
											</button>
										</div>

										{/* Stepper Progress Bar */}
										<div className="grid grid-cols-3 gap-2 pt-1">
											{TRACKING_STEPS.map((step, idx) => {
												const StepIcon = step.icon;
												const isDone = currentIdx >= idx;
												const isCurr = currentIdx === idx;

												return (
													<div
														key={step.label}
														className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition ${
															isCurr
																? "bg-white border-[#1877F2] shadow-xs"
																: isDone
																	? "bg-[#E7F7ED]/60 border-[#00A400]/40 text-[#00A400]"
																	: "bg-white/60 border-[#E4E6EB] text-[#65676B] opacity-60"
														}`}
													>
														<div
															className={`w-7 h-7 rounded-full flex items-center justify-center ${
																isCurr
																	? "bg-[#1877F2] text-white"
																	: isDone
																		? "bg-[#00A400] text-white"
																		: "bg-[#E4E6EB] text-[#65676B]"
															}`}
														>
															{isDone && !isCurr ? (
																<CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
															) : (
																<StepIcon className="w-3.5 h-3.5" />
															)}
														</div>
														<span
															className={`text-[11px] font-bold ${
																isCurr
																	? "text-[#1877F2]"
																	: isDone
																		? "text-[#050505]"
																		: "text-[#65676B]"
															}`}
														>
															{step.label}
														</span>
													</div>
												);
											})}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* Facebook-style Custom Builder Banner Card */}
				<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
					{/* Subtle Accent Glow */}
					<div className="absolute -top-12 -right-12 w-48 h-48 bg-[#E7F3FF] rounded-full blur-2xl pointer-events-none" />

					<div className="space-y-3 text-center md:text-left z-10">
						<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7F3FF] text-[#1877F2] text-xs font-bold tracking-wide">
							<Sparkles className="w-3.5 h-3.5" /> 4-Step Custom Studio
						</span>
						<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#050505]">
							Build Your Signature Pizza
						</h1>
						<p className="text-[#65676B] max-w-lg text-sm leading-relaxed">
							Choose your dough, house-simmered sauces, curated cheeses,
							and fresh market toppings with live stock tracking and instant
							checkout.
						</p>
					</div>

					<button
						onClick={() => navigate("/builder")}
						className="z-10 w-full md:w-auto px-6 py-3.5 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold rounded-xl shadow-[0_2px_4px_rgba(24,119,242,0.3)] transition active:scale-[0.98] flex items-center justify-center gap-2.5 whitespace-nowrap text-sm"
					>
						<PlusCircle className="w-5 h-5" />
						<span>Launch Pizza Builder</span>
						<ArrowRight className="w-4 h-4 ml-1" />
					</button>
				</div>

				{/* Search & Category Filter Section */}
				<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-4 space-y-4">
					<div className="flex flex-col sm:flex-row items-center gap-3">
						{/* Search Bar */}
						<div className="relative flex-1 w-full">
							<Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#65676B]" />
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search pizzas or ingredients..."
								className="w-full pl-10 pr-4 py-2.5 bg-[#F0F2F5] hover:bg-[#E4E6EB]/70 focus:bg-white text-sm rounded-full border border-transparent focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 focus:outline-none transition text-[#050505] placeholder-[#65676B]"
							/>
						</div>

						{/* Quick Badge Counter */}
						<div className="text-xs font-semibold text-[#65676B] hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#F0F2F5] rounded-full">
							<SlidersHorizontal className="w-3.5 h-3.5 text-[#1877F2]" />
							<span>{filteredPizzas.length} Available</span>
						</div>
					</div>

					{/* Category Pill Filter Buttons */}
					<div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
						{CATEGORIES.map((cat) => {
							const active = selectedCategory === cat;
							return (
								<button
									key={cat}
									onClick={() => setSelectedCategory(cat)}
									className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
										active
											? "bg-[#E7F3FF] text-[#1877F2] border border-[#1877F2]/30 shadow-xs"
											: "bg-[#F0F2F5] text-[#050505] hover:bg-[#E4E6EB] border border-transparent"
									}`}
								>
									{cat}
								</button>
							);
						})}
					</div>
				</div>

				{/* Catalog Grid */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-xl font-bold text-[#050505] tracking-tight">
								Chef's Handcrafted Menu
							</h2>
							<p className="text-xs text-[#65676B]">
								Pre-configured signature combinations ready for oven baking
							</p>
						</div>
					</div>

					{filteredPizzas.length === 0 ? (
						<div className="bg-white rounded-2xl border border-[#CED0D4]/70 p-12 text-center space-y-3">
							<div className="w-12 h-12 bg-[#F0F2F5] rounded-full flex items-center justify-center mx-auto text-[#65676B]">
								<Search className="w-6 h-6" />
							</div>
							<h3 className="font-bold text-[#050505]">
								No pizzas found
							</h3>
							<p className="text-xs text-[#65676B] max-w-sm mx-auto">
								No matching recipes for "{searchQuery}". Try selecting
								another category or build your own custom recipe.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							{filteredPizzas.map((pizza) => (
								<div
									key={pizza.id}
									className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-200 overflow-hidden flex flex-col justify-between group"
								>
									<div>
										{/* Pizza Image with Badges */}
										<div className="relative h-44 w-full overflow-hidden bg-[#E4E6EB]">
											<img
												src={pizza.image}
												alt={pizza.name}
												className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
											/>

											<div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
												{pizza.isBestseller && (
													<span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1877F2] text-white shadow-xs flex items-center gap-1">
														<Star className="w-3 h-3 fill-white" />{" "}
														Popular
													</span>
												)}
												{pizza.spicy && (
													<span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FA383E] text-white shadow-xs flex items-center gap-1">
														<Flame className="w-3 h-3" />{" "}
														Spicy
													</span>
												)}
											</div>

											<div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#050505]/75 text-white backdrop-blur-xs flex items-center gap-1">
												<Clock className="w-3 h-3" />{" "}
												{pizza.prepTime}
											</div>
										</div>

										{/* Content Details */}
										<div className="p-4 space-y-2">
											<div className="flex items-center justify-between">
												<span className="text-[10px] font-bold uppercase tracking-wider text-[#1877F2]">
													{pizza.category}
												</span>
												<div className="flex items-center gap-1 text-xs font-bold text-[#050505]">
													<Star className="w-3.5 h-3.5 fill-[#F7B125] text-[#F7B125]" />
													<span>{pizza.rating}</span>
												</div>
											</div>

											<h3 className="font-bold text-[#050505] text-base leading-snug">
												{pizza.name}
											</h3>
											<p className="text-xs text-[#65676B] line-clamp-2 leading-relaxed">
												{pizza.description}
											</p>
										</div>
									</div>

									{/* Card Action Footer */}
									<div className="p-4 pt-3 border-t border-[#E4E6EB] flex items-center justify-between bg-[#FAFAFA]/50">
										<div>
											<span className="text-[10px] uppercase font-semibold text-[#65676B] block">
												Price
											</span>
											<span className="text-lg font-black text-[#050505]">
												₹{pizza.price}
											</span>
										</div>

										<button
											onClick={() => navigate("/builder")}
											className="px-3.5 py-2 bg-[#E7F3FF] hover:bg-[#DBEBFF] text-[#1877F2] rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
										>
											<ShoppingBag className="w-3.5 h-3.5" />
											<span>Customize</span>
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Facebook-style Informational Guarantee Banner */}
				<div className="bg-white rounded-2xl border border-[#CED0D4]/70 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.1)] flex flex-wrap items-center justify-around gap-4 text-xs font-semibold text-[#65676B]">
					<div className="flex items-center gap-2">
						<CheckCircle className="w-4 h-4 text-[#1877F2]" />
						<span>100% Mozzarella & Hand-Rolled Crusts</span>
					</div>
					<div className="flex items-center gap-2">
						<CheckCircle className="w-4 h-4 text-[#1877F2]" />
						<span>Real-Time Kitchen WebSocket Tracking</span>
					</div>
					<div className="flex items-center gap-2">
						<CheckCircle className="w-4 h-4 text-[#1877F2]" />
						<span>Secure Razorpay Integration</span>
					</div>
				</div>
			</div>
		</div>
	);
}
