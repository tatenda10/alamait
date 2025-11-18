import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';

// Prevent mouse wheel from changing number input values
document.addEventListener('wheel', (e) => {
  if (document.activeElement.type === 'number' && document.activeElement === e.target) {
    document.activeElement.blur();
  }
}, { passive: true });

// Also prevent on focusin for better compatibility
document.addEventListener('focusin', (e) => {
  if (e.target.type === 'number') {
    e.target.addEventListener('wheel', (e) => {
      e.preventDefault();
    }, { passive: false });
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
); 