import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const DashboardPage: React.FC = () => {
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		// Only handle role-based navigation
		// No need to check if user exists, that's handled by ProtectedRoute

		// Only redirect hospital users if they're actually on the dashboard page
		// This prevents redirection loops when they're already on other pages
		if (
			window.location.pathname === "/dashboard" &&
			user?.role === "hospital"
		) {
			navigate("/cases");
		}
	}, [user, navigate]);

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	// No need for loading check since ProtectedRoute handles it
	return (
		<div className="container py-10">
			<Card className="w-full max-w-md mx-auto">
				<CardHeader>
					<CardTitle>Welcome, {user?.firstName}!</CardTitle>
					<CardDescription>You are logged in as {user?.role}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{user?.role === "hospital" && (
							<>
								<Button className="w-full" onClick={() => navigate("/cases")}>
									View Emergency Cases
								</Button>
								<Button className="w-full" onClick={() => navigate("/drivers")}>
									Manage Drivers
								</Button>
								<Button
									className="w-full"
									onClick={() => navigate("/driver-approvals")}
									variant="outline"
								>
									Driver Approval Requests
								</Button>
							</>
						)}

						{user?.role === "driver" && (
							<p className="text-center text-muted-foreground">
								Driver dashboard features coming soon.
							</p>
						)}

						{user?.role === "user" && (
							<>
								<Button
									className="w-full"
									onClick={() => navigate("/emergency")}
								>
									Emergency Services
								</Button>
								<p className="text-center text-muted-foreground">
									Access emergency ambulance services
								</p>
							</>
						)}
					</div>
				</CardContent>
				<CardFooter>
					<Button variant="outline" className="w-full" onClick={handleLogout}>
						Logout
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
};

export default DashboardPage;
