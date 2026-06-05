import { describe, expect, it } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import MusicPlayer from "../../app/components/vf/MusicPlayer.vue"

describe("VfMusicPlayer", () => {
  it("renders the title and a labelled audio control with the source", async () => {
    const wrapper = await mountSuspended(MusicPlayer, {
      props: { src: "https://cdn.test/track.mp3", title: "Funeral Bell" },
    })
    expect(wrapper.text()).toContain("Funeral Bell")
    const audio = wrapper.find("audio")
    expect(audio.exists()).toBe(true)
    expect(audio.attributes("src")).toBe("https://cdn.test/track.mp3")
    expect(audio.attributes("aria-label")).toBe("Play Funeral Bell")
  })

  it("does not autoplay and defers loading", async () => {
    const wrapper = await mountSuspended(MusicPlayer, {
      props: { src: "https://cdn.test/track.mp3", title: "Static" },
    })
    const audio = wrapper.find("audio")
    expect(audio.attributes("autoplay")).toBeUndefined()
    expect(audio.attributes("preload")).toBe("none")
    expect(audio.attributes("controls")).toBeDefined()
  })
})
