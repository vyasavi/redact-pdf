# 🔒 RedactPDF

**Automated PII Redaction powered by AI • Privacy-First • Client-Side Processing**

An intelligent document sanitization tool that detects and permanently redacts personally identifiable information (PII) from PDF files using LLM-powered AI and local processing. No data leaves your device.

🚀 **Live Demo:** [redact-pdf-beta.vercel.app](https://redact-pdf-beta.vercel.app)

---

## ✨ Key Features

- 🤖 **LLM-Powered Detection** – Uses Hugging Face transformers for accurate PII identification
- 🔐 **Client-Side Processing** – All processing happens locally; no server uploads
- 🎯 **Multi-Entity Support** – Detects names, emails, phones, SSNs, credit cards, IPs, and more
- 📝 **Interactive Review** – Visual redaction editor with manual override capabilities
- ⚡ **Smart Hardware Scaling** – Adapts to device capabilities (WebGPU/WASM)
- 🔥 **Nuclear Redaction** – Pixel-level permanent redaction with zero recovery
- ♿ **Accessible UI** – ARIA labels, keyboard navigation, semantic HTML

---

## 🎯 Supported PII Categories

| Category | Examples |
|----------|----------|
| **Names** | Person, Organization names |
| **Contact** | Email addresses, Phone numbers |
| **Identity** | SSNs, Credit cards, IBAN codes |
| **Location** | Addresses, Geographic locations |
| **Technical** | IP addresses, API keys (AWS/custom) |
| **Temporal** | Dates, times |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| **AI Engine** | Hugging Face Transformers 4.2, ONNX Runtime |
| **PDF Processing** | PDF.js 5.7, jsPDF 4.2, pdf-lib 1.17 |
| **State Management** | Zustand 5 |
| **Icons** | Lucide React 1.14 |

---

## 📁 Project Structure

```
redact-pdf/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main PII detection UI
│   ├── layout.tsx         # Root layout with metadata
│   └── globals.css        # Design system & styling
├── components/
│   └── RedactionCanvas.tsx # Interactive redaction editor
├── lib/                    # Core business logic
│   ├── ai-engine.ts       # Model loading & inference
│   ├── pdf-engine.ts      # PDF parsing & text extraction
│   ├── hardware.ts        # Hardware capability detection
│   ├── mapping.ts         # PII→PDF coordinate mapping
│   └── surgeon.ts         # Pixel-level redaction engine
├── store/
│   └── useAppStore.ts     # Zustand state management
├── types/
│   └── webgpu.d.ts        # WebGPU type definitions
├── public/
│   └── pdf.worker.min.mjs # PDF.js web worker
├── package.json           # Dependencies
├── next.config.ts         # Webpack ML optimizations
└── tsconfig.json          # TypeScript config

```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ (with npm or yarn)
- **Modern browser** with WebGPU support (Chrome/Edge recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/Aakash-Bora/redact-pdf.git
cd redact-pdf

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 How It Works

### 1️⃣ **Hardware Detection**
   - Checks available RAM and WebGPU support
   - Selects HIGH tier (WebGPU) or LOW tier (WASM)

### 2️⃣ **Model Loading**
   - Loads `openai/privacy-filter` (HIGH) or `gliner-bi-base-v2.0` (LOW)
   - Caches locally on first run (~300MB)

### 3️⃣ **PDF Analysis**
   - Parses PDF and extracts text tokens
   - Generates high-quality page previews
   - Preserves coordinate metadata

### 4️⃣ **PII Detection**
   - Runs token-classification on full page text
   - Combines AI + regex pattern matching
   - Maps entities to PDF coordinates

### 5️⃣ **Interactive Review**
   - Display detected PII with visual highlights
   - Users can toggle/add/remove redactions
   - Draw custom boxes for manual redaction

### 6️⃣ **Final Redaction**
   - Burns black pixels directly into page images
   - Exports flat JPEG stack (no text layer)
   - Irreversible pixel-level destruction

### 7️⃣ **Download & Wipe**
   - Downloads sanitized PDF
   - Clears all data from memory
   - Zero trace remains

---

## 📦 Available Scripts

```bash
# Development (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

## 🧠 State Management (Zustand Store)

The app uses a centralized Zustand store (`store/useAppStore.ts`) to manage:

- **Processing State** – idle → loading-model → processing → reviewing → completed/error
- **UI State** – draw mode, progress percentage
- **Data State** – detected boxes, logs, hardware tier, PDF URL
- **Actions** – toggle boxes, add/remove redactions, category filtering

---

## 🔧 Configuration

### Hardware Tiers

| Tier | Trigger | Model | Device |
|------|---------|-------|--------|
| **HIGH** | RAM ≥ 8GB + WebGPU | openai/privacy-filter | WebGPU (GPU) |
| **LOW** | RAM < 8GB or no WebGPU | gliner-bi-base-v2.0 | WASM (CPU) |

### Environment Setup

Create a `.env.local` file if needed:
```env
# Optional: Configure model cache directory
TRANSFORMERS_CACHE=/path/to/cache
```

---

## 🎨 UI/UX Highlights

- **Responsive Design** – Works on desktop, tablet, mobile
- **Accessibility** – WCAG 2.1 AA compliant with ARIA labels
- **Dark Mode Ready** – CSS variables for theme switching
- **Animations** – Smooth transitions and micro-interactions
- **Error Handling** – User-friendly error messages with recovery options

---

## ⚙️ Advanced Features

### Custom Redaction Drawing
- Toggle "Draw Box" mode in the review interface
- Click & drag to create custom redaction boxes
- Hover to delete individual boxes

### Category Filtering
- Sidebar shows detected PII grouped by category
- Check/uncheck entire categories at once
- Individual toggle for each detection

### Regex Pattern Matching
Fallback patterns for detection:
- Phone numbers: `(123) 456-7890`
- Credit cards: 16-digit numbers
- IPs: `192.168.1.1`
- AWS keys: `AKIA*`

---

## 📄 PDF Processing Pipeline

```
Input PDF
    ↓
[Parse with PDF.js]
    ↓
[Extract text tokens + generate previews]
    ↓
[Detect PII with AI + Regex]
    ↓
[Map entities to coordinates]
    ↓
[Interactive Review]
    ↓
[Render to Canvas + Burn pixels black]
    ↓
[Export as flat JPEG → jsPDF]
    ↓
Redacted PDF (Irreversible)
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# One-click deploy
npm run build
vercel deploy --prod
```

**Note:** Ensure your Vercel environment has:
- Node 18+ runtime
- 512MB+ memory
- Timeouts set to ≥60s

### Self-Hosted

```bash
# Build
npm run build

# Start
npm start
```

Or use Docker:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔒 Privacy & Security

✅ **Zero Server Storage** – Files never uploaded  
✅ **Client-Side Processing** – All AI runs locally  
✅ **No Analytics** – Zero telemetry  
✅ **No Cookies** – Stateless operation  
✅ **Pixel-Level Redaction** – Cryptographically irreversible  

---

## 🐛 Troubleshooting

### Issue: "Loading Neural Engine" stuck
- **Solution:** Check browser storage quota (requires ~300MB)
- Clear browser cache and reload
- Try in incognito/private mode

### Issue: Model download fails
- **Solution:** Check internet connection
- Verify you're not behind a restrictive firewall
- Try a different browser

### Issue: WebGPU not available
- **Solution:** Use Chrome/Edge on desktop
- Falls back to WASM automatically
- Performance will be slower

---

## 📚 Key Libraries & APIs

| Library | Purpose | Docs |
|---------|---------|------|
| `@huggingface/transformers` | Token classification | [Docs](https://huggingface.co/docs/transformers.js) |
| `pdfjs-dist` | PDF parsing | [Docs](https://mozilla.github.io/pdf.js/) |
| `jspdf` | PDF generation | [Docs](https://github.com/parallax/jsPDF) |
| `zustand` | State management | [Docs](https://github.com/pmndrs/zustand) |

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit changes (`git commit -m 'Add my feature'`)
4. Push to branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📝 License

This project is a fork of [shreenath04/redact-pdf](https://github.com/shreenath04/redact-pdf). Please check the original repository for license information.

---

## 🙋 Support & Feedback

- 🐛 **Report Bugs** – Open an issue on GitHub
- 💡 **Feature Requests** – Discussions welcome
- ❓ **Questions** – Check existing issues first

---

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js)
- [PDF.js Guide](https://mozilla.github.io/pdf.js/getting_started/)
- [Zustand Docs](https://github.com/pmndrs/zustand)

---

**Made with ❤️ for privacy-conscious developers**
