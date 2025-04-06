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

const registerSchema = z
	.object({
		firstName: z
			.string()
			.min(2, { message: "First name must be at least 2 characters" }),
		lastName: z
			.string()
			.min(2, { message: "Last name must be at least 2 characters" }),
		email: z.string().email({ message: "Please enter a valid email address" }),
		phoneNumber: z
			.string()
			.min(10, { message: "Phone number must be at least 10 characters" }),
		password: z
			.string()
			.min(8, { message: "Password must be at least 8 characters" }),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
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
			toast.success("Registration successful! Redirecting to login...");
		}
	}, [error, success]);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			phoneNumber: "",
			password: "",
			confirmPassword: "",
		},
	});

	const onSubmit = async (data: RegisterFormData) => {
		setLoading(true);
		setError(null);

		try {
			// Remove confirmPassword as it's not needed for the API
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { confirmPassword, ...userData } = data;

			await authAPI.register(userData);
			setSuccess(true);

			// Redirect to login after 2 seconds
			setTimeout(() => {
				navigate("/login");
			}, 2000);
		} catch (err: unknown) {
			let errorMessage = "Failed to register. Please try again.";

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
						Create an Account
					</CardTitle>
					<CardDescription className="text-center">
						Register for the Instant Ambulance service
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
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="firstName">First Name</Label>
									<Input
										id="firstName"
										placeholder="John"
										{...register("firstName")}
									/>
									{errors.firstName && (
										<p className="text-sm text-destructive">
											{errors.firstName.message}
										</p>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="lastName">Last Name</Label>
									<Input
										id="lastName"
										placeholder="Doe"
										{...register("lastName")}
									/>
									{errors.lastName && (
										<p className="text-sm text-destructive">
											{errors.lastName.message}
										</p>
									)}
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									placeholder="name@example.com"
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
								{loading ? "Registering..." : "Register"}
							</Button>
						</form>
					)}
				</CardContent>
				<CardFooter className="flex flex-col justify-center gap-2">
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
					<div className="flex flex-col gap-2 w-full mt-4">
						<p className="text-sm text-center font-medium">Are you a...</p>
						<div className="grid grid-cols-2 gap-2">
							<Button
								variant="outline"
								onClick={() => navigate("/register/hospital")}
							>
								Hospital
							</Button>
							<Button
								variant="outline"
								onClick={() => navigate("/register/driver")}
							>
								Driver
							</Button>
						</div>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
};

export default RegisterPage;
