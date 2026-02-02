import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Router } from './Router';

export function App() {
  return (
    <BrowserRouter>
      <Router />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1f1f1f',
            color: '#fff',
            borderRadius: '12px',
          },
          success: {
            iconTheme: { primary: '#a855f7', secondary: '#fff' },
          },
        }}
      />
    </BrowserRouter>
  );
}
