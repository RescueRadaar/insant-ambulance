import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
	return (
		<SonnerToaster
			position="top-right"
			toastOptions={{
				duration: 5000,
				className: "border border-border rounded-md",
				style: {
					background: "hsl(var(--background))",
					color: "hsl(var(--foreground))",
					border: "1px solid hsl(var(--border))",
				},
			}}
		/>
	);
}
