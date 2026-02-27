import { cn } from "@/lib/utils";
import { appName } from "@/utils/data";
import { Link } from "react-router-dom";
import { useTheme } from "@/providers/ThemeProvider";

export default function Logo() {
  const { theme } = useTheme();
  const logoSrc = theme === "dark" ? "/logos/flogodark.png" : "/logos/flogolight.png";

  return (
    <Link to="/" className="flex items-center">
      <img
        src={logoSrc}
        alt={appName}
        width={420}
        height={160}
        className="h-8 w-48"
      />
    </Link>
  );
}
