import { BsGithub } from "react-icons/bs";
import { Link } from "react-router-dom";
import { QuickLinks } from "@/utils/navLinks";
import Logo from "./Logo";
import { appName } from "@/utils/data";

export default function Footer() {
  return (
    <footer className="mx-auto mt-20 w-full p-4 max-w-4xl">
      <div className="border-border border-t p-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:place-items-center">
          <div className="md:col-span-1">
            <Logo />
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              {QuickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary flex items-center gap-2 text-sm transition-colors"
                  >
                    <link.icon size={16} />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-border mt-8 border-t pt-8">
          <div className="flex flex-col items-center md:flex-row">
            <div className="text-muted-foreground text-sm w-full text-center">
              © 2025 {appName}. All rights reserved.
            </div>
          </div>
          <div className="mt-6 text-center">
            <h4 className="text-muted-foreground mb-4 text-sm font-medium">Developed by</h4>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="https://github.com/jayendrabharti" target="_blank" rel="noopener noreferrer"
                className="bg-muted hover:bg-muted/80 hover:text-primary hover:ring-ring flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all hover:ring-2 hover:shadow-md">
                <BsGithub size={16} /> Jayendra Bharti
              </a>
              <a href="https://github.com/parth-yadav" target="_blank" rel="noopener noreferrer"
                className="bg-muted hover:bg-muted/80 hover:text-primary hover:ring-ring flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all hover:ring-2 hover:shadow-md">
                <BsGithub size={16} /> Parth Yadavv
              </a>
              <a href="https://github.com/Krrish2401" target="_blank" rel="noopener noreferrer"
                className="bg-muted hover:bg-muted/80 hover:text-primary hover:ring-ring flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-all hover:ring-2 hover:shadow-md">
                <BsGithub size={16} /> Krrish Chaudhary
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
