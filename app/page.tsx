'use client';
import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { getHardwareTier } from '@/lib/hardware';
import { processPDF } from '@/lib/pdf-engine';
import { loadModel } from '@/lib/ai-engine';
import { mapPIIToCoordinates } from '@/lib/mapping';
import { applyRedactions } from '@/lib/surgeon';
import { RedactionCanvas } from '@/components/RedactionCanvas';

export default function PIIApp() {
  const store = useAppStore();
  const [file, setFile] = useState<File | null>(null);
  const [originalBytes, setOriginalBytes] = useState<Uint8Array | null>(null);
  const [pageData, setPageData] = useState<any[]>([]);

  const startRedaction = async () => {
    if (!file) return;
    store.reset();
    store.setStatus('loading-model');

    try {
      store.addLog("Detecting hardware...");
      const hw = await getHardwareTier();
      store.setHardwareTier(hw.tier);

      store.addLog("Initializing OpenAI Privacy Filter...");
      const model = await loadModel(hw.tier, (p) => {
        if (p.status === 'progress') store.setProgress(p.progress);
      });

      store.setStatus('processing');
      const { pageData: newPageData, originalBytes: bytes } = await processPDF(file);
      setOriginalBytes(bytes);
      setPageData(newPageData);

      let allBoxes: any[] = [];
      for (const page of newPageData) {
        store.addLog(`Analyzing Page ${page.pageNum}...`);
        const pii = await model(page.fullText, { aggregation_strategy: 'simple' });
        const pageBoxes = mapPIIToCoordinates(page.items, pii);
        allBoxes = [...allBoxes, ...pageBoxes];
      }

      store.setDraftBoxes(allBoxes);
      store.setStatus('reviewing');
      store.addLog(`Detection complete. Found ${allBoxes.length} items for review.`);
    } catch (err: any) {
      store.addLog(`ERROR: ${err.message}`);
      store.setStatus('error');
    }
  };

  const finalizeSurgery = async () => {
    if (pageData.length === 0) return;
    store.setStatus('processing');
    store.addLog("Applying final redactions via Rasterization (Flatten & Burn)...");

    try {
      const activeBoxes = store.draftBoxes.filter(b => b.isActive !== false);
      const redacted = await applyRedactions(pageData, activeBoxes, 'BLACKOUT');
      const blob = new Blob([redacted as any], { type: 'application/pdf' });
      if (store.redactedPdfUrl) URL.revokeObjectURL(store.redactedPdfUrl);
      store.setRedactedPdfUrl(URL.createObjectURL(blob));
      store.setStatus('completed');
      store.addLog("Sanitization complete. Document ready.");
    } catch (err: any) {
      store.addLog(`Surgery Failed: ${err.message}`);
      store.setStatus('error');
    }
  };

  const handleDownloadAndWipe = () => {
    setTimeout(() => {
      setFile(null);
      setOriginalBytes(null);
      setPageData([]);
      store.reset();
    }, 500);
  };

  // Group boxes by category for the sidebar
  const groupedBoxes = useMemo(() => {
    return store.draftBoxes.reduce((acc, box) => {
      const cat = box.category || (box.text ? 'Uncategorized' : 'Manual');
      acc[cat] = acc[cat] || [];
      acc[cat].push(box);
      return acc;
    }, {} as Record<string, typeof store.draftBoxes>);
  }, [store.draftBoxes]);

  const activeCount = store.draftBoxes.filter(b => b.isActive !== false).length;
  const totalCount = store.draftBoxes.length;

  // ─── TRUST BAR ICONS ───────────────────────────────────────────────────
  const trustItems = [
    {
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
      text: "End-to-end processing",
    },
    {
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
      text: "No files stored",
    },
    {
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" /></svg>,
      text: "LLM-powered engine",
    },
    {
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
      text: "No account needed",
    },
  ];

  // ─── ENTITY TAGS for idle state ────────────────────────────────────────
  const entityTags = [
    "Persons", "Email Addresses", "Phone Numbers", "SSNs", "Credit Cards", "Locations", "IP Addresses"
  ];

  const isEditorState = store.status === 'reviewing' || store.status === 'completed';

  return (
    <div className="page-wrapper">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="navbar" aria-label="Main navigation">
        <a href="/" className="navbar-logo" id="logo-link">
          <div className="navbar-logo-dot" aria-hidden="true">R</div>
          RedactPDF
        </a>
        <span className="navbar-badge">Free · Secure · Private</span>
      </nav>

      {/* ── Trust bar ──────────────────────────────────────────────────── */}
      <div className="trust-bar" role="complementary" aria-label="Trust indicators">
        {trustItems.map(({ icon, text }) => (
          <div key={text} className="trust-item">
            <span className="trust-item-icon" aria-hidden="true">{icon}</span>
            {text}
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* EDITOR STATES: reviewing + completed                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {isEditorState ? (
        <div className="editor-wrapper" style={{ maxWidth: '100%', padding: '0 2rem' }}>
          {/* ── TOP TOOLBAR ───────────────────────────────────────────── */}
          {store.status === 'reviewing' && (
            <>
              <div className="editor-toolbar">
                <div className="editor-toolbar-left">
                  <button onClick={finalizeSurgery} className="editor-finalize-btn">
                    Finalize Redactions
                  </button>
                  <div className="editor-file-info">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    <span className="editor-file-name">{file?.name || 'document.pdf'}</span>
                  </div>
                  <span className="editor-stats-badge">{activeCount} / {totalCount} redactions active</span>
                </div>
                <div className="editor-toolbar-center">
                  <button
                    onClick={store.toggleDrawMode}
                    className={`editor-tool-btn ${store.isDrawMode ? 'active' : ''}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
                    Draw Box
                  </button>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>·</span>
                  <div className="editor-legend">
                    <span className="legend-item"><span className="legend-dot" style={{ background: 'rgba(244,63,94,0.5)', border: '1.5px solid #f43f5e' }}></span>Click box to toggle on/off</span>
                    <span className="legend-item"><span className="legend-dot" style={{ background: '#18181b' }}></span>Drag to add box</span>
                  </div>
                </div>
              </div>
              <div className="editor-hint">
                ⚡ Click any highlighted box to toggle it off/on. Use Draw Box to add custom redactions.
              </div>
            </>
          )}

          {/* ── COMPLETED TOOLBAR ─────────────────────────────────────── */}
          {store.status === 'completed' && store.redactedPdfUrl && (
            <div style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              padding: '1.25rem 1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#065f46', fontWeight: 700 }}>✓</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>Success</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{activeCount} redactions applied · Processed locally — No data retained</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <a
                  href={store.redactedPdfUrl}
                  download="redacted_document.pdf"
                  onClick={handleDownloadAndWipe}
                  className="result-download-btn"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Download PDF
                </a>
                <button onClick={() => { setFile(null); setOriginalBytes(null); setPageData([]); store.reset(); }} className="result-reset-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                  Redact another
                </button>
              </div>
            </div>
          )}

          {/* ── MAIN LAYOUT: sidebar (left) + document (right) ─────── */}
          <div className="editor-main-layout" style={{ minHeight: '80vh' }}>
            {/* ── LEFT SIDEBAR ──────────────────────────────────────── */}
            {store.status === 'reviewing' && (
              <div className="editor-sidebar">
                <div className="analytics-panel">
                  <h3 className="analytics-title">Detected PII</h3>
                  <div className="analytics-list">
                    {Object.entries(groupedBoxes).map(([category, boxes]) => {
                      const activeInCat = boxes.filter(b => b.isActive !== false).length;
                      const allActive = activeInCat === boxes.length;
                      const noneActive = activeInCat === 0;
                      return (
                        <div key={category} className="analytics-category-block">
                          <div className="analytics-category-header">
                            <input
                              type="checkbox"
                              className="analytics-checkbox"
                              checked={allActive}
                              ref={(el) => { if (el) el.indeterminate = !allActive && !noneActive; }}
                              onChange={() => store.toggleCategory(category, !allActive)}
                            />
                            <span className="analytics-category-name">{category}</span>
                            <span className="analytics-count-badge">{activeInCat}/{boxes.length}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── DOCUMENT VIEWER ──────────────────────────────────── */}
            <div className="editor-pages-scrollable">
              {store.status === 'completed' && store.redactedPdfUrl ? (
                <iframe
                  src={store.redactedPdfUrl}
                  style={{ width: '100%', height: '100%', minHeight: '80vh', border: 'none', display: 'block' }}
                />
              ) : (
                <div className="editor-pages">
                  {pageData.map((page) => (
                    <div key={page.pageNum} className="editor-page-wrapper" style={{ width: '100%', maxWidth: '800px' }}>
                      <span className="editor-page-label">Page {page.pageNum}</span>
                      <div className="editor-page-container" style={{ width: '100%', aspectRatio: '8.5/11' }}>
                        <img
                          src={page.previewUrl}
                          alt={`Page ${page.pageNum}`}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', userSelect: 'none' }}
                        />
                        <RedactionCanvas pageNum={page.pageNum} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════ */
        /* IDLE / LOADING / ERROR STATES                                 */
        /* ═══════════════════════════════════════════════════════════════ */
        <main className="main-content" id="main-content">
          {/* ── Hero ─────────────────────────────────────────────────── */}
          <div className="hero">
            <span className="hero-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              Privacy-First
            </span>
            <h1 className="hero-title">
              Automated <span className="hero-title-accent">PII Redaction</span>
            </h1>
            <p className="hero-subtitle">
              Upload any PDF and our LLM-powered engine instantly detects and permanently redacts personal information.
            </p>
          </div>

          {/* ── Entity tags ──────────────────────────────────────────── */}
          {store.status === 'idle' && (
            <div className="entity-badges" style={{ marginTop: '0' }}>
              {entityTags.map((tag, i) => (
                <span key={tag} className="entity-badge" style={{ '--bi': i } as any}>
                  <span className="entity-badge-text">{tag.toUpperCase()}</span>
                  <span className="entity-badge-redact"></span>
                </span>
              ))}
            </div>
          )}

          {/* ── Upload Card ──────────────────────────────────────────── */}
          {store.status === 'idle' && (
            <div className="upload-card" id="upload-card">
              <div
                className={`dropzone ${file ? 'active' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedFile = e.dataTransfer.files?.[0];
                  if (droppedFile && droppedFile.type === 'application/pdf') {
                    setFile(droppedFile);
                  }
                }}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" style={{ display: 'none' }} />
                <div className="dropzone-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                </div>
                <h3 className="dropzone-title">{file ? file.name : "Drag & drop your PDF here"}</h3>
                <p className="dropzone-sub">{file ? `${(file.size / 1024).toFixed(1)} KB` : "or"}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); if (!file) { document.getElementById('file-upload')?.click(); } }}
                  className="dropzone-btn"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 9h6v6H9z" /></svg>
                  Choose PDF file
                </button>
                <p className="dropzone-note">PDF only · Max 50MB</p>
              </div>

              {file && (
                <button
                  onClick={startRedaction}
                  className="redact-btn"
                  id="redact-btn"
                >
                  Redact PII Now
                </button>
              )}
            </div>
          )}

          {/* ── Loading / Processing ─────────────────────────────────── */}
          {(store.status === 'loading-model' || store.status === 'processing') && (
            <div className="status-card">
              <div className="spinner-ring"></div>
              <h3 className="status-title">
                {store.status === 'loading-model' ? "Loading Neural Engine" : "Scanning Document"}
              </h3>
              <p className="status-sub">
                {store.status === 'loading-model' ? "Caching AI model to your local machine (first run only)..." : "Applying privacy filters and extracting PII..."}
              </p>
              {store.status === 'loading-model' && (
                <div style={{ marginTop: '1rem', width: '100%', background: '#e2e8f0', borderRadius: '99px', height: '6px' }}>
                  <div style={{ background: 'var(--accent)', height: '6px', borderRadius: '99px', width: `${store.progress || 0}%`, transition: 'width 0.2s' }}></div>
                </div>
              )}
            </div>
          )}

          {/* ── Error ────────────────────────────────────────────────── */}
          {store.status === 'error' && (
            <div className="status-card">
              <div className="error-icon">✕</div>
              <h3 className="error-title">Error Occurred</h3>
              <p className="error-message">Something went wrong during processing. Check logs or refresh.</p>
              <button onClick={() => store.reset()} className="restart-btn" style={{ marginTop: '1rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                Try Again
              </button>
            </div>
          )}

          {/* ── Feature chips (idle only) ────────────────────────────── */}
          {store.status === 'idle' && (
            <div className="features">
              {[
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, text: "Zero data retention" },
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>, text: "Instant processing" },
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /></svg>, text: "LLM-powered detection" },
                { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, text: "GDPR & HIPAA friendly" },
              ].map((f, i) => (
                <div key={i} className="feature-chip" style={{ '--i': i } as any}>
                  <span className="feature-chip-icon">{f.icon}</span>
                  {f.text}
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="footer">
        <p>
          RedactPDF uses local AI processing for accurate, permanent PII redaction. No data leaves your device.
        </p>
      </footer>
    </div>
  );
}