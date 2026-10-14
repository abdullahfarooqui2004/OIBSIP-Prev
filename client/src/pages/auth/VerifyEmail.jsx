import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../api/client";
import {
	CheckCircle2,
	XCircle,
	Loader2,
	ArrowRight,
	RotateCcw,
	Mail,
	Send,
	ShieldCheck,
	AlertCircle,
} from "lucide-react";

export default function VerifyEmail() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const token = searchParams.get("token");

	// Prevent React StrictMode double-execution from consuming the token twice
	const hasRequested = useRef(false);

	const [state, setState] = useState(() => ({
		loading: Boolean(token),
		success: false,
		message: token
			? "Validating token with server..."
			: "No verification token found. Please check the link in your email.",
	}));

	const [countdown, setCountdown] = useState(5);
	const [showResend, setShowResend] = useState(false);
	const [resendEmail, setResendEmail] = useState("");
	const [resendStatus, setResendStatus] = useState({
		loading: false,
		success: "",
		error: "",
	});

	const verifyToken = useCallback(async () => {
		if (!token) return;

		setState({
			loading: true,
			success: false,
			message: "Validating your token...",
		});

		try {
			const { data } = await api.get(`/auth/verify-email?token=${token}`);
			setState({
				loading: false,
				success: true,
				message:
					data.message ||
					"Your email address has been verified successfully!",
			});
		} catch (err) {
			setState({
				loading: false,
				success: false,
				message:
					err.response?.data?.message ||
					"This verification link is invalid, malformed, or has expired.",
			});
		}
	}, [token]);

	useEffect(() => {
		if (!token || hasRequested.current) return;
		hasRequested.current = true;
		verifyToken();
	}, [token, verifyToken]);


	// Automated countdown to login on success
	useEffect(() => {
		if (!state.success) return;

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
	}, [state.success, navigate]);

	const handleResend = async (e) => {
		e.preventDefault();
		setResendStatus({ loading: true, success: "", error: "" });

		try {
			const { data } = await api.post("/auth/forgot-password", {
				email: resendEmail,
			});

			setResendStatus({
				loading: false,
				success:
					data.message ||
					"A new access link has been sent to your email.",
				error: "",
			});
		} catch (err) {
			setResendStatus({
				loading: false,
				success: "",
				error:
					err.response?.data?.message ||
					"Could not resend email. Check your address.",
			});
		}
	};

	return (
		<div className="min-h-screen bg-[#F0F2F5] text-[#050505] flex items-center justify-center p-4 sm:p-6 font-sans">
			<div className="max-w-md w-full space-y-4">
				<div className="text-center space-y-1">
					<Link to="/" className="inline-flex items-center gap-2">
						<span className="text-3xl">🍕</span>
						<span className="text-2xl font-black tracking-tight text-[#1877F2]">
							Pizza<span className="text-[#050505]">Co.</span>
						</span>
					</Link>
					<p className="text-xs text-[#65676B]">
						Account Verification Portal
					</p>
				</div>

				<div className="bg-white rounded-2xl border border-[#CED0D4]/70 shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.06)] p-6 sm:p-8 text-center space-y-6">
					{state.loading && (
						<div className="py-6 space-y-4">
							<div className="w-14 h-14 bg-[#E7F3FF] rounded-full flex items-center justify-center mx-auto shadow-xs">
								<Loader2 className="w-7 h-7 text-[#1877F2] animate-spin" />
							</div>
							<div className="space-y-1">
								<h2 className="text-lg font-bold text-[#050505]">
									Verifying Your Email...
								</h2>
								<p className="text-xs text-[#65676B] max-w-xs mx-auto">
									Connecting to the server to confirm your
									credentials.
								</p>
							</div>
						</div>
					)}

					{!state.loading && state.success && (
						<div className="py-2 space-y-5">
							<div className="w-14 h-14 bg-[#E7F7ED] border border-[#00A400]/20 rounded-full flex items-center justify-center mx-auto shadow-xs">
								<CheckCircle2 className="w-8 h-8 text-[#00A400] stroke-[2.5]" />
							</div>

							<div className="space-y-1.5">
								<span className="text-[11px] font-extrabold uppercase tracking-wider text-[#00A400] bg-[#E7F7ED] px-2.5 py-0.5 rounded-full">
									Confirmed
								</span>
								<h2 className="text-xl font-bold text-[#050505]">
									Account Verified!
								</h2>
								<p className="text-xs text-[#65676B] leading-relaxed">
									{state.message}
								</p>
							</div>

							<div className="p-3 bg-[#F0F2F5] rounded-xl text-xs text-[#65676B] font-medium flex items-center justify-center gap-1.5">
								<span>Redirecting to login in</span>
								<span className="font-bold text-[#1877F2] w-4 text-center">
									{countdown}s
								</span>
							</div>

							<div className="pt-2 flex flex-col gap-2.5">
								<Link
									to="/login"
									className="w-full py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl text-xs font-bold shadow-[0_2px_4px_rgba(24,119,242,0.3)] transition active:scale-[0.98] flex items-center justify-center gap-2"
								>
									<span>Proceed to Log In Now</span>
									<ArrowRight className="w-4 h-4" />
								</Link>

								<Link
									to="/builder"
									className="w-full py-2.5 bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#050505] rounded-xl text-xs font-bold transition"
								>
									Browse Menu & Custom Studio
								</Link>
							</div>
						</div>
					)}

					{!state.loading && !state.success && (
						<div className="py-2 space-y-5">
							<div className="w-14 h-14 bg-[#FFEBE8] border border-[#FA383E]/20 rounded-full flex items-center justify-center mx-auto shadow-xs">
								<XCircle className="w-8 h-8 text-[#FA383E] stroke-[2]" />
							</div>

							<div className="space-y-1.5">
								<span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FA383E] bg-[#FFEBE8] px-2.5 py-0.5 rounded-full">
									Verification Failed
								</span>
								<h2 className="text-xl font-bold text-[#050505]">
									Unable to Verify
								</h2>
								<p className="text-xs text-[#65676B] leading-relaxed">
									{state.message}
								</p>
							</div>

							<div className="pt-1 flex flex-col gap-2.5">
								{token && (
									<button
										onClick={() => {
											hasRequested.current = false;
											verifyToken();
										}}
										className="w-full py-2.5 bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#050505] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
									>
										<RotateCcw className="w-3.5 h-3.5" />
										<span>Retry Verification</span>
									</button>
								)}

								<button
									onClick={() => setShowResend(!showResend)}
									className="w-full py-2.5 bg-[#E7F3FF] hover:bg-[#DBEBFF] text-[#1877F2] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
								>
									<Mail className="w-3.5 h-3.5" />
									<span>
										{showResend
											? "Hide Recovery Form"
											: "Need a New Verification Link?"}
									</span>
								</button>

								{showResend && (
									<form
										onSubmit={handleResend}
										className="p-3 bg-[#F0F2F5]/70 border border-[#CED0D4]/70 rounded-xl space-y-2.5 text-left"
									>
										<label className="block text-[11px] font-bold text-[#65676B]">
											Enter Registered Email:
										</label>
										<div className="flex gap-2">
											<input
												type="email"
												required
												value={resendEmail}
												onChange={(e) =>
													setResendEmail(
														e.target.value,
													)
												}
												placeholder="you@example.com"
												className="flex-1 px-3 py-2 bg-white text-xs rounded-lg border border-[#CED0D4] focus:border-[#1877F2] focus:outline-none"
											/>
											<button
												type="submit"
												disabled={resendStatus.loading}
												className="px-3 py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center gap-1"
											>
												<Send className="w-3.5 h-3.5" />
												<span>Send</span>
											</button>
										</div>

										{resendStatus.success && (
											<p className="text-[11px] text-[#00A400] font-semibold flex items-center gap-1">
												<CheckCircle2 className="w-3.5 h-3.5" />{" "}
												{resendStatus.success}
											</p>
										)}
										{resendStatus.error && (
											<p className="text-[11px] text-[#FA383E] font-semibold flex items-center gap-1">
												<AlertCircle className="w-3.5 h-3.5" />{" "}
												{resendStatus.error}
											</p>
										)}
									</form>
								)}

								<Link
									to="/register"
									className="w-full py-2.5 bg-[#42B72A] hover:bg-[#36A420] text-white rounded-xl text-xs font-bold shadow-[0_2px_4px_rgba(66,183,42,0.25)] transition"
								>
									Register a New Account
								</Link>
							</div>
						</div>
					)}

					<div className="pt-4 border-t border-[#E4E6EB] flex items-center justify-center gap-2 text-[11px] text-[#65676B]">
						<ShieldCheck className="w-4 h-4 text-[#00A400]" />
						<span>256-Bit Cryptographic Email Verification</span>
					</div>
				</div>

				<div className="text-center text-xs text-[#65676B]">
					Need assistance?{" "}
					<Link
						to="/login"
						className="font-bold text-[#1877F2] hover:underline"
					>
						Return to Log In
					</Link>
				</div>
			</div>
		</div>
	);
}
