import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { emergencyAPI } from "@/lib/api";
import { toast } from "sonner";
import { getCurrentLocation, getAddressFromCoordinates } from "@/lib/utils";

interface SOSButtonProps {
	onSuccess?: (emergencyId: string) => void;
	className?: string;
}

const SOSButton: React.FC<SOSButtonProps> = ({ onSuccess, className = "" }) => {
	const [loading, setLoading] = useState(false);

	const createEmergencyRequest = async () => {
		setLoading(true);

		try {
			// Get user's current location
			const location = await getCurrentLocation();

			// Get address based on coordinates
			const address = await getAddressFromCoordinates(
				location.latitude,
				location.longitude
			);

			// Create emergency request with current location
			const response = await emergencyAPI.createEmergency({
				pickupLatitude: location.latitude,
				pickupLongitude: location.longitude,
				pickupAddress: address,
				medicalNotes: "Emergency SOS request - Immediate assistance needed",
			});

			if (response.data && response.data.success) {
				toast.success("Emergency request created successfully");

				if (onSuccess && response.data.data && response.data.data.requestId) {
					onSuccess(response.data.data.requestId);
				}
			} else {
				throw new Error(
					response.data?.error?.message || "Failed to create emergency request"
				);
			}
		} catch (error) {
			console.error("Error creating emergency request:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to create emergency request"
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={`relative ${className}`}>
			{/* Pulsing background layers */}
			<div className="absolute inset-0 rounded-full animate-ping bg-red-500 opacity-25"></div>
			<div className="absolute inset-0 rounded-full animate-pulse bg-red-600 opacity-30"></div>

			{/* Main SOS button */}
			<Button
				variant="destructive"
				size="lg"
				disabled={loading}
				onClick={createEmergencyRequest}
				className="relative z-10 h-20 w-20 rounded-full text-xl font-bold shadow-lg hover:bg-red-700 transition-all"
			>
				{loading ? <Loader2 className="h-10 w-10 animate-spin" /> : "SOS"}
			</Button>
		</div>
	);
};

export default SOSButton;
