import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import SignOutButton from "./SignOutButton";
import {
  Loader2Icon,
  LockIcon,
  LogInIcon,
  UserRoundCogIcon,
} from "lucide-react";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { useSession } from "@/providers/SessionProvider";
import { motion, AnimatePresence } from "motion/react";

export default function UserButton({
  className = "",
  variant = "simple",
  expanded = false,
}) {
  const { user, status } = useSession();

  if (status === "loading")
    return <Loader2Icon className={cn("animate-spin", className)} />;

  if (status === "unauthenticated")
    return (
      <Link to="/login">
        <Button variant="outline" className="rounded-full">
          Log In <LogInIcon />
        </Button>
      </Link>
    );

  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase();

  if (user) {
    if (variant === "simple") {
      return (
        <div className={cn("flex items-center", className)}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="space-y-2 px-3 py-2 text-center">
                {user?.name && (
                  <span className="block font-medium text-gray-900 dark:text-gray-100">
                    {user.name}
                  </span>
                )}
                <Separator />
                {user?.email && (
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </span>
                )}
                {user?.phone && (
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {user.phone}
                  </span>
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="flex flex-col gap-2 p-1">
                <Link to="/profile">
                  <Button variant="outline" className="mx-auto flex w-full items-center justify-start">
                    <UserRoundCogIcon />
                    Profile Settings
                  </Button>
                </Link>
                {user.isAdmin && (
                  <Link to="/admin">
                    <Button variant="outline" className="mx-auto flex w-full items-center justify-start">
                      <LockIcon />
                      Admin Dashboard
                    </Button>
                  </Link>
                )}
                <SignOutButton className="mx-auto flex w-full items-center justify-start" />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    } else {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className={cn(
                "flex flex-row items-center border rounded-2xl gap-2",
                "transition-all duration-300 mx-auto",
                expanded
                  ? "border-border shadow-md bg-secondary py-2 px-4"
                  : "bg-transparent border-transparent mx-auto",
                className
              )}
            >
              <Avatar className="cursor-pointer">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, width: 0, height: 0 }}
                    animate={{ opacity: 1, width: "auto", height: "auto" }}
                    exit={{ opacity: 0, width: 0, height: 0 }}
                    className="flex flex-col truncate"
                  >
                    <span>{user.email}</span>
                    {user.name && (
                      <span className="text-sm font-light">{user.name}</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="flex flex-col gap-2 p-1">
              <Link to="/profile">
                <Button variant="outline" className="mx-auto flex w-full items-center justify-start">
                  <UserRoundCogIcon />
                  Profile Settings
                </Button>
              </Link>
              {user.isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" className="mx-auto flex w-full items-center justify-start">
                    <LockIcon />
                    Admin Dashboard
                  </Button>
                </Link>
              )}
              <SignOutButton className="mx-auto flex w-full items-center justify-start" />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
}
