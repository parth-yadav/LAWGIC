import getUser from "@/auth/getUser";
import Unauthenticated from "@/components/auth/Unauthenticated";
import Footer from "@/components/Footer";
import Main from "@/components/Main";
import NavBar from "@/components/NavBar";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export default async function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getUser();

  return (
    <>
      <NavBar />
      <Main
        className={cn(
          "flex w-full flex-col items-center overflow-y-auto overflow-x-hidden flex-1 min-h-0"
        )}
      >
        {user ? children : <Unauthenticated />}
        <Footer />
      </Main>
    </>
  );
}
