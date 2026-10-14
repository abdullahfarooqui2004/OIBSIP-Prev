import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import {
	AlertCircle,
	Lock,
	Mail,
	Eye,
	EyeOff,
	ShieldCheck,
	Radio,
} from "lucide-react";

export default function Login() {
	const navigate = useNavigate();
	const { saveAuth } = useAuth();

	const [formData, setFormData] = useState({ email: "", password: "" });
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(true);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const { data } = await api.post("/auth/login", formData);
			saveAuth(data.token, data.user);
			navigate("/builder");
		} catch (err) {
			setError(
				err.response?.data?.message ||
					"Invalid email or password. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#F0F2F5] text-[#050505] flex items-center justify-center p-4 sm:p-6 font-sans">
			<div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-6">
				{/* Left Column: Facebook-style Brand Showcase */}
				<div className="lg:col-span-7 space-y-4 text-center lg:text-left">
					<div className="inline-flex items-center gap-2.5">
						<span className="text-4xl sm:text-5xl">🍕</span>
						<span className="text-3xl sm:text-4xl font-black tracking-tight text-[#1877F2]">
							Pizza<span className="text-[#050505]">Co.</span>
						</span>
					</div>

					<h1 className="text-2xl sm:text-3xl font-extrabold text-[#050505] leading-snug">
						Craft, bake, and track artisan pizzas directly from your
						feed.
					</h1>

					<p className="text-[#65676B] text-sm sm:text-base max-w-lg leading-relaxed mx-auto lg:mx-0">
						Log in to customize dough bases, simmered sauces,
						cheeses, and farm-fresh toppings with live WebSocket
						kitchen updates.
					</p>

					{/* Feature Badges */}
					<div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-4 text-xs font-semibold text-[#65676B]">
						<div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#CED0D4]/70 shadow-2xs">
							<Radio className="w-3.5 h-3.5 text-[#1877F2] animate-pulse" />
							<span>Real-Time Kitchen Feed</span>
						</div>
						<div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#CED0D4]/70 shadow-2xs">
							<ShieldCheck className="w-3.5 h-3.5 text-[#00A400]" />
							<span>Verified Razorpay Checkout</span>
						</div>
					</div>
				</div>

				{/* Right Column: Facebook-style Clean Login Card */}
				<div className="lg:col-span-5 w-full max-w-md mx-auto space-y-4">
					<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.06)] p-6 sm:p-8 space-y-5">
						<div className="pb-1 text-center">
							<h2 className="text-xl font-bold text-[#050505] tracking-tight">
								Log In to Pizza Co.
							</h2>
							<p className="text-xs text-[#65676B] mt-0.5">
								Access your cart and recent orders
							</p>
						</div>

						{error && (
							<div className="p-3.5 bg-[#FFEBE8] border border-[#FA383E]/30 rounded-xl flex items-start gap-2.5 text-xs text-[#FA383E]">
								<AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
								<span className="leading-relaxed font-semibold">
									{error}
								</span>
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-3.5">
							{/* Email Input */}
							<div>
								<div className="relative">
									<Mail className="w-4 h-4 text-[#65676B] absolute left-3.5 top-1/2 -translate-y-1/2" />
									<input
										type="email"
										required
										value={formData.email}
										onChange={(e) =>
											setFormData({
												...formData,
												email: e.target.value,
											})
										}
										placeholder="Email address"
										className="w-full pl-10 pr-4 py-2.5 bg-[#F0F2F5] hover:bg-[#E4E6EB]/60 focus:bg-white text-sm rounded-xl border border-transparent focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 focus:outline-none transition text-[#050505] placeholder-[#65676B]"
									/>
								</div>
							</div>

							{/* Password Input with Show/Hide Toggle */}
							<div>
								<div className="relative">
									<Lock className="w-4 h-4 text-[#65676B] absolute left-3.5 top-1/2 -translate-y-1/2" />
									<input
										type={
											showPassword ? "text" : "password"
										}
										required
										value={formData.password}
										onChange={(e) =>
											setFormData({
												...formData,
												password: e.target.value,
											})
										}
										placeholder="Password"
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

							{/* Remember Me & Forgot Password */}
							<div className="flex items-center justify-between text-xs pt-0.5">
								<label className="flex items-center gap-2 cursor-pointer select-none text-[#65676B]">
									<input
										type="checkbox"
										checked={rememberMe}
										onChange={(e) =>
											setRememberMe(e.target.checked)
										}
										className="w-4 h-4 text-[#1877F2] rounded border-[#CED0D4] focus:ring-[#1877F2]"
									/>
									<span>Remember me</span>
								</label>

								<Link
									to="/forgot-password"
									className="text-xs font-semibold text-[#1877F2] hover:underline"
								>
									Forgot password?
								</Link>
							</div>

							{/* Submit Button (Facebook Blue) */}
							<button
								type="submit"
								disabled={loading}
								className="w-full py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold rounded-xl text-sm shadow-[0_2px_4px_rgba(24,119,242,0.3)] transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
							>
								{loading ? (
									<>
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										<span>Signing In...</span>
									</>
								) : (
									<span>Log In</span>
								)}
							</button>
						</form>

						{/* Separator Line */}
						<div className="relative flex items-center justify-center pt-1">
							<div className="border-t border-[#E4E6EB] w-full" />
							<span className="bg-white px-3 text-[11px] font-bold text-[#65676B] uppercase tracking-wider absolute">
								or
							</span>
						</div>

						{/* Create Account CTA (Classic Facebook Green CTA) */}
						<div className="pt-2 text-center">
							<Link
								to="/register"
								className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-2.5 bg-[#42B72A] hover:bg-[#36A420] text-white font-bold text-xs rounded-xl shadow-[0_2px_4px_rgba(66,183,42,0.25)] transition active:scale-[0.98]"
							>
								Create New Account
							</Link>
						</div>
					</div>

					{/* Admin Backdoor Link */}
					<div className="text-center text-xs text-[#65676B]">
						Store kitchen staff?{" "}
						<Link
							to="/admin/login"
							className="font-bold text-[#1877F2] hover:underline"
						>
							Sign in to Admin Console
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
