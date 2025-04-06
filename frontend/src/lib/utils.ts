import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Gets the user's current location using browser's geolocation API
 * @returns Promise that resolves to coordinates or rejects with an error
 */
export const getCurrentLocation = (): Promise<{
	latitude: number;
	longitude: number;
}> => {
	return new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error("Geolocation is not supported by your browser"));
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				resolve({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				});
			},
			(error) => {
				reject(error);
			},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
		);
	});
};

// Utility to get address from coordinates using reverse geocoding
export const getAddressFromCoordinates = async (
	latitude: number,
	longitude: number
): Promise<string> => {
	try {
		const response = await fetch(
			`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
		);
		const data = await response.json();

		if (data && data.display_name) {
			return data.display_name;
		}
		return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
	} catch (error) {
		console.error("Error getting address:", error);
		return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
	}
};
