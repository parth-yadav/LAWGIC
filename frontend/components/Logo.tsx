"use client";
import { cn } from "@/lib/utils";
import { appName } from "@/utils/data";
import { anurati } from "@/utils/fonts";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Logo() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show text logo during SSR and before theme is determined
  if (!mounted) {
    return (
      <Link
        href={"/"}
        className={cn("text-foreground text-xl font-bold", anurati.className)}
      >
        {appName}
      </Link>
    );
  }

  const logoSrc = theme === "dark" ? "/logos/flogodark.png" : "/logos/flogolight.png";

  return (
    <Link
      href={"/"}
      className="flex items-center"
    >
      <Image
        src={logoSrc}
        alt={appName}
        width={420}
        height={160}
        className="h-8 w-48"
        priority
      />
    </Link>
  );
}
