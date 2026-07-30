import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export function Home() {
  const { currentUser, loginWithGoogle } = useAuth();

  if (currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-8">
        <h1 className="text-4xl md:text-5xl lg:text-6xl text-primary font-bold">Welcome back to GeneTree</h1>
        <p className="text-xl text-text-secondary max-w-2xl">
          Continue building your family legacy. Add new relatives, preserve memories, and explore your ancestry.
        </p>
        <div className="flex gap-4">
          <Link to="/tree">
            <Button size="lg">View Family Tree</Button>
          </Link>
          <Link to="/person/add">
            <Button variant="outline" size="lg">Add Person</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-8">
      <h1 className="text-5xl md:text-6xl lg:text-7xl text-primary font-bold">Discover Your Roots</h1>
      <p className="text-xl text-text-secondary max-w-2xl">
        GeneTree is the elegant way to trace your family history, connect generations, and preserve your legacy for the future.
      </p>
      <Button size="lg" onClick={loginWithGoogle}>Start Your Journey</Button>
    </div>
  );
}
