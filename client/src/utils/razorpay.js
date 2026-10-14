import api from "../api/client";

// Utility to dynamically load Razorpay checkout script
export const loadRazorpayScript = () => {
	return new Promise((resolve) => {
		if (window.Razorpay) {
			resolve(true);
			return;
		}
		const script = document.createElement("script");
		script.src = "https://checkout.razorpay.com/v1/checkout.js";
		script.onload = () => resolve(true);
		script.onerror = () => resolve(false);
		document.body.appendChild(script);
	});
};

// Checkout handler called on "Pay Now"
export const handleCheckout = async ({
	items,
	deliveryInfo,
	couponCode,
	user,
	onSuccess,
	onError,
}) => {
	const isLoaded = await loadRazorpayScript();
	if (!isLoaded) {
		const msg = "Razorpay SDK failed to load. Please verify your internet connection.";
		if (onError) onError(msg);
		else alert(msg);
		return;
	}

	try {
		// 1. Create order on backend with server-side validation
		const { data } = await api.post("/orders/create-razorpay-order", {
			items,
			deliveryInfo,
			couponCode,
		});

		// 2. Open Razorpay Modal in Test Mode
		const options = {
			key: data.keyId,
			amount: data.amount,
			currency: data.currency,
			name: "Pizza Co.",
			description: "Artisan Pizza Order Checkout",
			order_id: data.razorpayOrderId,
			handler: async function (response) {
				try {
					// 3. User clicked "Success" in test mode -> Verify on backend
					const verifyRes = await api.post("/orders/verify-payment", {
						razorpay_order_id: response.razorpay_order_id,
						razorpay_payment_id: response.razorpay_payment_id,
						razorpay_signature: response.razorpay_signature,
						dbOrderId: data.orderId,
					});

					if (verifyRes.data.success) {
						localStorage.removeItem("cart_pizza");
						if (onSuccess) {
							onSuccess(data.orderId);
						} else {
							window.location.href = `/track/${data.orderId}`;
						}
					}
				} catch (err) {
					const msg =
						err.response?.data?.message ||
						"Payment verification failed on the server.";
					if (onError) onError(msg);
					else alert(msg);
				}
			},
			prefill: {
				name: deliveryInfo?.fullName || user?.name || "Customer",
				email: user?.email || "customer@example.com",
				contact: deliveryInfo?.phone || "9999999999",
			},
			theme: {
				color: "#1877F2", // Facebook Blue
			},
		};

		const paymentObject = new window.Razorpay(options);
		paymentObject.open();
	} catch (err) {
		const msg =
			err.response?.data?.message ||
			"Error creating payment order. Please try again.";
		if (onError) onError(msg);
		else alert(msg);
	}
};
