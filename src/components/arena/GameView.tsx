import { useEffect, useRef, useState } from 'preact/hooks';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { githubLight } from '@uiw/codemirror-theme-github';
import { defaultKeymap, historyKeymap } from '@codemirror/commands';
import { theme } from '@/store/theme';
import {
  arenaPrompt, arenaPlayers, arenaPlayerId,
  arenaTypedText, arenaWpm, arenaAccuracy, arenaCursorPos,
  arenaGameStartedAt, arenaFinished,
} from '@/store/arena';
import { calculateWpm, calculateAccuracy } from '@/lib/arena-scoring';
import { sendMsg } from '@/lib/partykit-client';

const WPM_MILESTONES = [40, 60, 80, 100];

const debounceProgress = (() => {
  let t = 0;
  return (fn: () => void) => { clearTimeout(t); t = window.setTimeout(fn, 100); };
})();

export function GameView() {
  const editorRef  = useRef<HTMLDivElement>(null);
  const cmRef      = useRef<EditorView | null>(null);
  const promptRef  = useRef<HTMLPreElement>(null);
  const prevTextRef = useRef('');
  const comboRef   = useRef(0);
  const passedMilestonesRef = useRef(new Set<number>());

  const prompt   = arenaPrompt.value;
  const players  = arenaPlayers.value;
  const myId     = arenaPlayerId.value;
  const typed    = arenaTypedText.value;
  const wpm      = arenaWpm.value;
  const accuracy = arenaAccuracy.value;
  const finished = arenaFinished.value;

  const [combo, setCombo]               = useState(0);
  const [scoreFloats, setScoreFloats]   = useState<{ id: number; x: number; y: number }[]>([]);
  const [milestone, setMilestone]       = useState<string | null>(null);
  const milestoneTimerRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mount CodeMirror editor
  useEffect(() => {
    if (!editorRef.current || !prompt) return;

    const isDark = theme.value === 'dark';
    const editableComp = new Compartment();

    const view = new EditorView({
      state: EditorState.create({
        doc: '',
        extensions: [
          isDark ? oneDark : githubLight,
          markdown(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          editableComp.of(EditorView.editable.of(true)),
          EditorView.theme({
            '&': { height: '100%', fontSize: '13px' },
            '.cm-scroller': { fontFamily: 'monospace', lineHeight: '1.7', overflow: 'auto' },
            '.cm-content': { padding: '16px' },
            '.cm-focused': { outline: 'none' },
          }),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            const text = update.state.doc.toString();
            const startedAt = arenaGameStartedAt.value;
            if (!startedAt || arenaFinished.value) return;

            const elapsedMs   = Date.now() - startedAt;
            const wpmCalc     = calculateWpm(text.length, elapsedMs);
            const accCalc     = calculateAccuracy(text, prompt.content);
            const cursorPos   = Math.min(text.length, prompt.content.length);

            arenaTypedText.value  = text;
            arenaWpm.value        = wpmCalc;
            arenaAccuracy.value   = accCalc;
            arenaCursorPos.value  = cursorPos;

            // ── Game juice: detect new char ─────────────────────────
            const prev = prevTextRef.current;
            if (text.length > prev.length) {
              const i = text.length - 1;
              const correct = text[i] === prompt.content[i];

              if (correct) {
                // Combo
                comboRef.current += 1;
                setCombo(comboRef.current);

                // Score float near cursor
                if (editorRef.current) {
                  const rect = editorRef.current.getBoundingClientRect();
                  const id = Date.now() + Math.random();
                  const x = rect.width * 0.6 + Math.random() * 20 - 10;
                  const y = rect.height * 0.4 + Math.random() * 20 - 10;
                  setScoreFloats(f => [...f, { id, x, y }]);
                  setTimeout(() => setScoreFloats(f => f.filter(sf => sf.id !== id)), 900);
                }

                // WPM milestone
                for (const ms of WPM_MILESTONES) {
                  if (wpmCalc >= ms && !passedMilestonesRef.current.has(ms)) {
                    passedMilestonesRef.current.add(ms);
                    setMilestone(`🔥 ${ms} WPM!`);
                    if (milestoneTimerRef.current) clearTimeout(milestoneTimerRef.current);
                    milestoneTimerRef.current = setTimeout(() => setMilestone(null), 2600);
                  }
                }
              } else {
                // Error: reset combo + shake
                comboRef.current = 0;
                setCombo(0);
                if (promptRef.current) {
                  const el = promptRef.current;
                  el.classList.remove('game-shake');
                  void el.offsetWidth; // force reflow
                  el.classList.add('game-shake');
                }
              }
            }
            prevTextRef.current = text;
            // ── End game juice ──────────────────────────────────────

            debounceProgress(() => {
              sendMsg({ type: 'progress', typedText: text, wpm: wpmCalc, accuracy: accCalc, cursorPos });
            });

            // Check completion
            if (text === prompt.content) {
              arenaFinished.value = true;
              sendMsg({
                type: 'finish',
                typedText: text,
                finalWpm: wpmCalc,
                finalAccuracy: accCalc,
                timeMs: elapsedMs,
              });
              view.dispatch({ effects: editableComp.reconfigure(EditorView.editable.of(false)) });
            }
          }),
        ],
      }),
      parent: editorRef.current,
    });

    cmRef.current = view;
    view.focus();

    return () => { view.destroy(); cmRef.current = null; };
  }, [prompt?.id]);

  if (!prompt) return null;

  // Build character-by-character prompt display
  const chars = prompt.content.split('');
  const curPos = typed.length;

  const wpmColor = wpm >= 60 ? '#22c55e' : wpm >= 30 ? '#f59e0b' : 'var(--c-danger)';
  const accColor = accuracy >= 95 ? '#22c55e' : accuracy >= 80 ? '#f59e0b' : 'var(--c-danger)';
  const isAccuracyGlow = accuracy >= 98;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>

      {/* Milestone banner */}
      {milestone && (
        <div class="milestone-banner">{milestone}</div>
      )}

      {/* Main area: prompt + editor side-by-side */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left — prompt display */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px',
          borderRight: '1px solid var(--c-border)',
          background: 'var(--c-surface-alt)',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            Prompt — Type this exactly
          </div>
          <pre
            ref={promptRef}
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              margin: 0,
            }}
          >
            {chars.map((ch, i) => {
              let cls = 'arena-char-untyped';
              if (i < typed.length) {
                cls = typed[i] === ch ? 'arena-char-correct' : 'arena-char-incorrect';
              }
              const isCursor = i === curPos;
              return (
                <span key={i} class={`${cls}${isCursor ? ' arena-char-cursor' : ''}`}>
                  {ch === '\n' ? '\n' : ch}
                </span>
              );
            })}
            {curPos >= chars.length && <span class="arena-char-cursor"> </span>}
          </pre>
        </div>

        {/* Right — editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 20px 8px', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
            Your Typing
          </div>
          <div ref={editorRef} style={{ flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>
            {/* Score floats */}
            {scoreFloats.map(sf => (
              <div
                key={sf.id}
                class="score-float"
                style={{ left: sf.x, top: sf.y }}
              >
                +1
              </div>
            ))}
          </div>
          {finished && (
            <div style={{
              position: 'absolute', inset: 0, background: '#16a34a18', backdropFilter: 'blur(2px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '8px',
            }}>
              <div style={{ fontSize: '48px' }}>🎉</div>
              <div style={{ fontWeight: 700, fontSize: '18px', color: '#22c55e' }}>Finished!</div>
              <div style={{ fontSize: '13px', color: 'var(--c-muted)' }}>Waiting for others…</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom stats bar */}
      <div style={{
        flexShrink: 0,
        borderTop: '1px solid var(--c-border)',
        background: 'var(--c-header)',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        overflow: 'hidden',
      }}>
        {/* WPM */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '28px', fontWeight: 800, color: wpmColor, lineHeight: 1 }}>{wpm}</span>
          <span style={{ fontSize: '11px', color: 'var(--c-muted)', fontWeight: 600 }}>WPM</span>
        </div>

        {/* Accuracy */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span
            style={{ fontSize: '20px', fontWeight: 700, color: accColor, lineHeight: 1 }}
            class={isAccuracyGlow ? 'accuracy-glow' : ''}
          >
            {accuracy}%
          </span>
          <span style={{ fontSize: '11px', color: 'var(--c-muted)', fontWeight: 600 }}>ACC</span>
        </div>

        {/* Combo badge — only when combo >= 5 */}
        {combo >= 5 && (
          <div class="combo-badge">
            <span
              key={combo}
              class="game-combo-counter"
            >
              ×{combo}
            </span>
            combo
          </div>
        )}

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--c-text)' }}>
            {Math.min(typed.length, prompt.content.length)}/{prompt.content.length}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--c-muted)', fontWeight: 600 }}>chars</span>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '30px', background: 'var(--c-border)' }} />

        {/* Mini leaderboard */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', overflow: 'hidden' }}>
          {players.slice(0, 4).map((p, i) => {
            const pct = Math.min(100, (p.cursorPos / prompt.content.length) * 100);
            const barColors = ['#f7df4b', '#9ca3af', '#cd7f32', '#6b7280'];
            const isMe = p.id === myId;
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ fontSize: '10px', color: 'var(--c-muted)', width: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {isMe ? <strong>{p.name}</strong> : p.name}
                </span>
                <div class="arena-progress-bar" style={{ flex: 1 }}>
                  <div
                    class={`arena-progress-fill${isMe && !p.finished ? ' arena-progress-fill--active' : ''}`}
                    style={{ width: `${pct}%`, background: p.finished ? '#22c55e' : barColors[i] ?? '#6b7280' }}
                  />
                </div>
                <span style={{ fontSize: '10px', color: 'var(--c-muted)', width: '30px', textAlign: 'right', flexShrink: 0 }}>
                  {p.finished ? '✓' : `${Math.round(pct)}%`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
