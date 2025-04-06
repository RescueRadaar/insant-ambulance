declare module "sonner" {
	interface ToastOptions {
		duration?: number;
		className?: string;
		style?: React.CSSProperties;
	}

	interface ToasterProps {
		position?:
			| "top-left"
			| "top-right"
			| "bottom-left"
			| "bottom-right"
			| "top-center"
			| "bottom-center";
		toastOptions?: ToastOptions;
		visibleToasts?: number;
		hotkey?: string[];
		richColors?: boolean;
		expand?: boolean;
		duration?: number;
		closeButton?: boolean;
	}

	export function Toaster(props?: ToasterProps): JSX.Element;

	export interface Toast {
		(message: string, options?: ToastOptions): void;
		success(message: string, options?: ToastOptions): void;
		error(message: string, options?: ToastOptions): void;
		info(message: string, options?: ToastOptions): void;
		warning(message: string, options?: ToastOptions): void;
		loading(message: string, options?: ToastOptions): void;
		dismiss(id?: string): void;
	}

	export const toast: Toast;
}
