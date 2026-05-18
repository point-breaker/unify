import React from 'react';
import HealthDashboard from '../modules/health/HealthDashboard';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("HealthDashboard Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#1e1e1e', color: 'white', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2 style={{ color: '#ef4444' }}>Health Dashboard Crashed!</h2>
          <p>Please share this exact error message:</p>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '20px', borderRadius: '8px', overflowX: 'auto', marginBottom: '20px' }}>
            <strong style={{ fontSize: '18px', color: '#fca5a5' }}>{this.state.error?.toString()}</strong>
          </div>
          <h3>Component Stack Trace:</h3>
          <pre style={{ background: '#000', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '12px', color: '#34d399' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <h3>Stack Trace:</h3>
          <pre style={{ background: '#000', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '12px', color: '#93c5fd' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const Health = () => {
    return (
        <ErrorBoundary>
            <HealthDashboard />
        </ErrorBoundary>
    );
};

export default Health;
