import { InfoIcon } from "lucide-react";
import { FaHome, FaEnvelope } from "react-icons/fa";

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
  { name: "Contact Us", href: "/contact", icon: FaEnvelope },
  { name: "About Us", href: "/aboutus", icon: InfoIcon },
];
