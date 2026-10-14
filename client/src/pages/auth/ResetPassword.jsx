import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../../api/client";
import {
	Lock,
	KeyRound,
	Eye,
	EyeOff,
	CheckCircle2,
	AlertCircle,
	ShieldCheck,
	ArrowRight,
	ArrowLeft,
	Check,
	Clock,
} from "lucide-react";

export default function ResetPassword() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const token = searchParams.get("token");

	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const [status, setStatus] = useState({
		loading: false,
		success: false,
		message: "",
		error: !token
			? "Missing password reset token. Please request a new recovery link."
			: "",
	});

	const [countdown, setCountdown] = useState(5);

	// Auto-redirect to login after successful password update
	useEffect(() => {
		if (!status.success) return;

		const timer = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					navigate("/login");
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [status.success, navigate]);

	// Real-time password criteria
	const hasMinLength = newPassword.length >= 6;
	const hasNumber = /\d/.test(newPassword);
	const passwordsMatch =
		newPassword.length > 0 && newPassword === confirmPassword;

	const handleSubmit = async (e) => {
		e.preventDefault();
		setStatus((prev) => ({ ...prev, error: "" }));

		if (!token) {
			setStatus((prev) => ({
				...prev,
				error: "Invalid or missing token. Please request a new reset link.",
			}));
			return;
		}

		if (!hasMinLength) {
			setStatus((prev) => ({
				...prev,
				error: "Password must be at least 6 characters long.",
			}));
			return;
		}

		if (newPassword !== confirmPassword) {
			setStatus((prev) => ({
				...prev,
				error: "Passwords do not match.",
			}));
			return;
		}

		setStatus({ loading: true, success: false, message: "", error: "" });

		try {
			const { data } = await api.post("/auth/reset-password", {
				token,
				newPassword,
			});

			setStatus({
				loading: false,
				success: true,
				message:
					data.message ||
					"Your password has been securely reset. You can now log in.",
				error: "",
			});
		} catch (err) {
			setStatus({
				loading: false,
				success: false,
				message: "",
				error:
					err.response?.data?.message ||
					"This password reset link is invalid or has expired after 15 minutes.",
			});
		}
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
						<span>Credential Security</span>
					</span>
				</div>

				{/* Facebook-style Card */}
				<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.06)] p-6 sm:p-8 space-y-6">
					{/* Header */}
					<div className="text-center space-y-2">
						<div className="w-14 h-14 bg-[#E7F3FF] border border-[#1877F2]/20 rounded-2xl flex items-center justify-center mx-auto text-[#1877F2] shadow-xs">
							<KeyRound className="w-7 h-7" />
						</div>

						<div>
							<span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-[#1877F2] bg-[#E7F3FF] px-2.5 py-0.5 rounded-full mb-1">
								Account Recovery
							</span>
							<h1 className="text-2xl font-black text-[#050505] tracking-tight">
								Create New Password
							</h1>
							<p className="text-xs text-[#65676B] mt-0.5 max-w-xs mx-auto">
								Set a strong, unique password to secure your
								Pizza Co. orders and personal data[cite: 1, 2].
							</p>
						</div>
					</div>

					{/* Error Message */}
					{status.error && (
						<div className="p-3.5 bg-[#FFEBE8] border border-[#FA383E]/30 rounded-xl flex items-start gap-2.5 text-xs text-[#FA383E]">
							<AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
							<div className="space-y-1">
								<p className="font-semibold">{status.error}</p>
								{!token && (
									<Link
										to="/forgot-password"
										className="font-bold underline text-[#FA383E] block hover:opacity-80"
									>
										Request a new reset link &rarr;
									</Link>
								)}
							</div>
						</div>
					)}

					{/* 1. Success Screen */}
					{status.success ? (
						<div className="py-2 space-y-5">
							<div className="w-14 h-14 bg-[#E7F7ED] border border-[#00A400]/20 rounded-full flex items-center justify-center mx-auto shadow-xs">
								<CheckCircle2 className="w-8 h-8 text-[#00A400] stroke-[2.5]" />
							</div>

							<div className="text-center space-y-1.5">
								<h3 className="font-bold text-[#050505] text-lg">
									Password Updated!
								</h3>
								<p className="text-xs text-[#65676B] leading-relaxed">
									{status.message}
								</p>
							</div>

							{/* Countdown Indicator */}
							<div className="p-3 bg-[#F0F2F5] rounded-xl text-xs text-[#65676B] font-medium flex items-center justify-center gap-1.5">
								<Clock className="w-3.5 h-3.5 text-[#1877F2]" />
								<span>Redirecting to login in</span>
								<span className="font-bold text-[#1877F2] w-4 text-center">
									{countdown}s
								</span>
							</div>

							<Link
								to="/login"
								className="w-full py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl text-xs font-bold shadow-[0_2px_4px_rgba(24,119,242,0.3)] transition active:scale-[0.98] flex items-center justify-center gap-2"
							>
								<span>Proceed to Sign In</span>
								<ArrowRight className="w-4 h-4" />
							</Link>
						</div>
					) : (
						/* 2. Password Reset Form */
						<form onSubmit={handleSubmit} className="space-y-4">
							{/* New Password */}
							<div>
								<label className="block text-[11px] font-bold text-[#65676B] uppercase tracking-wider mb-1">
									New Password
								</label>
								<div className="relative">
									<Lock className="w-4 h-4 text-[#65676B] absolute left-3.5 top-1/2 -translate-y-1/2" />
									<input
										type={
											showNewPassword
												? "text"
												: "password"
										}
										required
										minLength={6}
										value={newPassword}
										onChange={(e) =>
											setNewPassword(e.target.value)
										}
										placeholder="Enter new password"
										className="w-full pl-10 pr-10 py-2.5 bg-[#F0F2F5] hover:bg-[#E4E6EB]/60 focus:bg-white text-sm rounded-xl border border-transparent focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 focus:outline-none transition text-[#050505] placeholder-[#65676B]"
									/>
									<button
										type="button"
										onClick={() =>
											setShowNewPassword(!showNewPassword)
										}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-[#65676B] hover:text-[#050505] p-1 rounded-md transition"
									>
										{showNewPassword ? (
											<EyeOff className="w-4 h-4" />
										) : (
											<Eye className="w-4 h-4" />
										)}
									</button>
								</div>
							</div>

							{/* Confirm New Password */}
							<div>
								<label className="block text-[11px] font-bold text-[#65676B] uppercase tracking-wider mb-1">
									Confirm New Password
								</label>
								<div className="relative">
									<Lock className="w-4 h-4 text-[#65676B] absolute left-3.5 top-1/2 -translate-y-1/2" />
									<input
										type={
											showConfirmPassword
												? "text"
												: "password"
										}
										required
										minLength={6}
										value={confirmPassword}
										onChange={(e) =>
											setConfirmPassword(e.target.value)
										}
										placeholder="Repeat new password"
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

							{/* Password Requirements Checklist */}
							<div className="p-3 bg-[#F0F2F5] rounded-xl space-y-1.5 text-[11px]">
								<div
									className={`flex items-center gap-1.5 ${
										hasMinLength
											? "text-[#00A400]"
											: "text-[#65676B]"
									}`}
								>
									{hasMinLength ? (
										<Check className="w-3.5 h-3.5 stroke-[3]" />
									) : (
										<span className="w-3.5 h-3.5 rounded-full border border-[#CED0D4] inline-block" />
									)}
									<span className="font-medium">
										At least 6 characters
									</span>
								</div>

								<div
									className={`flex items-center gap-1.5 ${
										hasNumber
											? "text-[#00A400]"
											: "text-[#65676B]"
									}`}
								>
									{hasNumber ? (
										<Check className="w-3.5 h-3.5 stroke-[3]" />
									) : (
										<span className="w-3.5 h-3.5 rounded-full border border-[#CED0D4] inline-block" />
									)}
									<span className="font-medium">
										Contains at least one number
									</span>
								</div>

								<div
									className={`flex items-center gap-1.5 ${
										passwordsMatch
											? "text-[#00A400]"
											: "text-[#65676B]"
									}`}
								>
									{passwordsMatch ? (
										<Check className="w-3.5 h-3.5 stroke-[3]" />
									) : (
										<span className="w-3.5 h-3.5 rounded-full border border-[#CED0D4] inline-block" />
									)}
									<span className="font-medium">
										Passwords match
									</span>
								</div>
							</div>

							{/* Submit Button */}
							<button
								type="submit"
								disabled={
									status.loading ||
									!hasMinLength ||
									!passwordsMatch ||
									!token
								}
								className="w-full py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold rounded-xl text-sm shadow-[0_2px_4px_rgba(24,119,242,0.3)] transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
							>
								{status.loading ? (
									<>
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										<span>Updating Password...</span>
									</>
								) : (
									<span>Save New Password</span>
								)}
							</button>
						</form>
					)}

					{/* Footer Card Info */}
					<div className="pt-4 border-t border-[#E4E6EB] text-center space-y-1">
						<p className="text-[11px] text-[#65676B] leading-relaxed">
							Link expired?{" "}
							<Link
								to="/forgot-password"
								className="font-bold text-[#1877F2] hover:underline"
							>
								Request a new password reset
							</Link>
						</p>
					</div>
				</div>

				{/* Footer Support Notice */}
				<div className="text-center text-xs text-[#65676B]">
					Need immediate support?{" "}
					<Link
						to="/login"
						className="font-bold text-[#1877F2] hover:underline"
					>
						Contact Support
					</Link>
				</div>
			</div>
		</div>
	);
}
