"use client";

import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeSwitch from "./ThemeSwitch";
import { useState } from "react";
import { Button } from "./ui/button";
import Reveal from "./animations/Reveal";
import { NavBarLinks } from "@/utils/navLinks";
import UserButton from "./auth/UserButton";
import Logo from "./Logo";

export default function NavBar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        `w-full space-x-2`,
        `border-border border-b shadow-md`,
        `sticky top-0 left-0 z-50`,
        `flex flex-row items-center py-4`,
        `bg-background transition-all duration-200`
      )}
    >
      <Reveal
        className={cn(
          "flex items-center justify-between",
          "mx-auto px-5 md:px-10",
          "w-full space-x-3"
        )}
      >
        <Logo />

        <div
          className={cn(
            `flex flex-col md:flex-row`,
            `items-start md:items-center`,
            `justify-center`,
            `gap-3 md:gap-1.5`,
            `top-full left-0 w-full`,
            "px-5 py-4 md:p-0",
            "absolute md:static",
            "transition-all duration-200",
            "shadow-md md:shadow-none",
            expanded
              ? "translate-y-0 scale-y-100"
              : "-translate-y-1/2 scale-y-0 md:translate-y-0 md:scale-y-100",
            expanded && "bg-background",
            `border-border border-b-2 md:border-0`
          )}
        >
          {NavBarLinks.map((link, index) => {
            const active = isActive(link.href);

            return (
              <Link
                key={index}
                prefetch={true}
                href={link.href}
                onClick={() => setExpanded(false)}
                className={cn(
                  "flex flex-row items-center",
                  "rounded-full px-5 py-2 font-bold md:px-2.5 md:py-1",
                  active && "bg-primary text-background",
                  !active &&
                    "hover:bg-accent text-muted-foreground hover:text-primary",
                  "ring-muted-foreground active:ring-4",
                  "transition-all duration-300",
                  "w-full md:w-max"
                )}
              >
                <link.icon className="mr-1.5 size-4" />
                {link.name}
              </Link>
            );
          })}
        </div>

        <ThemeSwitch className="md:ml-0 ml-auto" />

        <UserButton />

        <Button
          variant={"ghost"}
          size={"icon"}
          onClick={(e) => {
            setExpanded((prev) => !prev);
            e.stopPropagation();
          }}
          className={cn("relative flex md:hidden")}
        >
          <X
            className={cn(
              "absolute transition-all duration-200",
              expanded ? "scale-200 rotate-180" : "scale-0 rotate-0"
            )}
          />

          <Menu
            className={cn(
              "absolute transition-all duration-200",
              expanded ? "scale-0 rotate-180" : "scale-200 rotate-0"
            )}
          />
        </Button>
      </Reveal>
    </nav>
  );
}
