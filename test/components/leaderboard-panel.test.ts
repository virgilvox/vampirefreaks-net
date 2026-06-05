import { describe, expect, it } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import LeaderboardPanel from "../../app/components/vf/LeaderboardPanel.vue"

const rows = [
  { username: "raven", displayName: "Raven", average: 9.2, ratingCount: 8 },
  { username: "ashes", displayName: null, average: 8.1, ratingCount: 6 },
]

describe("VfLeaderboardPanel", () => {
  it("ranks rows and links to each member", async () => {
    const wrapper = await mountSuspended(LeaderboardPanel, { props: { rows } })
    const links = wrapper.findAll("a")
    expect(links).toHaveLength(2)
    expect(links[0]?.attributes("href")).toBe("/raven")
    expect(wrapper.text()).toContain("1")
    expect(wrapper.text()).toContain("Raven")
    expect(wrapper.text()).toContain("9.2")
  })

  it("falls back to the username when there is no display name", async () => {
    const wrapper = await mountSuspended(LeaderboardPanel, { props: { rows } })
    expect(wrapper.text()).toContain("ashes")
  })

  it("hides the average when showAverage is false", async () => {
    const wrapper = await mountSuspended(LeaderboardPanel, {
      props: { rows, showAverage: false },
    })
    expect(wrapper.text()).not.toContain("9.2")
  })

  it("shows an empty state with no rows", async () => {
    const wrapper = await mountSuspended(LeaderboardPanel, { props: { rows: [] } })
    expect(wrapper.text()).toContain("No one here yet")
  })
})
