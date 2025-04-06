import axios from "axios";
import {
	UserRegistration,
	LoginCredentials,
	EmergencyCreation,
	HospitalRegistration,
	DriverRegistration,
} from "./types";

// Create an axios instance with default config
const api = axios.create({
	baseURL: "http://localhost:5001/api/v1", // Update this to match your backend URL
	headers: {
		"Content-Type": "application/json",
	},
});

// Add a request interceptor for authentication
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Auth API
export const authAPI = {
	register: async (userData: UserRegistration) => {
		return api.post("/auth/register/user", userData);
	},
	registerHospital: async (hospitalData: HospitalRegistration) => {
		return api.post("/auth/register/hospital", hospitalData);
	},
	registerDriver: async (driverData: DriverRegistration) => {
		return api.post("/auth/register/driver", driverData);
	},
	login: async (credentials: LoginCredentials) => {
		// Ensure userType is included for the login request
		if (!credentials.userType) {
			credentials = { ...credentials, userType: "user" };
		}
		return api.post("/auth/login", credentials);
	},
	logout: () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
	},
};

// Emergency API
export const emergencyAPI = {
	createEmergency: async (emergencyData: EmergencyCreation) => {
		return api.post("/user/emergency", emergencyData);
	},
	getEmergencies: async () => {
		console.log(
			"Calling getEmergencies with endpoint: /hospital/emergency/pending"
		);
		return api.get("/hospital/emergency/pending");
	},
	getActiveEmergencies: async () => {
		console.log(
			"Calling getActiveEmergencies with endpoint: /hospital/emergency/active"
		);
		return api.get("/hospital/emergency/active");
	},
	assignDriver: async (emergencyId: string, driverId: string) => {
		return api.post(`/hospital/emergency/${emergencyId}/assign`, { driverId });
	},
	rejectEmergency: async (emergencyId: string) => {
		// Since we don't have a backend endpoint yet, we'll simulate rejection
		// In a real app, this would call something like:
		// return api.post(`/hospital/emergency/${emergencyId}/reject`);

		// For demo purposes, we'll make a direct POST call
		return api.post(`/hospital/emergency/${emergencyId}/reject`);
	},
	getNearbyHospitals: async (
		emergencyId: string,
		maxDistance = 50,
		limit = 10
	) => {
		return api.get(`/user/emergency/${emergencyId}/nearby-hospitals`, {
			params: { maxDistance, limit },
		});
	},
	getEmergencyStatus: async (requestId: string) => {
		return api.get(`/user/emergency/${requestId}`);
	},
	getEmergencyHistory: async (page = 1, limit = 10) => {
		return api.get(`/user/emergency/history`, {
			params: { page, limit },
		});
	},
};

// Driver API
export const driverAPI = {
	getDrivers: async () => {
		return api.get("/hospital/drivers");
	},
	approveDriver: async (driverId: string) => {
		return api.post(`/hospital/drivers/${driverId}/approve`);
	},
	updateAvailability: async (isAvailable: boolean) => {
		return api.put("/driver/status", { isAvailable });
	},
	getCurrentAssignment: async () => {
		return api.get("/driver/assignment/current");
	},
	updateAssignmentStatus: async (assignmentId: string, status: string) => {
		return api.put(`/driver/assignment/${assignmentId}/status`, { status });
	},
	getAssignmentHistory: async (page = 1, limit = 10) => {
		return api.get(`/driver/assignment/history?page=${page}&limit=${limit}`);
	},
};

export default api;
