"use client";

import React, { useState } from "react";
import { Menu as MenuIcon, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { title: "Why DeadDropper", href: "/why" },
  { title: "Security", href: "/security" },
  { title: "FAQ", href: "/faq" },
  { title: "Who are We", href: "/who" },
  { title: "Our Vision", href: "/vision" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="w-full bg-transparent backdrop-blur-none border-b-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Left: brand */}
          <div className="flex items-center gap-3">
            <Link to="/" aria-label="DeadDropper Home" className="inline-flex items-center gap-2">
              <span className="text-lg font-semibold text-white">DeadDropper</span>
            </Link>
          </div>

          {/* Center (desktop links) */}
          <nav className="hidden lg:flex lg:items-center lg:gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.title}
                to={link.href}
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                {link.title}
              </Link>
            ))}
          </nav>

          {/* Right: CTA area + mobile menu button */}
          <div className="flex items-center gap-3">
            {/* auth / CTA area (optional) - we keep it minimal */}
            <div className="hidden lg:flex items-center gap-3">
              <Link to="/drop">
                <Button size="sm" className="bg-white text-black hover:bg-white/90">
                  Drop
                </Button>
              </Link>
              <Link to="/pickup">
                <Button size="sm" variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                  Pickup
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button
                    aria-label="Open menu"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white/5"
                  >
                    <MenuIcon className="h-5 w-5 text-white" />
                  </button>
                </SheetTrigger>

                <SheetContent side="right" className="w-80 bg-black/80 backdrop-blur-md border-white/10">
                  <SheetHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <SheetTitle className="text-white">DeadDropper</SheetTitle>
                          <div className="text-sm text-white/60">Drop it. Encrypt it. Forget it.</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setMobileOpen(false)}
                        aria-label="Close menu"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white/5"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  </SheetHeader>

                  <div className="mt-6 flex flex-col gap-4">
                    {NAV_LINKS.map((link) => (
                      <Link
                        key={link.title}
                        to={link.href}
                        className="rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-white/5"
                        onClick={() => setMobileOpen(false)}
                      >
                        {link.title}
                      </Link>
                    ))}


                    <div className="mt-6 flex flex-col gap-3">
                      <Link to="/drop">
                        <Button className="w-full bg-white text-black hover:bg-white/90">
                          Drop
                        </Button>
                      </Link>
                      <Link to="/pickup">
                        <Button variant="outline" className="w-full border-white text-white hover:bg-white hover:text-black">
                          Pickup
                        </Button>
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
