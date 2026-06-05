export type Toast = {
  id: number
  title: string
  description?: string
  variant: "default" | "danger"
}

type ToastInput = Omit<Toast, "id" | "variant"> & { variant?: Toast["variant"] }

let counter = 0

// Shared toast queue. Components call push(); the Toaster host in the default
// layout renders whatever is in the list. State lives in useState so it is one
// queue across the app, not one per caller.
export function useToast(): {
  toasts: Ref<Toast[]>
  push: (toast: ToastInput) => void
  dismiss: (id: number) => void
} {
  const toasts = useState<Toast[]>("jig-toasts", () => [])

  function push(toast: ToastInput): void {
    counter += 1
    toasts.value = [...toasts.value, { variant: "default", ...toast, id: counter }]
  }

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, push, dismiss }
}
