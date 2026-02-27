import NavBar from "@/components/NavBar";
import Main from "@/components/Main";
import Footer from "@/components/Footer";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function MainLayout() {
  return (
    <>
      <NavBar />
      <Main
        className={cn(
          "flex w-full flex-col items-center overflow-y-auto overflow-x-hidden flex-1 min-h-0"
        )}
      >
        <Outlet />
        <Footer />
      </Main>
    </>
  );
}
