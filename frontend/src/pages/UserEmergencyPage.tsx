import React, { useState, useEffect } from "react";
import { emergencyAPI } from "@/lib/api";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import NearbyHospitals from "@/components/NearbyHospitals";
import SOSButton from "@/components/SOSButton";

interface EmergencyStatus {
	requestId: string;
	status: string;
	createdAt: string;
	hospital?: {
		id: string;
		name: string;
		address: string;
		phoneNumber: string;
	};
	driver?: {
		id: string;
		name: string;
		phoneNumber: string;
		status: string;
		estimatedArrival: string;
	};
}

interface EmergencyHistoryItem {
	requestId: string;
	status: string;
	hospital: string | null;
	createdAt: string;
	completedAt: string | null;
}

const UserEmergencyPage: React.FC = () => {
	const [activeEmergency, setActiveEmergency] =
		useState<EmergencyStatus | null>(null);
	const [emergencyHistory, setEmergencyHistory] = useState<
		EmergencyHistoryItem[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadActiveEmergency();
		loadEmergencyHistory();
	}, []);

	const loadActiveEmergency = async () => {
		setLoading(true);
		setError(null);

		try {
			// In a real app, we would have an API endpoint to get the user's active emergency
			// For now, we'll get the most recent emergency from history and check if it's active
			const historyResponse = await emergencyAPI.getEmergencyHistory(1, 5);

			if (historyResponse.data && historyResponse.data.success) {
				const requests = historyResponse.data.data?.requests || [];

				// Find the first active emergency (status is pending, accepted, or assigned)
				const active = requests.find((req: EmergencyHistoryItem) =>
					["pending", "accepted", "assigned"].includes(req.status)
				);

				if (active) {
					// Get detailed status of this emergency
					const statusResponse = await emergencyAPI.getEmergencyStatus(
						active.requestId
					);

					if (statusResponse.data && statusResponse.data.success) {
						setActiveEmergency(statusResponse.data.data || null);
					}
				}
			}
		} catch (err) {
			console.error("Error loading active emergency:", err);
			setError("Failed to load active emergency");
		} finally {
			setLoading(false);
		}
	};

	const loadEmergencyHistory = async () => {
		try {
			const response = await emergencyAPI.getEmergencyHistory();

			if (response.data && response.data.success) {
				setEmergencyHistory(response.data.data?.requests || []);
			}
		} catch (err) {
			console.error("Error loading emergency history:", err);
			// Don't set error state as this is not critical
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString();
	};

	const getStatusBadgeClass = (status: string) => {
		switch (status) {
			case "pending":
				return "bg-yellow-100 text-yellow-800";
			case "accepted":
				return "bg-blue-100 text-blue-800";
			case "assigned":
				return "bg-purple-100 text-purple-800";
			case "completed":
				return "bg-green-100 text-green-800";
			case "cancelled":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const handleEmergencyCreated = async (_: string) => {
		// Reload both active emergency and history after creating a new emergency
		await loadActiveEmergency();
		await loadEmergencyHistory();
	};

	if (loading) {
		return (
			<div className="container py-8">Loading emergency information...</div>
		);
	}

	if (error) {
		return (
			<div className="container py-8">
				<div className="text-red-500 mb-4">{error}</div>
				<Button onClick={loadActiveEmergency}>Retry</Button>
			</div>
		);
	}

	return (
		<div className="container py-8 space-y-8">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold">Emergency Services</h1>
				{!activeEmergency && (
					<SOSButton onSuccess={handleEmergencyCreated} className="mr-4" />
				)}
			</div>

			{activeEmergency ? (
				<>
					<Card>
						<CardHeader>
							<CardTitle>Active Emergency Request</CardTitle>
							<CardDescription>
								Your current emergency request status
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex justify-between">
									<div>
										<p className="text-sm font-medium">Request ID</p>
										<p className="text-sm">{activeEmergency.requestId}</p>
									</div>
									<div>
										<p className="text-sm font-medium">Status</p>
										<p className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium">
											<span
												className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
													activeEmergency.status
												)}`}
											>
												{activeEmergency.status.toUpperCase()}
											</span>
										</p>
									</div>
								</div>

								<div>
									<p className="text-sm font-medium">Created At</p>
									<p className="text-sm">
										{formatDate(activeEmergency.createdAt)}
									</p>
								</div>

								{activeEmergency.hospital && (
									<div>
										<p className="text-sm font-medium">Hospital</p>
										<div className="bg-blue-50 p-3 rounded-md">
											<p className="text-sm font-medium">
												{activeEmergency.hospital.name}
											</p>
											<p className="text-sm">
												{activeEmergency.hospital.address}
											</p>
											<p className="text-sm">
												Phone: {activeEmergency.hospital.phoneNumber}
											</p>
										</div>
									</div>
								)}

								{activeEmergency.driver && (
									<div>
										<p className="text-sm font-medium">Driver Information</p>
										<div className="bg-green-50 p-3 rounded-md">
											<p className="text-sm font-medium">
												{activeEmergency.driver.name}
											</p>
											<p className="text-sm">
												Phone: {activeEmergency.driver.phoneNumber}
											</p>
											<p className="text-sm">
												Status: {activeEmergency.driver.status}
											</p>
											<p className="text-sm">
												Estimated Arrival:{" "}
												{activeEmergency.driver.estimatedArrival}
											</p>
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Nearby Hospitals Component */}
					<NearbyHospitals
						emergencyId={activeEmergency.requestId}
						maxDistance={50}
						limit={10}
					/>
				</>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>No Active Emergency</CardTitle>
						<CardDescription>
							You don't have any active emergency requests
						</CardDescription>
					</CardHeader>
					<CardContent className="text-center">
						<div className="mb-6">
							<p className="mb-4">
								Need emergency medical assistance? Press the SOS button above to
								instantly send an emergency request with your current location.
							</p>
							<p className="text-sm text-muted-foreground">
								When you press SOS, we'll use your device's location to alert
								the nearest available hospitals.
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Emergency History */}
			{emergencyHistory.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Emergency History</CardTitle>
						<CardDescription>Your past emergency requests</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Hospital</TableHead>
									<TableHead>Created At</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{emergencyHistory.map((emergency) => (
									<TableRow key={emergency.requestId}>
										<TableCell>{emergency.requestId.slice(0, 8)}...</TableCell>
										<TableCell>
											<span
												className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
													emergency.status
												)}`}
											>
												{emergency.status.toUpperCase()}
											</span>
										</TableCell>
										<TableCell>{emergency.hospital || "N/A"}</TableCell>
										<TableCell>{formatDate(emergency.createdAt)}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
};

export default UserEmergencyPage;
