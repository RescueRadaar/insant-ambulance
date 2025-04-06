import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Home, Ambulance, UserCheck } from "lucide-react";

const Header: React.FC = () => {
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	const getUserDisplayName = () => {
		if (!user) return "";

		if (user.role === "hospital") {
			return user.name || "Hospital";
		} else {
			return `${user.firstName || ""} ${user.lastName || ""}`.trim();
		}
	};

	const getRoleDisplay = () => {
		if (!user) return "";

		if (user.role === "hospital") return "Hospital";
		if (user.role === "driver") return "Driver";
		return "Patient";
	};

	return (
		<header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 py-3 px-4 sm:px-6 md:px-8 shadow-sm">
			<div className="max-w-7xl mx-auto flex justify-between items-center">
				<div className="flex items-center">
					<h1
						className="text-xl font-bold text-gray-900 cursor-pointer"
						onClick={() => navigate("/dashboard")}
					>
						Instant Ambulance
					</h1>
				</div>

				{user && (
					<>
						{/* Navigation Links - Only for hospital users */}
						{user.role === "hospital" && (
							<nav className="hidden md:flex space-x-6 ml-10">
								<Link
									to="/cases"
									className="flex items-center text-sm font-medium text-gray-700 hover:text-primary"
								>
									<Ambulance className="h-4 w-4 mr-2" />
									Emergency Cases
								</Link>
								<Link
									to="/driver-approvals"
									className="flex items-center text-sm font-medium text-gray-700 hover:text-primary"
								>
									<UserCheck className="h-4 w-4 mr-2" />
									Driver Approvals
								</Link>
							</nav>
						)}

						<div className="flex items-center gap-4">
							<div className="hidden md:flex flex-col items-end text-sm">
								<span className="font-medium">{getUserDisplayName()}</span>
								<span className="text-gray-500 text-xs">
									{getRoleDisplay()}
								</span>
							</div>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon" className="rounded-full">
										<User className="h-5 w-5" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem className="text-sm font-medium md:hidden">
										{getUserDisplayName()} ({getRoleDisplay()})
									</DropdownMenuItem>

									{/* Mobile Navigation Menu Items for hospital users */}
									{user.role === "hospital" && (
										<>
											<DropdownMenuItem onClick={() => navigate("/cases")}>
												Emergency Cases
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => navigate("/driver-approvals")}
											>
												Driver Approvals
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => navigate("/drivers")}>
												Manage Drivers
											</DropdownMenuItem>
										</>
									)}

									<DropdownMenuItem onClick={handleLogout}>
										Logout
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</>
				)}
			</div>
		</header>
	);
};

export default Header;
