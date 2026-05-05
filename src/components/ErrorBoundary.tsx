import { Component } from 'preact';
import type { ComponentChildren } from 'preact';

interface Props { children: ComponentChildren; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        background: 'var(--c-bg)', color: 'var(--c-text)',
        fontFamily: 'var(--font-ui)', padding: 32, textAlign: 'center',
      }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Something went wrong</div>
        <div style={{ fontSize: 13, color: 'var(--c-muted)', maxWidth: 480, lineHeight: 1.6 }}>
          {error.message}
        </div>
        <button
          onClick={() => { this.setState({ error: null }); window.location.reload(); }}
          style={{
            marginTop: 8, padding: '10px 24px', borderRadius: 8, cursor: 'pointer',
            background: 'var(--c-accent)', color: '#000', fontWeight: 700,
            fontSize: 14, border: 'none', fontFamily: 'var(--font-ui)',
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
