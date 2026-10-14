import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
	ArrowLeft,
	ShieldCheck,
	Plus,
	Minus,
	MapPin,
	Phone,
	User as UserIcon,
	Tag,
	Check,
	AlertCircle,
	Lock,
	Pizza,
	Layers,
	Flame,
	Sparkles,
	Leaf,
	Info,
} from "lucide-react";

export default function OrderSummary() {
	const navigate = useNavigate();
	const { user } = useAuth();

	// Load pizza config from local storage[cite: 1, 2]
	const [pizza] = useState(() => {
		const saved = localStorage.getItem("cart_pizza");
		return saved ? JSON.parse(saved) : null;
	});

	// Quantity & Delivery States
	const [quantity, setQuantity] = useState(1);
	const [deliveryInfo, setDeliveryInfo] = useState({
		fullName: user?.name || "",
		phone: user?.phone || "",
		address: user?.address || "",
		deliveryNotes: "",
	});


	// Coupon / Promo States
	const [couponCode, setCouponCode] = useState("");
	const [appliedDiscount, setAppliedDiscount] = useState(0);
	const [couponStatus, setCouponStatus] = useState({
		error: "",
		success: "",
	});

	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		if (!pizza) {
			navigate("/builder");
		}
	}, [pizza, navigate]);

	if (!pizza) return null;

	// Pricing calculations
	const unitPrice =
		(pizza.base?.price || 0) +
		(pizza.sauce?.price || 0) +
		(pizza.cheese?.price || 0) +
		(pizza.vegetables?.reduce((acc, v) => acc + v.price, 0) || 0);

	const subtotal = unitPrice * quantity;
	const deliveryFee = subtotal >= 500 ? 0 : 40;
	const taxes = Math.round(subtotal * 0.05); // 5% GST
	const finalTotal = Math.max(
		0,
		subtotal + deliveryFee + taxes - appliedDiscount,
	);

	const handleApplyCoupon = (e) => {
		e.preventDefault();
		setCouponStatus({ error: "", success: "" });

		const code = couponCode.trim().toUpperCase();
		if (code === "PIZZA50") {
			setAppliedDiscount(50);
			setCouponStatus({
				error: "",
				success: "₹50 discount applied successfully!",
			});
		} else if (code === "FREEDEL") {
			setAppliedDiscount(deliveryFee);
			setCouponStatus({
				error: "",
				success: "Free delivery coupon applied!",
			});
		} else {
			setCouponStatus({
				error: "Invalid coupon. Try 'PIZZA50' or 'FREEDEL'",
				success: "",
			});
		}
	};

	const loadRazorpayScript = () => {
		return new Promise((resolve) => {
			const script = document.createElement("script");
			script.src = "https://checkout.razorpay.com/v1/checkout.js";
			script.onload = () => resolve(true);
			script.onerror = () => resolve(false);
			document.body.appendChild(script);
		});
	};

	const handlePayment = async () => {
		setErrorMessage("");

		if (!user) {
			setErrorMessage("Please sign in to complete your checkout.");
			navigate("/login", { state: { from: "/order-summary" } });
			return;
		}

		if (!deliveryInfo.address.trim()) {
			setErrorMessage(
				"Please enter a delivery address before proceeding.",
			);
			return;
		}

		setLoading(true);
		try {
			const isScriptLoaded = await loadRazorpayScript();
			if (!isScriptLoaded) {
				setErrorMessage(
					"Could not load Razorpay SDK. Check your internet connection.",
				);
				setLoading(false);
				return;
			}

			// 1. Request Razorpay Order ID from backend with calculated payload
			const itemsPayload = [
				{
					base: pizza.base._id,
					sauce: pizza.sauce._id,
					cheese: pizza.cheese._id,
					vegetables: pizza.vegetables.map((v) => v._id),
					quantity: quantity,
				},
			];

			const { data } = await api.post("/orders/create-razorpay-order", {
				items: itemsPayload,
				couponCode: couponStatus.success ? couponCode : "",
				deliveryInfo,
			});

			// 2. Configure Razorpay modal with Facebook Blue theme[cite: 1, 2]
			const options = {
				key: data.keyId,
				amount: data.amount,
				currency: data.currency,
				name: "Pizza Co.",
				description: `Order of ${quantity} Custom Pizza(s)`,
				order_id: data.razorpayOrderId,
				handler: async function (response) {
					try {
						// 3. User clicked "Success" -> verify on backend[cite: 1, 2]
						const verifyRes = await api.post(
							"/orders/verify-payment",
							{
								razorpay_order_id: response.razorpay_order_id,
								razorpay_payment_id:
									response.razorpay_payment_id,
								razorpay_signature: response.razorpay_signature,
								dbOrderId: data.orderId,
							},
						);

						if (verifyRes.data.success) {
							// Persist delivery address & phone number to user profile
							if (deliveryInfo.phone || deliveryInfo.address) {
								api.patch("/auth/profile", {
									phone: deliveryInfo.phone,
									address: deliveryInfo.address,
								}).catch((pErr) => {
									console.warn("Profile update failed:", pErr);
								});
							}

							localStorage.removeItem("cart_pizza");
							navigate(`/track/${data.orderId}`);
						}

					} catch {
						setErrorMessage(
							"Payment verification failed on the server.",
						);
					}
				},
				prefill: {
					name: deliveryInfo.fullName || user?.name || "Customer",
					email: user?.email || "customer@example.com",
					contact: deliveryInfo.phone || "9999999999",
				},
				theme: {
					color: "#1877F2", // Facebook Blue
				},
			};

			const razorpayInstance = new window.Razorpay(options);
			razorpayInstance.open();
		} catch (error) {
			setErrorMessage(
				error.response?.data?.message || "Error initiating order.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#F0F2F5] text-[#050505] pb-16 font-sans">
			<div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
				{/* Navigation & Header */}
				<div className="flex items-center justify-between">
					<button
						onClick={() => navigate("/builder")}
						className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1877F2] hover:text-[#166FE5] bg-white px-3.5 py-2 rounded-xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition"
					>
						<ArrowLeft className="w-4 h-4" /> Edit Pizza Recipe
					</button>
					<span className="text-xs font-semibold text-[#65676B]">
						Step 5 of 5 • Final Review
					</span>
				</div>

				{errorMessage && (
					<div className="p-4 bg-[#FFEBE8] border border-[#FA383E]/30 rounded-xl flex items-center gap-3 text-sm text-[#FA383E]">
						<AlertCircle className="w-5 h-5 shrink-0" />
						<span>{errorMessage}</span>
					</div>
				)}

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
					{/* Left Column: Order Breakdown & Details */}
					<div className="lg:col-span-7 space-y-5">
						{/* Pizza Recipe Breakdown Card */}
						<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-5 space-y-4">
							<div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB]">
								<div className="flex items-center gap-2">
									<div className="w-9 h-9 rounded-xl bg-[#E7F3FF] text-[#1877F2] flex items-center justify-center">
										<Pizza className="w-5 h-5" />
									</div>
									<div>
										<h2 className="text-base font-bold text-[#050505]">
											Your Custom Creation
										</h2>
										<p className="text-xs text-[#65676B]">
											Freshly configured artisan recipe
										</p>
									</div>
								</div>

								{/* Quantity Controls */}
								<div className="flex items-center gap-2 bg-[#F0F2F5] p-1 rounded-xl border border-[#CED0D4]/50">
									<button
										onClick={() =>
											setQuantity(
												Math.max(1, quantity - 1),
											)
										}
										disabled={quantity <= 1}
										className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-[#050505] shadow-xs disabled:opacity-40 hover:bg-[#E4E6EB] transition"
									>
										<Minus className="w-3.5 h-3.5" />
									</button>
									<span className="w-6 text-center text-xs font-bold">
										{quantity}
									</span>
									<button
										onClick={() =>
											setQuantity(quantity + 1)
										}
										className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1877F2] text-white shadow-xs hover:bg-[#166FE5] transition"
									>
										<Plus className="w-3.5 h-3.5" />
									</button>
								</div>
							</div>

							{/* Ingredient List */}
							<div className="space-y-2.5 text-xs">
								<div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F0F2F5]/60">
									<div className="flex items-center gap-2 text-[#050505]">
										<Layers className="w-4 h-4 text-[#1877F2]" />
										<span>
											Crust:{" "}
											<strong>{pizza.base?.name}</strong>
										</span>
									</div>
									<span className="font-bold text-[#050505]">
										₹{pizza.base?.price}
									</span>
								</div>

								<div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F0F2F5]/60">
									<div className="flex items-center gap-2 text-[#050505]">
										<Flame className="w-4 h-4 text-[#FA383E]" />
										<span>
											Sauce:{" "}
											<strong>{pizza.sauce?.name}</strong>
										</span>
									</div>
									<span className="font-bold text-[#050505]">
										₹{pizza.sauce?.price}
									</span>
								</div>

								<div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F0F2F5]/60">
									<div className="flex items-center gap-2 text-[#050505]">
										<Sparkles className="w-4 h-4 text-[#F7B125]" />
										<span>
											Cheese:{" "}
											<strong>
												{pizza.cheese?.name}
											</strong>
										</span>
									</div>
									<span className="font-bold text-[#050505]">
										₹{pizza.cheese?.price}
									</span>
								</div>

								{/* Veggies */}
								<div className="p-2.5 rounded-xl bg-[#F0F2F5]/60 space-y-1.5">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2 text-[#050505]">
											<Leaf className="w-4 h-4 text-[#00A400]" />
											<span className="font-semibold">
												Selected Toppings (
												{pizza.vegetables?.length || 0})
											</span>
										</div>
										<span className="font-bold text-[#050505]">
											₹
											{pizza.vegetables?.reduce(
												(acc, v) => acc + v.price,
												0,
											)}
										</span>
									</div>

									{pizza.vegetables?.length > 0 ? (
										<div className="flex flex-wrap gap-1.5 pt-1">
											{pizza.vegetables.map((v) => (
												<span
													key={v._id}
													className="px-2 py-0.5 rounded-md bg-white border border-[#CED0D4]/70 text-[11px] text-[#050505] font-medium"
												>
													{v.name} (+₹{v.price})
												</span>
											))}
										</div>
									) : (
										<p className="text-[11px] text-[#65676B] italic">
											No vegetables added
										</p>
									)}
								</div>
							</div>
						</div>

						{/* Delivery Details Form */}
						<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-5 space-y-4">
							<div className="flex items-center gap-2 pb-3 border-b border-[#E4E6EB]">
								<div className="w-9 h-9 rounded-xl bg-[#E7F3FF] text-[#1877F2] flex items-center justify-center">
									<MapPin className="w-5 h-5" />
								</div>
								<div>
									<h3 className="text-base font-bold text-[#050505]">
										Delivery Destination
									</h3>
									<p className="text-xs text-[#65676B]">
										Where should we deliver your hot pizza?
									</p>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
								<div>
									<label className="block font-bold text-[#65676B] mb-1 uppercase tracking-wider text-[10px]">
										Recipient Name
									</label>
									<div className="relative">
										<UserIcon className="w-4 h-4 text-[#65676B] absolute left-3 top-2.5" />
										<input
											type="text"
											value={deliveryInfo.fullName}
											onChange={(e) =>
												setDeliveryInfo({
													...deliveryInfo,
													fullName: e.target.value,
												})
											}
											placeholder="John Doe"
											className="w-full pl-9 pr-3 py-2 bg-[#F0F2F5] focus:bg-white rounded-xl border border-transparent focus:border-[#1877F2] focus:outline-none transition"
										/>
									</div>
								</div>

								<div>
									<label className="block font-bold text-[#65676B] mb-1 uppercase tracking-wider text-[10px]">
										Phone Number
									</label>
									<div className="relative">
										<Phone className="w-4 h-4 text-[#65676B] absolute left-3 top-2.5" />
										<input
											type="tel"
											value={deliveryInfo.phone}
											onChange={(e) =>
												setDeliveryInfo({
													...deliveryInfo,
													phone: e.target.value,
												})
											}
											placeholder="9876543210"
											className="w-full pl-9 pr-3 py-2 bg-[#F0F2F5] focus:bg-white rounded-xl border border-transparent focus:border-[#1877F2] focus:outline-none transition"
										/>
									</div>
								</div>

								<div className="sm:col-span-2">
									<label className="block font-bold text-[#65676B] mb-1 uppercase tracking-wider text-[10px]">
										Delivery Address *
									</label>
									<textarea
										rows={2}
										value={deliveryInfo.address}
										onChange={(e) =>
											setDeliveryInfo({
												...deliveryInfo,
												address: e.target.value,
											})
										}
										placeholder="Flat / House No., Floor, Landmark, Street Name..."
										className="w-full p-2.5 bg-[#F0F2F5] focus:bg-white rounded-xl border border-transparent focus:border-[#1877F2] focus:outline-none transition text-xs"
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Right Column: Checkout Bill & Payment Card */}
					<div className="lg:col-span-5 space-y-5 sticky top-20">
						{/* Promo Code Input Card */}
						<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-4">
							<form
								onSubmit={handleApplyCoupon}
								className="flex gap-2"
							>
								<div className="relative flex-1">
									<Tag className="w-4 h-4 text-[#65676B] absolute left-3 top-2.5" />
									<input
										type="text"
										value={couponCode}
										onChange={(e) =>
											setCouponCode(e.target.value)
										}
										placeholder="Enter Coupon (e.g. PIZZA50)"
										className="w-full pl-9 pr-3 py-2 text-xs uppercase bg-[#F0F2F5] focus:bg-white rounded-xl border border-transparent focus:border-[#1877F2] focus:outline-none font-bold"
									/>
								</div>
								<button
									type="submit"
									className="px-4 py-2 bg-[#E7F3FF] hover:bg-[#DBEBFF] text-[#1877F2] rounded-xl text-xs font-bold transition"
								>
									Apply
								</button>
							</form>

							{couponStatus.success && (
								<p className="text-[11px] font-bold text-[#00A400] mt-2 flex items-center gap-1">
									<Check className="w-3.5 h-3.5" />{" "}
									{couponStatus.success}
								</p>
							)}
							{couponStatus.error && (
								<p className="text-[11px] font-bold text-[#FA383E] mt-2 flex items-center gap-1">
									<AlertCircle className="w-3.5 h-3.5" />{" "}
									{couponStatus.error}
								</p>
							)}
						</div>

						{/* Bill Summary */}
						<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-5 space-y-4">
							<h3 className="text-sm font-bold uppercase tracking-wider text-[#65676B] pb-2 border-b border-[#E4E6EB]">
								Payment Breakdown
							</h3>

							<div className="space-y-2.5 text-xs text-[#050505]">
								<div className="flex justify-between">
									<span className="text-[#65676B]">
										Item Subtotal ({quantity}x)
									</span>
									<span className="font-semibold">
										₹{subtotal}
									</span>
								</div>

								<div className="flex justify-between items-center">
									<div className="flex items-center gap-1 text-[#65676B]">
										<span>Delivery Fee</span>
										{deliveryFee === 0 && (
											<span className="text-[10px] bg-[#E7F7ED] text-[#00A400] px-1.5 py-0.2 rounded font-bold">
												FREE
											</span>
										)}
									</div>
									<span className="font-semibold">
										{deliveryFee === 0
											? "₹0"
											: `₹${deliveryFee}`}
									</span>
								</div>

								<div className="flex justify-between">
									<span className="text-[#65676B]">
										Taxes & Packaging (5% GST)
									</span>
									<span className="font-semibold">
										₹{taxes}
									</span>
								</div>

								{appliedDiscount > 0 && (
									<div className="flex justify-between text-[#00A400] font-bold">
										<span>Coupon Discount</span>
										<span>-₹{appliedDiscount}</span>
									</div>
								)}

								<div className="pt-3 border-t border-[#E4E6EB] flex justify-between items-baseline">
									<div>
										<span className="text-sm font-bold text-[#050505]">
											To Pay
										</span>
										<span className="text-[10px] text-[#65676B] block">
											Inclusive of all taxes
										</span>
									</div>
									<span className="text-2xl font-black text-[#1877F2]">
										₹{finalTotal}
									</span>
								</div>
							</div>

							{/* Razorpay Test Mode Card */}
							<div className="p-3 bg-[#E7F3FF]/70 rounded-xl border border-[#1877F2]/20 flex items-start gap-2.5 text-xs text-[#1877F2]">
								<Info className="w-4 h-4 shrink-0 mt-0.5" />
								<p className="leading-relaxed">
									<strong>Test Mode Active:</strong> Clicking
									"Success" in the Razorpay popup will confirm
									your order and automatically decrement
									stock[cite: 1, 2].
								</p>
							</div>

							{/* Payment CTA */}
							<button
								onClick={handlePayment}
								disabled={loading}
								className="w-full py-3.5 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold rounded-xl shadow-[0_2px_4px_rgba(24,119,242,0.3)] transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
							>
								<ShieldCheck className="w-5 h-5" />
								<span>
									{loading
										? "Initializing Razorpay..."
										: `Pay ₹${finalTotal} with Razorpay`}
								</span>
							</button>

							<div className="flex items-center justify-center gap-2 text-[11px] text-[#65676B]">
								<Lock className="w-3.5 h-3.5 text-[#00A400]" />
								<span>
									256-Bit SSL Encrypted Razorpay Checkout
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
