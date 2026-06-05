import { describe, expect, it } from "vitest"
import { mountSuspended } from "@nuxt/test-utils/runtime"
import ProfileBody from "../../app/components/vf/ProfileBody.vue"

describe("VfProfileBody", () => {
  it("renders the bio text", async () => {
    const wrapper = await mountSuspended(ProfileBody, {
      props: { username: "raven", bio: "nocturnal by design" },
    })
    expect(wrapper.text()).toContain("nocturnal by design")
  })

  it("shows an empty-state line when there is no bio", async () => {
    const wrapper = await mountSuspended(ProfileBody, { props: { username: "raven", bio: "" } })
    expect(wrapper.text()).toContain("still empty")
  })

  it("scopes custom CSS selectors under the member's container class", async () => {
    const wrapper = await mountSuspended(ProfileBody, {
      props: { username: "raven", bio: "x", customCss: ".banner { color: red; }" },
    })
    const html = wrapper.html()
    // The raw selector is rewritten to live only inside this profile's scope.
    expect(html).toContain(".vf-pb-raven .banner")
  })

  it("emits a scoped link-color rule from the linkColor prop", async () => {
    const wrapper = await mountSuspended(ProfileBody, {
      props: { username: "raven", bio: "x", linkColor: "#abcdef" },
    })
    expect(wrapper.html()).toContain(".vf-pb-raven a")
    expect(wrapper.html()).toContain("#abcdef")
  })
})
