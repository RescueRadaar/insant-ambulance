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

interface NearbyHospital {
	id: string;
	name: string;
	address: string;
	distance: string;
	currentLoad: string;
	availability: string;
}

interface NearbyHospitalsProps {
	emergencyId: string;
	maxDistance?: number;
	limit?: number;
}

const NearbyHospitals: React.FC<NearbyHospitalsProps> = ({
	emergencyId,
	maxDistance = 50,
	limit = 10,
}) => {
	const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadHospitals();
	}, [emergencyId, maxDistance, limit]);

	const loadHospitals = async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await emergencyAPI.getNearbyHospitals(
				emergencyId,
				maxDistance,
				limit
			);

			if (response.data && response.data.success) {
				setHospitals(response.data.data.hospitals || []);
			} else {
				setError("Failed to load nearby hospitals");
			}
		} catch (err) {
			console.error("Error loading nearby hospitals:", err);
			setError("Failed to load nearby hospitals");
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return <div className="p-4 text-center">Loading nearby hospitals...</div>;
	}

	if (error) {
		return (
			<div className="p-4 text-center text-red-500">
				{error}
				<Button onClick={loadHospitals} className="ml-2" size="sm">
					Retry
				</Button>
			</div>
		);
	}

	if (hospitals.length === 0) {
		return (
			<div className="p-4 text-center">
				No hospitals found within {maxDistance} km
			</div>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Nearby Hospitals</CardTitle>
				<CardDescription>
					Hospitals within {maxDistance} km of your location
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Hospital</TableHead>
							<TableHead>Distance</TableHead>
							<TableHead>Current Load</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{hospitals.map((hospital) => (
							<TableRow key={hospital.id}>
								<TableCell>
									<div>
										<div className="font-medium">{hospital.name}</div>
										<div className="text-sm text-muted-foreground">
											{hospital.address}
										</div>
									</div>
								</TableCell>
								<TableCell>{hospital.distance}</TableCell>
								<TableCell>{hospital.currentLoad}</TableCell>
								<TableCell>
									<span
										className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
											hospital.availability === "Available"
												? "bg-green-100 text-green-800"
												: "bg-red-100 text-red-800"
										}`}
									>
										{hospital.availability}
									</span>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
};

export default NearbyHospitals;
