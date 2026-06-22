import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Portfolio render error:', error, info);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            padding: 32,
            background: '#0a0a0a',
            color: '#f5f5f5',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ color: '#a3a3a3', marginBottom: 16 }}>
            The portfolio hit a JavaScript error. Try a hard refresh (Cmd+Shift+R). If it
            persists, restart the dev server.
          </p>
          <pre
            style={{
              padding: 16,
              background: '#1c1c1c',
              borderRadius: 8,
              overflow: 'auto',
              fontSize: 13,
              color: '#f87171',
            }}
          >
            {error.message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
