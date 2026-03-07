/**
 * Error boundary - catches React component errors and displays fallback UI
 */
import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={containerStyle}>
          <div style={cardStyle}>
            <h1 style={titleStyle}>Something went wrong</h1>
            <p style={messageStyle}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button onClick={this.handleReset} style={buttonStyle}>
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const containerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: '1rem',
  background: 'var(--bg)',
};

const cardStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '2rem',
  maxWidth: 500,
  textAlign: 'center',
};

const titleStyle = {
  fontSize: '1.5rem',
  fontWeight: 700,
  marginBottom: '0.75rem',
  color: 'var(--text)',
};

const messageStyle = {
  fontSize: '0.95rem',
  color: 'var(--text-muted)',
  marginBottom: '1.5rem',
  lineHeight: 1.5,
};

const buttonStyle = {
  padding: '0.65rem 1.5rem',
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: '0.95rem',
  fontWeight: 600,
};
