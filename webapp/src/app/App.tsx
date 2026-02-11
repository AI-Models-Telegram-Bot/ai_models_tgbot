import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Router } from './Router';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-white text-lg font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-400 text-sm mb-4">{this.state.error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-[#00d4ff] text-sm font-medium"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return <>{children}</>;
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function App() {
  const appContent = (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthInitializer>
          <Router />
        </AuthInitializer>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#252547',
              color: '#fff',
              borderRadius: '12px',
            },
            success: {
              iconTheme: { primary: '#00d4ff', secondary: '#fff' },
            },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  );

  // Wrap with GoogleOAuthProvider only if client ID is configured
  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {appContent}
      </GoogleOAuthProvider>
    );
  }

  return appContent;
}
