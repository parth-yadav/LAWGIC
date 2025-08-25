import { cn } from "@/lib/utils";
import { appName } from "@/utils/data";
import { anurati } from "@/utils/fonts";
import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href={"/"}
      className={cn("text-foreground text-xl font-bold", anurati.className)}
    >
      {appName}
    </Link>
  );
}
