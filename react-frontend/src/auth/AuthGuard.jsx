import Unauthenticated from "@/components/auth/Unauthenticated";
import { useSession } from "@/providers/SessionProvider";
import { LoaderCircleIcon } from "lucide-react";

export default function AuthGuard({ children, fallback = <Unauthenticated /> }) {
  const { user, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        <LoaderCircleIcon className="size-16 animate-spin" />
        <p className="text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  if (!user || status !== "authenticated") {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
