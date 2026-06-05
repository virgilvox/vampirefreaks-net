export const THEMES = ["punk-zine", "industrial", "paper-teal"] as const
export type ThemeName = (typeof THEMES)[number]

// Owns the one attribute that swaps the whole aesthetic. The chosen theme name
// lives in a cookie so server render and client agree, and is written to
// <html data-theme>. Every token-backed component retints with no edits.
export function useTheme(): {
  theme: Ref<ThemeName>
  themes: readonly ThemeName[]
  setTheme: (name: ThemeName) => void
} {
  const appConfig = useAppConfig()
  const fallback = (appConfig.theme as ThemeName) ?? "punk-zine"
  const theme = useCookie<ThemeName>("jig-theme", { default: () => fallback, sameSite: "lax" })

  useHead({ htmlAttrs: { "data-theme": theme } })

  function setTheme(name: ThemeName): void {
    theme.value = name
  }

  return { theme, themes: THEMES, setTheme }
}
