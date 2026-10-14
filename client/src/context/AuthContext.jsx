import { createContext, useContext, useState } from "react";

/* eslint-disable react-refresh/only-export-components */
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(() => {
		const saved = localStorage.getItem("user");
		return saved ? JSON.parse(saved) : null;
	});

	const saveAuth = (token, userData) => {
		localStorage.setItem("token", token);
		localStorage.setItem("user", JSON.stringify(userData));
		setUser(userData);
	};

	const logout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		setUser(null);
	};

	const updateUser = (updatedFields) => {
		setUser((prev) => {
			const updated = { ...prev, ...updatedFields };
			localStorage.setItem("user", JSON.stringify(updated));
			return updated;
		});
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				saveAuth,
				logout,
				updateUser,
				isAdmin: user?.role === "admin",
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);

