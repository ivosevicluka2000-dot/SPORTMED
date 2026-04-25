"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { Menu, X, ShoppingCart, ChevronDown } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import LanguageSwitcher from "./LanguageSwitcher";
import { cn } from "@/lib/utils";

const serviceSlugs = [
  "fizikalna-terapija",
  "manuelna-terapija",
  "kineziterapija",
  "dijagnostika",
  "sportska-rehabilitacija",
  "masaza",
  "recovery-terapije",
  "testiranje-merenja",
] as const;

const toolLinks = [
  { href: "/alati/procena-oporavka" as const, key: "recoveryEstimator" },
  { href: "/alati/spremnost-za-sport" as const, key: "readinessChecklist" },
] as const;

const b2bServiceSlugs = [
  "timska-rehabilitacija",
  "fizioterapija-na-terenu",
  "prevencija-povreda",
  "testiranje-performansi",
] as const;

const navItems = [
  { href: "/", label: "home" },
  { href: "/usluge", label: "services", hasDropdown: "services" },
  { href: "/o-nama", label: "about" },
  { href: "/lokacija", label: "location" },
  { href: "/blog", label: "blog" },
  { href: "/prodavnica", label: "shop" },
  { href: "/alati", label: "tools", hasDropdown: "tools" },
  { href: "/b2b", label: "b2b", hasDropdown: "b2b" },
  { href: "/kontakt", label: "contact" },
] as const;

export default function Header() {
  const t = useTranslations("nav");
  const tServices = useTranslations("services.items");
  const tTools = useTranslations("tools");
  const tB2B = useTranslations("b2b.services");
  const tShop = useTranslations("shop");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [mobileB2BOpen, setMobileB2BOpen] = useState(false);
  const dropdownRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { itemCount } = useCart();

  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Close desktop dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!openDropdown) return;
      const activeRef = dropdownRefs.current.get(openDropdown);
      if (activeRef && !activeRef.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  // Close dropdown on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing UI to external pathname change
    setOpenDropdown(null);
  }, [pathname]);

  const handleDropdownEnter = (key: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setOpenDropdown(key);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  const headerBg = scrolled || mobileOpen
    ? "bg-white/95 backdrop-blur-md border-b border-gray-100/80"
    : isHome
      ? "bg-transparent border-b border-transparent"
      : "bg-white/95 backdrop-blur-md border-b border-gray-100/80";

  const textColor = !scrolled && isHome && !mobileOpen ? "text-white/80" : "text-gray-500";
  const logoColor = !scrolled && isHome && !mobileOpen ? "text-white" : "text-navy";
  const activeColor = "text-teal";

  return (
    <>
      <header className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300", headerBg)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 md:h-24">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div className="hidden sm:block">
                <span className={cn("font-heading font-semibold text-xl tracking-tight transition-colors duration-300", logoColor)}>
                  Sport Care
                </span>
                <span className="text-teal font-heading font-semibold text-xl"> Med</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                if ("hasDropdown" in item && item.hasDropdown) {
                  const dropdownKey = item.hasDropdown;
                  const isOpen = openDropdown === dropdownKey;

                  return (
                    <div
                      key={item.href}
                      ref={(el) => {
                        dropdownRefs.current.set(dropdownKey, el);
                      }}
                      className="relative"
                      onMouseEnter={() => handleDropdownEnter(dropdownKey)}
                      onMouseLeave={handleDropdownLeave}
                    >
                      <div className="flex items-center">
                        <Link
                          href={item.href as "/"}
                          className={cn(
                            "relative pl-3 pr-1 py-2 text-sm font-medium transition-colors duration-200",
                            isActive
                              ? activeColor
                              : cn(textColor, "hover:text-teal")
                          )}
                          onClick={() => setOpenDropdown(null)}
                        >
                          {t(item.label)}
                          {isActive && (
                            <span className="absolute bottom-0 left-3 right-1 h-px bg-teal" />
                          )}
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDropdown(isOpen ? null : dropdownKey)
                          }
                          aria-haspopup="menu"
                          aria-expanded={isOpen}
                          aria-label={`${t(item.label)} submenu`}
                          className={cn(
                            "px-2 py-2 cursor-pointer transition-colors",
                            isActive
                              ? activeColor
                              : cn(textColor, "hover:text-teal")
                          )}
                        >
                          <ChevronDown
                            className={cn(
                              "w-3.5 h-3.5 transition-transform duration-200",
                              isOpen && "rotate-180"
                            )}
                          />
                        </button>
                      </div>

                      {/* Dropdown menu */}
                      <div
                        role="menu"
                        className={cn(
                          "absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200",
                          isOpen
                            ? "opacity-100 translate-y-0 pointer-events-auto"
                            : "opacity-0 -translate-y-2 pointer-events-none"
                        )}
                      >
                        <div className="bg-white rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-100/80 p-2 min-w-[280px]">
                          {dropdownKey === "services" && (
                            <>
                              {serviceSlugs.map((slug) => {
                                const serviceActive = pathname === `/usluge/${slug}`;
                                return (
                                  <Link
                                    key={slug}
                                    href={{ pathname: "/usluge/[slug]", params: { slug } }}
                                    className={cn(
                                      "block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                                      serviceActive
                                        ? "text-teal bg-teal-50"
                                        : "text-gray-600 hover:text-teal hover:bg-gray-50"
                                    )}
                                    onClick={() => setOpenDropdown(null)}
                                  >
                                    {tServices(`${slug}.title`)}
                                  </Link>
                                );
                              })}
                              <div className="border-t border-gray-100 mt-1 pt-1">
                                <Link
                                  href="/usluge"
                                  className="block px-4 py-2.5 rounded-lg text-sm font-semibold text-teal hover:bg-teal-50 transition-colors"
                                  onClick={() => setOpenDropdown(null)}
                                >
                                  {t("services")} →
                                </Link>
                              </div>
                            </>
                          )}
                          {dropdownKey === "tools" && (
                            <>
                              {toolLinks.map((tool) => {
                                const toolActive = pathname === tool.href;
                                return (
                                  <Link
                                    key={tool.href}
                                    href={tool.href}
                                    className={cn(
                                      "block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                                      toolActive
                                        ? "text-teal bg-teal-50"
                                        : "text-gray-600 hover:text-teal hover:bg-gray-50"
                                    )}
                                    onClick={() => setOpenDropdown(null)}
                                  >
                                    {tTools(`${tool.key}.title`)}
                                  </Link>
                                );
                              })}
                              <div className="border-t border-gray-100 mt-1 pt-1">
                                <Link
                                  href="/alati"
                                  className="block px-4 py-2.5 rounded-lg text-sm font-semibold text-teal hover:bg-teal-50 transition-colors"
                                  onClick={() => setOpenDropdown(null)}
                                >
                                  {t("tools")} →
                                </Link>
                              </div>
                            </>
                          )}
                          {dropdownKey === "b2b" && (
                            <>
                              {b2bServiceSlugs.map((slug) => {
                                const b2bActive = pathname === `/b2b/${slug}`;
                                return (
                                  <Link
                                    key={slug}
                                    href={{ pathname: "/b2b/[slug]", params: { slug } }}
                                    className={cn(
                                      "block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                                      b2bActive
                                        ? "text-teal bg-teal-50"
                                        : "text-gray-600 hover:text-teal hover:bg-gray-50"
                                    )}
                                    onClick={() => setOpenDropdown(null)}
                                  >
                                    {tB2B(`${slug}.title`)}
                                  </Link>
                                );
                              })}
                              <div className="border-t border-gray-100 mt-1 pt-1">
                                <Link
                                  href="/b2b"
                                  className="block px-4 py-2.5 rounded-lg text-sm font-semibold text-teal hover:bg-teal-50 transition-colors"
                                  onClick={() => setOpenDropdown(null)}
                                >
                                  {t("b2b")} →
                                </Link>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href as "/"}
                    className={cn(
                      "relative px-3 py-2 text-sm font-medium transition-colors duration-200",
                      isActive
                        ? activeColor
                        : cn(textColor, "hover:text-teal")
                    )}
                  >
                    {t(item.label)}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-px bg-teal" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <Link
                href="/prodavnica/korpa"
                className={cn("relative p-2 transition-colors", textColor, "hover:text-teal")}
                aria-label={tShop("cart")}
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span
                    key={itemCount}
                    className="absolute -top-0.5 -right-0.5 bg-teal text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center animate-cart-bump"
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </Link>
              <LanguageSwitcher />
              <button
                className={cn("lg:hidden p-2 cursor-pointer transition-colors", textColor, "hover:text-teal")}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-navy/30 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile slide-in menu */}
      <nav
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-[var(--shadow-elevated)] transition-transform duration-300 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 h-20 border-b border-gray-100">
          <span className="font-heading font-semibold text-navy text-lg">Menu</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 text-gray-400 hover:text-navy cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col py-4 px-4 overflow-y-auto max-h-[calc(100vh-5rem)]">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            if ("hasDropdown" in item && item.hasDropdown === "services") {
              return (
                <div key={item.href}>
                  <button
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-md text-base font-medium transition-colors cursor-pointer",
                      isActive
                        ? "text-teal bg-teal-50"
                        : "text-gray-600 hover:text-navy hover:bg-gray-50"
                    )}
                    onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                  >
                    {t(item.label)}
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      mobileServicesOpen && "rotate-180"
                    )} />
                  </button>
                  <div className={cn(
                    "overflow-hidden transition-all duration-300",
                    mobileServicesOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <div className="pl-4 py-1 space-y-0.5">
                      {serviceSlugs.map((slug) => {
                        const serviceActive = pathname === `/usluge/${slug}`;
                        return (
                          <Link
                            key={slug}
                            href={{ pathname: "/usluge/[slug]", params: { slug } }}
                            className={cn(
                              "block px-4 py-2 rounded-md text-sm font-medium transition-colors",
                              serviceActive
                                ? "text-teal bg-teal-50"
                                : "text-gray-500 hover:text-navy hover:bg-gray-50"
                            )}
                            onClick={() => setMobileOpen(false)}
                          >
                            {tServices(`${slug}.title`)}
                          </Link>
                        );
                      })}
                      <Link
                        href="/usluge"
                        className="block px-4 py-2 rounded-md text-sm font-semibold text-teal hover:bg-teal-50 transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        {t("services")} →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            }

            if ("hasDropdown" in item && item.hasDropdown === "tools") {
              return (
                <div key={item.href}>
                  <button
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-md text-base font-medium transition-colors cursor-pointer",
                      isActive
                        ? "text-teal bg-teal-50"
                        : "text-gray-600 hover:text-navy hover:bg-gray-50"
                    )}
                    onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
                  >
                    {t(item.label)}
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      mobileToolsOpen && "rotate-180"
                    )} />
                  </button>
                  <div className={cn(
                    "overflow-hidden transition-all duration-300",
                    mobileToolsOpen ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <div className="pl-4 py-1 space-y-0.5">
                      {toolLinks.map((tool) => {
                        const toolActive = pathname === tool.href;
                        return (
                          <Link
                            key={tool.href}
                            href={tool.href}
                            className={cn(
                              "block px-4 py-2 rounded-md text-sm font-medium transition-colors",
                              toolActive
                                ? "text-teal bg-teal-50"
                                : "text-gray-500 hover:text-navy hover:bg-gray-50"
                            )}
                            onClick={() => setMobileOpen(false)}
                          >
                            {tTools(`${tool.key}.title`)}
                          </Link>
                        );
                      })}
                      <Link
                        href="/alati"
                        className="block px-4 py-2 rounded-md text-sm font-semibold text-teal hover:bg-teal-50 transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        {t("tools")} →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            }

            if ("hasDropdown" in item && item.hasDropdown === "b2b") {
              return (
                <div key={item.href}>
                  <button
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-md text-base font-medium transition-colors cursor-pointer",
                      isActive
                        ? "text-teal bg-teal-50"
                        : "text-gray-600 hover:text-navy hover:bg-gray-50"
                    )}
                    onClick={() => setMobileB2BOpen(!mobileB2BOpen)}
                  >
                    {t(item.label)}
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      mobileB2BOpen && "rotate-180"
                    )} />
                  </button>
                  <div className={cn(
                    "overflow-hidden transition-all duration-300",
                    mobileB2BOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <div className="pl-4 py-1 space-y-0.5">
                      {b2bServiceSlugs.map((slug) => {
                        const b2bActive = pathname === `/b2b/${slug}`;
                        return (
                          <Link
                            key={slug}
                            href={{ pathname: "/b2b/[slug]", params: { slug } }}
                            className={cn(
                              "block px-4 py-2 rounded-md text-sm font-medium transition-colors",
                              b2bActive
                                ? "text-teal bg-teal-50"
                                : "text-gray-500 hover:text-navy hover:bg-gray-50"
                            )}
                            onClick={() => setMobileOpen(false)}
                          >
                            {tB2B(`${slug}.title`)}
                          </Link>
                        );
                      })}
                      <Link
                        href="/b2b"
                        className="block px-4 py-2 rounded-md text-sm font-semibold text-teal hover:bg-teal-50 transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        {t("b2b")} →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href as "/"}
                className={cn(
                  "px-4 py-3 rounded-md text-base font-medium transition-colors",
                  isActive
                    ? "text-teal bg-teal-50"
                    : "text-gray-600 hover:text-navy hover:bg-gray-50"
                )}
                onClick={() => setMobileOpen(false)}
              >
                {t(item.label)}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer so content doesn't hide behind fixed header */}
      {!isHome && <div className="h-20 md:h-24" />}
    </>
  );
}
