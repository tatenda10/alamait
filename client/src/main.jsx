import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';

// Prevent mouse wheel from changing number input values
document.addEventListener('wheel', (e) => {
  if (e.target.type === 'number' && document.activeElement === e.target) {
    e.preventDefault();
  }
}, { passive: false });

// Also prevent on focus to be extra safe
document.addEventListener('focusin', (e) => {
  if (e.target.type === 'number') {
    e.target.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);