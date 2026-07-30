import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { FamilyProvider } from './context/FamilyContext';

createRoot(document.getElementById('root')).render(
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
