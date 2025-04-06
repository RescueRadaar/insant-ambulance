import React, { useEffect, useState } from "react";
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
import { useAuth } from "@/lib/AuthContext";

const loginSchema = z.object({
	email: z.string().email({ message: "Please enter a valid email address" }),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters" }),
	userType: z.enum(["user", "hospital", "driver"], {
		required_error: "Please select a user type",
	}),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
	const { login, error, loading, clearError } = useAuth();
	const navigate = useNavigate();
	const [loginAttempted, setLoginAttempted] = useState(false);

	useEffect(() => {
		// Display error as toast whenever it changes
		if (error) {
			toast.error(error);
			clearError(); // Clear the error after showing toast
		}
	}, [error, clearError]);

	// Handle navigation after login attempt completes
	useEffect(() => {
		if (loginAttempted && !loading) {
			if (!error) {
				// Only navigate if there's no error and loading is complete
				navigate("/dashboard");
			}
			// Reset the login attempt flag
			setLoginAttempted(false);
		}
	}, [loginAttempted, loading, error, navigate]);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
			userType: "user",
		},
	});

	const onSubmit = async (data: LoginFormData) => {
		setLoginAttempted(true);
		await login(data);
		// Navigation will happen in the useEffect
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl font-bold text-center">
						Instant Ambulance
					</CardTitle>
					<CardDescription className="text-center">
						Sign in to your account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
							<Label htmlFor="userType">I am a</Label>
							<select
								id="userType"
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
								{...register("userType")}
							>
								<option value="user">Patient</option>
								<option value="hospital">Hospital</option>
								<option value="driver">Driver</option>
							</select>
							{errors.userType && (
								<p className="text-sm text-destructive">
									{errors.userType.message}
								</p>
							)}
						</div>
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Signing in..." : "Sign In"}
						</Button>
					</form>
				</CardContent>
				<CardFooter className="flex flex-col justify-center gap-2">
					<p className="text-sm text-center text-muted-foreground">
						Don't have an account?{" "}
						<Button
							variant="link"
							className="p-0"
							onClick={() => navigate("/register")}
						>
							Sign up
						</Button>
					</p>
					<div className="flex flex-col gap-2 w-full mt-2">
						<p className="text-sm text-center font-medium">Register as:</p>
						<div className="flex flex-row gap-2 justify-center">
							<Button
								variant="outline"
								size="sm"
								onClick={() => navigate("/register")}
							>
								Patient
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => navigate("/register/hospital")}
							>
								Hospital
							</Button>
							<Button
								variant="outline"
								size="sm"
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

export default LoginPage;
