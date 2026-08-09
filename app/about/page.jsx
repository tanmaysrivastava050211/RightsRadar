import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <Header />

      <section className="max-w-2xl mx-auto px-6 pt-16 pb-20">
        <span className="font-mono text-xs tracking-widest text-signal-teal">
          WHY RIGHTSRADAR
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-semibold mt-4 tracking-tight leading-tight">
          Most people sign things they don&apos;t fully understand.
        </h1>
        <p className="text-text-muted mt-6 leading-relaxed">
          Rental agreements, offer letters, notices, terms of service — they&apos;re
          written in a language most of us were never taught to read. Not
          because the ideas are hard, but because legal writing hides plain
          concepts behind jargon most people quietly skip past.
        </p>
        <p className="text-text-muted mt-4 leading-relaxed">
          RightsRadar doesn&apos;t replace a lawyer. It does something smaller
          and more immediate: it reads the document with you, explains what it
          actually means, and flags the parts worth a second look — before you
          sign, not after.
        </p>

        <div className="border border-line rounded-2xl bg-surface p-6 mt-10">
          <span className="font-mono text-xs tracking-widest text-text-muted">
            WHAT IT IS — AND ISN&apos;T
          </span>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-green mt-1.5 shrink-0" />
              <span className="text-text-primary/90">
                A plain-language explainer for contracts, clauses, and notices.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-green mt-1.5 shrink-0" />
              <span className="text-text-primary/90">
                A first pass that flags unusual or one-sided terms worth
                questioning.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-coral mt-1.5 shrink-0" />
              <span className="text-text-primary/90">
                Not legal advice, and not a substitute for a qualified
                lawyer on anything high-stakes.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-coral mt-1.5 shrink-0" />
              <span className="text-text-primary/90">
                Not a guarantee of enforceability — laws vary by region and
                circumstance.
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/scan"
            className="inline-block bg-signal-teal text-ink font-semibold px-6 py-3 rounded-lg hover:brightness-110 transition"
          >
            Try scanning a document
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
