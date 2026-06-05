import { describe, expect, it } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import Panel from "../../app/components/vf/Panel.vue"

describe("VfPanel", () => {
  it("renders the title bar and body slot", async () => {
    const wrapper = await mountSuspended(Panel, {
      props: { title: "Top Cults" },
      slots: { default: () => "body content" },
    })
    expect(wrapper.text()).toContain("Top Cults")
    expect(wrapper.text()).toContain("body content")
  })

  it("omits the title bar when no title is given", async () => {
    const wrapper = await mountSuspended(Panel, { slots: { default: () => "x" } })
    expect(wrapper.find(".vf-panel-bar").exists()).toBe(false)
  })

  it("drops body padding when flush", async () => {
    const wrapper = await mountSuspended(Panel, {
      props: { title: "t", flush: true },
      slots: { default: () => "x" },
    })
    expect(wrapper.find(".vf-panel-flush").exists()).toBe(true)
  })
})
