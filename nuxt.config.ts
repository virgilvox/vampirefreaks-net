import tailwindcss from "@tailwindcss/vite"

// Single source of config for the whole app. Runtime secrets come from env,
// never hardcoded, so the same build runs in dev, Docker, and production.
export default defineNuxtConfig({
  compatibilityDate: "2025-01-01",
  devtools: { enabled: true },

  modules: ["reka-ui/nuxt", "@nuxt/test-utils/module"],

  css: ["~/assets/design/tailwind.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  // Default aesthetic. Swap the value to ship a different look with zero
  // component changes. See app/assets/design/themes for the options.
  appConfig: {
    theme: "crypt",
  },

  // Server secrets (DATABASE_URL, BETTER_AUTH_SECRET, OAuth keys) are read
  // straight from process.env in server/ where they are used. Only the public
  // auth base URL needs to reach the client, mapped from NUXT_PUBLIC_AUTH_BASE_URL.
  runtimeConfig: {
    public: {
      authBaseUrl: "http://localhost:3000",
    },
  },

  nitro: {
    preset: "node-server",
  },

  // Baseline security headers on every response. nosniff stops content-type
  // sniffing, the frame rules block clickjacking of the app, and the referrer
  // policy keeps full URLs off cross-origin requests. A full CSP is a later
  // pass: profile customization renders inline styles that a strict policy would
  // need to account for.
  routeRules: {
    "/**": {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    },
  },
})
