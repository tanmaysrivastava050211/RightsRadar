import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="max-w-6xl mx-auto px-6 py-10 mt-16 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-signal-teal" />
        <span className="font-mono text-xs text-text-muted">
          RightsRadar — Know before you sign.
        </span>
      </div>
      <div className="flex items-center gap-5">
        <Link
          href="/scan"
          className="font-mono text-xs text-text-muted hover:text-signal-teal transition-colors"
        >
          Scan a document
        </Link>
        <Link
          href="/about"
          className="font-mono text-xs text-text-muted hover:text-signal-teal transition-colors"
        >
          About
        </Link>
      </div>
    </footer>
  );
}
