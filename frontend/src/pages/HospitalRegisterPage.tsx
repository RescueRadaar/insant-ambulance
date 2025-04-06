import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { authAPI } from "@/lib/api";

const hospitalRegisterSchema = z
	.object({
		name: z
			.string()
			.min(2, { message: "Hospital name must be at least 2 characters" }),
		email: z.string().email({ message: "Please enter a valid email address" }),
		phoneNumber: z
			.string()
			.min(10, { message: "Phone number must be at least 10 characters" }),
		password: z
			.string()
			.min(8, { message: "Password must be at least 8 characters" }),
		confirmPassword: z.string(),
		address: z
			.string()
			.min(5, { message: "Address must be at least 5 characters" }),
		latitude: z.string().optional(),
		longitude: z.string().optional(),
		maxCapacity: z
			.string()
			.min(1, { message: "Please enter a maximum capacity" }),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

type HospitalRegisterFormData = z.infer<typeof hospitalRegisterSchema>;

const HospitalRegisterPage: React.FC = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		// Display error as toast whenever it changes
		if (error) {
			toast.error(error);
			setError(null); // Clear the error after showing toast
		}

		// Show success toast when registration is successful
		if (success) {
			toast.success(
				"Hospital registration successful! Redirecting to login..."
			);
		}
	}, [error, success]);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<HospitalRegisterFormData>({
		resolver: zodResolver(hospitalRegisterSchema),
		defaultValues: {
			name: "",
			email: "",
			phoneNumber: "",
			password: "",
			confirmPassword: "",
			address: "",
			latitude: "",
			longitude: "",
			maxCapacity: "",
		},
	});

	const onSubmit = async (data: HospitalRegisterFormData) => {
		setLoading(true);
		setError(null);

		try {
			// Remove confirmPassword and convert numeric fields
			const { confirmPassword, latitude, longitude, maxCapacity, ...restData } =
				data;

			const hospitalData = {
				...restData,
				latitude: latitude ? parseFloat(latitude) : undefined,
				longitude: longitude ? parseFloat(longitude) : undefined,
				maxCapacity: parseInt(maxCapacity),
			};

			await authAPI.registerHospital(hospitalData);
			setSuccess(true);

			// Redirect to login after 2 seconds
			setTimeout(() => {
				navigate("/login");
			}, 2000);
		} catch (err: unknown) {
			let errorMessage = "Failed to register hospital. Please try again.";

			if (err && typeof err === "object" && "response" in err) {
				const apiError = err as { response?: { data?: { message?: string } } };
				if (apiError.response?.data?.message) {
					errorMessage = apiError.response.data.message;
				}
			}

			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl font-bold text-center">
						Register Hospital
					</CardTitle>
					<CardDescription className="text-center">
						Create a hospital account for the Instant Ambulance service
					</CardDescription>
				</CardHeader>
				<CardContent>
					{success ? (
						<div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
							<p className="text-center">
								Registration successful! Redirecting to login...
							</p>
						</div>
					) : (
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Hospital Name</Label>
								<Input
									id="name"
									placeholder="City Medical Center"
									{...register("name")}
								/>
								{errors.name && (
									<p className="text-sm text-destructive">
										{errors.name.message}
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="info@hospital.com"
									{...register("email")}
								/>
								{errors.email && (
									<p className="text-sm text-destructive">
										{errors.email.message}
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="phoneNumber">Phone Number</Label>
								<Input
									id="phoneNumber"
									placeholder="+1234567890"
									{...register("phoneNumber")}
								/>
								{errors.phoneNumber && (
									<p className="text-sm text-destructive">
										{errors.phoneNumber.message}
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="address">Address</Label>
								<Input
									id="address"
									placeholder="123 Medical Ave, City"
									{...register("address")}
								/>
								{errors.address && (
									<p className="text-sm text-destructive">
										{errors.address.message}
									</p>
								)}
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="latitude">Latitude (optional)</Label>
									<Input
										id="latitude"
										placeholder="40.7128"
										{...register("latitude")}
									/>
									{errors.latitude && (
										<p className="text-sm text-destructive">
											{errors.latitude.message}
										</p>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="longitude">Longitude (optional)</Label>
									<Input
										id="longitude"
										placeholder="-74.0060"
										{...register("longitude")}
									/>
									{errors.longitude && (
										<p className="text-sm text-destructive">
											{errors.longitude.message}
										</p>
									)}
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="maxCapacity">Maximum Capacity</Label>
								<Input
									id="maxCapacity"
									type="number"
									placeholder="100"
									{...register("maxCapacity")}
								/>
								{errors.maxCapacity && (
									<p className="text-sm text-destructive">
										{errors.maxCapacity.message}
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									type="password"
									placeholder="••••••••"
									{...register("password")}
								/>
								{errors.password && (
									<p className="text-sm text-destructive">
										{errors.password.message}
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="confirmPassword">Confirm Password</Label>
								<Input
									id="confirmPassword"
									type="password"
									placeholder="••••••••"
									{...register("confirmPassword")}
								/>
								{errors.confirmPassword && (
									<p className="text-sm text-destructive">
										{errors.confirmPassword.message}
									</p>
								)}
							</div>
							<Button type="submit" className="w-full" disabled={loading}>
								{loading ? "Registering..." : "Register Hospital"}
							</Button>
						</form>
					)}
				</CardContent>
				<CardFooter className="flex justify-center">
					<p className="text-sm text-center text-muted-foreground">
						Already have an account?{" "}
						<Button
							variant="link"
							className="p-0"
							onClick={() => navigate("/login")}
						>
							Sign in
						</Button>
					</p>
				</CardFooter>
			</Card>
		</div>
	);
};

export default HospitalRegisterPage;
