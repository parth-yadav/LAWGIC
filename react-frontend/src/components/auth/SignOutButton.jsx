import { Loader2Icon, LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "../ui/button";
import { useSession } from "@/providers/SessionProvider";

export default function SignOutButton({ className = "", redirect = false }) {
  const { logOut } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logOut(redirect);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      disabled={signingOut}
      variant="destructive"
      className={cn(`active:scale-90 ${className}`)}
    >
      {signingOut ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <LogOutIcon className="size-4" />
      )}
      {signingOut ? "Signing Out..." : "Sign Out"}
    </Button>
  );
}
