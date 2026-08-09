'use client';

import { useState, useRef } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const SAMPLES = {
  rental:
    'The Tenant shall not be entitled to any refund of the security deposit under any circumstances, including normal wear and tear. The Landlord reserves the right to enter the premises at any time without prior notice. This agreement automatically renews for a further 11 months unless the Tenant provides written notice 60 days in advance.',
  employment:
    'The Employee agrees that for a period of 24 months following termination, for any reason whatsoever, they shall not work in any capacity, for any company, in the same industry, anywhere in the country. The Company may terminate this agreement at any time without notice or cause. All inventions, ideas, and side projects created by the Employee during their tenure, including outside of working hours, shall be the sole property of the Company.',
  nda:
    'Receiving Party shall keep all Confidential Information strictly confidential and shall not disclose it to any third party for a period of 5 years. Confidential Information includes all information disclosed by Disclosing Party, whether marked confidential or not. The Receiving Party agrees that any breach of this agreement will cause irreparable harm, and the Disclosing Party shall be entitled to seek injunctive relief without proving actual damages or posting a bond.',
};

const RISK_STYLES = {
  Low: { color: '#34D399', label: 'LOW RISK', pct: 22 },
  Medium: { color: '#F5A623', label: 'MEDIUM RISK', pct: 58 },
  High: { color: '#F2545B', label: 'HIGH RISK', pct: 90 },
};

const MAX_CHAR_LIMIT = 6000;

const SCAN_STAGES = [
  'Preparing document...',
  'Analyzing clause semantics...',
  'Assessing risk levels...',
  'Compiling action recommendations...'
];

function RiskGauge({ level }) {
  const style = RISK_STYLES[level] || RISK_STYLES.Medium;
  const radius = 54;
  const circumference = Math.PI * radius;
  const offset = circumference - (style.pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="80" viewBox="0 0 140 80">
        <path
          d="M 13 70 A 54 54 0 0 1 127 70"
          fill="none"
          stroke="#263252"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 13 70 A 54 54 0 0 1 127 70"
          fill="none"
          stroke={style.color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="font-mono text-xs tracking-widest -mt-2" style={{ color: style.color }}>
        {style.label}
      </div>
    </div>
  );
}

async function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read this file.'));
    reader.readAsText(file);
  });
}

async function readPdfFile(file) {
  // Loaded dynamically so pdf.js never touches the server bundle.
  const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
}

export default function ScanPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [scanStep, setScanStep] = useState('');
  const [language, setLanguage] = useState('english');
  const fileInputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setError(null);
    setResult(null);
    setUploading(true);
    setFileName(file.name);

    try {
      let extracted = '';
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        extracted = await readPdfFile(file);
      } else if (
        file.type === 'text/plain' ||
        file.name.toLowerCase().endsWith('.txt')
      ) {
        extracted = await readTextFile(file);
      } else {
        throw new Error('Please upload a .pdf or .txt file, or paste your text below.');
      }

      if (!extracted.trim()) {
        throw new Error('Couldn\'t find any readable text in that file. Try pasting it instead.');
      }
      setText(extracted.trim());
    } catch (err) {
      setError(err.message || 'Could not read this file. Try pasting the text instead.');
      setFileName(null);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function scan() {
    if (!text.trim() || text.length > MAX_CHAR_LIMIT) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setScanStep(SCAN_STAGES[0]);

    let stageIndex = 0;
    const interval = setInterval(() => {
      if (stageIndex < SCAN_STAGES.length - 1) {
        stageIndex++;
        setScanStep(SCAN_STAGES[stageIndex]);
      }
    }, 1200);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('429_LIMIT');
        }
        throw new Error(data.error || 'Scan failed. Try again.');
      }
      setResult(data);
    } catch (err) {
      if (err.message === '429_LIMIT') {
        setError(
          <div className="space-y-1">
            <div className="font-semibold">Free Quota Limit Exceeded</div>
            <div>Too many requests are being sent to the Gemini API right now. Please wait a minute and try again.</div>
            <div className="text-xs opacity-80 mt-1 border-t border-signal-coral/20 pt-1">
              Tip: You can use your own Gemini API key in development by setting the <code>GEMINI_API_KEY</code> environment variable in your <code>.env.local</code> file.
            </div>
          </div>
        );
      } else {
        setError(err.message || 'Something went wrong.');
      }
    } finally {
      clearInterval(interval);
      setLoading(false);
      setScanStep('');
    }
  }

  function loadSample(key) {
    setText(SAMPLES[key]);
    setFileName(null);
    setResult(null);
    setError(null);
  }

  return (
    <main className="min-h-screen">
      <Header />

      <section className="max-w-3xl mx-auto px-6 pt-10 pb-6 text-center">
        <span className="font-mono text-xs tracking-widest text-signal-teal">
          DOCUMENT SCANNER
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-semibold mt-3 tracking-tight">
          Scan your document
        </h1>
        <p className="text-text-muted mt-3 max-w-xl mx-auto leading-relaxed">
          Upload a PDF, upload a text file, or paste a clause directly — whatever&apos;s
          easiest.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-6">
        {/* Upload zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-signal-teal bg-signal-teal/5'
              : 'border-line hover:border-signal-teal/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <p className="font-mono text-xs tracking-widest text-text-muted">
            {uploading ? 'READING FILE…' : 'DRAG & DROP A PDF OR TXT FILE'}
          </p>
          <p className="text-text-muted text-sm mt-2">
            {fileName ? `Loaded: ${fileName}` : 'or click to browse'}
          </p>
        </div>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-line flex-1" />
          <span className="font-mono text-xs text-text-muted">OR PASTE TEXT</span>
          <div className="h-px bg-line flex-1" />
        </div>

        {/* Paste panel */}
        <div className="scan-panel bg-surface border border-line rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <span className="font-mono text-xs text-text-muted tracking-widest">
              DOCUMENT INPUT
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => loadSample('rental')}
                className="font-mono text-xs px-2.5 py-1 rounded-md border border-line text-text-muted hover:text-signal-teal hover:border-signal-teal/40 transition-colors"
              >
                Try: rental clause
              </button>
              <button
                onClick={() => loadSample('employment')}
                className="font-mono text-xs px-2.5 py-1 rounded-md border border-line text-text-muted hover:text-signal-teal hover:border-signal-teal/40 transition-colors"
              >
                Try: employment clause
              </button>
              <button
                onClick={() => loadSample('nda')}
                className="font-mono text-xs px-2.5 py-1 rounded-md border border-line text-text-muted hover:text-signal-teal hover:border-signal-teal/40 transition-colors"
              >
                Try: NDA clause
              </button>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setFileName(null);
            }}
            placeholder="Paste a rental clause, notice, employment contract line, or any legal text you don't fully understand…"
            rows={8}
            className="w-full bg-transparent resize-none outline-none placeholder:text-text-muted/60 text-text-primary leading-relaxed"
          />

          {text.length > MAX_CHAR_LIMIT && (
            <div className="mb-3 text-xs text-signal-coral border border-signal-coral/20 bg-signal-coral/5 rounded-xl px-3 py-2.5">
              Your text is too long ({text.length} characters). RightsRadar works best on smaller sections or individual clauses (limit: {MAX_CHAR_LIMIT} chars). Please shorten your input.
            </div>
          )}

          <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <span className={`font-mono text-xs ${text.length > MAX_CHAR_LIMIT ? 'text-signal-coral font-semibold animate-pulse' : 'text-text-muted'}`}>
                {text.length} / {MAX_CHAR_LIMIT} chars
              </span>
              
              <div className="flex items-center gap-1 border border-line rounded-lg p-0.5 bg-ink">
                <button
                  onClick={() => setLanguage('english')}
                  className={`font-mono text-[10px] px-2.5 py-1 rounded-md transition-colors ${
                    language === 'english'
                      ? 'bg-signal-teal text-ink font-semibold'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  ENGLISH
                </button>
                <button
                  onClick={() => setLanguage('hindi')}
                  className={`font-mono text-[10px] px-2.5 py-1 rounded-md transition-colors ${
                    language === 'hindi'
                      ? 'bg-signal-teal text-ink font-semibold'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  हिन्दी
                </button>
              </div>
            </div>

            <button
              onClick={scan}
              disabled={loading || uploading || !text.trim() || text.length > MAX_CHAR_LIMIT}
              className="bg-signal-teal text-ink font-semibold px-5 py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                'Scan document'
              )}
            </button>
          </div>
        </div>

        {loading && (
          <div className="mt-4 border border-line rounded-2xl bg-surface p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs text-signal-teal tracking-widest uppercase animate-pulse">
                Radar Scan Active
              </span>
              <span className="text-xs text-text-muted font-mono">{scanStep}</span>
            </div>
            <div className="w-full bg-ink h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-signal-teal h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${
                    scanStep === SCAN_STAGES[0] ? '25%' :
                    scanStep === SCAN_STAGES[1] ? '50%' :
                    scanStep === SCAN_STAGES[2] ? '75%' : '95%'
                  }`
                }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 border border-signal-coral/30 bg-signal-coral/5 text-signal-coral text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
      </section>

      {result && (
        <section className="max-w-3xl mx-auto px-6 mt-10 pb-16">
          <div className="border border-line rounded-2xl bg-surface p-6 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
              <div>
                <span className="font-mono text-xs text-text-muted tracking-widest">
                  SCAN RESULT
                </span>
                <p className="text-text-primary leading-relaxed mt-2">
                  {result.plainSummary}
                </p>
              </div>
              <RiskGauge level={result.riskLevel} />
            </div>

            {Array.isArray(result.riskyClauses) && result.riskyClauses.length > 0 && (
              <div>
                <span className="font-mono text-xs text-text-muted tracking-widest">
                  FLAGGED CLAUSES
                </span>
                <div className="mt-3 space-y-3">
                  {result.riskyClauses.map((c, i) => (
                    <div key={i} className="border border-line rounded-xl p-4 bg-surface2">
                      <p className="text-sm text-text-primary/90 italic">&ldquo;{c.clause}&rdquo;</p>
                      <p className="text-sm text-text-muted mt-2">{c.explanation}</p>
                      {c.recommendation && (
                        <p className="text-sm text-signal-teal mt-2">→ {c.recommendation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(result.actionSteps) && result.actionSteps.length > 0 && (
              <div>
                <span className="font-mono text-xs text-text-muted tracking-widest">
                  WHAT TO DO NEXT
                </span>
                <ul className="mt-3 space-y-2">
                  {result.actionSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-signal-teal mt-1.5 shrink-0" />
                      <span className="text-text-primary/90">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-text-muted border-t border-line pt-4">
              RightsRadar gives plain-language guidance, not legal advice. For
              anything high-stakes, confirm with a qualified lawyer.
            </p>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
