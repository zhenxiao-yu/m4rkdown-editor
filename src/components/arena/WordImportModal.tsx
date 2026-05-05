import { useState, useRef } from 'preact/hooks';
import { setCustomWords } from '@/store/custom-words';
import { showToast } from '@/store/toast';

function parseWords(raw: string): string[] {
  const seen = new Set<string>();
  const valid: string[] = [];
  for (const w of raw.split(/[\s,\n\r\t]+/)) {
    const clean = w.trim().toLowerCase();
    if (/^[a-zA-Z]{2,20}$/.test(clean) && !seen.has(clean)) {
      seen.add(clean);
      valid.push(clean);
    }
  }
  return valid;
}

export function WordImportModal({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleTextChange(raw: string) {
    setText(raw);
    setPreview(parseWords(raw).slice(0, 30));
  }

  function handleFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handleTextChange(reader.result as string);
    reader.readAsText(file);
  }

  function handleApply() {
    const valid = parseWords(text);
    if (valid.length < 20) {
      showToast(`Need at least 20 valid words (got ${valid.length})`, 'error');
      return;
    }
    setCustomWords(valid);
    showToast(`${valid.length} custom words loaded!`, 'success');
    onClose();
  }

  const validCount = parseWords(text).length;

  return (
    <>
      <div class="cmd-backdrop" onClick={onClose} />
      <div class="template-modal" role="dialog" aria-label="Import Custom Words" style={{ maxHeight: '80vh' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--c-text)', fontFamily: 'var(--font-ui)' }}>
            📁 Import Custom Words
          </div>
          <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 4 }}>
            Paste words or upload a .txt file — letters only, 2–20 chars, min 20 words.
          </div>
        </div>

        <div style={{ padding: '16px 24px', flex: 1, overflow: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              class="btn-icon"
              style={{ fontSize: 12, padding: '4px 12px' }}
              onClick={() => fileRef.current?.click()}
            >
              📄 Upload .txt
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
          </div>

          <textarea
            style={{
              width: '100%', minHeight: 130, fontFamily: 'var(--font-mono)', fontSize: 13,
              background: 'var(--c-btn)', border: '1px solid var(--c-border)', borderRadius: 6,
              color: 'var(--c-text)', padding: '8px 12px', resize: 'vertical', boxSizing: 'border-box',
            }}
            placeholder={'one word per line, or comma/space separated\napple\nbanana\ncherry…'}
            value={text}
            onInput={(e) => handleTextChange((e.target as HTMLTextAreaElement).value)}
          />

          {validCount > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: validCount >= 20 ? '#22c55e' : '#f59e0b', marginBottom: 6 }}>
                {validCount >= 20 ? `✓ ${validCount} valid words` : `⚠ ${validCount} words (need 20+)`}
                {preview.length < validCount && ` — showing first 30`}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {preview.map(w => (
                  <span key={w} style={{
                    padding: '2px 8px', borderRadius: 12, background: 'var(--c-surface-alt)',
                    border: '1px solid var(--c-border)', fontSize: 12, fontFamily: 'var(--font-mono)',
                  }}>{w}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--c-border)', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button class="btn-icon" style={{ padding: '6px 16px' }} onClick={onClose}>Cancel</button>
          <button
            class="arena-btn-primary"
            style={{ padding: '6px 20px', fontSize: 13 }}
            onClick={handleApply}
            disabled={validCount < 20}
          >
            Apply {validCount >= 20 ? `(${validCount} words)` : ''}
          </button>
        </div>
      </div>
    </>
  );
}
