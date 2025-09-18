import { FaHome } from "react-icons/fa";

export interface NavBarLinkType {
  name: string;
  href: string;
  icon: React.ElementType;
}

export const NavBarLinks: NavBarLinkType[] = [
  { name: "Home", href: "/", icon: FaHome },
];
export const QuickLinks: NavBarLinkType[] = [
  { name: "Home", href: "/", icon: FaHome },
];
