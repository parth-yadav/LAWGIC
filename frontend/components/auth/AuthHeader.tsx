import Link from "next/link";
import ThemeSwitch from "../ThemeSwitch";
import { cn } from "@/lib/utils";
import { anurati } from "@/utils/fonts";

export default function AuthHeader() {
  return (
    <header className="bg-background border-border border-b shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={"/"}
          className={cn("text-foreground text-xl font-bold", anurati.className)}
        >
          SKILLIPSE
        </Link>

        <ThemeSwitch />
      </div>
    </header>
  );
}
