import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";

export default function Main({ children, ...props }) {
  const { pathname } = useLocation();
  const mainRef = useRef(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname]);

  return (
    <main ref={mainRef} {...props}>
      {children}
      <ScrollToTop mainRef={mainRef} />
    </main>
  );
}
