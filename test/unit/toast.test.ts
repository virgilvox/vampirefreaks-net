import { beforeEach, describe, expect, it } from "vitest"
import { useToast } from "../../app/composables/useToast"

describe("useToast", () => {
  beforeEach(() => {
    // The queue lives in useState, shared across the test file; reset it.
    useToast().toasts.value = []
  })

  it("push adds a toast with the default variant and a numeric id", () => {
    const { toasts, push } = useToast()
    push({ title: "Saved" })

    expect(toasts.value).toHaveLength(1)
    const toast = toasts.value[0]
    expect(toast?.title).toBe("Saved")
    expect(toast?.variant).toBe("default")
    expect(typeof toast?.id).toBe("number")
  })

  it("push keeps an explicit variant", () => {
    const { toasts, push } = useToast()
    push({ title: "Failed", variant: "danger" })
    expect(toasts.value.at(-1)?.variant).toBe("danger")
  })

  it("assigns a distinct id to each toast", () => {
    const { toasts, push } = useToast()
    push({ title: "A" })
    push({ title: "B" })
    const ids = new Set(toasts.value.map((t) => t.id))
    expect(ids.size).toBe(2)
  })

  it("dismiss removes only the matching toast", () => {
    const { toasts, push, dismiss } = useToast()
    push({ title: "A" })
    push({ title: "B" })
    const target = toasts.value.find((t) => t.title === "A")
    expect(target).toBeDefined()
    if (target) dismiss(target.id)
    expect(toasts.value.map((t) => t.title)).toEqual(["B"])
  })
})
