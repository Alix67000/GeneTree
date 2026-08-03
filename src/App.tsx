import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/pages/Home';
import { Tree } from '@/pages/Tree';
import { PersonDetail } from '@/pages/PersonDetail';
import { AddPerson } from '@/pages/AddPerson';
import { Photos } from '@/pages/Photos';
import { Timeline } from '@/pages/Timeline';
import { NetworkView } from '@/pages/NetworkView';
import { PathfinderView } from '@/pages/PathfinderView';
import { Admin } from '@/pages/Admin';
import { About } from '@/pages/About';
import { useAuth } from '@/hooks/useAuth';

// PrivateRoute wrapper component to protect routes requiring authentication
function PrivateRoute({ children }: { children: React.ReactNode }) {
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
        <Route path="about" element={<About />} />
        <Route path="tree" element={<PrivateRoute><Tree /></PrivateRoute>} />
        <Route path="person/add" element={<PrivateRoute><AddPerson /></PrivateRoute>} />
        <Route path="person/edit/:id" element={<PrivateRoute><AddPerson /></PrivateRoute>} />
        <Route path="person/:id" element={<PrivateRoute><PersonDetail /></PrivateRoute>} />
        <Route path="photos" element={<PrivateRoute><Photos /></PrivateRoute>} />
        <Route path="network" element={<PrivateRoute><NetworkView /></PrivateRoute>} />
        <Route path="pathfinder" element={<PrivateRoute><PathfinderView /></PrivateRoute>} />
        <Route path="timeline" element={<PrivateRoute><Timeline /></PrivateRoute>} />
        <Route path="admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
      </Route>
    </Routes>
  );
}
