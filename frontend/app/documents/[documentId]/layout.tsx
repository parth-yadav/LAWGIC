import getUser from "@/auth/getUser";
import Unauthenticated from "@/components/auth/Unauthenticated";

export default async function DocumentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return user ? children : <Unauthenticated />;
}
