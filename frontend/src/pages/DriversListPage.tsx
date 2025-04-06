import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { driverAPI } from "@/lib/api";
import { Driver } from "@/lib/types";

const DriversListPage: React.FC = () => {
	const [drivers, setDrivers] = useState<Driver[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [approvingDriver, setApprovingDriver] = useState<string | null>(null);

	useEffect(() => {
		// No need to check authentication or role, already handled by ProtectedRoute
		loadDrivers();
	}, []);

	const loadDrivers = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await driverAPI.getDrivers();
			setDrivers(response.data.data || []);
		} catch (err) {
			setError("Failed to load drivers. Please try again.");
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const handleApproveDriver = async (driverId: string) => {
		setApprovingDriver(driverId);
		try {
			await driverAPI.approveDriver(driverId);
			// Refresh the list after approval
			await loadDrivers();
		} catch (err) {
			setError("Failed to approve driver. Please try again.");
			console.error(err);
		} finally {
			setApprovingDriver(null);
		}
	};

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<p>Loading...</p>
			</div>
		);
	}

	return (
		<div className="container py-10">
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Drivers List</CardTitle>
					<CardDescription>View and manage drivers</CardDescription>
				</CardHeader>
				<CardContent>
					{error && (
						<div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md">
							<p className="text-sm text-destructive">{error}</p>
						</div>
					)}

					<Button onClick={loadDrivers} className="mb-4" variant="outline">
						Refresh
					</Button>

					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Phone</TableHead>
									<TableHead>License</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Availability</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{drivers.length === 0 ? (
									<TableRow>
										<TableCell colSpan={7} className="text-center">
											No drivers found
										</TableCell>
									</TableRow>
								) : (
									drivers.map((driver) => (
										<TableRow key={driver.id}>
											<TableCell className="font-medium">
												{driver.name}
											</TableCell>
											<TableCell>{driver.email}</TableCell>
											<TableCell>{driver.phoneNumber}</TableCell>
											<TableCell>{driver.licenseNumber}</TableCell>
											<TableCell>
												<span
													className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
														driver.isApproved
															? "bg-green-100 text-green-800"
															: "bg-yellow-100 text-yellow-800"
													}`}
												>
													{driver.isApproved ? "Approved" : "Pending Approval"}
												</span>
											</TableCell>
											<TableCell>
												<span
													className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
														driver.isAvailable
															? "bg-green-100 text-green-800"
															: "bg-gray-100 text-gray-800"
													}`}
												>
													{driver.isAvailable ? "Available" : "Unavailable"}
												</span>
											</TableCell>
											<TableCell>
												{!driver.isApproved && (
													<Button
														onClick={() => handleApproveDriver(driver.id)}
														disabled={approvingDriver === driver.id}
														size="sm"
														variant="outline"
													>
														{approvingDriver === driver.id
															? "Approving..."
															: "Approve"}
													</Button>
												)}
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default DriversListPage;
