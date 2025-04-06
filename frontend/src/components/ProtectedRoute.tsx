import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

type ProtectedRouteProps = {
	children: React.ReactNode;
	allowedRoles?: string[];
	fallbackPath?: string;
};

/**
 * ProtectedRoute component that handles authentication and role-based access
 *
 * @param children - The components/routes to render if authenticated
 * @param allowedRoles - Optional array of roles allowed to access this route
 * @param fallbackPath - Optional path to redirect to if not authenticated (defaults to /login)
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
	children,
	allowedRoles,
	fallbackPath = "/login",
}) => {
	const { user, loading } = useAuth();
	const location = useLocation();

	useEffect(() => {
		// Log current authentication state (helpful for debugging)
		if (!loading) {
			console.log("Auth state in ProtectedRoute:", {
				isAuthenticated: !!user,
				userRole: user?.role,
				currentPath: location.pathname,
				allowedRoles,
			});
		}
	}, [user, loading, allowedRoles, location.pathname]);

	// Show loading state while checking authentication
	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<p>Loading...</p>
			</div>
		);
	}

	// If not authenticated, redirect to login
	if (!user) {
		return <Navigate to={fallbackPath} state={{ from: location }} replace />;
	}

	// If roles are specified, check if user has required role
	if (allowedRoles && allowedRoles.length > 0) {
		if (!allowedRoles.includes(user.role)) {
			// Redirect based on user role if not allowed
			const roleFallbackPaths = {
				hospital: "/cases",
				driver: "/dashboard",
				user: "/dashboard",
			};

			const redirectPath =
				roleFallbackPaths[user.role as keyof typeof roleFallbackPaths] ||
				"/dashboard";

			return <Navigate to={redirectPath} replace />;
		}
	}

	// User is authenticated and has required role, render children
	return <>{children}</>;
};

export default ProtectedRoute;
