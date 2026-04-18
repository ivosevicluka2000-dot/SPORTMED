import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Clock, ClipboardCheck, ArrowRight } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tools" });

  return {
    title: `${t("title")} | Sport Care Med`,
    description: t("subtitle"),
  };
}

const tools = [
  {
    key: "recoveryEstimator" as const,
    href: "/alati/procena-oporavka" as const,
    icon: Clock,
    color: "bg-teal-50 text-teal",
  },
  {
    key: "readinessChecklist" as const,
    href: "/alati/spremnost-za-sport" as const,
    icon: ClipboardCheck,
    color: "bg-accent/10 text-accent",
  },
];

export default async function ToolsPage() {
  const t = await getTranslations("tools");

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-teal text-sm font-medium tracking-wide uppercase mb-4">
            {t("title")}
          </span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-navy mb-4">
            {t("title")}
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Tool cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.key}
              href={tool.href}
              className="group block rounded-2xl border border-gray-200 bg-white p-8 hover:border-teal/30 hover:shadow-[var(--shadow-elevated)] transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center mb-5`}>
                <tool.icon className="w-6 h-6" />
              </div>
              <h2 className="font-heading text-xl font-semibold text-navy mb-2 group-hover:text-teal transition-colors">
                {t(`${tool.key}.title`)}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                {t(`${tool.key}.shortDescription`)}
              </p>
              <span className="inline-flex items-center gap-1.5 text-teal text-sm font-medium">
                {t(`${tool.key}.title`)}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
