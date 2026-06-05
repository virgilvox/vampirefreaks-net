import { h } from "vue"
import { describe, expect, it } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import FormField from "../../app/components/ui/FormField.vue"

describe("UiFormField", () => {
  it("binds the label to the control id passed through the slot", async () => {
    const wrapper = await mountSuspended(FormField, {
      props: { label: "Email", for: "email-1" },
      slots: { default: (props: { id: string }) => h("input", { id: props.id }) },
    })
    const label = wrapper.find("label")
    expect(label.text()).toBe("Email")
    expect(label.attributes("for")).toBe("email-1")
    expect(wrapper.find("input").attributes("id")).toBe("email-1")
  })

  it("shows the error and hides the hint when both are set", async () => {
    const wrapper = await mountSuspended(FormField, {
      props: { label: "E", error: "Required", hint: "Help text" },
      slots: { default: () => h("input") },
    })
    expect(wrapper.text()).toContain("Required")
    expect(wrapper.text()).not.toContain("Help text")
  })

  it("shows the hint when there is no error", async () => {
    const wrapper = await mountSuspended(FormField, {
      props: { label: "E", hint: "Help text" },
      slots: { default: () => h("input") },
    })
    expect(wrapper.text()).toContain("Help text")
  })

  it("generates an id and binds the label to it when none is given", async () => {
    const wrapper = await mountSuspended(FormField, {
      props: { label: "E" },
      slots: { default: (props: { id: string }) => h("input", { id: props.id }) },
    })
    const id = wrapper.find("input").attributes("id")
    expect(id).toBeTruthy()
    expect(wrapper.find("label").attributes("for")).toBe(id)
  })
})
