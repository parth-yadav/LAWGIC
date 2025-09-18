import getUser from "@/auth/getUser";
import Unauthenticated from "@/components/auth/Unauthenticated";
import { ReactNode } from "react";

export default async function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getUser();

  return user ? children : <Unauthenticated />;
}
