"use client";
import { Loader2Icon, LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import ApiClient from "@/utils/ApiClient";
import { useRouter } from "next/navigation";

export default function SignOutButton({
  className = "",
}: {
  className?: string;
}) {
  const router = useRouter();
  const [signingOut, startSignOut] = useTransition();

  return (
    <Button
      onClick={() => {
        startSignOut(async () => {
          await ApiClient.post("/auth/logout");
          toast.success("Signed out !!");
          router.push("/login");
        });
      }}
      disabled={signingOut}
      variant={"destructive"}
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
