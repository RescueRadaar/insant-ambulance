// User Types
export interface User {
	id: string;
	firstName?: string;
	lastName?: string;
	name?: string; // For hospital users
	email: string;
	phoneNumber?: string;
	role: string;
}

export interface UserRegistration {
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber: string;
	password: string;
	address?: string;
	latitude?: number;
	longitude?: number;
}

export interface LoginCredentials {
	email: string;
	password: string;
	userType: "user" | "hospital" | "driver";
}

// Hospital Types
export interface Hospital {
	id: string;
	name: string;
	email: string;
	phoneNumber: string;
	address: string;
	latitude?: number;
	longitude?: number;
	maxCapacity: number;
}

export interface HospitalRegistration {
	name: string;
	email: string;
	phoneNumber: string;
	password: string;
	address: string;
	latitude?: number;
	longitude?: number;
	maxCapacity: number;
}

// Driver Types
export interface Driver {
	id: string;
	userId?: string;
	name: string;
	email: string;
	phoneNumber: string;
	licenseNumber: string;
	isApproved: boolean;
	isAvailable: boolean;
	createdAt?: string;
}

export interface DriverRegistration {
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber: string;
	password: string;
	licenseNumber: string;
}

// Emergency Types
export interface EmergencyRequest {
	requestId: string; // Note: API returns requestId, not id
	id?: string; // For backward compatibility
	status: string;
	pickupAddress?: string;
	pickupLatitude?: number;
	pickupLongitude?: number;
	pickupLocation?: {
		latitude: number;
		longitude: number;
		address: string;
	};
	user?: {
		name: string;
		phoneNumber: string;
	};
	medicalNotes?: string;
	hospitalId?: string;
	driver?: {
		id: string;
		name: string;
		status: string;
	} | null;
	createdAt: string;
	updatedAt?: string;
	distance?: string;
}

export interface EmergencyCreation {
	pickupLatitude: number;
	pickupLongitude: number;
	pickupAddress: string;
	medicalNotes?: string;
}

// Assignment Types
export interface Assignment {
	assignmentId: string;
	requestId: string;
	status: string;
	user: {
		name: string;
		phoneNumber: string;
	};
	pickup: {
		latitude: number;
		longitude: number;
		address: string;
	};
	hospital: {
		name: string;
		address: string;
	};
	medicalNotes: string;
	assignedAt: string;
}
