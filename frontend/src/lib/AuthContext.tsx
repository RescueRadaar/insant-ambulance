import React, { createContext, useContext, useState, useEffect } from "react";
import { User, LoginCredentials } from "./types";
import { authAPI } from "./api";

interface AuthContextType {
	user: User | null;
	loading: boolean;
	error: string | null;
	login: (credentials: LoginCredentials) => Promise<void>;
	logout: () => void;
	clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	loading: false,
	error: null,
	login: async () => {},
	logout: () => {},
	clearError: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Check if user is logged in on mount
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			try {
				const parsedUser = JSON.parse(storedUser);
				// Ensure role is set (backwards compatibility)
				if (parsedUser.userType && !parsedUser.role) {
					parsedUser.role = parsedUser.userType;
				}
				setUser(parsedUser);
			} catch (err) {
				console.error("Error parsing user from localStorage", err);
				localStorage.removeItem("user");
				localStorage.removeItem("token");
			}
		}
		setLoading(false);
	}, []);

	const login = async (credentials: LoginCredentials) => {
		setLoading(true);
		setError(null);
		try {
			const response = await authAPI.login(credentials);
			const { data } = response;

			// Check if we have a success response with token and user
			if (data.success && data.data?.token && data.data?.id) {
				// Transform the data to match the expected User interface
				const userData = {
					...data.data,
					// Ensure role is set for compatibility with components expecting role
					role: data.data.userType,
				};

				// For hospital users, ensure firstName is available or set defaults
				if (userData.role === "hospital") {
					if (!userData.firstName) {
						userData.firstName = userData.name || "Hospital";
					}
					if (!userData.lastName) {
						userData.lastName = "Admin";
					}
				}

				localStorage.setItem("token", data.data.token);
				localStorage.setItem("user", JSON.stringify(userData));
				setUser(userData);
				return;
			}

			// If we get a response but it's not formatted as expected
			setError("Invalid response from server. Please try again.");
		} catch (err: unknown) {
			let errorMessage = "Failed to login. Please try again.";

			// Handle specific status codes
			const error = err as {
				response?: {
					status?: number;
					data?: {
						error?: { message?: string };
						message?: string;
					};
				};
			};

			if (error?.response?.status === 401) {
				errorMessage = "Invalid email or password. Please try again.";
			} else if (error?.response?.status === 404) {
				errorMessage = "User not found. Please check your credentials.";
			} else if (error?.response?.data?.error?.message) {
				// Get the error message from the API response
				errorMessage = error.response.data.error.message;
			} else if (error?.response?.data?.message) {
				errorMessage = error.response.data.message;
			}

			setError(errorMessage);
			console.error("Login error:", err);
		} finally {
			setLoading(false);
		}
	};

	const logout = () => {
		authAPI.logout();
		setUser(null);
	};

	const clearError = () => {
		setError(null);
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				error,
				login,
				logout,
				clearError,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};
