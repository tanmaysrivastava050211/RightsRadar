import Link from 'next/link';

export default function Header() {
  return (
    <header className="max-w-6xl mx-auto px-6 pt-6 flex items-center justify-between relative z-20">
      <Link href="/" className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-signal-teal shadow-glow" />
        <span className="font-display font-semibold tracking-tight text-lg">
          RightsRadar
        </span>
      </Link>
      <nav className="flex items-center gap-3">
        <Link
          href="/scan"
          className="font-mono text-xs tracking-widest bg-signal-teal text-ink font-semibold px-4 py-2 rounded-md hover:brightness-110 transition"
        >
          SCAN
        </Link>
        <Link
          href="/about"
          className="font-mono text-xs tracking-widest border border-line text-text-primary px-4 py-2 rounded-md hover:border-signal-teal/40 transition"
        >
          ABOUT
        </Link>
      </nav>
    </header>
  );
}
