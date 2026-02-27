import useIsMobile from "@/hooks/useIsMobile";
import { Link } from "react-router-dom";

export default function ScrollToSection({ targetId, children }) {
  const isMobile = useIsMobile();
  const scrollTo = (e) => {
    if (isMobile) return;
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Link to={`#${targetId}`} onClick={scrollTo}>
      {children}
    </Link>
  );
}
