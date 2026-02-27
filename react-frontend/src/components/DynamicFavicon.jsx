import { useTheme } from "@/providers/ThemeProvider";
import { useEffect } from "react";

export default function DynamicFavicon() {
  const { theme } = useTheme();

  useEffect(() => {
    const faviconPath = theme === "dark" ? "/images/favicon-dark.ico" : "/images/favicon-light.ico";
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = faviconPath;
  }, [theme]);

  return null;
}
