# RightsRadar 📡

> **Know before you sign.** RightsRadar parses complex legal jargon, contracts, clauses, and notices, translating them into plain-English (or Hindi) summaries, identifying hidden risks, and detailing actionable next steps in seconds.

Built for **Hack Devengers 1.0** and updated to use cutting-edge structured LLM reasoning.

---

## Key Features 🚀

- **Multilingual Support (English & हिन्दी)**: Scan documents in English or Hindi, and receive plain-language summaries, risk explanations, and action steps in either language.
- **Structured AI Insights**: Powered by Google Gemini 3.5 Flash with strict `responseSchema` validation. The analysis is guaranteed to follow our JSON structure, ensuring robust and error-free UI parsing.
- **Smart PDF & TXT Import**: Upload documents directly. Text formatting, empty spacing, and page markers are cleaned up and normalized automatically before processing.
- **Safety Character Constraints**: Integrates a client-side character checker (limit: 6,000 chars) with real-time feedback and count warnings to avoid silent data truncation.
- **Progressive Radar Scanner**: Features a dynamic, multi-stage loading indicator (*Preparing document*, *Analyzing semantics*, *Assessing risks*, *Compiling recommendations*) matched with a sleek visual progress bar.
- **Embedded WebGL Radar Scene**: A premium, responsive 3D Three.js animation that mimics a live radar scan on the landing page.

---

## Tech Stack 🛠️

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **3D Graphics**: Three.js
- **AI Core**: Google Gemini API (`gemini-3.5-flash` with Structured Outputs via `v1beta`)
- **Document Reader**: pdfjs-dist (loaded dynamically on the client-side to keep server bundles lightweight)

---

## Local Setup 💻

Follow these steps to run RightsRadar on your local machine:

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure your environment variables**:
   Create a `.env` or `.env.local` file in the root directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY="your-gemini-api-key-here"
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Production Deployment 🌐

RightsRadar is optimized to deploy seamlessly to **Vercel**:

1. Push your repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. In the project's **Environment Variables** settings, add:
   - `GEMINI_API_KEY` = *your Google AI Studio API Key*
4. Click **Deploy**. Vercel will automatically build the site and provide a live HTTPS link.

---

## Architecture & Security 🔒

- **Secure API Key Management**: The Gemini API key is read strictly on the server side (`app/api/analyze/route.js`). It is never exposed to the client browser.
- **Rate Limiting protection**: Features an in-memory client rate limiter (5 requests per minute per visitor) to protect against API key abuse or daily quota exhaustion.
- **Data Privacy Recommendation**: The Free Tier key may use prompt/response data for model improvement. For production environments containing highly sensitive contracts, link a billing account to your project in Google Cloud to move to the **Paid Pay-As-You-Go Tier** (which disables model training data collection).
