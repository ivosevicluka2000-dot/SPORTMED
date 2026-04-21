import { Link } from "@/i18n/routing";

export default function LocaleNotFound() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-6 py-20">
      <div className="max-w-lg text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-teal mb-3">
          404
        </p>
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-navy mb-4">
          Stranica nije pronađena
        </h1>
        <p className="text-gray-600 mb-8">
          Tražena stranica ne postoji ili je premeštena.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-navy px-6 py-3 text-white font-medium hover:bg-navy/90 transition-colors"
        >
          Vrati se na početnu
        </Link>
      </div>
    </section>
  );
}
