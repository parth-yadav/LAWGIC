import getUser from "@/auth/getUser";
import Authenticated from "@/components/auth/Authenticated";
import AuthHeader from "@/components/auth/AuthHeader";
import Main from "@/components/Main";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <Main className="bg-background text-foreground grid h-dvh min-h-dvh w-full grid-rows-[auto_1fr]">
      <AuthHeader />
      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
        {user ? <Authenticated /> : children}
      </div>
    </Main>
  );
}
