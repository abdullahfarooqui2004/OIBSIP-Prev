import { useState, useEffect, useMemo } from "react";
import io from "socket.io-client";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import {
	AlertTriangle,
	Check,
	ClipboardList,
	LogOut,
	Package,
	RotateCcw,
	Search,
	IndianRupee,
	Clock,
	ChefHat,
	Truck,
	CheckCircle2,
	X,
	Layers,
	Plus,
	Minus,
	Send,
	MapPin,
	Phone,
	Trash2,
} from "lucide-react";

const SOCKET_SERVER_URL =
	import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const STATUS_OPTIONS = [
	"Order Received",
	"In Kitchen",
	"Sent to Delivery",
	"Delivered",
];
const CATEGORIES = ["All", "base", "sauce", "cheese", "veggie"];


export default function AdminDashboard() {
	const { logout } = useAuth();
	const [activeTab, setActiveTab] = useState("inventory"); // 'inventory' | 'orders'
	const [inventory, setInventory] = useState([]);
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [socketConnected, setSocketConnected] = useState(false);
	const [triggeringJob, setTriggeringJob] = useState(false);

	// Search & Filter States
	const [invSearch, setInvSearch] = useState("");
	const [invCategory, setInvCategory] = useState("All");
	const [orderFilter, setOrderFilter] = useState("All");
	const [orderSearch, setOrderSearch] = useState("");

	// Edit State
	const [editingId, setEditingId] = useState(null);
	const [editValues, setEditValues] = useState({
		stock: 0,
		threshold: 0,
		price: 0,
	});
	const [toastMessage, setToastMessage] = useState("");

	const showToast = (msg) => {
		setToastMessage(msg);
		setTimeout(() => setToastMessage(""), 3500);
	};

	// 1. Fetch data helper for manual refresh
	const fetchData = async () => {
		try {
			const [invRes, ordRes] = await Promise.all([
				api.get("/inventory"),
				api.get("/admin/orders"),
			]);
			setInventory(invRes.data);
			setOrders(ordRes.data);
		} catch (err) {
			console.error("Failed to load admin data:", err);
			showToast("Failed to fetch fresh data from the server.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		let isMounted = true;
		(async () => {
			try {
				const [invRes, ordRes] = await Promise.all([
					api.get("/inventory"),
					api.get("/admin/orders"),
				]);
				if (isMounted) {
					setInventory(invRes.data);
					setOrders(ordRes.data);
				}
			} catch (err) {
				console.error("Failed to load admin data:", err);
				if (isMounted) {
					showToast("Failed to fetch fresh data from the server.");
				}
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

	// Real-time WebSockets connection for Admin Console
	useEffect(() => {
		const socket = io(SOCKET_SERVER_URL);

		socket.on("connect", () => {
			setSocketConnected(true);
			socket.emit("joinAdminRoom");
		});

		socket.on("disconnect", () => {
			setSocketConnected(false);
		});

		// Listen for incoming new orders in real-time
		socket.on("newOrder", (newOrd) => {
			setOrders((prev) => {
				if (prev.some((o) => o._id === newOrd._id)) return prev;
				return [newOrd, ...prev];
			});
			showToast(`🔔 New Order #${newOrd._id.slice(-6)} received!`);
		});

		// Listen for order status updates
		socket.on("orderStatusUpdated", (data) => {
			setOrders((prev) =>
				prev.map((ord) =>
					ord._id === data.orderId
						? { ...ord, status: data.status }
						: ord,
				),
			);
		});

		// Listen for inventory stock changes
		socket.on("inventoryUpdated", () => {
			api.get("/inventory")
				.then((res) => setInventory(res.data))
				.catch((err) => console.error("Error syncing inventory:", err));
		});

		socket.on("inventoryCreated", (newItem) => {
			if (newItem?._id) {
				setInventory((prev) =>
					prev.some((item) => item._id === newItem._id)
						? prev
						: [newItem, ...prev],
				);
			}
		});

		socket.on("inventoryDeleted", (data) => {
			if (data?.id) {
				setInventory((prev) =>
					prev.filter((item) => item._id !== data.id),
				);
			}
		});

		return () => {
			socket.disconnect();
		};
	}, []);

	// Trigger manual low-stock check & admin notification
	const handleTriggerLowStockCheck = async () => {
		setTriggeringJob(true);
		try {
			const { data } = await api.post("/inventory/check-low-stock");
			showToast(data.message || "Low-stock alert job executed successfully!");
		} catch (err) {
			showToast(
				err.response?.data?.message ||
					"Failed to trigger low-stock alert.",
			);
		} finally {
			setTriggeringJob(false);
		}
	};

	// 2. Manual Inventory Updates
	const handleEditClick = (item) => {
		setEditingId(item._id);
		setEditValues({
			stock: item.stock,
			threshold: item.threshold,
			price: item.price,
		});
	};

	const handleSaveStock = async (id) => {
		try {
			const { data } = await api.patch(`/inventory/${id}`, editValues);
			setInventory((prev) =>
				prev.map((item) => (item._id === id ? data.item : item)),
			);
			setEditingId(null);
			showToast(`${data.item.name} updated successfully!`);
		} catch {
			showToast("Error updating stock levels.");
		}
	};

	// Quick increment/decrement helper for stock
	const handleQuickAdjust = async (item, delta) => {
		const newStock = Math.max(0, item.stock + delta);
		try {
			const { data } = await api.patch(`/inventory/${item._id}`, {
				stock: newStock,
			});
			setInventory((prev) =>
				prev.map((it) => (it._id === item._id ? data.item : it)),
			);
		} catch {
			showToast("Could not adjust stock.");
		}
	};

	// Delete Inventory Item Handler
	const handleDeleteIngredient = async (id, name) => {
		const confirmed = window.confirm(
			`Are you sure you want to delete "${name}" from inventory? Past order records will remain safe.`,
		);
		if (!confirmed) return;

		try {
			await api.delete(`/inventory/${id}`);
			setInventory((prev) => prev.filter((item) => item._id !== id));
			showToast(`"${name}" deleted from inventory.`);
		} catch (err) {
			console.error("Failed to delete ingredient:", err);
			showToast(
				err.response?.data?.message || "Failed to delete ingredient.",
			);
		}
	};

	// Add New Ingredient Modal Handler
	const [showAddModal, setShowAddModal] = useState(false);
	const [submittingAdd, setSubmittingAdd] = useState(false);
	const [addError, setAddError] = useState("");
	const [newIngredient, setNewIngredient] = useState({
		name: "",
		category: "base",
		price: "",
		stock: "",
		threshold: 20,
	});

	const handleAddIngredient = async (e) => {
		e.preventDefault();
		setAddError("");

		if (!newIngredient.name.trim()) {
			setAddError("Ingredient name is required.");
			return;
		}
		if (newIngredient.price === "" || Number(newIngredient.price) < 0) {
			setAddError("Price must be 0 or a positive number.");
			return;
		}
		if (newIngredient.stock === "" || Number(newIngredient.stock) < 0) {
			setAddError("Stock must be 0 or a positive number.");
			return;
		}
		if (
			newIngredient.threshold === "" ||
			Number(newIngredient.threshold) < 0
		) {
			setAddError("Safety threshold must be 0 or a positive number.");
			return;
		}

		setSubmittingAdd(true);
		try {
			const { data } = await api.post("/inventory", {
				name: newIngredient.name.trim(),
				category: newIngredient.category,
				price: Number(newIngredient.price),
				stock: Number(newIngredient.stock),
				threshold: Number(newIngredient.threshold),
			});

			setInventory((prev) => {
				if (prev.some((it) => it._id === data.item._id)) return prev;
				return [data.item, ...prev];
			});

			setShowAddModal(false);
			setNewIngredient({
				name: "",
				category: "base",
				price: "",
				stock: "",
				threshold: 20,
			});
			showToast(`"${data.item.name}" added successfully!`);
		} catch (err) {
			setAddError(
				err.response?.data?.message || "Failed to add ingredient.",
			);
		} finally {
			setSubmittingAdd(false);
		}
	};

	// 3. Status Switcher triggering Socket.io broadcast[cite: 1, 2]
	const handleStatusChange = async (orderId, newStatus) => {
		try {
			const { data } = await api.patch(
				`/admin/orders/${orderId}/status`,
				{
					status: newStatus,
				},
			);
			setOrders((prev) =>
				prev.map((ord) =>
					ord._id === orderId
						? { ...ord, status: data.order.status }
						: ord,
				),
			);
			showToast(`Order status updated to "${newStatus}"!`);
		} catch {
			showToast("Failed to update order status.");
		}
	};

	// KPIs
	const totalRevenue = useMemo(() => {
		return orders
			.filter((o) => o.paymentStatus === "paid")
			.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
	}, [orders]);

	const lowStockCount = useMemo(() => {
		return inventory.filter((item) => item.stock <= item.threshold).length;
	}, [inventory]);

	const activeKitchenOrders = useMemo(() => {
		return orders.filter((o) => o.status !== "Delivered").length;
	}, [orders]);


	// Filtered Inventory
	const filteredInventory = useMemo(() => {
		return inventory.filter((item) => {
			const matchesCategory =
				invCategory === "All" || item.category === invCategory;
			const matchesSearch = item.name
				.toLowerCase()
				.includes(invSearch.toLowerCase());
			return matchesCategory && matchesSearch;
		});
	}, [inventory, invCategory, invSearch]);

	// Filtered Orders
	const filteredOrders = useMemo(() => {
		return orders.filter((ord) => {
			const matchesStatus =
				orderFilter === "All" || ord.status === orderFilter;
			const matchesSearch =
				ord._id.toLowerCase().includes(orderSearch.toLowerCase()) ||
				ord.user?.name
					?.toLowerCase()
					.includes(orderSearch.toLowerCase()) ||
				ord.user?.email
					?.toLowerCase()
					.includes(orderSearch.toLowerCase());
			return matchesStatus && matchesSearch;
		});
	}, [orders, orderFilter, orderSearch]);

	if (loading) {
		return (
			<div className="min-h-[75vh] flex flex-col items-center justify-center gap-3 bg-[#F0F2F5]">
				<div className="w-10 h-10 border-4 border-[#E7F3FF] border-t-[#1877F2] rounded-full animate-spin" />
				<p className="text-xs font-bold text-[#65676B] animate-pulse">
					Loading Store Management Console...
				</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#F0F2F5] text-[#050505] pb-16 font-sans">
			<div className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
				{/* Floating Toast Notice */}
				{toastMessage && (
					<div className="fixed bottom-6 right-6 z-50 bg-[#050505] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-bold border border-white/10 animate-fade-in">
						<CheckCircle2 className="w-4 h-4 text-[#42B72A]" />
						<span>{toastMessage}</span>
					</div>
				)}

				{/* Top Header Card */}
				<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<div className="flex items-center gap-2 mb-1">
							<span
								className={`w-2.5 h-2.5 rounded-full ${
									socketConnected
										? "bg-[#42B72A] animate-pulse"
										: "bg-[#FA383E]"
								}`}
							/>
							<span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1877F2]">
								{socketConnected
									? "Admin Console • Live Socket Feed"
									: "Admin Console • Connecting..."}
							</span>
						</div>
						<h1 className="text-2xl font-black text-[#050505] tracking-tight">
							Store Operations Dashboard
						</h1>
						<p className="text-xs text-[#65676B]">
							Oversee live ingredient stocks, automated low-stock
							jobs, and order progression.
						</p>
					</div>

					<div className="flex items-center gap-3">
						{/* View Switcher Pills */}
						<div className="bg-[#F0F2F5] p-1 rounded-xl flex border border-[#CED0D4]/60">
							<button
								onClick={() => setActiveTab("inventory")}
								className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition ${
									activeTab === "inventory"
										? "bg-white shadow-xs text-[#1877F2]"
										: "text-[#65676B] hover:text-[#050505]"
								}`}
							>
								<Package className="w-4 h-4" />
								<span>Inventory ({inventory.length})</span>
							</button>

							<button
								onClick={() => setActiveTab("orders")}
								className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition ${
									activeTab === "orders"
										? "bg-white shadow-xs text-[#1877F2]"
										: "text-[#65676B] hover:text-[#050505]"
								}`}
							>
								<ClipboardList className="w-4 h-4" />
								<span>Live Orders ({orders.length})</span>
							</button>
						</div>

						<button
							onClick={fetchData}
							title="Refresh Data"
							className="p-2.5 bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#65676B] hover:text-[#050505] rounded-xl transition"
						>
							<RotateCcw className="w-4 h-4" />
						</button>

						<button
							onClick={logout}
							title="Sign Out"
							className="p-2.5 bg-[#FFEBE8] hover:bg-[#FA383E]/20 text-[#FA383E] rounded-xl transition"
						>
							<LogOut className="w-4 h-4" />
						</button>
					</div>
				</div>

				{/* Executive KPI Stats Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-5 flex items-center justify-between">
						<div>
							<span className="text-[10px] font-extrabold uppercase tracking-wider text-[#65676B] block">
								Total Revenue
							</span>
							<span className="text-2xl font-black text-[#050505]">
								₹{totalRevenue.toLocaleString()}
							</span>
							<span className="text-[11px] text-[#00A400] font-bold block mt-0.5">
								From{" "}
								{
									orders.filter(
										(o) => o.paymentStatus === "paid",
									).length
								}{" "}
								paid orders
							</span>
						</div>
						<div className="w-11 h-11 bg-[#E7F7ED] text-[#00A400] rounded-xl flex items-center justify-center">
							<IndianRupee className="w-5 h-5" />
						</div>
					</div>

					<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-5 flex items-center justify-between">
						<div>
							<span className="text-[10px] font-extrabold uppercase tracking-wider text-[#65676B] block">
								Kitchen Queue
							</span>
							<span className="text-2xl font-black text-[#1877F2]">
								{activeKitchenOrders}
							</span>
							<span className="text-[11px] text-[#65676B] font-medium block mt-0.5">
								Orders awaiting completion
							</span>
						</div>
						<div className="w-11 h-11 bg-[#E7F3FF] text-[#1877F2] rounded-xl flex items-center justify-center">
							<ChefHat className="w-5 h-5" />
						</div>
					</div>

					<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-5 flex flex-col justify-between gap-3">
						<div className="flex items-center justify-between">
							<div>
								<span className="text-[10px] font-extrabold uppercase tracking-wider text-[#65676B] block">
									Low Stock Items
								</span>
								<span
									className={`text-2xl font-black ${lowStockCount > 0 ? "text-[#FA383E]" : "text-[#050505]"}`}
								>
									{lowStockCount}
								</span>
								<span className="text-[11px] text-[#65676B] font-medium block mt-0.5">
									node-cron &lt; threshold
								</span>
							</div>
							<div
								className={`w-11 h-11 rounded-xl flex items-center justify-center ${
									lowStockCount > 0
										? "bg-[#FFEBE8] text-[#FA383E]"
										: "bg-[#F0F2F5] text-[#65676B]"
								}`}
							>
								<AlertTriangle className="w-5 h-5" />
							</div>
						</div>

						<button
							onClick={handleTriggerLowStockCheck}
							disabled={triggeringJob}
							className="w-full py-1.5 px-2 bg-[#E7F3FF] hover:bg-[#DBEBFF] text-[#1877F2] rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
						>
							<Send className="w-3 h-3" />
							<span>{triggeringJob ? "Dispatching..." : "Dispatch Alert Email"}</span>
						</button>
					</div>

					<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-5 flex items-center justify-between">
						<div>
							<span className="text-[10px] font-extrabold uppercase tracking-wider text-[#65676B] block">
								Total Recipes Stocked
							</span>
							<span className="text-2xl font-black text-[#050505]">
								{inventory.length}
							</span>
							<span className="text-[11px] text-[#65676B] font-medium block mt-0.5">
								Bases, sauces, cheeses, veggies[cite: 1, 2]
							</span>
						</div>
						<div className="w-11 h-11 bg-[#F0F2F5] text-[#050505] rounded-xl flex items-center justify-center">
							<Layers className="w-5 h-5" />
						</div>
					</div>
				</div>

				{/* TAB 1: INVENTORY MANAGEMENT */}
				{activeTab === "inventory" && (
					<div className="space-y-4">
						{/* Filter & Search Toolbar */}
						<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-4 flex flex-col md:flex-row items-center justify-between gap-3">
							<div className="relative w-full md:w-72">
								<Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#65676B]" />
								<input
									type="text"
									value={invSearch}
									onChange={(e) =>
										setInvSearch(e.target.value)
									}
									placeholder="Search ingredient by name..."
									className="w-full pl-9 pr-3 py-2 bg-[#F0F2F5] rounded-xl text-xs border border-transparent focus:bg-white focus:border-[#1877F2] focus:outline-none transition"
								/>
							</div>

							<div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
								{/* Category Pills */}
								<div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
									{CATEGORIES.map((cat) => (
										<button
											key={cat}
											onClick={() => setInvCategory(cat)}
											className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition whitespace-nowrap ${
												invCategory === cat
													? "bg-[#E7F3FF] text-[#1877F2] border border-[#1877F2]/30"
													: "bg-[#F0F2F5] text-[#65676B] hover:bg-[#E4E6EB]"
											}`}
										>
											{cat}
										</button>
									))}
								</div>

								{/* Add Ingredient Button */}
								<button
									onClick={() => {
										setAddError("");
										setShowAddModal(true);
									}}
									className="px-3.5 py-2 bg-[#42B72A] hover:bg-[#36A420] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-[0_2px_4px_rgba(66,183,42,0.25)] shrink-0 active:scale-95"
								>
									<Plus className="w-4 h-4 stroke-[2.5]" />
									<span>Add Ingredient</span>
								</button>
							</div>
						</div>


						{/* Inventory Table Card */}
						<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] overflow-hidden">
							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs text-[#050505]">
									<thead className="bg-[#F0F2F5] text-[#65676B] uppercase text-[10px] font-bold border-b border-[#CED0D4]/60">
										<tr>
											<th className="py-3.5 px-4">
												Item Name
											</th>
											<th className="py-3.5 px-4">
												Category
											</th>
											<th className="py-3.5 px-4">
												Price (₹)
											</th>
											<th className="py-3.5 px-4">
												Current Stock
											</th>
											<th className="py-3.5 px-4">
												Safety Threshold
											</th>
											<th className="py-3.5 px-4">
												Health Status
											</th>
											<th className="py-3.5 px-4 text-right">
												Actions
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-[#E4E6EB]">
										{filteredInventory.length === 0 ? (
											<tr>
												<td
													colSpan={7}
													className="py-8 text-center text-[#65676B]"
												>
													No ingredients found
													matching your search.
												</td>
											</tr>
										) : (
											filteredInventory.map((item) => {
												const isLow =
													item.stock <=
													item.threshold;
												const isEditing =
													editingId === item._id;

												return (
													<tr
														key={item._id}
														className={`transition ${
															isLow
																? "bg-[#FFEBE8]/40 hover:bg-[#FFEBE8]/70"
																: "hover:bg-[#F0F2F5]/50"
														}`}
													>
														<td className="py-3.5 px-4 font-bold text-[#050505]">
															{item.name}
														</td>

														<td className="py-3.5 px-4">
															<span className="px-2.5 py-1 bg-[#F0F2F5] rounded-md text-[10px] font-extrabold uppercase text-[#65676B] border border-[#CED0D4]/50">
																{item.category}
															</span>
														</td>

														<td className="py-3.5 px-4 font-semibold">
															{isEditing ? (
																<input
																	type="number"
																	min="0"
																	value={
																		editValues.price
																	}
																	onChange={(
																		e,
																	) =>
																		setEditValues(
																			{
																				...editValues,
																				price: Number(
																					e
																						.target
																						.value,
																				),
																			},
																		)
																	}
																	className="w-16 px-2 py-1 bg-white border border-[#CED0D4] rounded-lg text-xs"
																/>
															) : (
																`₹${item.price}`
															)}
														</td>

														{/* Stock with inline adjuster */}
														<td className="py-3.5 px-4">
															{isEditing ? (
																<input
																	type="number"
																	min="0"
																	value={
																		editValues.stock
																	}
																	onChange={(
																		e,
																	) =>
																		setEditValues(
																			{
																				...editValues,
																				stock: Number(
																					e
																						.target
																						.value,
																				),
																			},
																		)
																	}
																	className="w-20 px-2 py-1 bg-white border border-[#CED0D4] rounded-lg text-xs font-bold text-[#050505]"
																/>
															) : (
																<div className="flex items-center gap-2">
																	<span
																		className={`font-black text-sm ${isLow ? "text-[#FA383E]" : "text-[#050505]"}`}
																	>
																		{
																			item.stock
																		}
																	</span>
																	<div className="flex items-center gap-1 opacity-70 hover:opacity-100">
																		<button
																			onClick={() =>
																				handleQuickAdjust(
																					item,
																					-1,
																				)
																			}
																			className="w-5 h-5 bg-[#F0F2F5] hover:bg-[#E4E6EB] rounded flex items-center justify-center text-[#65676B]"
																			title="Deduct 1"
																		>
																			<Minus className="w-3 h-3" />
																		</button>
																		<button
																			onClick={() =>
																				handleQuickAdjust(
																					item,
																					1,
																				)
																			}
																			className="w-5 h-5 bg-[#F0F2F5] hover:bg-[#E4E6EB] rounded flex items-center justify-center text-[#65676B]"
																			title="Add 1"
																		>
																			<Plus className="w-3 h-3" />
																		</button>
																	</div>
																</div>
															)}
														</td>

														<td className="py-3.5 px-4 text-[#65676B]">
															{isEditing ? (
																<input
																	type="number"
																	min="0"
																	value={
																		editValues.threshold
																	}
																	onChange={(
																		e,
																	) =>
																		setEditValues(
																			{
																				...editValues,
																				threshold:
																					Number(
																						e
																							.target
																							.value,
																					),
																			},
																		)
																	}
																	className="w-20 px-2 py-1 bg-white border border-[#CED0D4] rounded-lg text-xs"
																/>
															) : (
																`${item.threshold} units`
															)}
														</td>

														<td className="py-3.5 px-4">
															{isLow ? (
																<span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 bg-[#FFEBE8] text-[#FA383E] rounded-full border border-[#FA383E]/20">
																	<AlertTriangle className="w-3 h-3" />{" "}
																	Low Stock
																</span>
															) : (
																<span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 bg-[#E7F7ED] text-[#00A400] rounded-full border border-[#00A400]/20">
																	<Check className="w-3 h-3" />{" "}
																	Optimal
																</span>
															)}
														</td>

														<td className="py-3.5 px-4 text-right">
															{isEditing ? (
																<div className="flex items-center justify-end gap-1.5">
																	<button
																		onClick={() =>
																			handleSaveStock(
																				item._id,
																			)
																		}
																		className="px-3 py-1 bg-[#42B72A] hover:bg-[#36A420] text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
																	>
																		<Check className="w-3 h-3" />{" "}
																		Save
																	</button>
																	<button
																		onClick={() =>
																			setEditingId(
																				null,
																			)
																		}
																		className="px-2 py-1 bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#65676B] rounded-lg text-xs transition"
																	>
																		<X className="w-3 h-3" />
																	</button>
																</div>
															) : (
																<div className="flex items-center justify-end gap-1.5">
																	<button
																		onClick={() =>
																			handleEditClick(
																				item,
																			)
																		}
																		className="px-3 py-1 bg-[#E7F3FF] hover:bg-[#DBEBFF] text-[#1877F2] rounded-lg text-xs font-bold transition"
																	>
																		Edit
																	</button>
																	<button
																		onClick={() =>
																			handleDeleteIngredient(
																				item._id,
																				item.name,
																			)
																		}
																		className="p-1.5 text-[#FA383E] hover:bg-[#FFEBE8] rounded-lg transition"
																		title={`Delete ${item.name}`}
																	>
																		<Trash2 className="w-3.5 h-3.5" />
																	</button>
																</div>
															)}

														</td>
													</tr>
												);
											})
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				)}

				{/* TAB 2: ORDER MANAGEMENT PANEL */}
				{activeTab === "orders" && (
					<div className="space-y-4">
						{/* Order Controls Toolbar */}
						<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
							<div className="relative w-full sm:w-80">
								<Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#65676B]" />
								<input
									type="text"
									value={orderSearch}
									onChange={(e) =>
										setOrderSearch(e.target.value)
									}
									placeholder="Search by Order ID or Customer Name/Email..."
									className="w-full pl-9 pr-3 py-2 bg-[#F0F2F5] rounded-xl text-xs border border-transparent focus:bg-white focus:border-[#1877F2] focus:outline-none transition"
								/>
							</div>

							{/* Status Filters */}
							<div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
								{["All", ...STATUS_OPTIONS].map((status) => (
									<button
										key={status}
										onClick={() => setOrderFilter(status)}
										className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
											orderFilter === status
												? "bg-[#E7F3FF] text-[#1877F2] border border-[#1877F2]/30"
												: "bg-[#F0F2F5] text-[#65676B] hover:bg-[#E4E6EB]"
										}`}
									>
										{status}
									</button>
								))}
							</div>
						</div>

						{/* Orders Feed */}
						<div className="space-y-3.5">
							{filteredOrders.length === 0 ? (
								<div className="bg-white rounded-2xl border border-[#CED0D4]/70 p-12 text-center text-[#65676B] space-y-2">
									<ClipboardList className="w-8 h-8 mx-auto text-[#CED0D4]" />
									<p className="font-bold text-[#050505]">
										No orders match your filter criteria.
									</p>
								</div>
							) : (
								filteredOrders.map((ord) => (
									<div
										key={ord._id}
										className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-5 space-y-4"
									>
										{/* Order Header */}
										<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[#E4E6EB]">
											<div>
												<div className="flex items-center gap-2">
													<span className="text-xs font-mono font-bold text-[#1877F2]">
														Order #{ord._id}
													</span>
													<span
														className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
															ord.paymentStatus ===
															"paid"
																? "bg-[#E7F7ED] text-[#00A400] border border-[#00A400]/20"
																: "bg-[#FFF4E5] text-[#F7B125] border border-[#F7B125]/20"
														}`}
													>
														{ord.paymentStatus}
													</span>
												</div>

												<h3 className="font-bold text-sm text-[#050505] mt-0.5">
													Customer:{" "}
													{ord.recipientName ||
														ord.user?.name ||
														"Customer"}{" "}
													(
													{ord.user?.email ||
														"No email"}
													)
												</h3>
												{(ord.deliveryAddress ||
													ord.phone) && (
													<div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#65676B]">
														{ord.deliveryAddress && (
															<span className="flex items-center gap-1 bg-[#F0F2F5] px-2 py-0.5 rounded-md">
																<MapPin className="w-3 h-3 text-[#1877F2]" />
																{ord.deliveryAddress}
															</span>
														)}
														{ord.phone && (
															<span className="flex items-center gap-1 bg-[#F0F2F5] px-2 py-0.5 rounded-md">
																<Phone className="w-3 h-3 text-[#00A400]" />
																{ord.phone}
															</span>
														)}
													</div>
												)}
											</div>

											<div className="text-right">
												<span className="text-[10px] uppercase font-bold text-[#65676B] block">
													Total Paid
												</span>
												<span className="text-lg font-black text-[#050505]">
													₹{ord.totalAmount}
												</span>
											</div>
										</div>

										{/* Clean Pizza Recipe Stack */}
										<div className="space-y-2">
											{ord.items?.map((it, idx) => (
												<div
													key={idx}
													className="bg-[#F0F2F5]/70 p-3 rounded-xl border border-[#CED0D4]/50 text-xs text-[#050505] flex flex-wrap items-center gap-2"
												>
													<span className="font-bold text-[#1877F2]">
														Pizza #{idx + 1} (
														{it.quantity || 1}x):
													</span>
													<span className="bg-white px-2 py-0.5 rounded border border-[#CED0D4]/60 text-[11px]">
														Crust:{" "}
														<strong>
															{it.base?.name ||
																"N/A"}
														</strong>
													</span>
													<span className="bg-white px-2 py-0.5 rounded border border-[#CED0D4]/60 text-[11px]">
														Sauce:{" "}
														<strong>
															{it.sauce?.name ||
																"N/A"}
														</strong>
													</span>
													<span className="bg-white px-2 py-0.5 rounded border border-[#CED0D4]/60 text-[11px]">
														Cheese:{" "}
														<strong>
															{it.cheese?.name ||
																"N/A"}
														</strong>
													</span>
													{it.vegetables?.length >
														0 && (
														<span className="bg-white px-2 py-0.5 rounded border border-[#CED0D4]/60 text-[11px] text-[#00A400] font-semibold">
															Toppings:{" "}
															{it.vegetables
																.map(
																	(v) =>
																		v.name,
																)
																.join(", ")}
														</span>
													)}
												</div>
											))}
										</div>

										{/* Status Controller (Socket.io Broadcaster)[cite: 1, 2] */}
										<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
											<div className="flex items-center gap-1.5 text-xs text-[#65676B]">
												<span className="font-bold uppercase text-[10px]">
													Current Status:
												</span>
												<span
													className={`font-extrabold px-2 py-0.5 rounded-md ${
														ord.status ===
														"Delivered"
															? "bg-[#E7F7ED] text-[#00A400]"
															: "text-[#050505]"
													}`}
												>
													{ord.status}
												</span>
											</div>

											<div className="flex flex-wrap items-center gap-1.5">
												{STATUS_OPTIONS.map(
													(statusOption) => {
														const isActive =
															ord.status ===
															statusOption;
														const isDelivered =
															statusOption ===
															"Delivered";

														return (
															<button
																key={
																	statusOption
																}
																onClick={() =>
																	handleStatusChange(
																		ord._id,
																		statusOption,
																	)
																}
																className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
																	isActive
																		? isDelivered
																			? "bg-[#42B72A] text-white shadow-xs"
																			: "bg-[#1877F2] text-white shadow-xs"
																		: "bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#65676B]"
																}`}
															>
																{statusOption ===
																	"Order Received" && (
																	<Clock className="w-3.5 h-3.5" />
																)}
																{statusOption ===
																	"In Kitchen" && (
																	<ChefHat className="w-3.5 h-3.5" />
																)}
																{statusOption ===
																	"Sent to Delivery" && (
																	<Truck className="w-3.5 h-3.5" />
																)}
																{statusOption ===
																	"Delivered" && (
																	<CheckCircle2 className="w-3.5 h-3.5" />
																)}
																<span>
																	{
																		statusOption
																	}
																</span>
															</button>
														);
													},
												)}
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				)}
			</div>

			{/* Add Ingredient Modal */}
			{showAddModal && (
				<div className="fixed inset-0 z-50 bg-[#050505]/40 backdrop-blur-xs flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-2xl max-w-md w-full p-6 space-y-4">
						<div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB]">
							<div className="flex items-center gap-2">
								<div className="w-8 h-8 rounded-lg bg-[#E7F7ED] text-[#42B72A] flex items-center justify-center">
									<Plus className="w-5 h-5 stroke-[2.5]" />
								</div>
								<div>
									<h3 className="text-base font-black text-[#050505]">
										Add New Ingredient
									</h3>
									<p className="text-[11px] text-[#65676B]">
										Create a new component in kitchen pantry
									</p>
								</div>
							</div>
							<button
								onClick={() => setShowAddModal(false)}
								className="p-1.5 text-[#65676B] hover:bg-[#F0F2F5] rounded-xl transition"
							>
								<X className="w-4 h-4" />
							</button>
						</div>

						{addError && (
							<div className="p-3 bg-[#FFEBE8] border border-[#FA383E]/20 text-[#FA383E] text-xs font-bold rounded-xl flex items-center gap-2">
								<AlertTriangle className="w-4 h-4 shrink-0" />
								<span>{addError}</span>
							</div>
						)}

						<form
							onSubmit={handleAddIngredient}
							className="space-y-3.5 text-xs"
						>
							<div>
								<label className="block font-bold text-[#050505] mb-1">
									Ingredient Name
								</label>
								<input
									type="text"
									value={newIngredient.name}
									onChange={(e) =>
										setNewIngredient({
											...newIngredient,
											name: e.target.value,
										})
									}
									placeholder="e.g. Truffle Infused Mozzarella"
									className="w-full px-3 py-2 bg-[#F0F2F5] rounded-xl border border-transparent focus:bg-white focus:border-[#1877F2] focus:outline-none transition font-medium text-xs"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-bold text-[#050505] mb-1">
										Category
									</label>
									<select
										value={newIngredient.category}
										onChange={(e) =>
											setNewIngredient({
												...newIngredient,
												category: e.target.value,
											})
										}
										className="w-full px-3 py-2 bg-[#F0F2F5] rounded-xl border border-transparent focus:bg-white focus:border-[#1877F2] focus:outline-none transition font-bold capitalize text-xs"
									>
										<option value="base">
											Base (Crust)
										</option>
										<option value="sauce">Sauce</option>
										<option value="cheese">Cheese</option>
										<option value="veggie">
											Topping (Veggie)
										</option>
									</select>
								</div>

								<div>
									<label className="block font-bold text-[#050505] mb-1">
										Price (₹)
									</label>
									<input
										type="number"
										min="0"
										value={newIngredient.price}
										onChange={(e) =>
											setNewIngredient({
												...newIngredient,
												price: e.target.value,
											})
										}
										placeholder="e.g. 50"
										className="w-full px-3 py-2 bg-[#F0F2F5] rounded-xl border border-transparent focus:bg-white focus:border-[#1877F2] focus:outline-none transition font-semibold text-xs"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block font-bold text-[#050505] mb-1">
										Initial Stock
									</label>
									<input
										type="number"
										min="0"
										value={newIngredient.stock}
										onChange={(e) =>
											setNewIngredient({
												...newIngredient,
												stock: e.target.value,
											})
										}
										placeholder="e.g. 100"
										className="w-full px-3 py-2 bg-[#F0F2F5] rounded-xl border border-transparent focus:bg-white focus:border-[#1877F2] focus:outline-none transition font-semibold text-xs"
									/>
								</div>

								<div>
									<label className="block font-bold text-[#050505] mb-1">
										Alert Threshold
									</label>
									<input
										type="number"
										min="0"
										value={newIngredient.threshold}
										onChange={(e) =>
											setNewIngredient({
												...newIngredient,
												threshold: e.target.value,
											})
										}
										placeholder="20"
										className="w-full px-3 py-2 bg-[#F0F2F5] rounded-xl border border-transparent focus:bg-white focus:border-[#1877F2] focus:outline-none transition font-semibold text-xs"
									/>
								</div>
							</div>

							<div className="pt-2 flex justify-end gap-2">
								<button
									type="button"
									onClick={() => setShowAddModal(false)}
									className="px-4 py-2 bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#65676B] font-bold rounded-xl transition text-xs"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={submittingAdd}
									className="px-5 py-2 bg-[#42B72A] hover:bg-[#36A420] text-white font-bold rounded-xl transition shadow-[0_2px_4px_rgba(66,183,42,0.25)] flex items-center gap-1.5 disabled:opacity-50 text-xs"
								>
									{submittingAdd ? (
										<span>Adding...</span>
									) : (
										<>
											<Check className="w-4 h-4" />
											<span>Save Ingredient</span>
										</>
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

