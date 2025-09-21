import { BsGithub } from "react-icons/bs";
import Link from "next/link";
import { QuickLinks } from "@/utils/navLinks";
import Logo from "./Logo";
import { appName } from "@/utils/data";

export default async function Footer() {
  return (
    <footer className="mx-auto mt-20 w-full p-4 max-w-4xl">
      <div className="border-border border-t p-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:place-items-center">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <Logo />
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              {QuickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    target="_blank"
                    className="text-muted-foreground hover:text-primary flex items-center gap-2 text-sm transition-colors"
                  >
                    <link.icon size={16} />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-border mt-8 flex flex-col items-center justify-between border-t pt-6 md:flex-row">
          <div className="text-muted-foreground mb-4 text-sm md:mb-0">
            © 2025 {appName}.
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Developed by</span>
            <Link
              href="https://github.com/jayendrabharti"
              target="_blank"
              className="bg-muted hover:text-primary hover:ring-ring flex items-center gap-2 rounded-md px-3 py-1 font-medium transition-all hover:ring-2"
            >
              <BsGithub size={16} />
              Jayendra Bharti
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
