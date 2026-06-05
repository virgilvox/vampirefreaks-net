import { describe, expect, it } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import Input from "../../app/components/ui/Input.vue"

describe("UiInput", () => {
  it("renders the bound value", async () => {
    const wrapper = await mountSuspended(Input, { props: { modelValue: "hello" } })
    const el = wrapper.find("input").element as HTMLInputElement
    expect(el.value).toBe("hello")
  })

  it("emits update:modelValue on input", async () => {
    const wrapper = await mountSuspended(Input, { props: { modelValue: "" } })
    await wrapper.find("input").setValue("typed")
    expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual(["typed"])
  })

  it("marks the field aria-invalid when invalid", async () => {
    const wrapper = await mountSuspended(Input, { props: { modelValue: "", invalid: true } })
    expect(wrapper.find("input").attributes("aria-invalid")).toBe("true")
  })

  it("passes type and autocomplete through to the element", async () => {
    const wrapper = await mountSuspended(Input, {
      props: { modelValue: "", type: "password", autocomplete: "current-password" },
    })
    const input = wrapper.find("input")
    expect(input.attributes("type")).toBe("password")
    expect(input.attributes("autocomplete")).toBe("current-password")
  })
})
