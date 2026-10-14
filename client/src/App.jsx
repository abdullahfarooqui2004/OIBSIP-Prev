import {
	BrowserRouter,
	Routes,
	Route,
	Link,
	useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Customer Flow Pages[cite: 1, 2]
import Dashboard from "./pages/Dashboard";
import PizzaBuilder from "./pages/PizzaBuilder";
import OrderSummary from "./pages/OrderSummary";
import OrderTracking from "./pages/OrderTracking";
import OrderHistory from "./pages/OrderHistory";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgetPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Admin Portal Pages[cite: 1, 2]
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";

// Icons
import {
	Pizza,
	Sparkles,
	ShoppingBag,
	LayoutDashboard,
	LogOut,
	User as UserIcon,
	Shield,
} from "lucide-react";


function Navigation() {
	const { user, isAdmin, logout } = useAuth();
	const location = useLocation();

	const isCurrentPath = (path) => {
		if (
			path === "/" &&
			(location.pathname === "/" || location.pathname === "/dashboard")
		) {
			return true;
		}
		return location.pathname === path;
	};

	return (
		<header className="sticky top-0 z-50 bg-white border-b border-[#CED0D4]/70 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
			<nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
				{/* Left: Brand Logo (Facebook Blue Theme) */}
				<div className="flex items-center gap-6">
					<Link
						to="/"
						className="flex items-center gap-2 group transition active:scale-95"
					>
						<div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-xl shadow-[0_2px_4px_rgba(24,119,242,0.3)]">
							🍕
						</div>
						<span className="font-black text-xl tracking-tight text-[#050505]">
							Pizza<span className="text-[#1877F2]">Co.</span>
						</span>
					</Link>

					{/* Navigation Links (Desktop) */}
					<div className="hidden md:flex items-center gap-1.5 text-xs font-bold">
						<Link
							to="/dashboard"
							className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
								isCurrentPath("/")
									? "bg-[#E7F3FF] text-[#1877F2]"
									: "text-[#65676B] hover:bg-[#F0F2F5] hover:text-[#050505]"
							}`}
						>
							<Pizza className="w-4 h-4" />
							<span>Menu Catalog</span>
						</Link>

						<Link
							to="/builder"
							className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
								isCurrentPath("/builder")
									? "bg-[#E7F3FF] text-[#1877F2]"
									: "text-[#65676B] hover:bg-[#F0F2F5] hover:text-[#050505]"
							}`}
						>
							<Sparkles className="w-4 h-4" />
							<span>Pizza Studio</span>
						</Link>

						{user && (
							<Link
								to="/orders"
								className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
									isCurrentPath("/orders") ||
									isCurrentPath("/my-orders")
										? "bg-[#E7F3FF] text-[#1877F2]"
										: "text-[#65676B] hover:bg-[#F0F2F5] hover:text-[#050505]"
								}`}
							>
								<ShoppingBag className="w-4 h-4" />
								<span>Orders</span>
							</Link>
						)}

						{isAdmin && (
							<Link
								to="/admin/dashboard"
								className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
									isCurrentPath("/admin/dashboard")
										? "bg-[#FFEBE8] text-[#FA383E]"
										: "text-[#65676B] hover:bg-[#FFEBE8]/60 hover:text-[#FA383E]"
								}`}
							>
								<LayoutDashboard className="w-4 h-4" />
								<span>Admin Console</span>
							</Link>
						)}

					</div>
				</div>

				{/* Right: User Authentication / Profile Area */}
				<div className="flex items-center gap-2.5">
					{user ? (
						<div className="flex items-center gap-3">
							{/* User Avatar Badge */}
							<div className="flex items-center gap-2 bg-[#F0F2F5] hover:bg-[#E4E6EB]/70 py-1 px-2.5 rounded-full border border-[#CED0D4]/60 transition">
								<div className="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
									{user.name ? (
										user.name.charAt(0)
									) : (
										<UserIcon className="w-3.5 h-3.5" />
									)}
								</div>
								<div className="hidden sm:block text-left pr-1">
									<span className="block text-xs font-bold text-[#050505] leading-tight truncate max-w-[120px]">
										{user.name}
									</span>
									<span className="block text-[10px] text-[#65676B] capitalize leading-none">
										{user.role}
									</span>
								</div>
							</div>

							{/* Sign Out Button */}
							<button
								onClick={logout}
								className="p-2 text-[#65676B] hover:text-[#FA383E] hover:bg-[#FFEBE8] rounded-xl transition"
								title="Sign Out"
							>
								<LogOut className="w-4 h-4" />
							</button>
						</div>
					) : (
						<div className="flex items-center gap-2">
							<Link
								to="/login"
								className="px-3.5 py-2 text-xs font-bold text-[#1877F2] hover:bg-[#E7F3FF] rounded-xl transition"
							>
								Sign In
							</Link>

							<Link
								to="/register"
								className="px-4 py-2 bg-[#42B72A] hover:bg-[#36A420] text-white rounded-xl text-xs font-bold shadow-[0_2px_4px_rgba(66,183,42,0.25)] transition active:scale-95"
							>
								Sign Up
							</Link>

							<Link
								to="/admin/login"
								className="p-2 text-[#CED0D4] hover:text-[#65676B] transition"
								title="Admin Staff Area"
							>
								<Shield className="w-4 h-4" />
							</Link>
						</div>
					)}
				</div>
			</nav>
		</header>
	);
}

export default function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<div className="min-h-screen flex flex-col bg-[#F0F2F5] text-[#050505] font-sans antialiased">
					<Navigation />

					<main className="flex-1">
						<Routes>
							{/* Home & Ordering */}
							<Route path="/" element={<Dashboard />} />
							<Route path="/dashboard" element={<Dashboard />} />
							<Route path="/builder" element={<PizzaBuilder />} />
							<Route
								path="/order-summary"
								element={
									<ProtectedRoute>
										<OrderSummary />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/track/:orderId"
								element={
									<ProtectedRoute>
										<OrderTracking />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/order-tracking/:orderId"
								element={
									<ProtectedRoute>
										<OrderTracking />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/orders"
								element={
									<ProtectedRoute>
										<OrderHistory />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/my-orders"
								element={
									<ProtectedRoute>
										<OrderHistory />
									</ProtectedRoute>
								}
							/>


							{/* Customer Auth[cite: 1, 2] */}
							<Route path="/register" element={<Register />} />
							<Route
								path="/verify-email"
								element={<VerifyEmail />}
							/>
							<Route path="/login" element={<Login />} />
							<Route
								path="/forgot-password"
								element={<ForgotPassword />}
							/>
							<Route
								path="/reset-password"
								element={<ResetPassword />}
							/>

							{/* Admin Portal[cite: 1, 2] */}
							<Route
								path="/admin/login"
								element={<AdminLogin />}
							/>
							<Route
								path="/admin/dashboard"
								element={
									<AdminRoute>
										<AdminDashboard />
									</AdminRoute>
								}
							/>
						</Routes>
					</main>
				</div>
			</BrowserRouter>
		</AuthProvider>
	);
}
