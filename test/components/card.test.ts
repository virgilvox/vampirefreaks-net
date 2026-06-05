import { describe, expect, it } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import Card from "../../app/components/ui/Card.vue"

describe("UiCard", () => {
  it("renders the title and default slot", async () => {
    const wrapper = await mountSuspended(Card, {
      props: { title: "Hello" },
      slots: { default: () => "Body" },
    })
    expect(wrapper.find("h2").text()).toBe("Hello")
    expect(wrapper.text()).toContain("Body")
  })

  it("renders the subtitle when given", async () => {
    const wrapper = await mountSuspended(Card, {
      props: { title: "T", subtitle: "Sub" },
      slots: { default: () => "x" },
    })
    expect(wrapper.text()).toContain("Sub")
  })

  it("omits the header when there is no title or header slot", async () => {
    const wrapper = await mountSuspended(Card, { slots: { default: () => "x" } })
    expect(wrapper.find("header").exists()).toBe(false)
  })

  it("renders a footer only when the footer slot is provided", async () => {
    const without = await mountSuspended(Card, { slots: { default: () => "x" } })
    expect(without.find("footer").exists()).toBe(false)

    const withFooter = await mountSuspended(Card, {
      slots: { default: () => "x", footer: () => "Foot" },
    })
    expect(withFooter.find("footer").exists()).toBe(true)
    expect(withFooter.text()).toContain("Foot")
  })
})
