import { toast as sonnerToast } from "sonner"

type ToastProps = {
    title?: string
    description?: string
    variant?: "default" | "destructive"
    duration?: number
}

export function useToast() {
    return {
        toast: ({ title, description, variant }: ToastProps) => {
            if (variant === "destructive") {
                sonnerToast.error(title, {
                    description,
                })
            } else {
                // If the title indicates success, use success toast, otherwise neutral
                if (title?.toLowerCase().includes("success")) {
                    sonnerToast.success(title, {
                        description,
                    })
                } else {
                    sonnerToast.message(title, {
                        description,
                    })
                }
            }
        },
        dismiss: (toastId?: string) => sonnerToast.dismiss(toastId),
    }
}
