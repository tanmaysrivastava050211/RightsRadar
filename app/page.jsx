import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RadarScene from '../components/RadarScene';

const STEPS = [
  {
    label: 'PASTE OR UPLOAD',
    title: 'Drop in any document',
    desc: 'A rental clause, an offer letter, a notice — paste the text or upload a PDF.',
  },
  {
    label: 'RADAR SCANS',
    title: 'AI reads the fine print',
    desc: 'RightsRadar explains it in plain English and flags anything unusual.',
  },
  {
    label: 'YOU ACT',
    title: 'Know exactly what to do',
    desc: 'Get a risk level and concrete next steps — before you sign anything.',
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-6 pb-24">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="text-center md:text-left order-2 md:order-1">
            <span className="font-mono text-xs tracking-widest text-signal-teal">
              PLAIN-LANGUAGE DOCUMENT SCANNER
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-semibold mt-4 tracking-tight leading-tight">
              Don&apos;t sign what you don&apos;t understand.
            </h1>
            <p className="text-text-muted mt-5 leading-relaxed max-w-md mx-auto md:mx-0">
              RightsRadar scans contracts, notices, and agreements in seconds —
              plain-English summary, risk flags, and exactly what to do next.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center md:justify-start">
              <Link
                href="/scan"
                className="bg-signal-teal text-ink font-semibold px-6 py-3 rounded-lg hover:brightness-110 transition text-center"
              >
                Scan a document
              </Link>
              <Link
                href="/about"
                className="border border-line text-text-primary px-6 py-3 rounded-lg hover:border-signal-teal/40 transition text-center"
              >
                Why RightsRadar
              </Link>
            </div>
          </div>

          <div className="order-1 md:order-2 h-[340px] md:h-[420px] relative">
            <RadarScene />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <span className="font-mono text-xs tracking-widest text-text-muted">
            HOW IT WORKS
          </span>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="border border-line rounded-2xl bg-surface p-6 relative"
            >
              <span className="font-mono text-xs tracking-widest text-signal-teal">
                {step.label}
              </span>
              <h3 className="font-display text-xl font-semibold mt-3">
                {step.title}
              </h3>
              <p className="text-text-muted text-sm mt-2 leading-relaxed">
                {step.desc}
              </p>
              {i < STEPS.length - 1 && (
                <span
                  className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-signal-teal/40 font-mono"
                  aria-hidden="true"
                >
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
          Got something to sign today?
        </h2>
        <p className="text-text-muted mt-3">
          Scan it before you do. Takes about ten seconds.
        </p>
        <Link
          href="/scan"
          className="inline-block mt-6 bg-signal-teal text-ink font-semibold px-6 py-3 rounded-lg hover:brightness-110 transition"
        >
          Scan a document
        </Link>
      </section>

      <Footer />
    </main>
  );
}
