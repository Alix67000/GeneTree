import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from '@/App';
import '@/index.css';
import { AuthProvider } from '@/context/AuthContext';
import { FamilyProvider } from '@/context/FamilyContext';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <FamilyProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </FamilyProvider>
    </AuthProvider>
  </React.StrictMode>
);
