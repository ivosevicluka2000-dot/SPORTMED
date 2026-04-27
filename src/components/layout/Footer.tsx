import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Phone, Mail, MapPin } from "lucide-react";

const Instagram = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

const Facebook = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);

export default function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tTools = useTranslations("tools");

  return (
    <footer className="bg-navy text-white">
      {/* Gold accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-teal rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <span className="font-heading font-semibold text-xl">Sport Care</span>
                <span className="text-teal font-heading font-semibold text-xl"> Med</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {t("description")}
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/sport.care.med"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-teal hover:border-teal/30 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-teal hover:border-teal/30 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-gray-300 mb-6">{t("quickLinks")}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/usluge" className="text-gray-400 hover:text-white transition-colors text-sm">
                  {tNav("services")}
                </Link>
              </li>
              <li>
                <Link href="/o-nama" className="text-gray-400 hover:text-white transition-colors text-sm">
                  {tNav("about")}
                </Link>
              </li>
              <li>
                <Link href="/lokacija" className="text-gray-400 hover:text-white transition-colors text-sm">
                  {tNav("location")}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white transition-colors text-sm">
                  {tNav("blog")}
                </Link>
              </li>
              <li>
                <Link href="/prodavnica" className="text-gray-400 hover:text-white transition-colors text-sm">
                  {tNav("shop")}
                </Link>
              </li>
              <li>
                <Link href="/b2b" className="text-gray-400 hover:text-white transition-colors text-sm">
                  {tNav("b2b")}
                </Link>
              </li>
              <li>
                <Link href="/alati" className="text-gray-400 hover:text-white transition-colors text-sm">
                  {tNav("tools")}
                </Link>
                <ul className="mt-2 ml-3 space-y-2">
                  <li>
                    <Link href="/alati/procena-oporavka" className="text-gray-500 hover:text-white transition-colors text-xs">
                      {tTools("recoveryEstimator.title")}
                    </Link>
                  </li>
                  <li>
                    <Link href="/alati/spremnost-za-sport" className="text-gray-500 hover:text-white transition-colors text-xs">
                      {tTools("readinessChecklist.title")}
                    </Link>
                  </li>
                </ul>
              </li>
              <li>
                <Link href="/kontakt" className="text-gray-400 hover:text-white transition-colors text-sm">
                  {tNav("contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Working Hours */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-gray-300 mb-6">
              {t("workingHours")}
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>{t("weekdays")}</li>
              <li>{t("saturday")}</li>
              <li>{t("sunday")}</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-gray-300 mb-6">{tNav("contact")}</h3>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                <span>Šabac, Srbija</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-teal flex-shrink-0" />
                <a href="tel:+381691982215" className="hover:text-white transition-colors">
                  +381 69 1982215
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-teal flex-shrink-0" />
                <a href="mailto:info@sportcaremed.com" className="hover:text-white transition-colors">
                  info@sportcaremed.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 mt-14 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Sport Care Med. {t("rights")}
            <span className="mx-2 text-gray-600">·</span>
            PIB: 115516204
            <span className="mx-2 text-gray-600">·</span>
            MB: 68426782
          </p>
          <div className="flex gap-6 text-xs text-gray-500">
            <Link href="/privatnost" className="hover:text-gray-300 transition-colors">
              {t("privacy")}
            </Link>
            <Link href="/uslovi" className="hover:text-gray-300 transition-colors">
              {t("terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
