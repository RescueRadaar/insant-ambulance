import React, { useEffect, useState } from "react";
import { toast } from "sonner";
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

const DriverApprovalPage: React.FC = () => {
	const [pendingDrivers, setPendingDrivers] = useState<Driver[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [approvingDriver, setApprovingDriver] = useState<string | null>(null);

	useEffect(() => {
		loadPendingDrivers();
	}, []);

	const loadPendingDrivers = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await driverAPI.getDrivers();

			if (response.data && response.data.success) {
				// Filter to only show pending drivers
				const allDrivers = response.data.data.drivers || [];
				const pending = allDrivers.filter(
					(driver: Driver) => !driver.isApproved
				);
				setPendingDrivers(pending);

				// Show toast if no pending drivers
				if (pending.length === 0) {
					toast.info("No pending driver applications found");
				}
			} else {
				setPendingDrivers([]);
				setError("Failed to load drivers. Unexpected response format.");
			}
		} catch (err) {
			console.error("Error loading drivers:", err);
			setError("Failed to load drivers. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleApproveDriver = async (driverId: string) => {
		setApprovingDriver(driverId);
		try {
			const response = await driverAPI.approveDriver(driverId);

			if (response.data && response.data.success) {
				// Remove the approved driver from the list
				setPendingDrivers((prev) =>
					prev.filter((driver) => driver.id !== driverId)
				);

				// Show success toast with driver name
				const driverName = response.data.data.name;
				toast.success(`Driver ${driverName} has been approved successfully`);
			} else {
				setError("Failed to approve driver. Unexpected response format.");
			}
		} catch (err) {
			console.error("Error approving driver:", err);
			setError("Failed to approve driver. Please try again.");
			toast.error("Failed to approve driver");
		} finally {
			setApprovingDriver(null);
		}
	};

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<p>Loading pending driver applications...</p>
			</div>
		);
	}

	return (
		<div className="container py-10">
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Driver Approval Requests</CardTitle>
					<CardDescription>
						Review and approve new driver applications
					</CardDescription>
				</CardHeader>
				<CardContent>
					{error && (
						<div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md">
							<p className="text-sm text-destructive">{error}</p>
						</div>
					)}

					<div className="flex justify-between mb-4">
						<Button onClick={loadPendingDrivers} variant="outline">
							Refresh List
						</Button>

						<div className="text-sm text-muted-foreground">
							{pendingDrivers.length} pending{" "}
							{pendingDrivers.length === 1 ? "application" : "applications"}
						</div>
					</div>

					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Contact Information</TableHead>
									<TableHead>License</TableHead>
									<TableHead>Application Date</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pendingDrivers.length === 0 ? (
									<TableRow>
										<TableCell colSpan={5} className="text-center py-10">
											<div className="flex flex-col items-center gap-2">
												<p className="text-muted-foreground">
													No pending driver applications
												</p>
												<Button
													variant="outline"
													size="sm"
													onClick={loadPendingDrivers}
												>
													Check Again
												</Button>
											</div>
										</TableCell>
									</TableRow>
								) : (
									pendingDrivers.map((driver) => (
										<TableRow key={driver.id}>
											<TableCell className="font-medium">
												{driver.name}
											</TableCell>
											<TableCell>
												<div className="flex flex-col">
													<span>{driver.email}</span>
													<span className="text-sm text-muted-foreground">
														{driver.phoneNumber}
													</span>
												</div>
											</TableCell>
											<TableCell>{driver.licenseNumber}</TableCell>
											<TableCell>
												{driver.createdAt
													? new Date(driver.createdAt).toLocaleDateString(
															"en-US",
															{
																year: "numeric",
																month: "short",
																day: "numeric",
															}
													  )
													: "N/A"}
											</TableCell>
											<TableCell>
												<div className="flex gap-2">
													<Button
														onClick={() => handleApproveDriver(driver.id)}
														disabled={approvingDriver === driver.id}
														size="sm"
													>
														{approvingDriver === driver.id
															? "Approving..."
															: "Approve Driver"}
													</Button>
												</div>
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

export default DriverApprovalPage;
