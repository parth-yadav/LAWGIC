import AuthHeader from "@/components/auth/AuthHeader";
import Main from "@/components/Main";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Main className="bg-background text-foreground grid h-dvh min-h-dvh w-full grid-rows-[auto_1fr]">
      <AuthHeader />
      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
        {children}
      </div>
    </Main>
  );
}
