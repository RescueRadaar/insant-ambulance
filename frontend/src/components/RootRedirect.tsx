import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

const RootRedirect: React.FC = () => {
	const { user, loading } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (loading) return;

		if (!user) {
			// Not logged in, redirect to login
			navigate("/login");
		} else if (user.role === "hospital") {
			// Hospital user, redirect to cases
			navigate("/cases");
		} else {
			// Other user types (user, driver), redirect to dashboard
			navigate("/dashboard");
		}
	}, [user, loading, navigate]);

	// Show loading indicator while checking auth state
	return (
		<div className="flex h-screen items-center justify-center">
			<p>Loading...</p>
		</div>
	);
};

export default RootRedirect;
