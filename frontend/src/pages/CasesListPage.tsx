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
import { emergencyAPI, driverAPI } from "@/lib/api";
import { EmergencyRequest, Driver } from "@/lib/types";

const CasesListPage: React.FC = () => {
	const [pendingEmergencies, setPendingEmergencies] = useState<
		EmergencyRequest[]
	>([]);
	const [activeEmergencies, setActiveEmergencies] = useState<
		EmergencyRequest[]
	>([]);
	const [drivers, setDrivers] = useState<Driver[]>([]);
	const [selectedDrivers, setSelectedDrivers] = useState<
		Record<string, string>
	>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [assigningEmergency, setAssigningEmergency] = useState<string | null>(
		null
	);
	const [acceptingEmergency, setAcceptingEmergency] = useState<string | null>(
		null
	);
	const [rejectingEmergency, setRejectingEmergency] = useState<string | null>(
		null
	);

	useEffect(() => {
		// No need to check authentication or role, already handled by ProtectedRoute
		loadData();
	}, []);

	const loadData = async () => {
		setLoading(true);
		setError(null);
		try {
			console.log("Fetching data for CasesListPage...");

			// Fetch pending emergencies
			try {
				const pendingRes = await emergencyAPI.getEmergencies();
				console.log("Pending emergencies response:", pendingRes);

				if (pendingRes.data && pendingRes.data.success) {
					// Check if data is in the expected format
					const pendingData = pendingRes.data.data?.requests || [];
					console.log("Setting pending emergencies:", pendingData);
					setPendingEmergencies(pendingData);
				} else {
					console.warn(
						"Unexpected pending emergencies response structure:",
						pendingRes
					);
					setPendingEmergencies([]);
				}
			} catch (pendingErr) {
				console.error("Error fetching pending emergencies:", pendingErr);
				setPendingEmergencies([]);
			}

			// Fetch active emergencies
			try {
				const activeRes = await emergencyAPI.getActiveEmergencies();
				console.log("Active emergencies response:", activeRes);

				if (activeRes.data && activeRes.data.success) {
					// Check if data is in the expected format
					const activeData = activeRes.data.data?.requests || [];
					console.log("Setting active emergencies:", activeData);
					setActiveEmergencies(activeData);
				} else {
					console.warn(
						"Unexpected active emergencies response structure:",
						activeRes
					);
					setActiveEmergencies([]);
				}
			} catch (activeErr) {
				console.error("Error fetching active emergencies:", activeErr);
				setActiveEmergencies([]);
			}

			// Fetch drivers
			try {
				const driversRes = await driverAPI.getDrivers();
				console.log("Drivers response:", driversRes);

				if (driversRes.data && driversRes.data.success) {
					// Check if data is in the expected format
					const driverData = driversRes.data.data?.drivers || [];
					console.log("Setting drivers:", driverData);
					setDrivers(driverData);
				} else {
					console.warn("Unexpected drivers response structure:", driversRes);
					setDrivers([]);
				}
			} catch (driverErr) {
				console.error("Error fetching drivers:", driverErr);
				setDrivers([]);
			}
		} catch (err) {
			console.error("Error in loadData:", err);
			setError("Failed to load data. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleDriverSelect = (emergencyId: string, driverId: string) => {
		setSelectedDrivers((prev) => ({
			...prev,
			[emergencyId]: driverId,
		}));
	};

	const handleAcceptEmergency = async (requestId: string) => {
		setAcceptingEmergency(requestId);
		try {
			const response = await fetch(
				`http://localhost:5001/api/v1/hospital/emergency/${requestId}/accept`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
						"Content-Type": "application/json",
					},
				}
			);

			if (response.ok) {
				await loadData(); // Refresh the data after accepting
			} else {
				const errorData = await response.json();
				setError(errorData.message || "Failed to accept emergency");
			}
		} catch (err) {
			console.error("Error accepting emergency:", err);
			setError("Failed to accept emergency. Please try again.");
		} finally {
			setAcceptingEmergency(null);
		}
	};

	const handleRejectEmergency = async (requestId: string) => {
		setRejectingEmergency(requestId);
		try {
			// In a real application, this would call the API
			// await emergencyAPI.rejectEmergency(requestId);

			// For demo purposes, we'll just simulate a successful rejection
			// by removing the emergency from the pending list
			setPendingEmergencies((prev) =>
				prev.filter((emergency) => emergency.requestId !== requestId)
			);

			// Show success message using toast
			toast.success("Emergency request rejected");
		} catch (err) {
			console.error("Error rejecting emergency:", err);
			setError("Failed to reject emergency. Please try again.");
		} finally {
			setRejectingEmergency(null);
		}
	};

	const handleAssignDriver = async (requestId: string) => {
		const driverId = selectedDrivers[requestId];
		if (!driverId) return;

		setAssigningEmergency(requestId);
		try {
			await emergencyAPI.assignDriver(requestId, driverId);
			// Refresh the data
			await loadData();
		} catch (err) {
			let errorMessage = "Failed to assign driver. Please try again.";
			if (err && typeof err === "object" && "response" in err) {
				const apiError = err as { response?: { data?: { message?: string } } };
				if (apiError.response?.data?.message) {
					errorMessage = apiError.response.data.message;
				}
			}
			setError(errorMessage);
		} finally {
			setAssigningEmergency(null);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString();
	};

	const getAvailableDrivers = () => {
		return drivers.filter((driver) => driver.isApproved && driver.isAvailable);
	};

	const getPickupAddress = (emergency: EmergencyRequest) => {
		if (emergency.pickupAddress) {
			return emergency.pickupAddress;
		} else if (emergency.pickupLocation?.address) {
			return emergency.pickupLocation.address;
		}
		return "N/A";
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
			<Card className="w-full mb-8">
				<CardHeader>
					<CardTitle>Pending Emergency Requests</CardTitle>
					<CardDescription>
						Emergency requests waiting for hospital acceptance
					</CardDescription>
				</CardHeader>
				<CardContent>
					{error && (
						<div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md">
							<p className="text-sm text-destructive">{error}</p>
						</div>
					)}

					<Button onClick={loadData} className="mb-4" variant="outline">
						Refresh
					</Button>

					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID</TableHead>
									<TableHead>Patient</TableHead>
									<TableHead>Pickup Address</TableHead>
									<TableHead>Medical Notes</TableHead>
									<TableHead>Created At</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pendingEmergencies.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="text-center">
											No pending emergency requests
										</TableCell>
									</TableRow>
								) : (
									pendingEmergencies.map((emergency) => (
										<TableRow key={emergency.requestId}>
											<TableCell className="font-medium">
												{emergency.requestId.slice(0, 8)}...
											</TableCell>
											<TableCell>{emergency.user?.name || "Unknown"}</TableCell>
											<TableCell>{getPickupAddress(emergency)}</TableCell>
											<TableCell>{emergency.medicalNotes || "None"}</TableCell>
											<TableCell>{formatDate(emergency.createdAt)}</TableCell>
											<TableCell>
												<div className="flex gap-2">
													<Button
														onClick={() =>
															handleAcceptEmergency(emergency.requestId)
														}
														disabled={
															acceptingEmergency === emergency.requestId ||
															rejectingEmergency === emergency.requestId
														}
														size="sm"
														variant="default"
													>
														{acceptingEmergency === emergency.requestId
															? "Accepting..."
															: "Accept"}
													</Button>
													<Button
														onClick={() =>
															handleRejectEmergency(emergency.requestId)
														}
														disabled={
															acceptingEmergency === emergency.requestId ||
															rejectingEmergency === emergency.requestId
														}
														size="sm"
														variant="destructive"
													>
														{rejectingEmergency === emergency.requestId
															? "Rejecting..."
															: "Reject"}
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

			<Card className="w-full">
				<CardHeader>
					<CardTitle>Active Emergency Cases</CardTitle>
					<CardDescription>
						Accepted emergencies that need to be assigned to drivers
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID</TableHead>
									<TableHead>Patient</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Created At</TableHead>
									<TableHead>Patient Support</TableHead>
									<TableHead>Assign Driver</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{activeEmergencies.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="text-center">
											No active emergency cases
										</TableCell>
									</TableRow>
								) : (
									activeEmergencies.map((emergency) => (
										<TableRow key={emergency.requestId}>
											<TableCell className="font-medium">
												{emergency.requestId.slice(0, 8)}...
											</TableCell>
											<TableCell>{emergency.user?.name || "Unknown"}</TableCell>
											<TableCell>
												<span
													className={
														emergency.status === "accepted"
															? "text-yellow-600"
															: emergency.status === "assigned"
															? "text-blue-600"
															: emergency.status === "completed"
															? "text-green-600"
															: "text-gray-600"
													}
												>
													{emergency.status}
												</span>
											</TableCell>
											<TableCell>{formatDate(emergency.createdAt)}</TableCell>
											<TableCell>
												<Button
													onClick={() =>
														window.open(
															"https://www.chatbase.co/chatbot-iframe/SHU2betdinKO3Ht34-Q3v",
															"_blank"
														)
													}
													size="sm"
													variant="outline"
													className="flex items-center gap-1"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="16"
														height="16"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
														className="lucide lucide-message-square"
													>
														<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
													</svg>
													Chat
												</Button>
											</TableCell>
											<TableCell>
												{emergency.status === "accepted" ? (
													<div className="flex flex-col gap-2">
														<select
															className="p-2 border rounded"
															value={selectedDrivers[emergency.requestId] || ""}
															onChange={(e) =>
																handleDriverSelect(
																	emergency.requestId,
																	e.target.value
																)
															}
															disabled={
																assigningEmergency === emergency.requestId
															}
														>
															<option value="">Select a driver</option>
															{getAvailableDrivers().map((driver) => (
																<option key={driver.id} value={driver.id}>
																	{driver.name}
																</option>
															))}
														</select>
														<Button
															onClick={() =>
																handleAssignDriver(emergency.requestId)
															}
															disabled={
																!selectedDrivers[emergency.requestId] ||
																assigningEmergency === emergency.requestId
															}
															size="sm"
														>
															{assigningEmergency === emergency.requestId
																? "Assigning..."
																: "Assign"}
														</Button>
													</div>
												) : (
													<span className="text-sm text-muted-foreground">
														{emergency.driver
															? `Assigned to ${emergency.driver.name}`
															: "Already assigned"}
													</span>
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

export default CasesListPage;
