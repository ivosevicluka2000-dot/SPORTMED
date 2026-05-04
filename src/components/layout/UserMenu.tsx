"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { User as UserIcon, LogOut, Package, ChevronDown, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import SignOutButton from "@/components/account/SignOutButton";
import { cn } from "@/lib/utils";

interface Props {
  textColorClass: string;
}

export default function UserMenu({ textColorClass }: Props) {
  const t = useTranslations("account.nav");
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const loadRole = async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      if (active) setIsAdmin(data?.role === "admin");
    };

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.user?.email ?? null);
      if (data.user?.id) loadRole(data.user.id);
      else setIsAdmin(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
      if (session?.user?.id) loadRole(session.user.id);
      else setIsAdmin(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (email === undefined) {
    // Avoid layout shift while we don't yet know the auth state.
    return <div className="w-9 h-9" aria-hidden />;
  }

  if (email === null) {
    return (
      <Link
        href="/nalog/prijava"
        className={cn(
          "p-2 transition-colors hover:text-teal",
          textColorClass
        )}
        aria-label={t("login")}
      >
        <UserIcon className="w-5 h-5" />
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1 p-2 transition-colors hover:text-teal",
          textColorClass
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <UserIcon className="w-5 h-5" />
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden z-50"
        >
          <div className="px-4 py-3 border-b border-gray-100 text-xs text-gray-500 truncate">
            {email}
          </div>
          <Link
            href="/nalog"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <Package className="w-4 h-4" />
            {t("orders")}
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-teal hover:bg-gray-50 font-medium"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <Shield className="w-4 h-4" />
              {t("admin")}
            </Link>
          )}
          <div className="border-t border-gray-100">
            <SignOutButton
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
              label={t("logout")}
            />
            <span className="sr-only">
              <LogOut className="w-4 h-4" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
