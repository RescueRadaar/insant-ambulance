import React from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "@/lib/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import RootRedirect from "@/components/RootRedirect";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import HospitalRegisterPage from "@/pages/HospitalRegisterPage";
import DriverRegisterPage from "@/pages/DriverRegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import CasesListPage from "@/pages/CasesListPage";
import DriversListPage from "@/pages/DriversListPage";
import DriverApprovalPage from "@/pages/DriverApprovalPage";
import UserEmergencyPage from "@/pages/UserEmergencyPage";

function App() {
	return (
		<AuthProvider>
			<Router>
				<Routes>
					{/* Public routes */}
					<Route path="/" element={<RootRedirect />} />
					<Route path="/login" element={<LoginPage />} />
					<Route path="/register" element={<RegisterPage />} />
					<Route path="/register/hospital" element={<HospitalRegisterPage />} />
					<Route path="/register/driver" element={<DriverRegisterPage />} />

					{/* Protected routes */}
					<Route
						path="/dashboard"
						element={
							<ProtectedRoute>
								<Layout>
									<DashboardPage />
								</Layout>
							</ProtectedRoute>
						}
					/>

					{/* Hospital-specific routes */}
					<Route
						path="/cases"
						element={
							<ProtectedRoute allowedRoles={["hospital"]}>
								<Layout>
									<CasesListPage />
								</Layout>
							</ProtectedRoute>
						}
					/>
					<Route
						path="/drivers"
						element={
							<ProtectedRoute allowedRoles={["hospital"]}>
								<Layout>
									<DriversListPage />
								</Layout>
							</ProtectedRoute>
						}
					/>
					<Route
						path="/driver-approvals"
						element={
							<ProtectedRoute allowedRoles={["hospital"]}>
								<Layout>
									<DriverApprovalPage />
								</Layout>
							</ProtectedRoute>
						}
					/>

					{/* User-specific routes */}
					<Route
						path="/emergency"
						element={
							<ProtectedRoute allowedRoles={["user"]}>
								<Layout>
									<UserEmergencyPage />
								</Layout>
							</ProtectedRoute>
						}
					/>

					{/* Redirect to login for any undefined routes */}
					<Route path="*" element={<Navigate to="/login" replace />} />
				</Routes>
				<Toaster position="top-right" />
			</Router>
		</AuthProvider>
	);
}

export default App;
