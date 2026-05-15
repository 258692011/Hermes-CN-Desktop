import { atom, useAtom } from "jotai";

type ThemeVariant = "light" | "dark";
type DensityVariant = "comfortable" | "compact";

export interface ThemeConfig {
  theme: ThemeVariant;
  density: DensityVariant;
}

const DEFAULT_THEME: ThemeConfig = {
  theme: "light",
  density: "comfortable",
};

function loadTheme(): ThemeConfig {
  try {
    const saved = localStorage.getItem("hermes-theme");
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<ThemeConfig>;
      return {
        theme: parsed.theme === "dark" ? "dark" : "light",
        density: parsed.density === "compact" ? "compact" : "comfortable",
      };
    }
  } catch {}
  return DEFAULT_THEME;
}

export const themeAtom = atom<ThemeConfig>(loadTheme());

export const themeWriteAtom = atom(null, (_get, set, update: Partial<ThemeConfig>) => {
  set(themeAtom, (prev) => {
    const next = { ...prev, ...update };
    localStorage.setItem("hermes-theme", JSON.stringify(next));
    applyThemeToDOM(next);
    return next;
  });
});

export function applyThemeToDOM(config: ThemeConfig) {
  const root = document.documentElement;
  root.setAttribute("data-theme", config.theme);
  root.setAttribute("data-density", config.density);
}

export function useTheme() {
  const [config] = useAtom(themeAtom);
  const [, update] = useAtom(themeWriteAtom);
  return { config, update };
}
