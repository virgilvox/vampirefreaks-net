import { describe, expect, it } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import JournalCard from "../../app/components/vf/JournalCard.vue"

const base = {
  id: "j1",
  title: "Velvet and rust",
  body: "x".repeat(300),
  mood: "wistful",
  visibility: "public",
  commentCount: 3,
  createdAt: "2026-06-01T00:00:00.000Z",
  username: "lilymorgue",
  displayName: "Lily Morgue",
}

describe("VfJournalCard", () => {
  it("links the title to the entry and the author to the profile", async () => {
    const wrapper = await mountSuspended(JournalCard, { props: { entry: base } })
    const hrefs = wrapper.findAll("a").map((a) => a.attributes("href"))
    expect(hrefs).toContain("/lilymorgue/journal/j1")
    expect(hrefs).toContain("/lilymorgue")
  })

  it("shows mood and comment count", async () => {
    const wrapper = await mountSuspended(JournalCard, { props: { entry: base } })
    expect(wrapper.text()).toContain("wistful")
    expect(wrapper.text()).toContain("3 comments")
  })

  it("truncates a long body into a snippet", async () => {
    const wrapper = await mountSuspended(JournalCard, { props: { entry: base } })
    expect(wrapper.text()).toContain("...")
  })

  it("shows a visibility badge only when not public", async () => {
    const pub = await mountSuspended(JournalCard, { props: { entry: base } })
    expect(pub.find(".vf-jcard-vis").exists()).toBe(false)
    const friends = await mountSuspended(JournalCard, {
      props: { entry: { ...base, visibility: "friends" } },
    })
    expect(friends.find(".vf-jcard-vis").text()).toBe("friends")
  })
})
