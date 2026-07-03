import { createContext, useContext, useEffect, useState } from "react";

interface ThemeContextValue {
  calmMode: boolean;
  toggleCalmMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  calmMode: false,
  toggleCalmMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [calmMode, setCalmMode] = useState(
    () => localStorage.getItem("pdx-calm-mode") === "true"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("calm-mode", calmMode);
    if (calmMode) {
      document.documentElement.setAttribute("data-calm", "true");
    } else {
      document.documentElement.removeAttribute("data-calm");
    }
    localStorage.setItem("pdx-calm-mode", String(calmMode));
  }, [calmMode]);

  return (
    <ThemeContext.Provider value={{ calmMode, toggleCalmMode: () => setCalmMode(x => !x) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
