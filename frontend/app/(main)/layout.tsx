import getUser from "@/auth/getUser";
import Unauthenticated from "@/components/auth/Unauthenticated";
import Main from "@/components/Main";
import NavBar from "@/components/NavBar";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { Footer } from "react-day-picker";

export default async function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getUser();

  if (!user) return <Unauthenticated />;

  return (
    <>
      <NavBar />
      <Main
        className={cn(
          "flex w-full flex-col items-center overflow-y-auto overflow-x-hidden flex-1 min-h-0"
        )}
      >
        {children}
        <Footer />
      </Main>
    </>
  );
}
