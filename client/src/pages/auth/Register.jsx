import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import {
	AlertCircle,
	Lock,
	Mail,
	User,
	Eye,
	EyeOff,
	Radio,
	ShieldCheck,
	Sparkles,
	Inbox,
	ArrowRight,
} from "lucide-react";

export default function Register() {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
	});

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [status, setStatus] = useState({
		loading: false,
		success: "",
		error: "",
	});

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setStatus({ loading: false, success: "", error: "" });

		if (formData.password.length < 6) {
			setStatus({
				loading: false,
				success: "",
				error: "Password must be at least 6 characters long.",
			});
			return;
		}

		if (formData.password !== formData.confirmPassword) {
			setStatus({
				loading: false,
				success: "",
				error: "Passwords do not match.",
			});
			return;
		}

		setStatus({ loading: true, success: "", error: "" });

		try {
			const { data } = await api.post("/auth/register", {
				name: formData.name,
				email: formData.email,
				password: formData.password,
			});

			setStatus({ loading: false, success: data.message, error: "" });
		} catch (err) {
			setStatus({
				loading: false,
				success: "",
				error:
					err.response?.data?.message ||
					"Registration failed. Please try again.",
			});
		}
	};

	return (
		<div className="min-h-screen bg-[#F0F2F5] text-[#050505] flex items-center justify-center p-4 sm:p-6 font-sans">
			<div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-6">
				{/* Left Column: Brand Showcase (Facebook Style) */}
				<div className="lg:col-span-7 space-y-4 text-center lg:text-left">
					<div className="inline-flex items-center gap-2.5">
						<span className="text-4xl sm:text-5xl">🍕</span>
						<span className="text-3xl sm:text-4xl font-black tracking-tight text-[#1877F2]">
							Pizza<span className="text-[#050505]">Co.</span>
						</span>
					</div>

					<h1 className="text-2xl sm:text-3xl font-extrabold text-[#050505] leading-snug">
						Create an account and start crafting your custom artisan
						pizzas.
					</h1>

					<p className="text-[#65676B] text-sm sm:text-base max-w-lg leading-relaxed mx-auto lg:mx-0">
						Design signature crusts, simmered sauces, cheeses, and
						farm toppings with live WebSocket kitchen updates and
						fast Razorpay checkout[cite: 1, 2].
					</p>

					{/* Feature Badges */}
					<div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-3.5 text-xs font-semibold text-[#65676B]">
						<div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#CED0D4]/70 shadow-2xs">
							<Sparkles className="w-3.5 h-3.5 text-[#1877F2]" />
							<span>4-Step Custom Studio</span>
						</div>
						<div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#CED0D4]/70 shadow-2xs">
							<Radio className="w-3.5 h-3.5 text-[#00A400] animate-pulse" />
							<span>Live Order Tracking</span>
						</div>
						<div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#CED0D4]/70 shadow-2xs">
							<ShieldCheck className="w-3.5 h-3.5 text-[#1877F2]" />
							<span>Email Verified Accounts</span>
						</div>
					</div>
				</div>

				{/* Right Column: Register Card */}
				<div className="lg:col-span-5 w-full max-w-md mx-auto space-y-4">
					<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.06)] p-6 sm:p-8 space-y-5">
						<div className="pb-1 text-center">
							<h2 className="text-xl font-bold text-[#050505] tracking-tight">
								Create a New Account
							</h2>
							<p className="text-xs text-[#65676B] mt-0.5">
								Quick, easy, and ready in minutes
							</p>
						</div>

						{status.error && (
							<div className="p-3.5 bg-[#FFEBE8] border border-[#FA383E]/30 rounded-xl flex items-start gap-2.5 text-xs text-[#FA383E]">
								<AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
								<span className="leading-relaxed font-semibold">
									{status.error}
								</span>
							</div>
						)}

						{status.success ? (
							<div className="p-6 bg-[#E7F7ED]/70 border border-[#00A400]/30 rounded-2xl text-center space-y-3">
								<div className="w-12 h-12 bg-[#00A400] text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
									<Inbox className="w-6 h-6" />
								</div>
								<h3 className="font-bold text-[#050505] text-base">
									Verify Your Email
								</h3>
								<p className="text-xs text-[#65676B] leading-relaxed">
									{status.success}
								</p>
								<div className="pt-2">
									<Link
										to="/login"
										className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl text-xs font-bold transition shadow-xs"
									>
										<span>Proceed to Login</span>
										<ArrowRight className="w-3.5 h-3.5" />
									</Link>
								</div>
							</div>
						) : (
							<form
								onSubmit={handleSubmit}
								className="space-y-3.5"
							>
								{/* Full Name */}
								<div>
									<div className="relative">
										<User className="w-4 h-4 text-[#65676B] absolute left-3.5 top-1/2 -translate-y-1/2" />
										<input
											type="text"
											name="name"
											required
											value={formData.name}
											onChange={handleChange}
											placeholder="Full name"
											className="w-full pl-10 pr-4 py-2.5 bg-[#F0F2F5] hover:bg-[#E4E6EB]/60 focus:bg-white text-sm rounded-xl border border-transparent focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 focus:outline-none transition text-[#050505] placeholder-[#65676B]"
										/>
									</div>
								</div>

								{/* Email Address */}
								<div>
									<div className="relative">
										<Mail className="w-4 h-4 text-[#65676B] absolute left-3.5 top-1/2 -translate-y-1/2" />
										<input
											type="email"
											name="email"
											required
											value={formData.email}
											onChange={handleChange}
											placeholder="Email address"
											className="w-full pl-10 pr-4 py-2.5 bg-[#F0F2F5] hover:bg-[#E4E6EB]/60 focus:bg-white text-sm rounded-xl border border-transparent focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 focus:outline-none transition text-[#050505] placeholder-[#65676B]"
										/>
									</div>
								</div>

								{/* Password Input */}
								<div>
									<div className="relative">
										<Lock className="w-4 h-4 text-[#65676B] absolute left-3.5 top-1/2 -translate-y-1/2" />
										<input
											type={
												showPassword
													? "text"
													: "password"
											}
											name="password"
											required
											minLength={6}
											value={formData.password}
											onChange={handleChange}
											placeholder="Password (min 6 characters)"
											className="w-full pl-10 pr-10 py-2.5 bg-[#F0F2F5] hover:bg-[#E4E6EB]/60 focus:bg-white text-sm rounded-xl border border-transparent focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 focus:outline-none transition text-[#050505] placeholder-[#65676B]"
										/>
										<button
											type="button"
											onClick={() =>
												setShowPassword(!showPassword)
											}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-[#65676B] hover:text-[#050505] p-1 rounded-md transition"
										>
											{showPassword ? (
												<EyeOff className="w-4 h-4" />
											) : (
												<Eye className="w-4 h-4" />
											)}
										</button>
									</div>
								</div>

								{/* Confirm Password Input */}
								<div>
									<div className="relative">
										<Lock className="w-4 h-4 text-[#65676B] absolute left-3.5 top-1/2 -translate-y-1/2" />
										<input
											type={
												showConfirmPassword
													? "text"
													: "password"
											}
											name="confirmPassword"
											required
											minLength={6}
											value={formData.confirmPassword}
											onChange={handleChange}
											placeholder="Confirm password"
											className="w-full pl-10 pr-10 py-2.5 bg-[#F0F2F5] hover:bg-[#E4E6EB]/60 focus:bg-white text-sm rounded-xl border border-transparent focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 focus:outline-none transition text-[#050505] placeholder-[#65676B]"
										/>
										<button
											type="button"
											onClick={() =>
												setShowConfirmPassword(
													!showConfirmPassword,
												)
											}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-[#65676B] hover:text-[#050505] p-1 rounded-md transition"
										>
											{showConfirmPassword ? (
												<EyeOff className="w-4 h-4" />
											) : (
												<Eye className="w-4 h-4" />
											)}
										</button>
									</div>
								</div>

								{/* Submit Button (Facebook Green Action CTA) */}
								<button
									type="submit"
									disabled={status.loading}
									className="w-full py-3 bg-[#42B72A] hover:bg-[#36A420] text-white font-bold rounded-xl text-sm shadow-[0_2px_4px_rgba(66,183,42,0.25)] transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
								>
									{status.loading ? (
										<>
											<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
											<span>Creating Account...</span>
										</>
									) : (
										<span>Sign Up</span>
									)}
								</button>
							</form>
						)}

						{/* Separator Line */}
						<div className="relative flex items-center justify-center pt-1">
							<div className="border-t border-[#E4E6EB] w-full" />
							<span className="bg-white px-3 text-[11px] font-bold text-[#65676B] uppercase tracking-wider absolute">
								Already registered?
							</span>
						</div>

						{/* Log in CTA (Facebook Blue Button) */}
						<div className="pt-2 text-center">
							<Link
								to="/login"
								className="inline-flex items-center justify-center w-full py-2.5 bg-[#E7F3FF] hover:bg-[#DBEBFF] text-[#1877F2] font-bold text-xs rounded-xl transition active:scale-[0.98]"
							>
								Log In to Existing Account
							</Link>
						</div>
					</div>

					{/* Terms / Privacy Disclaimer */}
					<p className="text-center text-[11px] text-[#65676B] px-4 leading-normal">
						By signing up, you agree to receive automated email
						notifications regarding your pizza orders and inventory
						alerts[cite: 1, 2].
					</p>
				</div>
			</div>
		</div>
	);
}
