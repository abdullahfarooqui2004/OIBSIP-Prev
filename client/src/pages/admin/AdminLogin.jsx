import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import {
	Lock,
	Mail,
	ShieldAlert,
	ShieldCheck,
	Eye,
	EyeOff,
	ArrowLeft,
	KeyRound,
	Server,
} from "lucide-react";

export default function AdminLogin() {
	const navigate = useNavigate();
	const { saveAuth } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const { data } = await api.post("/auth/admin/login", {
				email,
				password,
			});
			saveAuth(data.token, data.admin);
			navigate("/admin/dashboard");
		} catch (err) {
			setError(
				err.response?.data?.message ||
					"Invalid administrative credentials or insufficient privileges.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#F0F2F5] text-[#050505] flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
			<div className="max-w-md w-full space-y-4">
				{/* Top Navigation Back to Store */}
				<div className="flex items-center justify-between px-1">
					<Link
						to="/login"
						className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1877F2] hover:text-[#166FE5] transition"
					>
						<ArrowLeft className="w-4 h-4" />
						<span>Customer Sign In</span>
					</Link>
					<span className="text-[11px] font-semibold text-[#65676B] flex items-center gap-1">
						<Server className="w-3.5 h-3.5 text-[#00A400]" />
						<span>Store Operations</span>
					</span>
				</div>

				{/* Admin Login Card */}
				<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.06)] p-6 sm:p-8 space-y-6">
					{/* Header Icon & Title */}
					<div className="text-center space-y-2">
						<div className="w-14 h-14 bg-[#E7F3FF] border border-[#1877F2]/20 rounded-2xl flex items-center justify-center mx-auto text-[#1877F2] shadow-xs">
							<KeyRound className="w-7 h-7" />
						</div>

						<div>
							<span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-[#1877F2] bg-[#E7F3FF] px-2.5 py-0.5 rounded-full mb-1">
								Restricted Access
							</span>
							<h1 className="text-2xl font-black text-[#050505] tracking-tight">
								Admin Console
							</h1>
							<p className="text-xs text-[#65676B] mt-0.5">
								Kitchen queue dispatch &amp; inventory control
								portal
							</p>
						</div>
					</div>

					{/* Error Banner */}
					{error && (
						<div className="p-3.5 bg-[#FFEBE8] border border-[#FA383E]/30 rounded-xl flex items-start gap-2.5 text-xs text-[#FA383E]">
							<ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
							<span className="leading-relaxed font-semibold">
								{error}
							</span>
						</div>
					)}

					{/* Form */}
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="block text-[11px] font-bold text-[#65676B] uppercase tracking-wider mb-1">
								Staff Email Address
							</label>
							<div className="relative">
								<Mail className="w-4 h-4 text-[#65676B] absolute left-3.5 top-1/2 -translate-y-1/2" />
								<input
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="admin@pizzaco.com"
									className="w-full pl-10 pr-4 py-2.5 bg-[#F0F2F5] hover:bg-[#E4E6EB]/60 focus:bg-white text-sm rounded-xl border border-transparent focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 focus:outline-none transition text-[#050505] placeholder-[#65676B]"
								/>
							</div>
						</div>

						<div>
							<label className="block text-[11px] font-bold text-[#65676B] uppercase tracking-wider mb-1">
								Security Password
							</label>
							<div className="relative">
								<Lock className="w-4 h-4 text-[#65676B] absolute left-3.5 top-1/2 -translate-y-1/2" />
								<input
									type={showPassword ? "text" : "password"}
									required
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									placeholder="••••••••"
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

						{/* Submit Button */}
						<button
							type="submit"
							disabled={loading}
							className="w-full py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold rounded-xl text-sm shadow-[0_2px_4px_rgba(24,119,242,0.3)] transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
						>
							{loading ? (
								<>
									<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									<span>Verifying Credentials...</span>
								</>
							) : (
								<>
									<ShieldCheck className="w-4 h-4" />
									<span>Authenticate Session</span>
								</>
							)}
						</button>
					</form>

					{/* Security Assurance Disclaimer */}
					<div className="pt-4 border-t border-[#E4E6EB] text-center space-y-1">
						<p className="text-[11px] text-[#65676B] leading-relaxed">
							Protected by isolated role-based JWT
							authentication[cite: 1, 2]. All manual stock changes
							and order updates are logged to the console[cite: 1,
							2].
						</p>
					</div>
				</div>

				{/* Footer Support */}
				<div className="text-center text-xs text-[#65676B]">
					Store front customer?{" "}
					<Link
						to="/"
						className="font-bold text-[#1877F2] hover:underline"
					>
						Go to Pizza Builder
					</Link>
				</div>
			</div>
		</div>
	);
}
