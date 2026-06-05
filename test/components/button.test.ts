import { describe, expect, it } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import Button from "../../app/components/ui/Button.vue"

describe("UiButton", () => {
  it("renders slot content with the accent variant by default", async () => {
    const wrapper = await mountSuspended(Button, { slots: { default: () => "Save" } })
    expect(wrapper.text()).toContain("Save")
    expect(wrapper.classes()).toContain("bg-accent")
  })

  it("switches token classes for the danger variant", async () => {
    const wrapper = await mountSuspended(Button, {
      props: { variant: "danger" },
      slots: { default: () => "Delete" },
    })
    expect(wrapper.classes()).toContain("bg-danger")
    expect(wrapper.classes()).not.toContain("bg-accent")
  })

  it("renders the surface and ghost variants", async () => {
    const surface = await mountSuspended(Button, {
      props: { variant: "surface" },
      slots: { default: () => "x" },
    })
    expect(surface.classes()).toContain("bg-surface")

    const ghost = await mountSuspended(Button, {
      props: { variant: "ghost" },
      slots: { default: () => "x" },
    })
    expect(ghost.classes()).toContain("border-transparent")
  })

  it("adds full width when block is set and reflects disabled", async () => {
    const wrapper = await mountSuspended(Button, {
      props: { block: true, disabled: true },
      slots: { default: () => "x" },
    })
    expect(wrapper.classes()).toContain("w-full")
    expect(wrapper.find("button").attributes("disabled")).toBeDefined()
  })

  it("defaults the native type to button", async () => {
    const wrapper = await mountSuspended(Button, { slots: { default: () => "x" } })
    expect(wrapper.find("button").attributes("type")).toBe("button")
  })
})
