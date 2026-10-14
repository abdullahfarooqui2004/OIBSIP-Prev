import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import {
	ArrowLeft,
	Mail,
	AlertCircle,
	KeyRound,
	ShieldCheck,
	RotateCcw,
	Clock,
	Inbox,
	ArrowRight,
} from "lucide-react";

export default function ForgotPassword() {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState({
		loading: false,
		success: "",
		error: "",
	});

	const handleSubmit = async (e) => {
		e.preventDefault();
		setStatus({ loading: true, success: "", error: "" });

		try {
			const { data } = await api.post("/auth/forgot-password", { email });
			setStatus({
				loading: false,
				success:
					data.message ||
					"A password reset link has been dispatched to your email inbox.",
				error: "",
			});
		} catch (err) {
			setStatus({
				loading: false,
				success: "",
				error:
					err.response?.data?.message ||
					"Failed to process password recovery. Please check your email.",
			});
		}
	};

	const handleResetForm = () => {
		setEmail("");
		setStatus({ loading: false, success: "", error: "" });
	};

	return (
		<div className="min-h-screen bg-[#F0F2F5] text-[#050505] flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
			<div className="max-w-md w-full space-y-4">
				{/* Top Navigation */}
				<div className="flex items-center justify-between px-1">
					<Link
						to="/login"
						className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1877F2] hover:text-[#166FE5] transition"
					>
						<ArrowLeft className="w-4 h-4" />
						<span>Back to Sign In</span>
					</Link>
					<span className="text-[11px] font-semibold text-[#65676B] flex items-center gap-1">
						<ShieldCheck className="w-3.5 h-3.5 text-[#00A400]" />
						<span>Account Security</span>
					</span>
				</div>

				{/* Facebook-style Recovery Card */}
				<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.06)] p-6 sm:p-8 space-y-6">
					{/* Header Icon & Title */}
					<div className="text-center space-y-2">
						<div className="w-14 h-14 bg-[#E7F3FF] border border-[#1877F2]/20 rounded-2xl flex items-center justify-center mx-auto text-[#1877F2] shadow-xs">
							<KeyRound className="w-7 h-7" />
						</div>

						<div>
							<span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-[#1877F2] bg-[#E7F3FF] px-2.5 py-0.5 rounded-full mb-1">
								Account Recovery
							</span>
							<h1 className="text-2xl font-black text-[#050505] tracking-tight">
								Reset Password
							</h1>
							<p className="text-xs text-[#65676B] mt-0.5 max-w-xs mx-auto">
								Enter your registered email address and we'll
								send a secure one-time reset link[cite: 1, 2].
							</p>
						</div>
					</div>

					{/* Error Banner */}
					{status.error && (
						<div className="p-3.5 bg-[#FFEBE8] border border-[#FA383E]/30 rounded-xl flex items-start gap-2.5 text-xs text-[#FA383E]">
							<AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
							<span className="leading-relaxed font-semibold">
								{status.error}
							</span>
						</div>
					)}

					{/* Success Notification View */}
					{status.success ? (
						<div className="space-y-5">
							<div className="p-5 bg-[#E7F7ED]/70 border border-[#00A400]/30 rounded-2xl text-center space-y-3">
								<div className="w-12 h-12 bg-[#00A400] text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
									<Inbox className="w-6 h-6" />
								</div>
								<div>
									<h3 className="font-bold text-[#050505] text-base">
										Check Your Inbox
									</h3>
									<p className="text-xs text-[#65676B] leading-relaxed mt-1">
										{status.success}
									</p>
								</div>

								<div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#65676B] bg-white py-1.5 px-3 rounded-lg border border-[#CED0D4]/60">
									<Clock className="w-3.5 h-3.5 text-[#F7B125]" />
									<span>
										The reset link remains active for 15
										minutes
									</span>
								</div>
							</div>

							{/* Tips Callout */}
							<div className="p-3 bg-[#F0F2F5] rounded-xl text-left space-y-1 text-[11px] text-[#65676B]">
								<p className="font-bold text-[#050505]">
									Didn't get an email?
								</p>
								<ul className="list-disc list-inside space-y-0.5">
									<li>
										Check your spam, junk, or promotions
										folder
									</li>
									<li>
										Verify that{" "}
										<span className="font-semibold text-[#050505]">
											{email}
										</span>{" "}
										is correct
									</li>
								</ul>
							</div>

							<div className="flex flex-col gap-2">
								<button
									type="button"
									onClick={handleResetForm}
									className="w-full py-2.5 bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#050505] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
								>
									<RotateCcw className="w-3.5 h-3.5" />
									<span>Try a Different Email</span>
								</button>

								<Link
									to="/login"
									className="w-full py-2.5 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
								>
									<span>Return to Sign In</span>
									<ArrowRight className="w-3.5 h-3.5" />
								</Link>
							</div>
						</div>
					) : (
						/* Input Form */
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label className="block text-[11px] font-bold text-[#65676B] uppercase tracking-wider mb-1">
									Registered Email Address
								</label>
								<div className="relative">
									<Mail className="w-4 h-4 text-[#65676B] absolute left-3.5 top-1/2 -translate-y-1/2" />
									<input
										type="email"
										required
										value={email}
										onChange={(e) =>
											setEmail(e.target.value)
										}
										placeholder="user@example.com"
										className="w-full pl-10 pr-4 py-2.5 bg-[#F0F2F5] hover:bg-[#E4E6EB]/60 focus:bg-white text-sm rounded-xl border border-transparent focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 focus:outline-none transition text-[#050505] placeholder-[#65676B]"
									/>
								</div>
							</div>

							<button
								type="submit"
								disabled={status.loading || !email.trim()}
								className="w-full py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold rounded-xl text-sm shadow-[0_2px_4px_rgba(24,119,242,0.3)] transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
							>
								{status.loading ? (
									<>
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										<span>Sending Recovery Link...</span>
									</>
								) : (
									<span>Send Reset Link</span>
								)}
							</button>
						</form>
					)}

					{/* Footer Card Info */}
					<div className="pt-4 border-t border-[#E4E6EB] text-center space-y-1">
						<p className="text-[11px] text-[#65676B] leading-relaxed">
							Remembered your credentials?{" "}
							<Link
								to="/login"
								className="font-bold text-[#1877F2] hover:underline"
							>
								Sign In
							</Link>
						</p>
					</div>
				</div>

				{/* Footer Support Notice */}
				<div className="text-center text-xs text-[#65676B]">
					Don't have an account yet?{" "}
					<Link
						to="/register"
						className="font-bold text-[#1877F2] hover:underline"
					>
						Create an account
					</Link>
				</div>
			</div>
		</div>
	);
}
