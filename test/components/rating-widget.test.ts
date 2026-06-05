import { describe, expect, it } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import RatingWidget from "../../app/components/vf/RatingWidget.vue"

describe("VfRatingWidget", () => {
  it("renders ten rating buttons", async () => {
    const wrapper = await mountSuspended(RatingWidget, {})
    expect(wrapper.findAll("button")).toHaveLength(10)
  })

  it("emits the chosen score on click", async () => {
    const wrapper = await mountSuspended(RatingWidget, {})
    await wrapper.findAll("button")[6]?.trigger("click")
    expect(wrapper.emitted("rate")?.[0]).toEqual([7])
  })

  it("shows the average and your prior score", async () => {
    const wrapper = await mountSuspended(RatingWidget, {
      props: { average: 8.4, ratingCount: 12, yourScore: 9 },
    })
    expect(wrapper.text()).toContain("8.4")
    expect(wrapper.text()).toContain("12 ratings")
    expect(wrapper.text()).toContain("you: 9")
  })

  it("says so when there are no ratings", async () => {
    const wrapper = await mountSuspended(RatingWidget, { props: { average: null } })
    expect(wrapper.text()).toContain("No ratings yet")
  })

  it("disables the buttons when disabled", async () => {
    const wrapper = await mountSuspended(RatingWidget, { props: { disabled: true } })
    expect(wrapper.find("button").attributes("disabled")).toBeDefined()
  })
})
