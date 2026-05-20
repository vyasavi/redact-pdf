# RedactPDF

**Automated PII Redaction powered by AI | Privacy-First | Client-Side Processing**

An intelligent document sanitization tool that detects and permanently redacts personally identifiable information (PII) from PDF files using transformer-based AI and local processing. No data leaves your device.

**Live Demo:** [redact-pdf-beta.vercel.app](https://redact-pdf-beta.vercel.app)

---

## Overview

RedactPDF combines a Hugging Face NER transformer with regex pattern matching to detect PII across a PDF's full text layer, maps detected entities to their precise pixel coordinates, and permanently destroys them at the canvas level. The output is a flat, image-only PDF with no text layer, no vector data, and no recoverable content. All processing runs in the browser via WebAssembly or WebGPU; no file is transmitted to any server.

---

## Key Features

- **Transformer-Based Detection** -- Hugging Face token-classification model (GLiNer NER) identifies names, organizations, locations, dates, and contact information with high recall.
- **Regex Fallback Engine** -- Six deterministic patterns cover structured PII: phone numbers, IP addresses, AWS access keys, AWS secrets, CVVs, and sensitive numeric IDs.
- **Hardware-Adaptive Inference** -- Detects available RAM and WebGPU support at runtime, routing to GPU-accelerated inference (WebGPU) or CPU fallback (WASM) accordingly.
- **Pixel-Level Redaction** -- Black rectangles are burned directly into the Canvas pixel buffer. The exported PDF is a JPEG image stack with no text layer and no metadata.
- **Interactive Review** -- A visual editor allows users to toggle, add, or remove individual redaction boxes before finalizing. Category-level toggles support bulk review.
- **Zero Data Retention** -- No server uploads, no analytics, no cookies. All state is cleared on download.

---

## Supported PII Categories

| Category   | Examples                                   |
|------------|--------------------------------------------|
| Names      | Person names, organization names           |
| Contact    | Email addresses, phone numbers             |
| Identity   | SSNs, credit cards, IBAN codes             |
| Location   | Addresses, geographic locations            |
| Technical  | IP addresses, AWS access keys and secrets  |
| Temporal   | Dates, times                               |

---

## Tech Stack

| Layer            | Technologies                                      |
|------------------|---------------------------------------------------|
| Frontend         | Next.js 16, React 19, TypeScript, Tailwind CSS 4  |
| AI Engine        | Hugging Face Transformers.js 4.2, ONNX Runtime    |
| PDF Processing   | PDF.js 5.7, jsPDF 4.2, pdf-lib 1.17              |
| State Management | Zustand 5                                         |

---

## My Contributions (Backend Systems Engineer)

I engineered all four core engine modules powering the detection-to-redaction pipeline, and authored the system documentation.

**AI Engine** (`lib/ai-engine.ts`) -- Dual-engine PII detection combining a Hugging Face token-classification transformer (GLiNer NER via ONNX/WebAssembly or WebGPU) with six regex patterns for structured entities. Implemented the SSR-safe dynamic import pattern to prevent Webpack bundling crashes in Next.js server-side rendering.

**PDF Engine** (`lib/pdf-engine.ts`) -- PDF parsing layer using PDF.js that extracts text tokens with full coordinate metadata, renders pages at 3x scale for print-quality previews, and preserves original bytes via safe copy. Includes the descender-padding fix for accurate Y-coordinate alignment from raw PDF transform values.

**PII Mapper** (`lib/mapping.ts`) -- Fuzzy span-mapping algorithm that matches NER and regex entity spans against PDF text tokens and converts character offsets into percentage-based bounding boxes with deduplication.

**Redaction Surgeon** (`lib/surgeon.ts`) -- Pixel-level flatten-and-burn redaction engine that loads each page onto an HTML Canvas, paints black rectangles directly into the pixel buffer, and exports a flat JPEG stack via jsPDF with no text layer, no vector layer, and no metadata.

I also authored the Use-Case, Sequence, and Class Diagrams (`diagrams/`) and wrote the architecture, algorithm, and implementation sections of the technical report.

---

## Project Structure

```
redact-pdf/
├── app/                     # Next.js App Router
│   ├── page.tsx             # Main application and pipeline orchestration
│   ├── layout.tsx           # Root layout with metadata
│   └── globals.css          # Design system and styling
├── components/
│   ├── RedactionCanvas.tsx  # Interactive redaction editor
│   └── AuditLog.tsx         # Activity log component
├── lib/                     # Core backend logic
│   ├── ai-engine.ts         # Model loading and dual-engine inference
│   ├── pdf-engine.ts        # PDF parsing and text extraction
│   ├── hardware.ts          # Hardware capability detection
│   ├── mapping.ts           # PII-to-PDF coordinate mapping
│   └── surgeon.ts           # Pixel-level redaction engine
├── store/
│   └── useAppStore.ts       # Zustand state machine
├── diagrams/
│   ├── class_diagram.mmd    # Class diagram (Mermaid source)
│   ├── sequence_diagram.mmd # Sequence diagram (Mermaid source)
│   └── use_case.mmd         # Use-case diagram (Mermaid source)
├── types/
│   └── webgpu.d.ts          # WebGPU type definitions
├── next.config.ts           # Webpack ML optimizations
└── tsconfig.json            # TypeScript configuration
```

---

## How It Works

**1. Hardware Detection** -- Checks available RAM and WebGPU support, selecting HIGH tier (WebGPU, GPU-accelerated) or LOW tier (WASM, CPU) for model inference.

**2. Model Loading** -- Loads `openai/privacy-filter` on HIGH tier or `onnx-community/gliner-bi-base-v2.0` on LOW tier, quantized to Q4. The model is cached locally on first run (approximately 300MB).

**3. PDF Parsing** -- PDF.js parses the document, extracting text tokens with coordinate metadata. Each page is rendered at 3x scale to a Canvas for a high-fidelity preview, capped at 20 pages.

**4. PII Detection** -- The transformer runs token-classification on each page's full text. Regex patterns run in parallel, covering structured entities the NER model may miss. Results are merged.

**5. Coordinate Mapping** -- Detected entity spans are fuzzy-matched against PDF text tokens and converted to percentage-based bounding boxes, deduplicated by position.

**6. Interactive Review** -- Detected PII is highlighted in a visual editor. Users can toggle individual boxes, bulk-toggle by category, or draw custom redaction boxes.

**7. Pixel-Level Redaction** -- Each page is loaded onto an HTML Canvas. Black rectangles are burned into the pixel buffer. The result is exported as a flat JPEG and assembled into a jsPDF document.

**8. Download and Wipe** -- The sanitized PDF is downloaded. All page data, model state, and bounding boxes are cleared from memory immediately.

---

## Hardware Tiers

| Tier | Trigger              | Model                          | Device     |
|------|----------------------|--------------------------------|------------|
| HIGH | RAM >= 8GB + WebGPU  | openai/privacy-filter          | WebGPU     |
| LOW  | RAM < 8GB or no GPU  | gliner-bi-base-v2.0 (ONNX)    | WASM (CPU) |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Chrome or Edge (recommended for WebGPU support)

### Installation

```bash
git clone https://github.com/vyasavi/redact-pdf.git
cd redact-pdf
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

```bash
npm run dev      # Development server with hot reload
npm run build    # Production build
npm start        # Start production server
npm run lint     # Lint code
```

---

## Deployment

### Vercel (Recommended)

```bash
npm run build
vercel deploy --prod
```

Ensure the Vercel environment has Node 18+ runtime, 512MB+ memory, and timeouts set to 60 seconds or more.

### Docker

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

## Privacy and Security

- Files are never uploaded to any server.
- All AI inference runs locally in the browser.
- No analytics, no telemetry, no cookies.
- Redactions are burned into pixel data and cannot be reversed.

---

## Troubleshooting

**"Loading Neural Engine" is stuck** -- Check browser storage quota (requires approximately 300MB). Clear cache and reload, or try incognito mode.

**Model download fails** -- Verify internet connection and confirm you are not behind a restrictive firewall. Try a different browser.

**WebGPU unavailable** -- Use Chrome or Edge on desktop. The app falls back to WASM automatically, with slower performance.

---

## License

This project was developed as a team capstone (CS 4366, Texas Tech University). Please contact the repository owner regarding reuse or licensing.
