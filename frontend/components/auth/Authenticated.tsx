import Link from "next/link";
import { Button } from "../ui/button";
import { CheckCheckIcon, HomeIcon } from "lucide-react";
import SignOutButton from "./SignOutButton";

export default function Authenticated() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-2">
      <CheckCheckIcon className="size-20 text-green-500" />
      <span className="text-4xl font-bold text-green-500">Authenticated</span>
      <span className="text-sm text-muted-foreground">
        You are already logged in.
      </span>
      <div className="flex flex-row items-center justify-center gap-2 mt-4">
        <Link href="/">
          <Button variant="outline" className="rounded-full">
            Homepage <HomeIcon />
          </Button>
        </Link>
        <SignOutButton type={"refresh"} />
      </div>
    </div>
  );
}
