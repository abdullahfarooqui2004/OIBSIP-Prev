import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import {
	Check,
	ArrowRight,
	ArrowLeft,
	Sparkles,
	Flame,
	Leaf,
	Layers,
	ShoppingBag,
	RotateCcw,
	Pizza,
	ShieldCheck,
} from "lucide-react";

export default function PizzaBuilder() {
	const navigate = useNavigate();
	const [step, setStep] = useState(1);
	const [inventory, setInventory] = useState({
		base: [],
		sauce: [],
		cheese: [],
		veggie: [],
	});
	const [loading, setLoading] = useState(true);

	// Selected Pizza Config[cite: 1, 2]
	const [selectedBase, setSelectedBase] = useState(null);
	const [selectedSauce, setSelectedSauce] = useState(null);
	const [selectedCheese, setSelectedCheese] = useState(null);
	const [selectedVeggies, setSelectedVeggies] = useState([]);

	useEffect(() => {
		const fetchInventory = async () => {
			try {
				const { data } = await api.get("/inventory");
				setInventory({
					base: data.filter((i) => i.category === "base"),
					sauce: data.filter((i) => i.category === "sauce"),
					cheese: data.filter((i) => i.category === "cheese"),
					veggie: data.filter((i) => i.category === "veggie"),
				});
			} catch (err) {
				console.error("Error fetching inventory:", err);
			} finally {
				setLoading(false);
			}
		};
		fetchInventory();
	}, []);

	const toggleVeggie = (veg) => {
		setSelectedVeggies((prev) =>
			prev.some((v) => v._id === veg._id)
				? prev.filter((v) => v._id !== veg._id)
				: [...prev, veg],
		);
	};

	const calculateTotal = () => {
		let total = 0;
		if (selectedBase) total += selectedBase.price;
		if (selectedSauce) total += selectedSauce.price;
		if (selectedCheese) total += selectedCheese.price;
		selectedVeggies.forEach((v) => {
			total += v.price;
		});
		return total;
	};

	const isStepComplete = (stepNumber) => {
		if (stepNumber === 1) return !!selectedBase;
		if (stepNumber === 2) return !!selectedSauce;
		if (stepNumber === 3) return !!selectedCheese;
		if (stepNumber === 4) return true; // Veggies are optional / multi-select[cite: 1, 2]
		return false;
	};

	const canNavigateToStep = (targetStep) => {
		if (targetStep === 1) return true;
		if (targetStep === 2) return !!selectedBase;
		if (targetStep === 3) return !!selectedBase && !!selectedSauce;
		if (targetStep === 4)
			return !!selectedBase && !!selectedSauce && !!selectedCheese;
		return false;
	};

	const handleProceedToSummary = () => {
		if (!selectedBase || !selectedSauce || !selectedCheese) {
			alert(
				"Please ensure your crust, sauce, and cheese selections are complete.",
			);
			return;
		}

		const customPizza = {
			base: selectedBase,
			sauce: selectedSauce,
			cheese: selectedCheese,
			vegetables: selectedVeggies,
			totalAmount: calculateTotal(),
		};
		localStorage.setItem("cart_pizza", JSON.stringify(customPizza));
		navigate("/order-summary");
	};

	const stepsMeta = [
		{ id: 1, label: "Crust Base", icon: Layers, count: 5 },
		{ id: 2, label: "Sauce", icon: Flame, count: 5 },
		{ id: 3, label: "Cheese", icon: Sparkles, count: "Artisan" },
		{ id: 4, label: "Toppings", icon: Leaf, count: "Multi-select" },
	];

	if (loading) {
		return (
			<div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-[#F0F2F5]">
				<div className="w-10 h-10 border-4 border-[#E7F3FF] border-t-[#1877F2] rounded-full animate-spin" />
				<p className="text-xs font-bold text-[#65676B] animate-pulse">
					Fetching pantry stocks from kitchen...
				</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#F0F2F5] text-[#050505] pb-16 font-sans">
			<div className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
				{/* Facebook-style Studio Header */}
				<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-6 space-y-6">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div>
							<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7F3FF] text-[#1877F2] text-xs font-bold tracking-wide mb-1.5">
								<Pizza className="w-3.5 h-3.5" /> Interactive
								4-Step Builder
							</span>
							<h1 className="text-2xl font-black text-[#050505] tracking-tight">
								Artisan Pizza Studio
							</h1>
							<p className="text-xs text-[#65676B]">
								Customize each tier with live ingredient stock
								verification[cite: 1, 2].
							</p>
						</div>

						<button
							onClick={() => {
								setSelectedBase(null);
								setSelectedSauce(null);
								setSelectedCheese(null);
								setSelectedVeggies([]);
								setStep(1);
							}}
							className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold text-[#65676B] hover:text-[#050505] bg-[#F0F2F5] hover:bg-[#E4E6EB] px-3.5 py-2 rounded-xl transition"
						>
							<RotateCcw className="w-3.5 h-3.5" /> Clear Build
						</button>
					</div>

					{/* Stepper Navigation Cards */}
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
						{stepsMeta.map((s) => {
							const Icon = s.icon;
							const completed = isStepComplete(s.id);
							const active = step === s.id;
							const accessible = canNavigateToStep(s.id);

							return (
								<button
									key={s.id}
									disabled={!accessible}
									onClick={() => setStep(s.id)}
									className={`relative p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
										active
											? "border-[#1877F2] bg-[#E7F3FF]/40 shadow-xs ring-2 ring-[#1877F2]/20"
											: completed
												? "border-[#00A400]/40 bg-[#E7F7ED]/50 hover:border-[#00A400]"
												: accessible
													? "border-[#CED0D4]/70 bg-white hover:bg-[#F0F2F5]"
													: "border-[#E4E6EB] bg-[#F0F2F5] opacity-50 cursor-not-allowed"
									}`}
								>
									<div
										className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-colors shrink-0 shadow-xs ${
											active
												? "bg-[#1877F2] text-white"
												: completed
													? "bg-[#00A400] text-white"
													: "bg-[#E4E6EB] text-[#65676B]"
										}`}
									>
										{completed && !active ? (
											<Check className="w-4 h-4 stroke-[3]" />
										) : (
											<Icon className="w-4 h-4" />
										)}
									</div>

									<div className="min-w-0">
										<span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#65676B]">
											Step 0{s.id}
										</span>
										<span
											className={`block text-xs font-bold truncate ${
												active
													? "text-[#1877F2]"
													: completed
														? "text-[#050505]"
														: "text-[#65676B]"
											}`}
										>
											{s.label}
										</span>
									</div>
								</button>
							);
						})}
					</div>
				</div>

				{/* Builder Workspace Layout */}
				<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
					{/* Main Stage: Ingredient Selection */}
					<div className="lg:col-span-8 bg-white border border-[#CED0D4]/70 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-6 min-h-[460px] flex flex-col justify-between">
						<div>
							{/* Step 1: Base[cite: 1, 2] */}
							{step === 1 && (
								<div className="space-y-4">
									<div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB]">
										<div>
											<h2 className="text-base font-bold text-[#050505]">
												Step 1: Choose Your Dough Crust
												(5 Options)
											</h2>
											<p className="text-xs text-[#65676B]">
												Hand-tossed artisan dough bases
												made fresh daily
											</p>
										</div>
										<span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-[#E7F3FF] text-[#1877F2] rounded-full">
											Required
										</span>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
										{inventory.base.map((item) => {
											const isSelected =
												selectedBase?._id === item._id;
											const isOut = item.stock === 0;

											return (
												<button
													key={item._id}
													disabled={isOut}
													onClick={() =>
														setSelectedBase(item)
													}
													className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-3 ${
														isSelected
															? "border-[#1877F2] bg-[#E7F3FF]/40 shadow-xs ring-2 ring-[#1877F2]/20"
															: "border-[#CED0D4]/70 hover:border-[#1877F2]/60 bg-white hover:bg-[#F0F2F5]/60"
													} ${isOut ? "opacity-50 cursor-not-allowed bg-[#F0F2F5]" : ""}`}
												>
													<div className="flex items-start justify-between gap-2">
														<h3 className="font-bold text-[#050505] text-sm">
															{item.name}
														</h3>
														<div
															className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
																isSelected
																	? "bg-[#1877F2] border-[#1877F2] text-white"
																	: "border-[#CED0D4]"
															}`}
														>
															{isSelected && (
																<Check className="w-3 h-3 stroke-[3]" />
															)}
														</div>
													</div>

													<div className="flex items-center justify-between text-xs pt-2 border-t border-[#E4E6EB]">
														<span
															className={`font-semibold text-[11px] ${
																isOut
																	? "text-[#FA383E]"
																	: item.stock <
																		  10
																		? "text-[#F7B125]"
																		: "text-[#65676B]"
															}`}
														>
															{isOut
																? "Out of Stock"
																: `${item.stock} left in stock`}
														</span>
														<span className="font-extrabold text-[#050505] text-sm">
															₹{item.price}
														</span>
													</div>
												</button>
											);
										})}
									</div>
								</div>
							)}

							{/* Step 2: Sauce[cite: 1, 2] */}
							{step === 2 && (
								<div className="space-y-4">
									<div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB]">
										<div>
											<h2 className="text-base font-bold text-[#050505]">
												Step 2: Choose Your Simmered
												Sauce (5 Options)
											</h2>
											<p className="text-xs text-[#65676B]">
												House-cooked sauces packed with
												authentic Italian herbs
											</p>
										</div>
										<span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-[#E7F3FF] text-[#1877F2] rounded-full">
											Required
										</span>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
										{inventory.sauce.map((item) => {
											const isSelected =
												selectedSauce?._id === item._id;
											const isOut = item.stock === 0;

											return (
												<button
													key={item._id}
													disabled={isOut}
													onClick={() =>
														setSelectedSauce(item)
													}
													className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-3 ${
														isSelected
															? "border-[#1877F2] bg-[#E7F3FF]/40 shadow-xs ring-2 ring-[#1877F2]/20"
															: "border-[#CED0D4]/70 hover:border-[#1877F2]/60 bg-white hover:bg-[#F0F2F5]/60"
													} ${isOut ? "opacity-50 cursor-not-allowed bg-[#F0F2F5]" : ""}`}
												>
													<div className="flex items-start justify-between gap-2">
														<h3 className="font-bold text-[#050505] text-sm">
															{item.name}
														</h3>
														<div
															className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
																isSelected
																	? "bg-[#1877F2] border-[#1877F2] text-white"
																	: "border-[#CED0D4]"
															}`}
														>
															{isSelected && (
																<Check className="w-3 h-3 stroke-[3]" />
															)}
														</div>
													</div>

													<div className="flex items-center justify-between text-xs pt-2 border-t border-[#E4E6EB]">
														<span
															className={`font-semibold text-[11px] ${
																isOut
																	? "text-[#FA383E]"
																	: item.stock <
																		  10
																		? "text-[#F7B125]"
																		: "text-[#65676B]"
															}`}
														>
															{isOut
																? "Out of Stock"
																: `${item.stock} left in stock`}
														</span>
														<span className="font-extrabold text-[#050505] text-sm">
															₹{item.price}
														</span>
													</div>
												</button>
											);
										})}
									</div>
								</div>
							)}

							{/* Step 3: Cheese[cite: 1, 2] */}
							{step === 3 && (
								<div className="space-y-4">
									<div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB]">
										<div>
											<h2 className="text-base font-bold text-[#050505]">
												Step 3: Select Your Melted
												Cheese
											</h2>
											<p className="text-xs text-[#65676B]">
												Pure mozzarella, aged cheddar,
												and smoked blends
											</p>
										</div>
										<span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-[#E7F3FF] text-[#1877F2] rounded-full">
											Required
										</span>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
										{inventory.cheese.map((item) => {
											const isSelected =
												selectedCheese?._id ===
												item._id;
											const isOut = item.stock === 0;

											return (
												<button
													key={item._id}
													disabled={isOut}
													onClick={() =>
														setSelectedCheese(item)
													}
													className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-3 ${
														isSelected
															? "border-[#1877F2] bg-[#E7F3FF]/40 shadow-xs ring-2 ring-[#1877F2]/20"
															: "border-[#CED0D4]/70 hover:border-[#1877F2]/60 bg-white hover:bg-[#F0F2F5]/60"
													} ${isOut ? "opacity-50 cursor-not-allowed bg-[#F0F2F5]" : ""}`}
												>
													<div className="flex items-start justify-between gap-2">
														<h3 className="font-bold text-[#050505] text-sm">
															{item.name}
														</h3>
														<div
															className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
																isSelected
																	? "bg-[#1877F2] border-[#1877F2] text-white"
																	: "border-[#CED0D4]"
															}`}
														>
															{isSelected && (
																<Check className="w-3 h-3 stroke-[3]" />
															)}
														</div>
													</div>

													<div className="flex items-center justify-between text-xs pt-2 border-t border-[#E4E6EB]">
														<span
															className={`font-semibold text-[11px] ${
																isOut
																	? "text-[#FA383E]"
																	: item.stock <
																		  10
																		? "text-[#F7B125]"
																		: "text-[#65676B]"
															}`}
														>
															{isOut
																? "Out of Stock"
																: `${item.stock} left in stock`}
														</span>
														<span className="font-extrabold text-[#050505] text-sm">
															₹{item.price}
														</span>
													</div>
												</button>
											);
										})}
									</div>
								</div>
							)}

							{/* Step 4: Veggies (Multiple Select)[cite: 1, 2] */}
							{step === 4 && (
								<div className="space-y-4">
									<div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB]">
										<div>
											<h2 className="text-base font-bold text-[#050505]">
												Step 4: Garden Veggies &
												Toppings (Multiple Select)
											</h2>
											<p className="text-xs text-[#65676B]">
												Pick as many fresh vegetable
												toppings as you like
											</p>
										</div>
										<span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-[#F0F2F5] text-[#65676B] rounded-full">
											Optional
										</span>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
										{inventory.veggie.map((item) => {
											const isSelected =
												selectedVeggies.some(
													(v) => v._id === item._id,
												);
											const isOut = item.stock === 0;

											return (
												<button
													key={item._id}
													disabled={isOut}
													onClick={() =>
														toggleVeggie(item)
													}
													className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-2.5 ${
														isSelected
															? "border-[#1877F2] bg-[#E7F3FF]/40 shadow-xs ring-2 ring-[#1877F2]/20"
															: "border-[#CED0D4]/70 hover:border-[#1877F2]/60 bg-white hover:bg-[#F0F2F5]/60"
													} ${isOut ? "opacity-50 cursor-not-allowed bg-[#F0F2F5]" : ""}`}
												>
													<div className="flex items-start justify-between gap-1">
														<span className="font-bold text-[#050505] text-xs">
															{item.name}
														</span>
														<div
															className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
																isSelected
																	? "bg-[#1877F2] border-[#1877F2] text-white"
																	: "border-[#CED0D4]"
															}`}
														>
															{isSelected && (
																<Check className="w-2.5 h-2.5 stroke-[3]" />
															)}
														</div>
													</div>

													<div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#E4E6EB]">
														<span className="text-[#65676B]">
															{isOut
																? "Sold out"
																: `${item.stock} left`}
														</span>
														<span className="font-extrabold text-[#050505]">
															+₹{item.price}
														</span>
													</div>
												</button>
											);
										})}
									</div>
								</div>
							)}
						</div>

						{/* Stepper Footer Controls */}
						<div className="flex items-center justify-between pt-6 mt-6 border-t border-[#E4E6EB]">
							{step > 1 ? (
								<button
									onClick={() => setStep(step - 1)}
									className="px-4 py-2.5 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#050505] text-xs font-bold inline-flex items-center gap-1.5 transition active:scale-95"
								>
									<ArrowLeft className="w-4 h-4" /> Back to
									Step 0{step - 1}
								</button>
							) : (
								<div />
							)}

							{step < 4 ? (
								<button
									disabled={
										(step === 1 && !selectedBase) ||
										(step === 2 && !selectedSauce) ||
										(step === 3 && !selectedCheese)
									}
									onClick={() => setStep(step + 1)}
									className="px-6 py-2.5 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl text-xs font-bold shadow-[0_2px_4px_rgba(24,119,242,0.3)] disabled:opacity-40 disabled:hover:bg-[#1877F2] inline-flex items-center gap-2 transition active:scale-95"
								>
									Proceed to Step 0{step + 1}{" "}
									<ArrowRight className="w-4 h-4" />
								</button>
							) : (
								<button
									disabled={
										!selectedBase ||
										!selectedSauce ||
										!selectedCheese
									}
									onClick={handleProceedToSummary}
									className="px-6 py-2.5 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl text-xs font-bold shadow-[0_2px_4px_rgba(24,119,242,0.3)] disabled:opacity-40 inline-flex items-center gap-2 transition active:scale-95"
								>
									Review Order{" "}
									<ArrowRight className="w-4 h-4" />
								</button>
							)}
						</div>
					</div>

					{/* Right Stage: Sticky Live Recipe Blueprint */}
					<div className="lg:col-span-4 sticky top-20 space-y-4">
						<div className="bg-white border border-[#CED0D4]/70 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-5 space-y-4">
							<div className="flex items-center justify-between pb-3 border-b border-[#E4E6EB]">
								<div className="flex items-center gap-2">
									<div className="w-8 h-8 rounded-lg bg-[#E7F3FF] text-[#1877F2] flex items-center justify-center">
										<ShoppingBag className="w-4 h-4" />
									</div>
									<div>
										<h3 className="font-bold text-[#050505] text-sm">
											Your Pizza Recipe
										</h3>
										<p className="text-[10px] text-[#65676B]">
											Live Blueprint
										</p>
									</div>
								</div>
							</div>

							{/* Ingredient Tiers */}
							<div className="space-y-2.5 text-xs">
								{/* Crust */}
								<div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F0F2F5]/60 border border-[#E4E6EB]">
									<div>
										<span className="text-[10px] uppercase font-bold text-[#65676B] block">
											Crust
										</span>
										<span className="font-bold text-[#050505]">
											{selectedBase
												? selectedBase.name
												: "Not selected yet"}
										</span>
									</div>
									<span className="font-extrabold text-[#050505]">
										{selectedBase
											? `₹${selectedBase.price}`
											: "—"}
									</span>
								</div>

								{/* Sauce */}
								<div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F0F2F5]/60 border border-[#E4E6EB]">
									<div>
										<span className="text-[10px] uppercase font-bold text-[#65676B] block">
											Sauce
										</span>
										<span className="font-bold text-[#050505]">
											{selectedSauce
												? selectedSauce.name
												: "Not selected yet"}
										</span>
									</div>
									<span className="font-extrabold text-[#050505]">
										{selectedSauce
											? `₹${selectedSauce.price}`
											: "—"}
									</span>
								</div>

								{/* Cheese */}
								<div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F0F2F5]/60 border border-[#E4E6EB]">
									<div>
										<span className="text-[10px] uppercase font-bold text-[#65676B] block">
											Cheese
										</span>
										<span className="font-bold text-[#050505]">
											{selectedCheese
												? selectedCheese.name
												: "Not selected yet"}
										</span>
									</div>
									<span className="font-extrabold text-[#050505]">
										{selectedCheese
											? `₹${selectedCheese.price}`
											: "—"}
									</span>
								</div>

								{/* Veggies */}
								<div className="p-2.5 rounded-xl bg-[#F0F2F5]/60 border border-[#E4E6EB] space-y-1.5">
									<div className="flex items-center justify-between">
										<span className="text-[10px] uppercase font-bold text-[#65676B]">
											Toppings ({selectedVeggies.length})
										</span>
										<span className="font-bold text-[#050505]">
											₹
											{selectedVeggies.reduce(
												(sum, v) => sum + v.price,
												0,
											)}
										</span>
									</div>

									{selectedVeggies.length > 0 ? (
										<div className="flex flex-wrap gap-1.5 pt-1">
											{selectedVeggies.map((v) => (
												<span
													key={v._id}
													className="px-2 py-0.5 rounded-md bg-white border border-[#CED0D4]/70 text-[10px] font-semibold text-[#050505]"
												>
													{v.name}
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

							{/* Price & Primary Action */}
							<div className="pt-3 border-t border-[#E4E6EB] space-y-3">
								<div className="flex items-baseline justify-between">
									<span className="text-xs font-bold text-[#65676B] uppercase tracking-wider">
										Calculated Total
									</span>
									<span className="text-2xl font-black text-[#1877F2]">
										₹{calculateTotal()}
									</span>
								</div>

								<button
									disabled={
										!selectedBase ||
										!selectedSauce ||
										!selectedCheese
									}
									onClick={handleProceedToSummary}
									className="w-full py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold rounded-xl text-xs shadow-[0_2px_4px_rgba(24,119,242,0.3)] disabled:opacity-40 disabled:hover:bg-[#1877F2] transition active:scale-[0.98] flex items-center justify-center gap-2"
								>
									<span>Review Order</span>
									<ArrowRight className="w-4 h-4" />
								</button>
							</div>
						</div>

						{/* Quick Assurance */}
						<div className="p-3 bg-white rounded-xl border border-[#CED0D4]/70 flex items-center gap-2 text-xs text-[#65676B]">
							<ShieldCheck className="w-4 h-4 text-[#00A400] shrink-0" />
							<span>
								Real-time inventory reserve on checkout
								confirmation
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
