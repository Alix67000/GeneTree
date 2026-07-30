import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Tree } from './pages/Tree';
import { PersonDetail } from './pages/PersonDetail';
import { AddPerson } from './pages/AddPerson';
import { Photos } from './pages/Photos';
import { useAuth } from './hooks/useAuth';

// PrivateRoute wrapper component to protect routes requiring authentication
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  // Redirect to home if user is not authenticated
  return currentUser ? children : <Navigate to="/" />;
}

// Main application routing component
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="tree" element={<PrivateRoute><Tree /></PrivateRoute>} />
        <Route path="person/add" element={<PrivateRoute><AddPerson /></PrivateRoute>} />
        <Route path="person/:id" element={<PrivateRoute><PersonDetail /></PrivateRoute>} />
        <Route path="photos" element={<PrivateRoute><Photos /></PrivateRoute>} />
      </Route>
    </Routes>
  );
}
