import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#b91c1c',
          color: 'white',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Something went wrong</h1>
          <p style={{ fontSize: '16px', marginBottom: '20px' }}>
            There was an error loading the application. This might be a Firebase configuration issue.
          </p>
          <details style={{ marginBottom: '20px', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>Error Details</summary>
            <pre style={{ 
              backgroundColor: 'rgba(0,0,0,0.3)', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              maxWidth: '80%'
            }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: 'white',
              color: '#b91c1c',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
